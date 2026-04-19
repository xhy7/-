import type { FatePreview, NurtureSummary } from "@/shared/contracts/home";
import {
  ProgressMeter,
  SectionHeading,
  TagPill,
} from "@/shared/ui/primitives";

import styles from "./home-growth-section.module.css";

export interface HomeGrowthSectionProps {
  nurtureSummary: NurtureSummary;
  fatePreviews: FatePreview[];
  onOpenFatePreview?: (fateId: string) => void | Promise<void>;
}

const getDeltaTone = (delta: number): "seal" | "muted" =>
  delta >= 0 ? "seal" : "muted";

const getMoodAnimationClass = (value: number): string => {
  if (value >= 70) return styles.metricsValueBreathing;
  if (value < 30) return styles.metricsValueDimmed;
  return "";
  return "";
};

export function HomeGrowthSection({
  nurtureSummary,
}: HomeGrowthSectionProps) {
  const deltaTone = getDeltaTone(nurtureSummary.moodSnapshot.delta);
  const moodAnimationClass = getMoodAnimationClass(
    nurtureSummary.moodSnapshot.value,
  );

  return (
    <section className={`${styles.root} section-shell`}>
      <SectionHeading
        eyebrow="养成总览"
        title="养成中枢"
        description="把情绪指数、性格向量、历史忠诚度和活跃标签集中摆在一起，方便快速判断人物当前的养成状态。"
      />

      <div className={styles.topGrid}>
        <article className={`${styles.metricsCard} paper-card`}>
          <div className={styles.metricsHeader}>
            <div>
              <p className="eyebrow">{nurtureSummary.moodSnapshot.label}</p>
              <h3 className={`${styles.metricsValue} ${moodAnimationClass}`}>
                {nurtureSummary.moodSnapshot.value}
                {nurtureSummary.moodSnapshot.delta > 0 && (
                  <span className={styles.particleContainer} aria-hidden="true">
                    <span className={styles.particle} />
                    <span className={styles.particle} />
                    <span className={styles.particle} />
                  </span>
                )}
              </h3>
              <TagPill tone={deltaTone}>
                {nurtureSummary.moodSnapshot.statusLabel}
              </TagPill>
            </div>
            <TagPill tone={deltaTone}>
              {nurtureSummary.moodSnapshot.delta >= 0 ? "+" : ""}
              {nurtureSummary.moodSnapshot.delta}
            </TagPill>
          </div>

          <p className="section-body">{nurtureSummary.moodSnapshot.summary}</p>
          <p className="muted-note">
            触发原因：{nurtureSummary.moodSnapshot.cause}
          </p>

          <div className={styles.summaryGrid}>
            <div className={styles.summaryCell}>
              <span>培养阶段</span>
              <strong>{nurtureSummary.cultivationStage}</strong>
            </div>
            <div className={styles.summaryCell}>
              <span>金叶子余额</span>
              <strong>{nurtureSummary.leafBalance}</strong>
            </div>
            <div className={styles.summaryCell}>
              <span>历史忠诚度</span>
              <strong>{nurtureSummary.historicalFidelity}</strong>
            </div>
          </div>

          {nurtureSummary.activeTags.length > 0 && (
            <div className={styles.tagRow}>
              {nurtureSummary.activeTags.map((tag, index) => (
                <span
                  key={tag}
                  className={styles.tagStagger}
                  style={{ animationDelay: `${index * 80}ms` } as React.CSSProperties}
                >
                  <TagPill>{tag}</TagPill>
                </span>
              ))}
            </div>
          )}

          <p className="muted-note">{nurtureSummary.nextBondMilestone}</p>
        </article>

        <article className={`${styles.traitCard} paper-card paper-card--muted`}>
          <div className={styles.traitHeader}>
            <p className="eyebrow">性格向量</p>
            <h3 className={styles.subTitle}>性格向量</h3>
          </div>

          {nurtureSummary.traitVector.length === 0 ? (
            <div className={styles.traitEmpty}>
              <p className="muted-note">性格向量数据待补充。</p>
            </div>
          ) : (
            <div className={styles.traitList}>
              {nurtureSummary.traitVector.map((trait) => (
                <ProgressMeter
                  key={trait.id}
                  label={trait.label}
                  value={Math.max(0, Math.min(100, trait.value ?? 0))}
                  max={trait.max}
                  note={trait.value != null ? trait.note : "数据待补充"}
                  tone={trait.tone}
                />
              ))}
            </div>
          )}
        </article>
      </div>
    </section>
  );
}
