"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

import type { PetSpriteFrameSet } from "@/shared/contracts/home";

import styles from "./desktop-pet-hub.module.css";

interface PetSpriteProps {
  displayName: string;
  title: string;
  frameSet: PetSpriteFrameSet;
  previewFallbackSrc: string;
  actionState: string;
  isDragging: boolean;
  prefersReducedMotion: boolean;
  panelSwitchNonce?: number;
  showDockHappy?: boolean;
}

export function PetSprite({
  displayName,
  title,
  frameSet,
  previewFallbackSrc,
  actionState,
  isDragging,
  prefersReducedMotion,
  panelSwitchNonce = 0,
  showDockHappy = false,
}: PetSpriteProps) {
  const [frameIndex, setFrameIndex] = useState(0);
  const [brokenFrames, setBrokenFrames] = useState<Record<string, true>>({});

  const frames = useMemo(() => {
    const unique = frameSet.framePaths.filter(Boolean);
    return unique.length > 0 ? unique : [previewFallbackSrc];
  }, [frameSet.framePaths, previewFallbackSrc]);

  const frameSignature = frames.join("|");
  const activeSrc = frames[frameIndex] ?? previewFallbackSrc;
  const showGlyphFallback = brokenFrames[activeSrc] === true;
  const shouldPanelBounce =
    panelSwitchNonce > 0 && !prefersReducedMotion;

  useEffect(() => {
    if (prefersReducedMotion || frames.length <= 1) {
      return;
    }

    const interval = window.setInterval(() => {
      setFrameIndex((current) => {
        const next = current + 1;
        if (next >= frames.length) {
          return frameSet.loop ? 0 : current;
        }
        return next;
      });
    }, frameSet.frameMs);

    return () => window.clearInterval(interval);
  }, [
    frameSet.frameMs,
    frameSet.loop,
    frameSignature,
    frames.length,
    prefersReducedMotion,
  ]);

  return (
    <div
      className={[
        styles.sprite,
        isDragging && styles.spriteDragging,
        actionState === "sleep" && styles.spriteSleeping,
        actionState === "annoyed" && styles.spriteAnnoyed,
        showDockHappy && styles.spriteHappy,
        actionState === "poem" && styles.spritePoem,
        shouldPanelBounce && styles.spritePanelBounce,
      ]
        .filter(Boolean)
        .join(" ")}
      data-action-state={actionState}
    >
      {showGlyphFallback ? (
        <div className={styles.spriteGlyph} aria-hidden="true">
          <span>{displayName.slice(0, 1)}</span>
          <small>{title}</small>
        </div>
      ) : (
        <Image
          key={activeSrc}
          src={activeSrc}
          alt={`${displayName}桌宠`}
          width={168}
          height={168}
          className={styles.spriteImage}
          draggable={false}
          onError={() => {
            setBrokenFrames((current) => ({
              ...current,
              [activeSrc]: true,
            }));
          }}
        />
      )}
      <span
        className={[
          styles.spriteHalo,
          showDockHappy && styles.spriteHaloHappy,
          actionState === "poem" && styles.spriteHaloPoem,
        ]
          .filter(Boolean)
          .join(" ")}
        aria-hidden="true"
      />
    </div>
  );
}
