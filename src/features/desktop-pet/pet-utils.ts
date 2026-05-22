import type {
  DesktopPetCharacter,
  DesktopPetConfig,
  PetActionState,
  PetAssetManifest,
  PetSpriteFrameSet,
} from "@/shared/contracts/home";

export const USER_TRIGGERED_ACTIONS: PetActionState[] = [
  "talk",
  "poem",
  "happy",
  "sleep",
];

export const DOCK_ACTION_LABELS: Record<
  Extract<PetActionState, "talk" | "poem" | "happy" | "sleep">,
  string
> = {
  talk: "说话",
  poem: "吟诗",
  happy: "开心",
  sleep: "小憩",
};

export function getActiveCharacter(
  config: DesktopPetConfig,
  ancestorId: string,
): DesktopPetCharacter {
  return (
    config.characters.find((character) => character.ancestorId === ancestorId) ??
    config.characters[0]
  );
}

export function resolveFrameSet(
  manifest: PetAssetManifest,
  state: PetActionState,
): PetSpriteFrameSet {
  const matched = manifest.frameSets.find((frameSet) => frameSet.state === state);
  if (matched && matched.framePaths.length > 0) {
    return matched;
  }

  const idleSet = manifest.frameSets.find((frameSet) => frameSet.state === "idle");
  if (idleSet && idleSet.framePaths.length > 0) {
    return idleSet;
  }

  return {
    state,
    framePaths: [manifest.previewImageSrc],
    frameMs: 900,
    loop: true,
  };
}

export function getAnimationDuration(frameSet: PetSpriteFrameSet): number {
  const frameCount = Math.max(1, frameSet.framePaths.length);
  if (frameSet.loop) {
    return frameSet.frameMs * frameCount;
  }
  return frameSet.frameMs * frameCount;
}

export function pickSpeechLine(
  character: DesktopPetCharacter,
  state: PetActionState,
  fallback: string,
): string {
  const matched = character.speechLines.filter((line) => line.state === state);
  if (matched.length === 0) {
    return fallback;
  }

  const index = Math.floor(Math.random() * matched.length);
  return matched[index]?.text ?? fallback;
}

export function clampOffset(
  offset: { x: number; y: number },
  bounds: { width: number; height: number },
  spriteSize: { width: number; height: number },
  padding = 16,
): { x: number; y: number } {
  const maxX = Math.max(padding, bounds.width - spriteSize.width - padding);
  const maxY = Math.max(padding, bounds.height - spriteSize.height - padding);

  return {
    x: Math.min(maxX, Math.max(padding, offset.x)),
    y: Math.min(maxY, Math.max(padding, offset.y)),
  };
}

export function getDefaultStageOffset(bounds: {
  width: number;
  height: number;
}): { x: number; y: number } {
  const spriteWidth = 168;
  const spriteHeight = 168;
  return {
    x: Math.max(24, bounds.width * 0.58 - spriteWidth / 2),
    y: Math.max(24, bounds.height * 0.42 - spriteHeight / 2),
  };
}

const SPRITE_WIDTH = 168;
const BUBBLE_ESTIMATED_WIDTH = 280;
const BUBBLE_TOP_SAFE_ZONE = 108;

export type BubblePlacement = "above" | "below";

export interface BubbleFollowLayout {
  placement: BubblePlacement;
  shiftX: number;
}

export function getBubbleFollowLayout(
  dragOffset: { x: number; y: number },
  stageBounds: { width: number; height: number },
): BubbleFollowLayout {
  const spriteCenterX = dragOffset.x + SPRITE_WIDTH / 2;
  const halfBubble = BUBBLE_ESTIMATED_WIDTH / 2;
  const padding = 16;
  let shiftX = 0;

  if (spriteCenterX - halfBubble < padding) {
    shiftX = padding - (spriteCenterX - halfBubble);
  } else if (spriteCenterX + halfBubble > stageBounds.width - padding) {
    shiftX = stageBounds.width - padding - (spriteCenterX + halfBubble);
  }

  const placement: BubblePlacement =
    dragOffset.y < BUBBLE_TOP_SAFE_ZONE ? "below" : "above";

  return { placement, shiftX };
}
