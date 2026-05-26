"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";

import type { DesktopPetPanelId, PetActionState, PetSpriteFrameSet } from "@/shared/contracts/home";

import styles from "./desktop-pet-hub.module.css";
import { PetSpeechBubble } from "./pet-speech-bubble";
import { PetSprite } from "./pet-sprite";
import {
  clampOffset,
  getBubbleFollowLayout,
  getDefaultStageOffset,
} from "./pet-utils";

interface PetStageProps {
  displayName: string;
  title: string;
  speechText: string;
  panelContext?: string;
  panelAmbientId?: DesktopPetPanelId;
  panelSwitchNonce?: number;
  showDockHappy?: boolean;
  showPanelHappyBurst?: boolean;
  actionState: PetActionState;
  frameSet: PetSpriteFrameSet;
  previewFallbackSrc: string;
  preloadFramePaths?: string[];
  isPoemReveal: boolean;
  isSleeping: boolean;
  isStageFading: boolean;
  dragOffset: { x: number; y: number };
  onDragOffsetChange: (offset: { x: number; y: number }) => void;
  onPetClick: () => void;
  onPetPointerDown: () => void;
  onPetPointerUp: () => void;
}

const STAGE_AMBIENT_CLASS: Record<DesktopPetPanelId, string> = {
  profile: "stageAmbientProfile",
  growth: "stageAmbientGrowth",
  playground: "stageAmbientPlayground",
  chat: "stageAmbientChat",
};

const SPRITE_SIZE = { width: 168, height: 168 };

export function PetStage({
  displayName,
  title,
  speechText,
  panelContext,
  panelAmbientId,
  panelSwitchNonce = 0,
  showDockHappy = false,
  showPanelHappyBurst = false,
  actionState,
  frameSet,
  previewFallbackSrc,
  preloadFramePaths,
  isPoemReveal,
  isSleeping,
  isStageFading,
  dragOffset,
  onDragOffsetChange,
  onPetClick,
  onPetPointerDown,
  onPetPointerUp,
}: PetStageProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const dragOffsetRef = useRef(dragOffset);
  const dragStartRef = useRef({ x: 0, y: 0, pointerX: 0, pointerY: 0 });
  const hasMovedRef = useRef(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    dragOffsetRef.current = dragOffset;
  }, [dragOffset]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setPrefersReducedMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) {
      return;
    }

    const syncStageSize = () => {
      const bounds = stage.getBoundingClientRect();
      setStageSize({ width: bounds.width, height: bounds.height });
    };

    syncStageSize();
    const observer = new ResizeObserver(syncStageSize);
    observer.observe(stage);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) {
      return;
    }

    const bounds = stage.getBoundingClientRect();
    if (dragOffset.x === 0 && dragOffset.y === 0) {
      onDragOffsetChange(getDefaultStageOffset(bounds));
    }
  }, [dragOffset.x, dragOffset.y, onDragOffsetChange]);

  const bubbleLayout = useMemo(() => {
    if (stageSize.width <= 0) {
      return { placement: "above" as const, shiftX: 0 };
    }
    return getBubbleFollowLayout(dragOffset, stageSize);
  }, [dragOffset, stageSize]);

  const clampToStage = useCallback((offset: { x: number; y: number }) => {
    const stage = stageRef.current;
    if (!stage) {
      return offset;
    }

    const bounds = stage.getBoundingClientRect();
    return clampOffset(offset, bounds, SPRITE_SIZE);
  }, []);

  const handlePointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0) {
      return;
    }

    event.preventDefault();
    if (typeof event.currentTarget.setPointerCapture === "function") {
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    setIsDragging(true);
    hasMovedRef.current = false;
    onPetPointerDown();

    dragStartRef.current = {
      x: dragOffsetRef.current.x,
      y: dragOffsetRef.current.y,
      pointerX: event.clientX,
      pointerY: event.clientY,
    };
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!isDragging) {
      return;
    }

    const deltaX = event.clientX - dragStartRef.current.pointerX;
    const deltaY = event.clientY - dragStartRef.current.pointerY;
    if (Math.hypot(deltaX, deltaY) > 8) {
      hasMovedRef.current = true;
    }
    const nextOffset = clampToStage({
      x: dragStartRef.current.x + deltaX,
      y: dragStartRef.current.y + deltaY,
    });
    onDragOffsetChange(nextOffset);
  };

  const finishDrag = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!isDragging) {
      return;
    }

    if (
      typeof event.currentTarget.hasPointerCapture === "function" &&
      event.currentTarget.hasPointerCapture(event.pointerId)
    ) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    setIsDragging(false);
    onPetPointerUp();
  };

  const isHappy = actionState === "happy";
  const showHappyVisual =
    isHappy && (showDockHappy || showPanelHappyBurst || Boolean(panelContext));
  const showHappyBurst = (isHappy && showDockHappy) || showPanelHappyBurst;
  const ambientClass = panelAmbientId
    ? styles[STAGE_AMBIENT_CLASS[panelAmbientId] as keyof typeof styles]
    : undefined;
  const stageClassName = [
    styles.stage,
    ambientClass,
    isPoemReveal && styles.stagePoem,
    showHappyBurst && styles.stageHappy,
  ]
    .filter(Boolean)
    .join(" ");

  const spriteLayerClassName = [
    styles.spriteLayer,
    isStageFading && styles.spriteLayerFading,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      ref={stageRef}
      className={stageClassName}
      role="group"
      aria-label={`${displayName}桌宠舞台`}
    >
      <div className={styles.stageBackdrop} aria-hidden="true">
        <span className={styles.stageGlow} />
        <span className={styles.stageRipple} />
        {isPoemReveal ? <span className={styles.stagePoemAura} aria-hidden="true" /> : null}
        {showHappyBurst ? <span className={styles.stageHappyBurst} aria-hidden="true" /> : null}
      </div>

      <div
        className={spriteLayerClassName}
        style={{
          transform: `translate3d(${dragOffset.x}px, ${dragOffset.y}px, 0)`,
        }}
      >
        <div
          className={[
            styles.bubbleAnchor,
            bubbleLayout.placement === "below" && styles.bubbleAnchorBelow,
          ]
            .filter(Boolean)
            .join(" ")}
          style={
            {
              "--bubble-shift-x": `${bubbleLayout.shiftX}px`,
            } as CSSProperties
          }
        >
          <PetSpeechBubble
            speechText={speechText}
            displayName={displayName}
            panelContext={panelContext}
            isPoemReveal={isPoemReveal}
            isSleeping={isSleeping}
            showHappyAccent={showHappyBurst}
            isHappy={isHappy}
          />
        </div>

        <button
          type="button"
          className={styles.spriteHandle}
          aria-label={`拖动${displayName}，点击互动`}
          onClick={() => {
            if (hasMovedRef.current) {
              hasMovedRef.current = false;
              return;
            }
            onPetClick();
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={finishDrag}
          onPointerCancel={finishDrag}
          onLostPointerCapture={finishDrag}
        >
          <PetSprite
            displayName={displayName}
            title={title}
            frameSet={frameSet}
            previewFallbackSrc={previewFallbackSrc}
            preloadFramePaths={preloadFramePaths}
            panelSwitchNonce={panelSwitchNonce}
            showDockHappy={showHappyVisual}
            actionState={actionState}
            isDragging={isDragging}
            prefersReducedMotion={prefersReducedMotion}
          />
        </button>
      </div>
    </div>
  );
}
