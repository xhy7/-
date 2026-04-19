import type { CreationHighlight, GameplayModeCard } from "@/shared/contracts/home";
import {
  InkButton,
  SectionHeading,
  TagPill,
} from "@/shared/ui/primitives";

import styles from "./home-playground-section.module.css";

const modePresentation = {
  "cross-time-quarrel": {
    glyph: "甲",
    eyebrow: "对峙剧场",
    signal: "火气先起",
    footer: "适合演示祖宗站队、互怼与局面失控的戏剧张力。",
  },
  "truth-or-dare": {
    glyph: "乙",
    eyebrow: "剖心问案",
    signal: "真话逼近",
    footer: "更适合做历史争议提问和人格反转，突出问答压迫感。",
  },
  "fusion-creation": {
    glyph: "丙",
    eyebrow: "合卷试笔",
    signal: "文风混写",
    footer: "适合直接发起联合作诗、改词或混写，随后继续把结果带入互评。",
  },
  "modern-reframe": {
    glyph: "丁",
    eyebrow: "今题借古",
    signal: "反差拉满",
    footer: "主打现代命题和古人视角错位，天然适合传播切条。",
  },
} satisfies Record<
  string,
  {
    glyph: string;
    eyebrow: string;
    signal: string;
    footer: string;
  }
>;

const creationRankLabels = ["头牌热传", "评论引线", "余波扩散"];

const getModePresentation = (modeId: string) => modePresentation[modeId as keyof typeof modePresentation];

export interface HomePlaygroundSectionProps {
  gameplayModes: GameplayModeCard[];
  creationHighlights: CreationHighlight[];
  selectedAncestorName?: string;
  selectedMoodValue?: number;
  selectedTraitTags?: string[];
  onRequestMode?: (modeId: string) => void | Promise<void>;
  onPreviewCreation?: (creationId: string) => void | Promise<void>;
}

export function HomePlaygroundSection({
  gameplayModes,
  creationHighlights,
  selectedAncestorName,
  selectedMoodValue,
  selectedTraitTags = [],
  onRequestMode,
  onPreviewCreation,
}: HomePlaygroundSectionProps) {
  return (
    <section className={`${styles.root} section-shell`}>
      <SectionHeading
        eyebrow="玩法总览"
        title="玩法入口"
        description="先从这里选择玩法，再在下方玩法工坊里真正操作。作品互评会并入创作类玩法的结果区。"
      />

      <div className={styles.stageNote}>
        <p className={styles.stageCopy}>
          点击任一玩法后，下方会切换到对应的可玩工坊；这里保留入口差异和传播样张预览。
        </p>
        <div className={styles.stageSignals} aria-label="玩法区状态总览">
          <TagPill tone="seal">{gameplayModes.length} 个入口已挂载</TagPill>
          <TagPill tone="seal">下方工坊可直接游玩</TagPill>
          <TagPill tone="muted">互评并入创作结果</TagPill>
          <TagPill tone="muted">{creationHighlights.length} 条传播样张</TagPill>
          {selectedAncestorName ? (
            <TagPill tone="muted">{selectedAncestorName} 的玩法视角</TagPill>
          ) : null}
          {typeof selectedMoodValue === "number" ? (
            <TagPill tone="muted">情绪指数 {selectedMoodValue}</TagPill>
          ) : null}
          {selectedTraitTags.slice(0, 2).map((tag) => (
            <TagPill key={tag} tone="muted">
              {tag}
            </TagPill>
          ))}
        </div>
      </div>

      <div className={styles.modeGrid}>
        {gameplayModes.map((mode) => {
          const presentation = getModePresentation(mode.id);

          return (
            <article
              key={mode.id}
              className={`${styles.modeCard} paper-card`}
              data-accent={mode.accent}
            >
              <div className={styles.modeHeader}>
                <div className={styles.modeTitleGroup}>
                  <span className={styles.modeGlyph} aria-hidden="true">
                    {presentation?.glyph ?? "卷"}
                  </span>
                  <div className={styles.modeTitleStack}>
                    <p className={styles.modeEyebrow}>
                      {presentation?.eyebrow ?? "卷轴入口"}
                    </p>
                    <h3 className={styles.modeTitle}>{mode.title}</h3>
                  </div>
                </div>
                <div className={styles.modeState}>
                  <TagPill tone={mode.readiness === "mock-ready" ? "seal" : "muted"}>
                    {mode.readiness === "mock-ready" ? "可游玩" : "敬请期待"}
                  </TagPill>
                  <span className={styles.modeSignal}>
                    {presentation?.signal ?? "意图待发"}
                  </span>
                </div>
              </div>

              <div className={styles.modeBody}>
                <p className={styles.modeTagline}>{mode.tagline}</p>
                <p className="section-body">{mode.description}</p>
              </div>

              <div className={styles.modeFooter}>
                <p className={styles.modePrompt}>
                  {presentation?.footer ?? "当前已开放玩法工坊，可继续生成实际结果。"}
                </p>
                <p className="muted-note">{mode.interactionHint}</p>
              </div>

              <InkButton
                tone="primary"
                className={styles.modeButton}
                onClick={() => {
                  void onRequestMode?.(mode.id);
                }}
              >
                {mode.id === "fusion-creation"
                  ? "打开创作台"
                  : mode.id === "modern-reframe"
                    ? "打开命题台"
                    : mode.ctaLabel}
              </InkButton>
            </article>
          );
        })}
      </div>

      <div className={styles.creationSection}>
        <div className={styles.creationHeader}>
          <div>
            <p className="eyebrow">Creative Output</p>
            <h3 className={styles.creationTitle}>创作预览</h3>
            <p className={styles.creationLead}>
              不做普通资讯流，而是把作品、互评和评论区热度压成可传播样张。
            </p>
          </div>
          <TagPill tone="muted">适合传播切片</TagPill>
        </div>

        <div className={styles.creationList}>
          {creationHighlights.map((highlight, index) => (
            <article
              key={highlight.id}
              className={`${styles.creationCard} paper-card paper-card--muted`}
            >
              <div className={styles.creationMeta}>
                <div>
                  <p className={styles.creationSerial}>
                    {creationRankLabels[index] ?? "热传增幅"}
                  </p>
                  <h4 className={styles.highlightTitle}>{highlight.title}</h4>
                  <p className={styles.highlightFormat}>{highlight.format}</p>
                </div>
                <TagPill tone="seal">热度 {highlight.heat}</TagPill>
              </div>

              <p className={styles.creationHook}>{highlight.hook}</p>
              <p className="section-body">{highlight.summary}</p>
              <div className={styles.tagRow}>
                {highlight.ancestors.map((ancestor) => (
                  <TagPill key={ancestor}>{ancestor}</TagPill>
                ))}
              </div>

              <InkButton
                tone="ghost"
                className={styles.creationButton}
                onClick={() => {
                  void onPreviewCreation?.(highlight.id);
                }}
              >
                查看传播脚本
              </InkButton>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
