import { useCallback, useState } from "react";
import type { FatePreview, NurtureSummary } from "@/shared/contracts/home";
import {
  InkButton,
  ProgressMeter,
  SectionHeading,
  TagPill,
} from "@/shared/ui/primitives";

import { TENSION_THRESHOLDS, TENSION_STATUS_LABELS } from "./constants";
import styles from "./home-growth-section.module.css";

export interface HomeGrowthSectionProps {
  nurtureSummary: NurtureSummary;
  fatePreviews: FatePreview[];
  onOpenFatePreview?: (fateId: string) => void | Promise<void>;
}

const getDeltaTone = (delta: number): "seal" | "muted" =>
  delta >= 0 ? "seal" : "muted";

const getTensionTone = (tension: number): "high" | "mid" | "low" => {
  if (tension >= TENSION_THRESHOLDS.high) return "high";
  if (tension >= TENSION_THRESHOLDS.mid) return "mid";
  return "low";
};

const getTensionStatus = (tension: number): string => {
  if (tension >= TENSION_THRESHOLDS.high) return TENSION_STATUS_LABELS.high;
  if (tension >= TENSION_THRESHOLDS.mid) return TENSION_STATUS_LABELS.mid;
  return TENSION_STATUS_LABELS.low;
};

const getMoodAnimationClass = (value: number): string => {
  if (value >= 70) return styles.metricsValueBreathing;
  if (value < 30) return styles.metricsValueDimmed;
  return "";
};

export function HomeGrowthSection({
  nurtureSummary,
  fatePreviews,
  onOpenFatePreview,
}: HomeGrowthSectionProps) {
  const [expandedFateId, setExpandedFateId] = useState<string | null>(null);
  const deltaTone = getDeltaTone(nurtureSummary.moodSnapshot.delta);
  const moodAnimationClass = getMoodAnimationClass(
    nurtureSummary.moodSnapshot.value,
  );

  const handleToggleFate = useCallback(
    (fateId: string) => {
      void onOpenFatePreview?.(fateId);
      setExpandedFateId((prev) => (prev === fateId ? null : fateId));
    },
    [onOpenFatePreview],
  );

  return (
    <section className={`${styles.root} section-shell`}>
      <SectionHeading
        eyebrow="Growth Core"
        title="养成中枢"
        description="把 MoodIndex、Trait Vector、历史忠诚度和活跃标签集中摆在一起，让首页就能看懂人物现在处于什么培养状态。"
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
            <p className="eyebrow">Trait Vector</p>
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

      <div className={styles.fateSection}>
        <div className={styles.fateHeader}>
          <div>
            <p className="eyebrow">Fate Queue</p>
            <h3 className={styles.subTitle}>命运节点预告</h3>
          </div>
          <TagPill tone="muted">Future Hook Only</TagPill>
        </div>

        {fatePreviews.length === 0 ? (
          <div className={styles.fateEmpty}>
            <p className="section-body">
              暂无命运节点预告。继续培养祖宗，新的命运线将在此展开。
            </p>
          </div>
        ) : (
          <div className={styles.fateList}>
            {fatePreviews.map((fate) => {
              const tensionTone = getTensionTone(fate.tension);
              const statusLabel = fate.statusLabel || getTensionStatus(fate.tension);
              const isExpanded = expandedFateId === fate.id;
              const isHighTension = fate.tension >= TENSION_THRESHOLDS.high;

              return (
                <article
                  key={fate.id}
                  className={`${styles.fateCard} paper-card ${isExpanded ? styles.fateCardExpanded : ""} ${isHighTension ? styles.fateCardHighTension : ""}`}
                >
                  <div className={styles.fateMeta}>
                    <div>
                      <p className="eyebrow">{fate.era}</p>
                      <h4 className={styles.fateTitle}>{fate.title}</h4>
                    </div>
                    <TagPill tone="seal">{statusLabel}</TagPill>
                  </div>

                  <div className={styles.fateCardContent}>
                    <p className="section-body">{fate.description}</p>

                    <div className={styles.tensionRow}>
                      <span>张力值</span>
                      <strong>{fate.tension}</strong>
                    </div>

                    <div
                      className={`${styles.tensionTrack} ${styles[`tensionTrack--${tensionTone}`]}`}
                      role="progressbar"
                      aria-label={`张力值: ${fate.tension}%`}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={fate.tension}
                    >
                      <div
                        className={`${styles.tensionFill} ${styles[`tensionFill--${tensionTone}`]}`}
                        style={{ width: `${fate.tension}%` }}
                      />
                    </div>

                    <p className="muted-note">{fate.triggerHint}</p>
                    <p className={styles.reward}>{fate.rewardLabel}</p>
                  </div>

                  <InkButton
                    tone="ghost"
                    onClick={() => handleToggleFate(fate.id)}
                  >
                    {isExpanded ? "合上卷轴" : "聚焦节点"}
                  </InkButton>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
