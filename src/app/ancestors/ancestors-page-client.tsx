"use client";

import Link from "next/link";
import { useMemo, useState, useSyncExternalStore } from "react";

import {
  HomeHeroSection,
  type HomeHeroSectionProps,
} from "@/features/home-hero/home-hero-section";
import { getAncestorDetailPreview } from "@/mocks/home-gateway";
import {
  buildAncestorBaseTraitVector,
  deriveMoodSnapshotFromHistory,
  deriveTraitVectorFromHistory,
  getConversationMemory,
  subscribeConversationMemory,
  summarizeConversationHistory,
} from "@/shared/ai/interaction-memory";
import type {
  AncestorDetailPreview,
  HomePageData,
} from "@/shared/contracts/home";
import { TagPill } from "@/shared/ui/primitives";

import styles from "../page-shell.module.css";

interface AncestorsPageClientProps {
  data: HomePageData;
}

const initialNote = "这里专门承载人物卷与角色 AI 代答，不再和养成、玩法混排。";

export function AncestorsPageClient({ data }: AncestorsPageClientProps) {
  const [activityNote, setActivityNote] = useState(initialNote);
  const [ancestorPreview, setAncestorPreview] =
    useState<AncestorDetailPreview | null>(null);
  const [activeAncestorId, setActiveAncestorId] = useState(data.featuredAncestor.id);
  const conversationRecords = useSyncExternalStore(
    subscribeConversationMemory,
    getConversationMemory,
    getConversationMemory,
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
        setAncestorPreview(null);
        setActivityNote(`已切换到 ${activeAncestor.name}，当前页只保留角色舞台与对话入口。`);
      }
    },
    onOpenAncestorDetail: async (ancestorId) => {
      const preview = await getAncestorDetailPreview(ancestorId);
      setAncestorPreview(preview);
      setActivityNote(`${preview.name} 的人物卷预览已展开。`);
    },
  };

  return (
    <main className={styles.page}>
      <header className={`${styles.header} section-shell`}>
        <div>
          <div className={styles.brandMeta}>
            <TagPill tone="seal">Ancestors</TagPill>
            <TagPill tone="muted">Developer 2</TagPill>
          </div>
          <h1 className="display-title">祖宗主舞台</h1>
          <p className={styles.subtitle}>
            这一页只承载古人角色展示、人物卷预览和角色 AI 代答，不再和首页其他模块混在一起。
          </p>
          <div className={styles.quickActions}>
            <Link href="/" className={styles.quickLink}>
              返回首页中枢
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
              <span>默认模式</span>
              <strong>{data.aiSandbox.supportedModes.join(" / ")}</strong>
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
        </div>

        <aside className={styles.rail}>
          <section className={`${styles.railCard} section-shell`}>
            <div>
              <p className="eyebrow">Persona Console</p>
              <h2 className={styles.railTitle}>
                {ancestorPreview?.archiveLabel ?? "人物与 AI 预览"}
              </h2>
            </div>

            {ancestorPreview ? (
              <div className={styles.previewStack}>
                <p className="section-body">{ancestorPreview.profile}</p>
                <div className={styles.tagRow}>
                  {ancestorPreview.unlockHints.map((hint) => (
                    <TagPill key={hint} tone="muted">
                      {hint}
                    </TagPill>
                  ))}
                </div>
              </div>
            ) : null}

            {!ancestorPreview ? (
              <div className={styles.previewStack}>
                <p className="section-body">
                  在左侧切换祖宗、展开人物卷，或跳入独立对话页，这里会显示当前角色的概览信息。
                </p>
                <p className="muted-note">
                  {summarizeConversationHistory(activeAncestor.name, activeRecords)}
                </p>
                <Link href={`/chat/${activeAncestor.id}`} className={styles.quickLink}>
                  与 {activeAncestor.name} 开始对话
                </Link>
              </div>
            ) : null}
          </section>
        </aside>
      </div>
    </main>
  );
}
