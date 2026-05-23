"use client";

import Link from "next/link";
import { useEffect, useState, type RefObject } from "react";

import type {
  DesktopPetPanelId,
  DesktopPetPanelItem,
  PetActionState,
} from "@/shared/contracts/home";

import styles from "./pet-content-panel.module.css";
import { getModeIdLabel, getSceneTypeLabel } from "./pet-utils";

export interface PetContentPanelProps {
  panelItem: DesktopPetPanelItem;
  variant: DesktopPetPanelId;
  panelKey: string;
  titleRef?: RefObject<HTMLHeadingElement | null>;
  onActionPreview: (actionState: PetActionState) => void;
}

function getActionBadge(
  variant: DesktopPetPanelId,
  action: DesktopPetPanelItem["actions"][number],
): string | undefined {
  if (variant === "playground") {
    return getModeIdLabel(action.modeId);
  }
  if (variant === "chat") {
    return getSceneTypeLabel(action.sceneType);
  }
  return undefined;
}

function metricToneClass(tone: DesktopPetPanelItem["metrics"][number]["tone"]) {
  if (tone === "seal") {
    return styles.metricCardSeal;
  }
  if (tone === "muted") {
    return styles.metricCardMuted;
  }
  return styles.metricCardInk;
}

export function PetContentPanel({
  panelItem,
  variant,
  panelKey,
  titleRef,
  onActionPreview,
}: PetContentPanelProps) {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setPrefersReducedMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return (
    <article
      key={panelKey}
      className={[
        styles.panelBody,
        prefersReducedMotion && styles.panelBodyReduced,
      ]
        .filter(Boolean)
        .join(" ")}
      aria-labelledby={`pet-panel-title-${panelItem.id}`}
    >
      <header className={styles.panelHeader}>
        <p className={styles.panelEyebrow}>{panelItem.eyebrow}</p>
        <h3
          ref={titleRef}
          id={`pet-panel-title-${panelItem.id}`}
          className={styles.panelTitle}
          tabIndex={-1}
        >
          {panelItem.title}
        </h3>
        <p className={styles.panelSummary}>{panelItem.summary}</p>
      </header>

      <div className={styles.metricGrid}>
        {panelItem.metrics.map((metric, index) => (
          <div
            key={metric.id}
            className={[styles.metricCard, metricToneClass(metric.tone)]
              .filter(Boolean)
              .join(" ")}
            style={
              prefersReducedMotion
                ? undefined
                : { animationDelay: `${index * 40}ms` }
            }
          >
            <span className={styles.metricLabel}>{metric.label}</span>
            <strong className={styles.metricValue}>{metric.value}</strong>
            <p className={styles.metricNote}>{metric.note}</p>
          </div>
        ))}
      </div>

      <div className={styles.actionList}>
        {panelItem.actions.map((action) => {
          const badge = getActionBadge(variant, action);

          return (
            <Link
              key={action.id}
              href={action.href}
              className={[styles.actionTile, styles.actionTileLink]
                .filter(Boolean)
                .join(" ")}
              onFocus={() => onActionPreview(action.actionState)}
            >
              <div className={styles.actionHeader}>
                <span className={styles.actionLabel}>{action.label}</span>
                {badge ? (
                  <span className={styles.actionBadge}>{badge}</span>
                ) : null}
              </div>
              <p className={styles.actionDescription}>{action.description}</p>
              <span className={styles.actionArrow} aria-hidden="true">
                进入 →
              </span>
            </Link>
          );
        })}
      </div>

      <div className={styles.primaryCtaRow}>
        <Link
          href={panelItem.primaryHref}
          className={`ink-button ${styles.primaryCta}`}
        >
          {panelItem.primaryCtaLabel}
          <span className={styles.primaryCtaArrow} aria-hidden="true">
            →
          </span>
        </Link>
      </div>
    </article>
  );
}
