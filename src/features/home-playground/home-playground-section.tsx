import type {
  CreationHighlight,
  GameplayModeCard,
} from "@/shared/contracts/home";
import {
  InkButton,
  SectionHeading,
  TagPill,
} from "@/shared/ui/primitives";

import styles from "./home-playground-section.module.css";

export interface HomePlaygroundSectionProps {
  gameplayModes: GameplayModeCard[];
  creationHighlights: CreationHighlight[];
  onRequestMode?: (modeId: string) => void | Promise<void>;
  onPreviewCreation?: (creationId: string) => void | Promise<void>;
}

export function HomePlaygroundSection({
  gameplayModes,
  creationHighlights,
  onRequestMode,
  onPreviewCreation,
}: HomePlaygroundSectionProps) {
  return (
    <section className={`${styles.root} section-shell`}>
      <SectionHeading
        eyebrow="Interactive Entry"
        title="玩法入口"
        description="玩法卡只负责表达可玩方向和未来接口，不做新页面。首页底部同时承担创作传播预览，方便演示项目的内容潜力。"
      />

      <div className={styles.modeGrid}>
        {gameplayModes.map((mode) => (
          <article key={mode.id} className={`${styles.modeCard} paper-card`}>
            <div className={styles.modeHeader}>
              <TagPill tone={mode.readiness === "mock-ready" ? "seal" : "muted"}>
                {mode.readiness === "mock-ready" ? "可预览" : "接口预告"}
              </TagPill>
              <span
                className={styles.modeAccent}
                data-accent={mode.accent}
                aria-hidden="true"
              />
            </div>

            <div className={styles.modeBody}>
              <h3 className={styles.modeTitle}>{mode.title}</h3>
              <p className={styles.modeTagline}>{mode.tagline}</p>
              <p className="section-body">{mode.description}</p>
            </div>

            <p className="muted-note">{mode.interactionHint}</p>

            <InkButton
              tone={mode.readiness === "mock-ready" ? "primary" : "ghost"}
              onClick={() => {
                void onRequestMode?.(mode.id);
              }}
            >
              {mode.ctaLabel}
            </InkButton>
          </article>
        ))}
      </div>

      <div className={styles.creationSection}>
        <div className={styles.creationHeader}>
          <div>
            <p className="eyebrow">Creative Output</p>
            <h3 className={styles.creationTitle}>创作预览</h3>
          </div>
          <TagPill tone="muted">适合传播切片</TagPill>
        </div>

        <div className={styles.creationList}>
          {creationHighlights.map((highlight) => (
            <article
              key={highlight.id}
              className={`${styles.creationCard} paper-card paper-card--muted`}
            >
              <div className={styles.creationMeta}>
                <div>
                  <h4 className={styles.highlightTitle}>{highlight.title}</h4>
                  <p className={styles.highlightFormat}>{highlight.format}</p>
                </div>
                <TagPill tone="seal">热度 {highlight.heat}</TagPill>
              </div>

              <p className="section-body">{highlight.summary}</p>
              <div className={styles.tagRow}>
                {highlight.ancestors.map((ancestor) => (
                  <TagPill key={ancestor}>{ancestor}</TagPill>
                ))}
                <TagPill tone="muted">{highlight.hook}</TagPill>
              </div>

              <InkButton
                tone="ghost"
                onClick={() => {
                  void onPreviewCreation?.(highlight.id);
                }}
              >
                预览传播脚本
              </InkButton>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

