"use client";

import { useState, useTransition } from "react";

import {
  HomeGrowthSection,
  type HomeGrowthSectionProps,
} from "@/features/home-growth/home-growth-section";
import {
  HomeHeroSection,
  type HomeHeroSectionProps,
} from "@/features/home-hero/home-hero-section";
import {
  HomePlaygroundSection,
  type HomePlaygroundSectionProps,
} from "@/features/home-playground/home-playground-section";
import {
  getAncestorDetailPreview,
  prepareModeIntent,
} from "@/mocks/home-gateway";
import type {
  AncestorDetailPreview,
  CreationHighlight,
  HomePageData,
  ModeIntentPreview,
} from "@/shared/contracts/home";
import { InkButton, TagPill } from "@/shared/ui/primitives";

import styles from "./home-page-client.module.css";

interface HomePageClientProps {
  data: HomePageData;
}

const initialConsoleNote =
  "首页当前运行在 mock-first 模式：所有按钮只回填意图预览，不跳转新页面。";

export function HomePageClient({ data }: HomePageClientProps) {
  const [activityNote, setActivityNote] = useState(initialConsoleNote);
  const [ancestorPreview, setAncestorPreview] =
    useState<AncestorDetailPreview | null>(null);
  const [modePreview, setModePreview] = useState<ModeIntentPreview | null>(null);
  const [isPending, startTransition] = useTransition();

  const heroProps: HomeHeroSectionProps = {
    featuredAncestor: data.featuredAncestor,
    roster: data.roster,
    onSelectAncestor: (ancestorId) => {
      const activeAncestor = [data.featuredAncestor, ...data.roster].find(
        (item) => item.id === ancestorId,
      );

      if (activeAncestor) {
        setActivityNote(
          `已切换到 ${activeAncestor.name}。当前最适合尝试“${activeAncestor.signatureTags[0]}”相关玩法。`,
        );
      }
    },
    onOpenAncestorDetail: async (ancestorId) => {
      setActivityNote("正在展开人物卷轴预览...");
      const preview = await getAncestorDetailPreview(ancestorId);

      startTransition(() => {
        setAncestorPreview(preview);
        setModePreview(null);
        setActivityNote(
          `${preview.name} 的人物卷已展开。后续只需把这里换成 drawer 或 side sheet。`,
        );
      });
    },
  };

  const growthProps: HomeGrowthSectionProps = {
    nurtureSummary: data.nurtureSummary,
    fatePreviews: data.fatePreviews,
    onOpenFatePreview: (fateId) => {
      const fate = data.fatePreviews.find((item) => item.id === fateId);

      if (fate) {
        setAncestorPreview(null);
        setModePreview(null);
        setActivityNote(
          `命运节点「${fate.title}」已聚焦。触发提示：${fate.triggerHint}`,
        );
      }
    },
  };

  const previewCreation = (creation: CreationHighlight) => {
    setActivityNote(
      `已预览「${creation.title}」。这块未来可以直接接短视频脚本或图文切片生成链路。`,
    );
    setAncestorPreview(null);
    setModePreview(null);
  };

  const playgroundProps: HomePlaygroundSectionProps = {
    gameplayModes: data.gameplayModes,
    creationHighlights: data.creationHighlights,
    onRequestMode: async (modeId) => {
      setActivityNote("正在生成玩法意图预览...");
      const preview = await prepareModeIntent(modeId);

      startTransition(() => {
        setModePreview(preview);
        setAncestorPreview(null);
        setActivityNote(
          `模式「${preview.title}」已回填到首页控制台。真实玩法页暂不开放。`,
        );
      });
    },
    onPreviewCreation: (creationId) => {
      const creation = data.creationHighlights.find(
        (item) => item.id === creationId,
      );

      if (creation) {
        previewCreation(creation);
      }
    },
  };

  const featuredModeId = data.gameplayModes[0]?.id;

  return (
    <main className={styles.page}>
      <header className={`${styles.topBanner} section-shell`}>
        <div className={styles.brandBlock}>
          <div className={styles.brandMeta}>
            <TagPill tone="seal">{data.seasonLabel}</TagPill>
            <TagPill tone="muted">Mock First</TagPill>
            <TagPill tone="muted">契约冻结中</TagPill>
          </div>
          <h1 className="display-title">{data.brandTitle}</h1>
          <p className={styles.subtitle}>{data.brandSubtitle}</p>
        </div>
        <div className={styles.bannerAside}>
          <p className={styles.heroNotice}>{data.heroNotice}</p>
          <InkButton
            onClick={() => {
              if (featuredModeId) {
                void playgroundProps.onRequestMode?.(featuredModeId);
              }
            }}
          >
            立即进入主舞台
          </InkButton>
        </div>
      </header>

      <div className={styles.layout}>
        <div className={styles.mainColumn}>
          <HomeHeroSection {...heroProps} />
          <HomeGrowthSection {...growthProps} />
          <HomePlaygroundSection {...playgroundProps} />
        </div>

        <aside className={styles.rail}>
          <section className={`${styles.railCard} section-shell`}>
            <div className={styles.railHeader}>
              <div>
                <p className="eyebrow">Home Console</p>
                <h2 className={styles.railTitle}>
                  {ancestorPreview?.archiveLabel ??
                    modePreview?.title ??
                    "首页控制台"}
                </h2>
              </div>
              <TagPill tone={isPending ? "seal" : "muted"}>
                {isPending ? "加载中" : "Future Intent"}
              </TagPill>
            </div>

            <p className={styles.activityNote}>{activityNote}</p>

            {ancestorPreview ? (
              <div className={styles.previewStack}>
                <div className={styles.previewMeta}>
                  <strong>
                    {ancestorPreview.name} · {ancestorPreview.courtesyName}
                  </strong>
                  <span>{ancestorPreview.era}</span>
                </div>
                <p className="section-body">{ancestorPreview.profile}</p>
                <ul className={styles.previewList}>
                  {ancestorPreview.relationshipHooks.map((hook) => (
                    <li key={hook}>{hook}</li>
                  ))}
                </ul>
                <div className={styles.tagRow}>
                  {ancestorPreview.unlockHints.map((hint) => (
                    <TagPill key={hint} tone="muted">
                      {hint}
                    </TagPill>
                  ))}
                </div>
              </div>
            ) : null}

            {modePreview ? (
              <div className={styles.previewStack}>
                <p className="section-body">{modePreview.intentSummary}</p>
                <div className={styles.tagRow}>
                  {modePreview.requiredAncestors.map((ancestor) => (
                    <TagPill key={ancestor}>{ancestor}</TagPill>
                  ))}
                </div>
                <p className="muted-note">{modePreview.systemNotice}</p>
                <p className={styles.nextStep}>{modePreview.nextStepLabel}</p>
              </div>
            ) : null}

            {!ancestorPreview && !modePreview ? (
              <div className={styles.previewStack}>
                <p className="section-body">
                  点击祖宗人物卡、命运节点或玩法入口后，这里会展示 future
                  intent 结果，给后续独立页面或抽屉接入做清晰边界。
                </p>
                <div className={styles.tagRow}>
                  <TagPill>人物卷预览</TagPill>
                  <TagPill tone="muted">模式意图预览</TagPill>
                </div>
              </div>
            ) : null}

            <InkButton
              tone="ghost"
              className={styles.resetButton}
              onClick={() => {
                setAncestorPreview(null);
                setModePreview(null);
                setActivityNote(initialConsoleNote);
              }}
            >
              清空控制台
            </InkButton>
          </section>
        </aside>
      </div>

      {featuredModeId ? (
        <InkButton
          className={styles.floatingCta}
          onClick={() => {
            void playgroundProps.onRequestMode?.(featuredModeId);
          }}
        >
          {data.floatingActionLabel}
        </InkButton>
      ) : null}
    </main>
  );
}

