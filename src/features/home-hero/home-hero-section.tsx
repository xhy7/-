"use client";

import Link from "next/link";
import type { FormEvent } from "react";
import { useMemo, useState } from "react";

import type {
  AiReplyRequest,
  AiReplyResponse,
  AiReplySandboxConfig,
  AncestorCardSummary,
  FeaturedAncestor,
  TraitMetric,
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
  aiSandbox,
  moodIndex,
  traitVector,
  aiReplyResult,
  aiReplyError,
  isAiReplyPending,
  getChatHref,
  chatMemoryCount,
  chatSummary,
  onGenerateAiReply,
  onSelectAncestor,
  onOpenAncestorDetail,
}: HomeHeroSectionProps) {
  const ancestors = [featuredAncestor, ...roster];
  const [activeAncestorId, setActiveAncestorId] = useState(featuredAncestor.id);
  const [mode, setMode] = useState(aiSandbox.supportedModes[0]);
  const [sceneType, setSceneType] = useState(aiSandbox.sceneOptions[0]?.id);
  const [message, setMessage] = useState("今天事情很多，我有点想摆烂。");
  const [contextNote, setContextNote] = useState("当前是首页轻交互场景");
  const activeAncestor =
    ancestors.find((ancestor) => ancestor.id === activeAncestorId) ??
    featuredAncestor;
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

  const archiveSealLabel = isFeaturedActive ? "主推人物卷" : "轮播人物卷";
  const archiveSummary = isFeaturedAncestor(activeAncestor)
    ? `${activeAncestor.currentResidence} · ${activeAncestor.playerBondTitle}`
    : `${activeAncestor.name} 当前位于轮播候选位，可从首页直接切换聚焦。`;
  const quoteSeal = isFeaturedActive ? "朱印题签" : "候选题签";
  const dominantTraits = useMemo(
    () =>
      [...traitVector]
        .sort((left, right) => right.value / right.max - left.value / left.max)
        .slice(0, 2),
    [traitVector],
  );
  const aiResponseMatchesAncestor = aiReplyResult?.ancestorId === activeAncestor.id;

  const submitAiRequest = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!sceneType || !message.trim()) {
      return;
    }

    await onGenerateAiReply?.({
      ancestorId: activeAncestor.id,
      userMessage: message.trim(),
      mode,
      sceneType,
      moodIndex,
      traitVector,
      contextNote: contextNote.trim() || undefined,
    });
  };

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
          <div className={styles.heroBanner}>
            <div className={styles.bannerCopy}>
              <p className="eyebrow">Current Ancestor</p>
              <strong className={styles.bannerTitle}>
                {isFeaturedActive ? "当前主推祖宗" : "已切换轮播祖宗"}
              </strong>
            </div>
            <TagPill tone={isFeaturedActive ? "seal" : "muted"}>
              {isFeaturedActive ? "Featured" : "Roster Active"}
            </TagPill>
          </div>

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

          <section className={styles.archiveShell} aria-label="人物卷预告">
            <div className={styles.archiveHeader}>
              <div>
                <p className="eyebrow">Archive Drawer Shell</p>
                <h4 className={styles.archiveTitle}>人物卷预告</h4>
              </div>
              <TagPill tone={isFeaturedActive ? "seal" : "muted"}>
                {archiveSealLabel}
              </TagPill>
            </div>
            <p className={styles.archiveSummary}>{archiveSummary}</p>
            <div className={styles.archiveMeta}>
              <span>语录</span>
              <span>题签</span>
              <span>关系钩子</span>
            </div>
          </section>

          <section className={styles.aiShell} aria-label="角色 AI 代答">
            <div className={styles.aiHeader}>
              <div>
                <p className="eyebrow">Persona AI</p>
                <h4 className={styles.aiTitle}>{activeAncestor.name} 的角色代答</h4>
              </div>
              <TagPill tone={isAiReplyPending ? "seal" : "muted"}>
                {isAiReplyPending ? "AI 生成中" : "AI 在线"}
              </TagPill>
            </div>

            <p className={styles.aiSummary}>
              每位祖宗背后都挂着一套角色 persona。当前会按
              `mode / sceneType / moodIndex / traitVector` 生成符合人设的回复。
            </p>

            <div className={styles.aiTraitRow}>
              <span>角色倾向</span>
              <div className={styles.tagRow}>
                {dominantTraits.map((trait) => (
                  <TagPill key={trait.id} tone="muted">
                    {trait.label}
                  </TagPill>
                ))}
                <TagPill tone="muted">Mood {moodIndex}</TagPill>
              </div>
            </div>

            {onGenerateAiReply ? (
              <>
                <form className={styles.aiForm} onSubmit={submitAiRequest}>
                  <div className={styles.aiGrid}>
                    <label className={styles.aiField}>
                      <span>模式</span>
                      <select
                        value={mode}
                        onChange={(event) => {
                          setMode(event.target.value as typeof mode);
                        }}
                      >
                        {aiSandbox.supportedModes.map((item) => (
                          <option key={item} value={item}>
                            {item}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className={styles.aiField}>
                      <span>场景</span>
                      <select
                        value={sceneType}
                        onChange={(event) => {
                          setSceneType(event.target.value as typeof sceneType);
                        }}
                      >
                        {aiSandbox.sceneOptions.map((option) => (
                          <option key={option.id} value={option.id}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <label className={styles.aiField}>
                    <span>场景备注</span>
                    <input
                      type="text"
                      value={contextNote}
                      onChange={(event) => {
                        setContextNote(event.target.value);
                      }}
                      placeholder="例如：安慰、吐槽、作品点评"
                    />
                  </label>

                  <label className={styles.aiField}>
                    <span>你想对他说的话</span>
                    <textarea
                      rows={4}
                      maxLength={aiSandbox.maxUserMessageLength}
                      value={message}
                      onChange={(event) => {
                        setMessage(event.target.value);
                      }}
                      placeholder="输入一句想让当前角色回应的话"
                    />
                  </label>

                  <div className={styles.aiFormFoot}>
                    <span className="muted-note">
                      当前聚焦祖宗切换后，AI 代答对象也会随之切换。
                    </span>
                    <InkButton
                      type="submit"
                      disabled={isAiReplyPending || !message.trim()}
                    >
                      让 {activeAncestor.name} 开口
                    </InkButton>
                  </div>
                </form>

                {aiReplyError ? <p className={styles.aiError}>{aiReplyError}</p> : null}

                {aiResponseMatchesAncestor ? (
                  <div className={styles.aiReplyCard}>
                    <div className={styles.aiReplyHeader}>
                      <strong>角色回复</strong>
                      <TagPill tone={aiReplyResult.debug.provider === "mock" ? "muted" : "seal"}>
                        {aiReplyResult.debug.provider}
                      </TagPill>
                    </div>
                    <p className={styles.aiReplyText}>{aiReplyResult.output.reply}</p>
                    <p className="muted-note">潜台词：{aiReplyResult.output.subtext}</p>
                    <p className="muted-note">下一步：{aiReplyResult.output.nextAction}</p>
                    <div className={styles.tagRow}>
                      {aiReplyResult.output.styleTags.map((tag) => (
                        <TagPill key={tag} tone="muted">
                          {tag}
                        </TagPill>
                      ))}
                    </div>
                  </div>
                ) : null}
              </>
            ) : getChatHref ? (
              <div className={styles.aiCtaBlock}>
                <p className="muted-note">
                  当前舞台页只保留角色概览，对话入口已拆到独立页面。
                </p>
                <p className="muted-note">
                  已累计 {chatMemoryCount ?? 0} 段对话记忆。
                </p>
                {chatSummary ? <p className="muted-note">{chatSummary}</p> : null}
                <Link
                  href={getChatHref(activeAncestor.id)}
                  className={styles.aiChatLink}
                >
                  进入 {activeAncestor.name} 的对话页
                </Link>
              </div>
            ) : null}
          </section>

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
            {ancestors.map((ancestor, index) => {
              const isActive = ancestor.id === activeAncestor.id;
              const isFeatured = ancestor.id === featuredAncestor.id;

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
                    <div className={styles.switcherGlyph} aria-hidden="true">
                      {ancestor.portraitGlyph}
                    </div>
                    <div>
                      <div className={styles.switcherMeta}>
                        <strong>
                          {ancestor.name} · {ancestor.era}
                        </strong>
                        <TagPill tone={isFeatured ? "seal" : "muted"}>
                          {isFeatured ? "主推位" : `候选 ${index}`}
                        </TagPill>
                        <TagPill tone="muted">AI 在线</TagPill>
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

          <p className="muted-note">
            当前只做首页切换，不接真实人物抽屉。后续只需复用
            `getAncestorDetailPreview(ancestorId)` 即可扩展。
          </p>
        </aside>
      </div>
    </section>
  );
}
