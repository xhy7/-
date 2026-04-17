import type { FatePreview, NurtureSummary } from "@/shared/contracts/home";
import {
  InkButton,
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

export function HomeGrowthSection({
  nurtureSummary,
  fatePreviews,
  onOpenFatePreview,
}: HomeGrowthSectionProps) {
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
              <h3 className={styles.metricsValue}>
                {nurtureSummary.moodSnapshot.value}
              </h3>
            </div>
            <TagPill tone="seal">
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

          <div className={styles.tagRow}>
            {nurtureSummary.activeTags.map((tag) => (
              <TagPill key={tag}>{tag}</TagPill>
            ))}
          </div>

          <p className="muted-note">{nurtureSummary.nextBondMilestone}</p>
        </article>

        <article className={`${styles.traitCard} paper-card paper-card--muted`}>
          <div className={styles.traitHeader}>
            <p className="eyebrow">Trait Vector</p>
            <h3 className={styles.subTitle}>性格向量</h3>
          </div>

          <div className={styles.traitList}>
            {nurtureSummary.traitVector.map((trait) => (
              <ProgressMeter
                key={trait.id}
                label={trait.label}
                value={trait.value}
                max={trait.max}
                note={trait.note}
                tone={trait.tone}
              />
            ))}
          </div>
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

        <div className={styles.fateList}>
          {fatePreviews.map((fate) => (
            <article key={fate.id} className={`${styles.fateCard} paper-card`}>
              <div className={styles.fateMeta}>
                <div>
                  <p className="eyebrow">{fate.era}</p>
                  <h4 className={styles.fateTitle}>{fate.title}</h4>
                </div>
                <TagPill tone="seal">{fate.statusLabel}</TagPill>
              </div>

              <p className="section-body">{fate.description}</p>

              <div className={styles.tensionRow}>
                <span>张力值</span>
                <strong>{fate.tension}</strong>
              </div>

              <div className={styles.tensionTrack} aria-hidden="true">
                <div
                  className={styles.tensionFill}
                  style={{ width: `${fate.tension}%` }}
                />
              </div>

              <p className="muted-note">{fate.triggerHint}</p>
              <p className={styles.reward}>{fate.rewardLabel}</p>

              <InkButton
                tone="ghost"
                onClick={() => {
                  void onOpenFatePreview?.(fate.id);
                }}
              >
                聚焦节点
              </InkButton>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

