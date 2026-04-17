"use client";

import { useState } from "react";

import type {
  AncestorCardSummary,
  FeaturedAncestor,
} from "@/shared/contracts/home";
import {
  InkButton,
  SectionHeading,
  TagPill,
} from "@/shared/ui/primitives";

import styles from "./home-hero-section.module.css";

export interface HomeHeroSectionProps {
  featuredAncestor: FeaturedAncestor;
  roster: AncestorCardSummary[];
  onSelectAncestor?: (ancestorId: string) => void | Promise<void>;
  onOpenAncestorDetail?: (ancestorId: string) => void | Promise<void>;
}

const fallbackSupportModes = ["真心话大冒险", "作品互评"];

const isFeaturedAncestor = (
  ancestor: AncestorCardSummary | FeaturedAncestor,
): ancestor is FeaturedAncestor => "playerBondTitle" in ancestor;

export function HomeHeroSection({
  featuredAncestor,
  roster,
  onSelectAncestor,
  onOpenAncestorDetail,
}: HomeHeroSectionProps) {
  const ancestors = [featuredAncestor, ...roster];
  const [activeAncestorId, setActiveAncestorId] = useState(featuredAncestor.id);
  const activeAncestor =
    ancestors.find((ancestor) => ancestor.id === activeAncestorId) ??
    featuredAncestor;

  const supportModes = isFeaturedAncestor(activeAncestor)
    ? activeAncestor.supportModes
    : fallbackSupportModes;

  const resonanceSummary = isFeaturedAncestor(activeAncestor)
    ? activeAncestor.resonanceSummary
    : `${activeAncestor.name} 当前处于「${activeAncestor.currentMoodLabel}」状态，适合进入高戏剧性互动。`;

  const playerBondTitle = isFeaturedAncestor(activeAncestor)
    ? activeAncestor.playerBondTitle
    : "轮播中的祖宗";

  const rareForm = isFeaturedAncestor(activeAncestor)
    ? activeAncestor.rareForm
    : `候选形态：${activeAncestor.signatureTags[0]}`;

  return (
    <section className={`${styles.root} section-shell`}>
      <div className={styles.header}>
        <SectionHeading
          eyebrow="Hero Stage"
          title="今日主推祖宗"
          description="先锁定当前主推祖宗，再从侧边轮播里切换其他角色。这个模块只负责首页舞台与人物卷预览入口。"
        />
        <TagPill tone="seal">{playerBondTitle}</TagPill>
      </div>

      <div className={styles.layout}>
        <article className={`${styles.heroCard} paper-card`}>
          <div className={styles.heroTop}>
            <div className={styles.glyphBlock} aria-hidden="true">
              <span>{activeAncestor.portraitGlyph}</span>
            </div>
            <div className={styles.heroMeta}>
              <p className="eyebrow">{activeAncestor.era}</p>
              <h3 className={styles.name}>
                {activeAncestor.name} · {activeAncestor.epithet}
              </h3>
              <p className="section-body">{activeAncestor.oneLiner}</p>
            </div>
          </div>

          <blockquote className={styles.quote}>{activeAncestor.quote}</blockquote>

          <div className={styles.tagRow}>
            {activeAncestor.signatureTags.map((tag) => (
              <TagPill key={tag}>{tag}</TagPill>
            ))}
          </div>

          <div className={styles.summaryPanel}>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Mood</span>
              <strong>{activeAncestor.currentMoodLabel}</strong>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>历史忠诚度</span>
              <strong>{activeAncestor.historicalFidelity}</strong>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>稀有提示</span>
              <strong>{rareForm}</strong>
            </div>
          </div>

          <p className="muted-note">{resonanceSummary}</p>

          <div className={styles.actionRow}>
            <InkButton
              onClick={() => {
                void onOpenAncestorDetail?.(activeAncestor.id);
              }}
            >
              展开人物卷
            </InkButton>
            <div className={styles.modeList}>
              {supportModes.map((mode) => (
                <TagPill key={mode} tone="muted">
                  {mode}
                </TagPill>
              ))}
            </div>
          </div>
        </article>

        <aside className={`${styles.switcher} paper-card paper-card--muted`}>
          <div className={styles.switcherHeader}>
            <p className="eyebrow">Ancestor Roster</p>
            <h3 className={styles.switcherTitle}>祖宗轮播</h3>
          </div>

          <div className={styles.switcherList}>
            {ancestors.map((ancestor) => {
              const isActive = ancestor.id === activeAncestor.id;

              return (
                <button
                  key={ancestor.id}
                  type="button"
                  className={styles.switcherItem}
                  data-active={isActive}
                  aria-pressed={isActive}
                  onClick={() => {
                    setActiveAncestorId(ancestor.id);
                    void onSelectAncestor?.(ancestor.id);
                  }}
                >
                  <div>
                    <strong>
                      {ancestor.name} · {ancestor.era}
                    </strong>
                    <p>{ancestor.oneLiner}</p>
                  </div>
                  <span>{ancestor.currentMoodLabel}</span>
                </button>
              );
            })}
          </div>

          <p className="muted-note">
            当前只做首页切换，不接真实人物抽屉。后续只需复用
            `getAncestorDetailPreview(ancestorId)` 即可扩展。
          </p>
        </aside>
      </div>
    </section>
  );
}

