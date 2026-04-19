"use client";

import Link from "next/link";
import { useMemo, useState, useSyncExternalStore } from "react";

import {
  HomeGrowthSection,
  type HomeGrowthSectionProps,
} from "@/features/home-growth/home-growth-section";
import {
  buildDerivedNurtureSummary,
  getConversationMemory,
  subscribeConversationMemory,
} from "@/shared/ai/interaction-memory";
import type { HomePageData } from "@/shared/contracts/home";
import { TagPill } from "@/shared/ui/primitives";

import styles from "../page-shell.module.css";

interface GrowthPageClientProps {
  data: HomePageData;
  initialAncestorId?: string;
}

export function GrowthPageClient({
  data,
  initialAncestorId,
}: GrowthPageClientProps) {
  const [selectedAncestorId, setSelectedAncestorId] = useState(
    initialAncestorId ?? data.featuredAncestor.id,
  );
  const conversationRecords = useSyncExternalStore(
    subscribeConversationMemory,
    getConversationMemory,
    () => [],
  );
  const [activityNote, setActivityNote] = useState(
    "这里集中记录你和老祖宗的互动如何改变情绪与性格向量。",
  );
  const ancestors = [data.featuredAncestor, ...data.roster];
  const selectedAncestor =
    ancestors.find((ancestor) => ancestor.id === selectedAncestorId) ??
    data.featuredAncestor;
  const selectedRecords = conversationRecords.filter(
    (record) => record.ancestorId === selectedAncestorId,
  );
  const selectedNurtureSummary = useMemo(
    () =>
      buildDerivedNurtureSummary(
        selectedAncestor,
        data.nurtureSummary,
        selectedRecords,
      ),
    [data.nurtureSummary, selectedAncestor, selectedRecords],
  );

  const growthProps: HomeGrowthSectionProps = {
    nurtureSummary: selectedNurtureSummary,
    fatePreviews: [],
  };

  return (
    <main className={`${styles.page} ${styles.pageLarge}`}>
      <header className={`${styles.header} section-shell`}>
        <div>
          <div className={styles.brandMeta}>
            <TagPill tone="seal">{data.seasonLabel}</TagPill>
            <TagPill tone="muted">{selectedAncestor.name}</TagPill>
          </div>
          <h1 className="display-title">养成中枢</h1>
          <p className={styles.subtitle}>
            这里集中展示情绪与性格向量，方便你判断当前关系已经被推到哪一步。
          </p>
          <div className={styles.quickActions}>
            <Link href="/" className={styles.quickLink}>
              返回首页
            </Link>
            <Link href="/ancestors" className={styles.quickLink}>
              去古人台
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
              <span>情绪指数</span>
              <strong>{selectedNurtureSummary.moodSnapshot.value}</strong>
            </div>
            <div className={styles.asideItem}>
              <span>培养阶段</span>
              <strong>{selectedNurtureSummary.cultivationStage}</strong>
            </div>
          </div>
        </div>
      </header>

      <div className={styles.layout}>
        <div className={styles.mainColumn}>
          <section className="section-shell">
            <div className="section-heading">
              <p className="eyebrow">祖宗视角</p>
              <h2 className="section-title">对话影响面板</h2>
              <p className="section-body">
                选择一位祖宗查看他与用户的历史对话如何回写到性格向量与情绪快照。
              </p>
            </div>
            <div className={styles.selectorGrid}>
              {ancestors.map((ancestor) => {
                const turns = conversationRecords.filter(
                  (record) => record.ancestorId === ancestor.id,
                ).length;

                return (
                  <button
                    key={ancestor.id}
                    type="button"
                    className={styles.selectorButton}
                    data-active={ancestor.id === selectedAncestorId}
                    onClick={() => {
                      setSelectedAncestorId(ancestor.id);
                      setActivityNote(`已切换到 ${ancestor.name} 的养成视角。`);
                    }}
                  >
                    <strong>{ancestor.name}</strong>
                    <span className={styles.selectorMeta}>{ancestor.currentMoodLabel}</span>
                    <span className={styles.selectorMeta}>历史回合 {turns}</span>
                  </button>
                );
              })}
            </div>
          </section>

          <HomeGrowthSection {...growthProps} />
        </div>

        <aside className={styles.rail}>
          <section className={`${styles.railCard} section-shell`}>
            <div>
              <p className="eyebrow">养成侧记</p>
              <h2 className={styles.railTitle}>养成概览</h2>
            </div>

            <div className={styles.previewStack}>
              <p className="section-body">{selectedNurtureSummary.moodSnapshot.summary}</p>
              <div className={styles.tagRow}>
                {selectedNurtureSummary.activeTags.map((tag) => (
                  <TagPill key={tag} tone="muted">
                    {tag}
                  </TagPill>
                ))}
              </div>
              <p className="muted-note">
                当前查看：{selectedAncestor.name}，已累计 {selectedRecords.length} 段对话记忆。
              </p>
              <Link href={`/chat/${selectedAncestor.id}`} className={styles.quickLink}>
                去和 {selectedAncestor.name} 对话
              </Link>
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}
