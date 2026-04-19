"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState, useSyncExternalStore } from "react";

import {
  HomeHeroSection,
  type HomeHeroSectionProps,
} from "@/features/home-hero/home-hero-section";
import { characterPortraitCatalog } from "@/features/home-hero/character-portraits";
import {
  buildAncestorBaseTraitVector,
  deriveMoodSnapshotFromHistory,
  deriveTraitVectorFromHistory,
  getConversationMemory,
  subscribeConversationMemory,
  summarizeConversationHistory,
} from "@/shared/ai/interaction-memory";
import type { HomePageData } from "@/shared/contracts/home";
import { TagPill } from "@/shared/ui/primitives";

import portraitStyles from "./ancestors-page.module.css";
import styles from "../page-shell.module.css";

interface AncestorsPageClientProps {
  data: HomePageData;
}

const initialNote = "在这里查看古人写真、人物卷和对话入口，先选定今天要继续相处的那位老祖宗。";

export function AncestorsPageClient({ data }: AncestorsPageClientProps) {
  const [activityNote, setActivityNote] = useState(initialNote);
  const [activeAncestorId, setActiveAncestorId] = useState(data.featuredAncestor.id);
  const conversationRecords = useSyncExternalStore(
    subscribeConversationMemory,
    getConversationMemory,
    () => [],
  );

  const ancestors = [data.featuredAncestor, ...data.roster];
  const activeAncestor =
    ancestors.find((ancestor) => ancestor.id === activeAncestorId) ??
    data.featuredAncestor;
  const activeRecords = conversationRecords.filter(
    (record) => record.ancestorId === activeAncestorId,
  );
  const activeTraitVector = useMemo(
    () =>
      deriveTraitVectorFromHistory(
        buildAncestorBaseTraitVector(activeAncestor, data.nurtureSummary.traitVector),
        activeRecords,
      ),
    [activeAncestor, activeRecords, data.nurtureSummary.traitVector],
  );
  const activeMoodSnapshot = useMemo(
    () =>
      deriveMoodSnapshotFromHistory(
        data.nurtureSummary.moodSnapshot,
        activeRecords,
      ),
    [activeRecords, data.nurtureSummary.moodSnapshot],
  );

  const heroProps: HomeHeroSectionProps = {
    featuredAncestor: data.featuredAncestor,
    roster: data.roster,
    aiSandbox: data.aiSandbox,
    moodIndex: activeMoodSnapshot.value,
    traitVector: activeTraitVector,
    getChatHref: (ancestorId) => `/chat/${ancestorId}`,
    chatMemoryCount: activeRecords.length,
    chatSummary: summarizeConversationHistory(activeAncestor.name, activeRecords),
    onSelectAncestor: (ancestorId) => {
      const activeAncestor = [data.featuredAncestor, ...data.roster].find(
        (item) => item.id === ancestorId,
      );

      if (activeAncestor) {
        setActiveAncestorId(activeAncestor.id);
        setActivityNote(`已切换到 ${activeAncestor.name}，当前页只保留角色舞台与对话入口。`);
      }
    },
  };

  return (
    <main className={`${styles.page} ${styles.pageLarge}`}>
      <header className={`${styles.header} section-shell`}>
        <div>
          <div className={styles.brandMeta}>
            <TagPill tone="seal">{data.seasonLabel}</TagPill>
            <TagPill tone="muted">{activeAncestor.name}</TagPill>
          </div>
          <h1 className="display-title">古人台</h1>
          <p className={styles.subtitle}>
            这一页集中展示人物写真、角色名录与对话入口，方便你围绕同一位老祖宗持续推进互动与养成。
          </p>
          <div className={styles.quickActions}>
            <Link href="/" className={styles.quickLink}>
              返回首页
            </Link>
            <Link href="/growth" className={styles.quickLink}>
              去养成页
            </Link>
            <Link href={`/chat/${activeAncestorId}`} className={styles.quickLink}>
              去当前祖宗对话页
            </Link>
            <Link href="/playground" className={styles.quickLink}>
              去玩法页
            </Link>
          </div>
        </div>
        <div className={styles.asideBlock}>
          <p className="section-body">{activityNote}</p>
          <div className={styles.asideList}>
            <div className={styles.asideItem}>
              <span>当前主推</span>
              <strong>{data.featuredAncestor.name}</strong>
            </div>
            <div className={styles.asideItem}>
              <span>历史记忆</span>
              <strong>{activeRecords.length} 段已回写</strong>
            </div>
            <div className={styles.asideItem}>
              <span>对话入口</span>
              <strong>{activeAncestor.name} 独立聊天页</strong>
            </div>
          </div>
        </div>
      </header>

      <div className={styles.layout}>
        <div className={styles.mainColumn}>
          <HomeHeroSection {...heroProps} />

          <section className={`${portraitStyles.gallerySection} section-shell`}>
            <div className={portraitStyles.galleryHeader}>
              <div>
                <p className="eyebrow">人物群像卷</p>
                <h2 className={portraitStyles.sectionTitle}>已入库肖像档案</h2>
                <p className="section-body">
                  这里汇总已入库的人物照片与档案，方便你快速浏览不同古人的气质、节点与关系线索。
                </p>
              </div>
              <TagPill tone="muted">{characterPortraitCatalog.length} 份照片已挂载</TagPill>
            </div>

            <div className={portraitStyles.galleryGrid}>
              {characterPortraitCatalog.map((profile) => {
                const isInCurrentStage = ancestors.some(
                  (ancestor) => ancestor.name === profile.name,
                );
                const isActive = profile.name === activeAncestor.name;

                return (
                  <article
                    key={profile.personId}
                    className={`${portraitStyles.galleryCard} paper-card paper-card--muted`}
                    data-active={isActive}
                  >
                    <div className={portraitStyles.galleryImageWrap}>
                      <Image
                        src={profile.imageSrc}
                        alt={`${profile.name}档案照片`}
                        fill
                        sizes="(max-width: 960px) 100vw, 240px"
                        className={portraitStyles.galleryImage}
                      />
                    </div>
                    <div className={portraitStyles.galleryMeta}>
                      <div className={styles.tagRow}>
                        <TagPill tone={isInCurrentStage ? "seal" : "muted"}>
                          {isInCurrentStage ? "已接入主舞台" : "档案扩展位"}
                        </TagPill>
                        <TagPill tone="muted">编号 {profile.personId}</TagPill>
                      </div>
                      <h3 className={portraitStyles.galleryTitle}>{profile.name}</h3>
                      <p className="muted-note">{profile.toneStyle}</p>
                      <p className="section-body">{profile.timelineNote}</p>
                      <div className={styles.tagRow}>
                        {profile.labels.slice(0, 2).map((label) => (
                          <TagPill key={label}>{label}</TagPill>
                        ))}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        </div>

        <aside className={styles.rail}>
          <section className={`${styles.railCard} section-shell`}>
            <div>
              <p className="eyebrow">人物侧记</p>
              <h2 className={styles.railTitle}>当前聚焦</h2>
            </div>
            <div className={styles.previewStack}>
              <p className="section-body">{activeAncestor.oneLiner}</p>
              <p className="muted-note">
                {summarizeConversationHistory(activeAncestor.name, activeRecords)}
              </p>
              <Link href={`/chat/${activeAncestor.id}`} className={styles.quickLink}>
                与 {activeAncestor.name} 开始对话
              </Link>
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}
