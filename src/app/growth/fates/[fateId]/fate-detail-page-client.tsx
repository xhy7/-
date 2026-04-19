"use client";

import Link from "next/link";
import { notFound } from "next/navigation";
import { useMemo, useSyncExternalStore } from "react";

import {
  buildDerivedNurtureSummary,
  evaluateFateUnlock,
  getConversationMemory,
  subscribeConversationMemory,
} from "@/shared/ai/interaction-memory";
import type { HomePageData } from "@/shared/contracts/home";
import { TagPill } from "@/shared/ui/primitives";

import styles from "../../../page-shell.module.css";

interface FateDetailPageClientProps {
  data: HomePageData;
  fateId: string;
  ancestorId?: string;
}

export function FateDetailPageClient({
  data,
  fateId,
  ancestorId,
}: FateDetailPageClientProps) {
  const fate = data.fatePreviews.find((item) => item.id === fateId);
  const selectedAncestor = [data.featuredAncestor, ...data.roster].find(
    (item) => item.id === ancestorId,
  );
  const ancestor = selectedAncestor ?? data.featuredAncestor;
  const conversationRecords = useSyncExternalStore(
    subscribeConversationMemory,
    getConversationMemory,
    () => [],
  );

  if (!fate) {
    notFound();
  }

  const ancestorRecords = conversationRecords.filter(
    (record) => record.ancestorId === ancestor.id,
  );
  const derivedSummary = useMemo(
    () =>
      buildDerivedNurtureSummary(
        ancestor,
        data.nurtureSummary,
        ancestorRecords,
      ),
    [ancestor, ancestorRecords, data.nurtureSummary],
  );
  const unlock = evaluateFateUnlock(
    fate,
    derivedSummary.traitVector,
    derivedSummary.moodSnapshot,
    ancestorRecords,
  );
  const unlockLabel =
    unlock.status === "ready"
      ? "已可解锁"
      : unlock.status === "evolving"
        ? "推进中"
        : "未满足";

  return (
    <main className={styles.page}>
      <header className={`${styles.header} section-shell`}>
        <div>
          <div className={styles.brandMeta}>
            <TagPill tone="seal">{fate.era}</TagPill>
            <TagPill tone="muted">{fate.statusLabel}</TagPill>
            <TagPill tone={unlock.status === "ready" ? "seal" : "muted"}>
              {unlockLabel}
            </TagPill>
          </div>
          <h1 className="display-title">{fate.title}</h1>
          <p className={styles.subtitle}>
            命运节点详情页现在会基于当前祖宗的历史对话、派生性格向量与 MoodIndex 判断节点推进状态。
          </p>
          <div className={styles.quickActions}>
            <Link href={`/growth?ancestor=${ancestor.id}`} className={styles.quickLink}>
              返回养成中枢
            </Link>
            <Link href={`/chat/${ancestor.id}`} className={styles.quickLink}>
              去对话页继续推进
            </Link>
          </div>
        </div>
        <div className={styles.asideBlock}>
          <p className="section-body">
            当前按 {ancestor.name} 的养成视角计算，已累计 {ancestorRecords.length} 段对话记忆。
          </p>
          <div className={styles.asideList}>
            <div className={styles.asideItem}>
              <span>节点进度</span>
              <strong>
                {unlock.score} / {unlock.threshold}
              </strong>
            </div>
            <div className={styles.asideItem}>
              <span>MoodIndex</span>
              <strong>{derivedSummary.moodSnapshot.value}</strong>
            </div>
          </div>
        </div>
      </header>

      <section className={`${styles.cardGrid} section-shell`}>
        <article className="paper-card">
          <p className="eyebrow">Node Overview</p>
          <h2 className={styles.cardTitle}>节点说明</h2>
          <p className={styles.cardBody}>{fate.description}</p>
        </article>

        <article className="paper-card paper-card--muted">
          <p className="eyebrow">Unlock Status</p>
          <h2 className={styles.cardTitle}>解锁状态</h2>
          <p className={styles.cardBody}>{unlock.nextStep}</p>
          <div className={styles.tagRow}>
            {unlock.reasons.map((reason) => (
              <TagPill key={reason} tone="muted">
                {reason}
              </TagPill>
            ))}
          </div>
        </article>

        <article className="paper-card">
          <p className="eyebrow">Current Traits</p>
          <h2 className={styles.cardTitle}>当前影响向量</h2>
          <div className={styles.tagRow}>
            {derivedSummary.traitVector.slice(0, 4).map((trait) => (
              <TagPill key={trait.id}>{`${trait.label} ${trait.value}`}</TagPill>
            ))}
          </div>
        </article>
      </section>
    </main>
  );
}
