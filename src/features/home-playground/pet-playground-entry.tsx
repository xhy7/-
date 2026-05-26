"use client";

import Link from "next/link";

import type { GameplayModeCard } from "@/shared/contracts/home";
import { TagPill } from "@/shared/ui/primitives";

import styles from "./home-playground-section.module.css";

export type PetPlaygroundIntentId =
  | "quarrel"
  | "mediate"
  | "poem"
  | "creation"
  | "modern-topic";

export type PetPlaygroundModeId =
  | "cross-time-quarrel"
  | "truth-or-dare"
  | "fusion-creation"
  | "modern-reframe";

export interface PetPlaygroundIntent {
  id: PetPlaygroundIntentId;
  label: string;
  modeId: PetPlaygroundModeId;
  summary: string;
  petHint: string;
}

export const petPlaygroundIntents: PetPlaygroundIntent[] = [
  {
    id: "quarrel",
    label: "吵架",
    modeId: "cross-time-quarrel",
    summary: "让苏轼先开口，把跨时空争端抛到台面上。",
    petHint: "桌宠面板可先预选苏轼为甲方。",
  },
  {
    id: "mediate",
    label: "拉架",
    modeId: "cross-time-quarrel",
    summary: "沿用对峙玩法，把苏轼放进调停视角继续收束火气。",
    petHint: "完整工坊里可以继续选择乙方和调解人。",
  },
  {
    id: "poem",
    label: "吟诗",
    modeId: "fusion-creation",
    summary: "以苏轼的语气生成短诗、词句或可传播的文案。",
    petHint: "适合从桌宠一句话灵感直接展开。",
  },
  {
    id: "creation",
    label: "创作",
    modeId: "fusion-creation",
    summary: "把苏轼和另一位古人的文风揉成一份作品。",
    petHint: "完整工坊保留互评和二次生成流程。",
  },
  {
    id: "modern-topic",
    label: "现代命题",
    modeId: "modern-reframe",
    summary: "让苏轼点评外卖、职场、消费等现代场景。",
    petHint: "进入完整页面后可改成自定义命题。",
  },
];

interface PetPlaygroundEntryProps {
  ancestorId?: string;
  ancestorName?: string;
  gameplayModes?: Pick<GameplayModeCard, "id" | "title" | "description">[];
  selectedIntentId?: PetPlaygroundIntentId;
  onSelectIntent?: (intent: PetPlaygroundIntent) => void;
  fullPageHref?: string;
  className?: string;
}

const defaultAncestorId = "su-shi";
const defaultAncestorName = "苏轼";

const joinClassNames = (...tokens: Array<string | false | null | undefined>) =>
  tokens.filter(Boolean).join(" ");

export const buildPetPlaygroundHref = (
  modeId?: PetPlaygroundModeId,
  ancestorId = defaultAncestorId,
) => {
  const params = new URLSearchParams({
    ancestorId,
    source: "pet",
  });

  if (modeId) {
    params.set("mode", modeId);
  }

  return `/playground?${params.toString()}`;
};

export function PetPlaygroundEntry({
  ancestorId = defaultAncestorId,
  ancestorName = defaultAncestorName,
  gameplayModes = [],
  selectedIntentId,
  onSelectIntent,
  fullPageHref,
  className,
}: PetPlaygroundEntryProps) {
  const modeTitleById = new Map(gameplayModes.map((mode) => [mode.id, mode.title]));
  const resolvedFullPageHref = fullPageHref ?? buildPetPlaygroundHref(undefined, ancestorId);

  return (
    <section className={joinClassNames(styles.petEntry, className)}>
      <div className={styles.petEntryHeader}>
        <div>
          <p className="eyebrow">桌宠玩法</p>
          <h3 className={styles.petEntryTitle}>{`${ancestorName}的玩法工坊`}</h3>
          <p className={styles.petEntryLead}>
            当前角色固定为 {ancestorName}，可先在桌宠旁选择轻量玩法，再展开完整页面继续深度操作。
          </p>
        </div>
        <TagPill tone="seal">source=pet</TagPill>
      </div>

      <div className={styles.petIntentGrid} aria-label={`${ancestorName} 桌宠玩法入口`}>
        {petPlaygroundIntents.map((intent) => {
          const modeTitle = modeTitleById.get(intent.modeId);
          const isActive = selectedIntentId === intent.id;

          return (
            <button
              key={intent.id}
              type="button"
              className={styles.petIntentButton}
              data-active={isActive}
              onClick={() => {
                onSelectIntent?.(intent);
              }}
            >
              <span className={styles.petIntentLabel}>{intent.label}</span>
              <span className={styles.petIntentSummary}>{intent.summary}</span>
              <span className={styles.petIntentMeta}>
                {modeTitle ? `对应完整玩法：${modeTitle}` : intent.petHint}
              </span>
            </button>
          );
        })}
      </div>

      <div className={styles.petEntryActions}>
        <Link href={resolvedFullPageHref} className={styles.petEntryLink}>
          展开完整玩法页面
        </Link>
        <span className={styles.petEntryMeta}>{resolvedFullPageHref}</span>
      </div>
    </section>
  );
}
