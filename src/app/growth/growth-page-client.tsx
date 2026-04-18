"use client";

import Link from "next/link";
import { useMemo, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";

import {
  HomeGrowthSection,
  type HomeGrowthSectionProps,
} from "@/features/home-growth/home-growth-section";
import {
  buildDerivedNurtureSummary,
  getConversationMemory,
  subscribeConversationMemory,
} from "@/shared/ai/interaction-memory";
import type { FatePreview, HomePageData } from "@/shared/contracts/home";
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
  const router = useRouter();
  const [focusedFate, setFocusedFate] = useState<FatePreview | null>(null);
  const [selectedAncestorId, setSelectedAncestorId] = useState(
    initialAncestorId ?? data.featuredAncestor.id,
  );
  const conversationRecords = useSyncExternalStore(
    subscribeConversationMemory,
    getConversationMemory,
    getConversationMemory,
  );
  const [activityNote, setActivityNote] = useState(
    "这一页只负责展示 MoodIndex、Trait Vector 和命运节点，不再和人物、玩法并排。",
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
    fatePreviews: data.fatePreviews,
    onOpenFatePreview: (fateId) => {
      const fate = data.fatePreviews.find((item) => item.id === fateId) ?? null;
      setFocusedFate(fate);
      if (fate) {
        setActivityNote(`已聚焦命运节点「${fate.title}」。`);
        router.push(`/growth/fates/${fate.id}?ancestor=${selectedAncestorId}`);
      }
    },
  };

  return (
    <main className={styles.page}>
      <header className={`${styles.header} section-shell`}>
        <div>
          <div className={styles.brandMeta}>
            <TagPill tone="seal">Growth</TagPill>
            <TagPill tone="muted">Developer 3</TagPill>
          </div>
          <h1 className="display-title">养成中枢</h1>
          <p className={styles.subtitle}>
            把人物培养状态单独抽成一个页面，集中展示情绪、性格向量与命运节点。
          </p>
          <div className={styles.quickActions}>
            <Link href="/" className={styles.quickLink}>
              返回首页中枢
            </Link>
            <Link href="/ancestors" className={styles.quickLink}>
              去祖宗页
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
              <span>MoodIndex</span>
              <strong>{data.nurtureSummary.moodSnapshot.value}</strong>
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
              <p className="eyebrow">Tracked Ancestors</p>
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
                      setFocusedFate(null);
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
              <p className="eyebrow">Growth Console</p>
              <h2 className={styles.railTitle}>
                {focusedFate?.title ?? "养成概览"}
              </h2>
            </div>

            {focusedFate ? (
              <div className={styles.previewStack}>
                <p className="section-body">{focusedFate.description}</p>
                <p className="muted-note">触发提示：{focusedFate.triggerHint}</p>
                <p className={styles.nextStep}>{focusedFate.rewardLabel}</p>
                <Link
                  href={`/growth/fates/${focusedFate.id}?ancestor=${selectedAncestorId}`}
                  className={styles.quickLink}
                >
                  打开节点详情页
                </Link>
              </div>
            ) : (
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
            )}
          </section>
        </aside>
      </div>
    </main>
  );
}
