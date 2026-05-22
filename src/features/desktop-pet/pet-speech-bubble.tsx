"use client";

import styles from "./desktop-pet-hub.module.css";

interface PetSpeechBubbleProps {
  speechText: string;
  displayName: string;
  isPoemReveal: boolean;
  isSleeping: boolean;
  isHappy: boolean;
}

export function PetSpeechBubble({
  speechText,
  displayName,
  isPoemReveal,
  isSleeping,
  isHappy,
}: PetSpeechBubbleProps) {
  return (
    <div
      className={[
        styles.bubble,
        isPoemReveal && styles.bubblePoem,
        isHappy && styles.bubbleHappy,
        isSleeping && styles.bubbleSleeping,
      ]
        .filter(Boolean)
        .join(" ")}
      aria-live="polite"
      aria-atomic="true"
    >
      <p className={styles.bubbleEyebrow}>
        {isSleeping
          ? `${displayName} · 小憩`
          : isHappy
            ? `${displayName} · 欣然`
            : isPoemReveal
              ? `${displayName} · 吟咏`
              : `${displayName} · 此刻`}
      </p>
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
