"use client";

import Link from "next/link";
import { notFound } from "next/navigation";
import { useMemo, useState, useSyncExternalStore } from "react";

import {
  appendConversationRecord,
  buildDerivedNurtureSummary,
  createConversationRecord,
  getConversationMemory,
  subscribeConversationMemory,
  summarizeConversationHistory,
} from "@/shared/ai/interaction-memory";
import type {
  AiReplyMode,
  AiReplyRequest,
  AiReplyResponse,
  AiSceneType,
  HomePageData,
} from "@/shared/contracts/home";
import { InkButton, TagPill } from "@/shared/ui/primitives";

import chatStyles from "./chat-page.module.css";
import styles from "../../page-shell.module.css";

interface ChatPageClientProps {
  data: HomePageData;
  ancestorId: string;
}

const modeLabelMap: Record<AiReplyMode, string> = {
  prototype: "原型模式",
  ooc: "偏移模式",
};

const sceneLabelMap: Record<AiSceneType, string> = {
  "daily-chat": "日常对话",
  "conflict-mediation": "冲突调停",
  "creative-feedback": "作品互评",
  "event-reaction": "事件反应",
};

const localizeTag = (tag: string) => {
  if (tag === "prototype" || tag === "ooc") {
    return modeLabelMap[tag];
  }

  if (
    tag === "daily-chat" ||
    tag === "conflict-mediation" ||
    tag === "creative-feedback" ||
    tag === "event-reaction"
  ) {
    return sceneLabelMap[tag];
  }

  return tag;
};

export function ChatPageClient({ data, ancestorId }: ChatPageClientProps) {
  const ancestors = [data.featuredAncestor, ...data.roster];
  const ancestor = ancestors.find((item) => item.id === ancestorId);

  if (!ancestor) {
    notFound();
  }

  const [mode, setMode] = useState<AiReplyMode>(data.aiSandbox.supportedModes[0]);
  const [sceneType, setSceneType] = useState<AiSceneType>(
    data.aiSandbox.sceneOptions[0]?.id ?? "daily-chat",
  );
  const [message, setMessage] = useState("今天事情很多，我有点想摆烂。");
  const [contextNote, setContextNote] = useState("当前对话场景");
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const conversationRecords = useSyncExternalStore(
    subscribeConversationMemory,
    getConversationMemory,
    () => [],
  );
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
  const dominantTraits = [...derivedSummary.traitVector]
    .sort((left, right) => right.value / right.max - left.value / left.max)
    .slice(0, 3);
  const baseSummary = useMemo(
    () => buildDerivedNurtureSummary(ancestor, data.nurtureSummary, []),
    [ancestor, data.nurtureSummary],
  );
  const traitDeltas = derivedSummary.traitVector
    .map((trait) => {
      const baseTrait = baseSummary.traitVector.find((item) => item.id === trait.id);
      const delta = trait.value - (baseTrait?.value ?? trait.value);

      return {
        ...trait,
        delta,
      };
    })
    .sort((left, right) => Math.abs(right.delta) - Math.abs(left.delta))
    .slice(0, 3);
  const quickPrompts = [
    {
      label: "安慰一下我",
      mode: "prototype" as const,
      sceneType: "daily-chat" as const,
      message: "今天状态不太好，你能先安慰我两句吗？",
      contextNote: "安抚情绪",
    },
    {
      label: "帮我评文案",
      mode: "prototype" as const,
      sceneType: "creative-feedback" as const,
      message: "你帮我看看这段文案是不是还不够锋利？",
      contextNote: "作品互评",
    },
    {
      label: "替我协调冲突",
      mode: "ooc" as const,
      sceneType: "conflict-mediation" as const,
      message: "如果两个人都很嘴硬，你会怎么劝他们先停下来？",
      contextNote: "冲突调停",
    },
  ];

  const submitReply = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const payload: AiReplyRequest = {
      ancestorId: ancestor.id,
      userMessage: message.trim(),
      mode,
      sceneType,
      moodIndex: derivedSummary.moodSnapshot.value,
      traitVector: derivedSummary.traitVector,
      contextNote: [contextNote.trim(), summarizeConversationHistory(ancestor.name, ancestorRecords)]
        .filter(Boolean)
        .join("\n"),
    };

    setIsPending(true);
    setError(null);

    try {
      const response = await fetch("/api/ai-reply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const json = (await response.json()) as AiReplyResponse | { error: string };

      if (!response.ok || "error" in json) {
        throw new Error("error" in json ? json.error : "AI reply request failed.");
      }

      appendConversationRecord(createConversationRecord(payload, json));
      setMessage("");
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "角色 AI 调用失败。",
      );
    } finally {
      setIsPending(false);
    }
  };

  return (
    <main className={styles.page}>
      <header className={`${styles.header} section-shell`}>
        <div>
          <div className={styles.brandMeta}>
            <TagPill tone="seal">{data.seasonLabel}</TagPill>
            <TagPill tone="muted">{ancestor.name}</TagPill>
          </div>
          <h1 className="display-title">{ancestor.name} 的对话场</h1>
          <p className={styles.subtitle}>
            把人物状态、对话历史和快捷开场语合并在一起，让聊天更自然，也让每次互动都继续影响养成。
          </p>
          <div className={styles.quickActions}>
            <Link href="/ancestors" className={styles.quickLink}>
              返回古人台
            </Link>
            <Link href="/growth" className={styles.quickLink}>
              查看养成变化
            </Link>
          </div>
        </div>
        <div className={styles.asideBlock}>
          <p className="section-body">{summarizeConversationHistory(ancestor.name, ancestorRecords)}</p>
          <div className={styles.asideList}>
            <div className={styles.asideItem}>
              <span>情绪指数</span>
              <strong>{derivedSummary.moodSnapshot.value}</strong>
            </div>
            <div className={styles.asideItem}>
              <span>历史回合</span>
              <strong>{ancestorRecords.length}</strong>
            </div>
          </div>
        </div>
      </header>

      <div className={styles.layout}>
        <div className={styles.mainColumn}>
          <section className={`${chatStyles.chatShell} section-shell`}>
            <div className={chatStyles.chatHeader}>
              <div>
                <p className="eyebrow">对话区</p>
                <h2 className={chatStyles.chatTitle}>角色 AI 对话</h2>
              </div>
              <TagPill tone={isPending ? "seal" : "muted"}>
                {isPending ? "回复中" : `${ancestorRecords.length} 段记忆`}
              </TagPill>
            </div>

            <div className={chatStyles.statsGrid}>
              <div className={chatStyles.statCard}>
                <span>当前情绪指数</span>
                <strong>{derivedSummary.moodSnapshot.value}</strong>
              </div>
              <div className={chatStyles.statCard}>
                <span>主导倾向</span>
                <strong>{dominantTraits.map((trait) => trait.label).join(" / ")}</strong>
              </div>
              <div className={chatStyles.statCard}>
                <span>当前模式</span>
                <strong>
                  {modeLabelMap[mode]} / {sceneLabelMap[sceneType]}
                </strong>
              </div>
            </div>

            <div className={chatStyles.promptRow}>
              {quickPrompts.map((prompt) => (
                <button
                  key={prompt.label}
                  type="button"
                  className={chatStyles.promptChip}
                  onClick={() => {
                    setMode(prompt.mode);
                    setSceneType(prompt.sceneType);
                    setMessage(prompt.message);
                    setContextNote(prompt.contextNote);
                  }}
                >
                  {prompt.label}
                </button>
              ))}
            </div>

            <div className={chatStyles.timeline}>
              {ancestorRecords.length > 0 ? (
                ancestorRecords.map((record) => (
                  <article key={record.id} className={chatStyles.messageRow}>
                    <div className={chatStyles.messageMeta}>
                      <span>你</span>
                      <time>{new Date(record.timestamp).toLocaleString()}</time>
                    </div>
                    <div className={chatStyles.userBubble}>{record.userMessage}</div>
                    <div className={chatStyles.messageMeta}>
                      <span>{ancestor.name}</span>
                      <span>
                        {modeLabelMap[record.mode]} / {sceneLabelMap[record.sceneType]}
                      </span>
                    </div>
                    <div className={chatStyles.replyBubble}>
                      {record.reply}
                      <div className={chatStyles.replyMeta}>
                        <p className="muted-note">潜台词：{record.subtext}</p>
                        <div className={styles.tagRow}>
                          {record.styleTags.map((tag) => (
                            <TagPill key={`${record.id}-${tag}`} tone="muted">
                              {localizeTag(tag)}
                            </TagPill>
                          ))}
                        </div>
                      </div>
                    </div>
                  </article>
                ))
              ) : (
                <div className={chatStyles.emptyState}>
                  <p className="section-body">还没有正式对话记录，可以直接发出第一句话。</p>
                </div>
              )}
            </div>

            <form className={chatStyles.composer} onSubmit={submitReply}>
              <div className={styles.selectorGrid}>
                {ancestors.map((item) => (
                  <Link
                    key={item.id}
                    href={`/chat/${item.id}`}
                    className={styles.selectorButton}
                    data-active={item.id === ancestor.id}
                  >
                    <strong>{item.name}</strong>
                    <span className={styles.selectorMeta}>{item.currentMoodLabel}</span>
                  </Link>
                ))}
              </div>

              <div className={chatStyles.composerGrid}>
                <label className={chatStyles.composerField}>
                  <span>模式</span>
                  <select
                    value={mode}
                    onChange={(event) => {
                      setMode(event.target.value as AiReplyMode);
                    }}
                  >
                    {data.aiSandbox.supportedModes.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </label>

                <label className={chatStyles.composerField}>
                  <span>场景</span>
                  <select
                    value={sceneType}
                    onChange={(event) => {
                      setSceneType(event.target.value as AiSceneType);
                    }}
                  >
                    {data.aiSandbox.sceneOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className={chatStyles.composerField}>
                  <span>场景备注</span>
                  <input
                    type="text"
                    value={contextNote}
                    onChange={(event) => {
                      setContextNote(event.target.value);
                    }}
                    placeholder="例如：深夜安慰、审稿互评、冲突协调"
                  />
                </label>
              </div>

              <label className={chatStyles.composerField}>
                <span>你想对他说的话</span>
                <textarea
                  rows={5}
                  maxLength={data.aiSandbox.maxUserMessageLength}
                  value={message}
                  onChange={(event) => {
                    setMessage(event.target.value);
                  }}
                />
                <span className="muted-note">
                  {message.length}/{data.aiSandbox.maxUserMessageLength}
                </span>
              </label>

              <div className={chatStyles.composerFooter}>
                <InkButton type="submit" disabled={isPending || !message.trim()}>
                  {isPending ? `正在请 ${ancestor.name} 回答` : `让 ${ancestor.name} 开口`}
                </InkButton>
              </div>
            </form>

            {error ? <p className={styles.error}>{error}</p> : null}
          </section>
        </div>

        <aside className={styles.rail}>
          <section className={`${styles.railCard} section-shell`}>
            <div>
              <p className="eyebrow">性格变化</p>
              <h2 className={styles.railTitle}>当前性格画像</h2>
            </div>
            <div className={styles.tagRow}>
              {dominantTraits.map((trait) => (
                <TagPill key={trait.id}>{trait.label}</TagPill>
              ))}
            </div>
            <p className="muted-note">{derivedSummary.moodSnapshot.summary}</p>
            <div className={chatStyles.deltaList}>
              {traitDeltas.map((trait) => (
                <article key={trait.id} className={chatStyles.deltaItem}>
                  <div className={chatStyles.deltaItemHeader}>
                    <strong>{trait.label}</strong>
                    <span className={chatStyles.deltaValue}>
                      {trait.delta >= 0 ? `+${trait.delta}` : trait.delta}
                    </span>
                  </div>
                  <span className="muted-note">当前值 {trait.value}</span>
                </article>
              ))}
            </div>
            <Link href={`/growth?ancestor=${ancestor.id}`} className={styles.quickLink}>
              去养成页查看节点
            </Link>
          </section>

          <section className={`${styles.railCard} section-shell`}>
            <div>
              <p className="eyebrow">对话记忆</p>
              <h2 className={styles.railTitle}>最近历史</h2>
            </div>
            <div className={styles.previewStack}>
              {ancestorRecords.length > 0 ? (
                ancestorRecords
                  .slice(-4)
                  .reverse()
                  .map((record) => (
                    <article key={record.id} className={chatStyles.memoryItem}>
                      <time>{new Date(record.timestamp).toLocaleString()}</time>
                      <p className="muted-note">你：{record.userMessage}</p>
                      <p className="section-body">{record.reply}</p>
                      <p className="muted-note">
                        {modeLabelMap[record.mode]} / {sceneLabelMap[record.sceneType]}
                      </p>
                    </article>
                  ))
              ) : (
                <p className="muted-note">还没有历史对话，第一轮会直接使用基础 persona。</p>
              )}
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}
