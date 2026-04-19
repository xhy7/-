"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

import {
  getCharacterPortraitProfile,
} from "@/features/home-hero/character-portraits";
import type {
  AiReplyRequest,
  AiReplyResponse,
  AiReplySandboxConfig,
  AncestorCardSummary,
  FeaturedAncestor,
  TraitMetric,
} from "@/shared/contracts/home";
import {
  SectionHeading,
  TagPill,
} from "@/shared/ui/primitives";

import styles from "./home-hero-section.module.css";

export interface HomeHeroSectionProps {
  featuredAncestor: FeaturedAncestor;
  roster: AncestorCardSummary[];
  aiSandbox: AiReplySandboxConfig;
  moodIndex: number;
  traitVector: TraitMetric[];
  aiReplyResult?: AiReplyResponse | null;
  aiReplyError?: string | null;
  isAiReplyPending?: boolean;
  getChatHref?: (ancestorId: string) => string;
  chatMemoryCount?: number;
  chatSummary?: string;
  onGenerateAiReply?: (request: AiReplyRequest) => void | Promise<void>;
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
  moodIndex,
  traitVector,
  getChatHref,
  onSelectAncestor,
}: HomeHeroSectionProps) {
  const ancestors = [featuredAncestor, ...roster];
  const [activeAncestorId, setActiveAncestorId] = useState(featuredAncestor.id);
  const activeAncestor =
    ancestors.find((ancestor) => ancestor.id === activeAncestorId) ??
    featuredAncestor;
  const activePortraitProfile = getCharacterPortraitProfile(activeAncestor.name);
  const isFeaturedActive = activeAncestor.id === featuredAncestor.id;

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

  const quoteSeal = isFeaturedActive ? "朱印题签" : "候选题签";
  const dominantTraits = useMemo(
    () =>
      [...traitVector]
        .sort((left, right) => right.value / right.max - left.value / left.max)
        .slice(0, 2),
    [traitVector],
  );

  return (
    <section className={`${styles.root} section-shell`}>
      <div className={styles.header}>
        <SectionHeading
          eyebrow="主舞台"
          title="古人台"
          description="先锁定当前聚焦的老祖宗，再从侧边名录切换其他角色；对话入口统一走对话场。"
        />
        <TagPill tone="seal">{playerBondTitle}</TagPill>
      </div>

      <div className={styles.layout}>
        <article className={`${styles.heroCard} paper-card`}>
          <div className={styles.heroBanner}>
            <div className={styles.bannerCopy}>
              <p className="eyebrow">当前聚焦</p>
              <strong className={styles.bannerTitle}>
                {isFeaturedActive ? "当前主推祖宗" : "已切换轮播祖宗"}
              </strong>
            </div>
            <TagPill tone={isFeaturedActive ? "seal" : "muted"}>
              {isFeaturedActive ? "主推位" : "轮播位"}
            </TagPill>
          </div>

          <div className={styles.heroTop}>
            <div className={styles.portraitPanel}>
              {activePortraitProfile ? (
                <div className={styles.portraitFrame}>
                  <Image
                    src={activePortraitProfile.imageSrc}
                    alt={`${activeAncestor.name}肖像`}
                    fill
                    sizes="(max-width: 960px) 100vw, 320px"
                    className={styles.portraitImage}
                  />
                </div>
              ) : (
                <div className={styles.glyphBlock} aria-hidden="true">
                  <span>{activeAncestor.portraitGlyph}</span>
                </div>
              )}
              <div className={styles.portraitCaption}>
                <strong>{activeAncestor.name}</strong>
                <span>
                  {activePortraitProfile
                    ? `档案编号 ${activePortraitProfile.personId}`
                    : "暂无照片档案"}
                </span>
              </div>
            </div>
            <div className={styles.heroMeta}>
              <p className="eyebrow">{activeAncestor.era}</p>
              <h3 className={styles.name}>
                {activeAncestor.name} · {activeAncestor.epithet}
              </h3>
              <p className="section-body">{activeAncestor.oneLiner}</p>
              {activePortraitProfile ? (
                <div className={styles.tagRow}>
                  {activePortraitProfile.labels.slice(0, 3).map((label) => (
                    <TagPill key={label} tone="muted">
                      {label}
                    </TagPill>
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          <blockquote className={styles.quote}>
            <span className={styles.quoteSeal}>{quoteSeal}</span>
            <p>{activeAncestor.quote}</p>
          </blockquote>

          <div className={styles.tagRow}>
            {activeAncestor.signatureTags.map((tag) => (
              <TagPill key={tag}>{tag}</TagPill>
            ))}
          </div>

          <div className={styles.summaryPanel}>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>情绪状态</span>
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
            {getChatHref ? (
              <Link href={getChatHref(activeAncestor.id)} className={styles.aiChatLink}>
                进入 {activeAncestor.name} 的对话场
              </Link>
            ) : null}
            <div className={styles.modeList}>
              {dominantTraits.map((trait) => (
                <TagPill key={trait.id} tone="muted">
                  {trait.label}
                </TagPill>
              ))}
              <TagPill tone="muted">情绪 {moodIndex}</TagPill>
              {supportModes.slice(0, 2).map((mode) => (
                <TagPill key={mode} tone="muted">
                  {mode}
                </TagPill>
              ))}
            </div>
          </div>
        </article>

        <aside className={`${styles.switcher} paper-card paper-card--muted`}>
          <div className={styles.switcherHeader}>
            <p className="eyebrow">祖宗名录</p>
            <h3 className={styles.switcherTitle}>祖宗轮播</h3>
          </div>

          <div className={styles.switcherList}>
            {ancestors.map((ancestor) => {
              const isActive = ancestor.id === activeAncestor.id;
              const isFeatured = ancestor.id === featuredAncestor.id;
              const portraitProfile = getCharacterPortraitProfile(ancestor.name);

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
                  <div className={styles.switcherTop}>
                    {portraitProfile ? (
                      <div className={styles.switcherPortrait}>
                        <Image
                          src={portraitProfile.imageSrc}
                          alt={`${ancestor.name}缩略肖像`}
                          fill
                          sizes="44px"
                          className={styles.switcherPortraitImage}
                        />
                      </div>
                    ) : (
                      <div className={styles.switcherGlyph} aria-hidden="true">
                        {ancestor.portraitGlyph}
                      </div>
                    )}
                    <div>
                      <div className={styles.switcherMeta}>
                        <strong>
                          {ancestor.name} · {ancestor.era}
                        </strong>
                        {isFeatured ? <TagPill tone="seal">主推</TagPill> : null}
                        <TagPill tone="muted">{isActive ? "当前聚焦" : "点击切换"}</TagPill>
                      </div>
                      <p>{ancestor.oneLiner}</p>
                    </div>
                  </div>
                  <div className={styles.switcherFoot}>
                    <span>{ancestor.currentMoodLabel}</span>
                    <span>{isActive ? "当前聚焦" : "点击切换"}</span>
                  </div>
                </button>
              );
            })}
          </div>

        </aside>
      </div>
    </section>
  );
}
