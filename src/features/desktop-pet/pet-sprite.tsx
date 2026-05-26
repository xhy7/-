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
  preloadFramePaths?: string[];
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
  preloadFramePaths = [],
  actionState,
  isDragging,
  prefersReducedMotion,
  panelSwitchNonce = 0,
  showDockHappy = false,
}: PetSpriteProps) {
  const [frameState, setFrameState] = useState({
    signature: "",
    index: 0,
  });
  const [brokenFrames, setBrokenFrames] = useState<Record<string, true>>({});
  const [activePanelBounceNonce, setActivePanelBounceNonce] = useState(0);

  const frames = useMemo(() => {
    const unique = frameSet.framePaths.filter(Boolean);
    return unique.length > 0 ? unique : [previewFallbackSrc];
  }, [frameSet.framePaths, previewFallbackSrc]);

  const frameSignature = frames.join("|");
  const frameIndex =
    frameState.signature === frameSignature
      ? Math.min(frameState.index, frames.length - 1)
      : 0;
  const activeSrc = frames[frameIndex] ?? previewFallbackSrc;
  const showGlyphFallback = brokenFrames[activeSrc] === true;
  const shouldPanelBounce =
    activePanelBounceNonce === panelSwitchNonce &&
    panelSwitchNonce > 0 &&
    !prefersReducedMotion;

  useEffect(() => {
    if (panelSwitchNonce <= 0 || prefersReducedMotion) {
      return;
    }

    const animationFrame = window.requestAnimationFrame(() => {
      setActivePanelBounceNonce(panelSwitchNonce);
    });
    const timer = window.setTimeout(() => {
      setActivePanelBounceNonce(0);
    }, 620);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.clearTimeout(timer);
    };
  }, [panelSwitchNonce, prefersReducedMotion]);

  useEffect(() => {
    const framePathsToPreload = new Set([
      ...preloadFramePaths,
      ...frames,
      previewFallbackSrc,
    ]);

    for (const framePath of framePathsToPreload) {
      if (brokenFrames[framePath]) {
        continue;
      }

      const image = new window.Image();
      image.src = framePath;
    }
  }, [brokenFrames, frameSignature, frames, preloadFramePaths, previewFallbackSrc]);

  useEffect(() => {
    if (prefersReducedMotion || frames.length <= 1) {
      return;
    }

    const interval = window.setInterval(() => {
      setFrameState((current) => {
        const currentIndex =
          current.signature === frameSignature ? current.index : 0;
        const next = currentIndex + 1;
        if (next >= frames.length) {
          return {
            signature: frameSignature,
            index: frameSet.loop ? 0 : currentIndex,
          };
        }
        return { signature: frameSignature, index: next };
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
        <div className={styles.spriteFrameStack} aria-hidden="true">
          {frames.map((framePath, index) => {
            if (brokenFrames[framePath]) {
              return null;
            }

            return (
              <Image
                key={framePath}
                src={framePath}
                alt=""
                width={168}
                height={168}
                className={[
                  styles.spriteImage,
                  index === frameIndex && styles.spriteImageActive,
                ]
                  .filter(Boolean)
                  .join(" ")}
                draggable={false}
                priority={index === 0}
                onError={() => {
                  setBrokenFrames((current) => ({
                    ...current,
                    [framePath]: true,
                  }));
                }}
              />
            );
          })}
        </div>
      )}
      {!showGlyphFallback ? (
        <span className={styles.spriteAccessibleName}>{displayName}桌宠</span>
      ) : null}
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
