"use client";

import styles from "./desktop-pet-hub.module.css";

interface PetSpeechBubbleProps {
  speechText: string;
  displayName: string;
  panelContext?: string;
  isPoemReveal: boolean;
  isSleeping: boolean;
  isHappy: boolean;
  showHappyAccent?: boolean;
}

export function PetSpeechBubble({
  speechText,
  displayName,
  panelContext,
  isPoemReveal,
  isSleeping,
  isHappy,
  showHappyAccent = false,
}: PetSpeechBubbleProps) {
  const eyebrow = isSleeping
    ? `${displayName} · 小憩`
    : isPoemReveal
      ? `${displayName} · 吟咏`
      : panelContext
        ? `${displayName} · ${panelContext}`
        : isHappy
          ? `${displayName} · 欣然`
          : `${displayName} · 此刻`;

  return (
    <div
      className={[
        styles.bubble,
        isPoemReveal && styles.bubblePoem,
        showHappyAccent && styles.bubbleHappy,
        isSleeping && styles.bubbleSleeping,
      ]
        .filter(Boolean)
        .join(" ")}
      aria-live="polite"
      aria-atomic="true"
    >
      <p className={styles.bubbleEyebrow}>{eyebrow}</p>
      <p
        className={[
          styles.bubbleText,
          isPoemReveal && styles.bubbleTextPoem,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {speechText}
      </p>
      <span className={styles.bubbleTail} aria-hidden="true" />
    </div>
  );
}
