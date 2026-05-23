import type {
  DesktopPetCharacter,
  DesktopPetConfig,
  DesktopPetPanelId,
  DesktopPetPanelItem,
  PetActionState,
  PetAssetManifest,
  PetEntranceId,
  PetSpriteFrameSet,
} from "@/shared/contracts/home";

const ENTRANCE_TO_PANEL: Record<PetEntranceId, DesktopPetPanelId> = {
  ancestors: "profile",
  growth: "growth",
  playground: "playground",
  chat: "chat",
};

export const PANEL_SPEECH_CONTEXT: Record<DesktopPetPanelId, string> = {
  profile: "档案",
  growth: "养成",
  playground: "玩法",
  chat: "对话",
};

const MODE_ID_LABELS: Record<string, string> = {
  "cross-time-quarrel": "吵架",
  "truth-or-dare": "真心话",
  "fusion-creation": "创作",
  "modern-reframe": "现代命题",
};

const SCENE_TYPE_LABELS: Record<string, string> = {
  "daily-chat": "日常",
  "conflict-mediation": "拉架",
  "creative-feedback": "作品互评",
  "event-reaction": "事件反应",
};

export function resolvePanelByEntranceId(
  entranceId: PetEntranceId,
): DesktopPetPanelId {
  return ENTRANCE_TO_PANEL[entranceId];
}

export function getPanelItem(
  config: DesktopPetConfig,
  panelId: DesktopPetPanelId,
): DesktopPetPanelItem | undefined {
  return config.panelItems.find((panel) => panel.id === panelId);
}

export function resolvePanelActionState(
  panelItem: DesktopPetPanelItem,
): PetActionState {
  return panelItem.actionState;
}

export function getModeIdLabel(modeId?: string): string | undefined {
  if (!modeId) {
    return undefined;
  }
  return MODE_ID_LABELS[modeId] ?? modeId;
}

export function getSceneTypeLabel(sceneType?: string): string | undefined {
  if (!sceneType) {
    return undefined;
  }
  return SCENE_TYPE_LABELS[sceneType] ?? sceneType;
}

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
  const anchorX = bounds.width < 520 ? 0.5 : 0.44;
  return {
    x: Math.max(24, bounds.width * anchorX - spriteWidth / 2),
    y: Math.max(24, bounds.height * 0.42 - spriteHeight / 2),
  };
}

const SPRITE_WIDTH = 168;
const BUBBLE_ESTIMATED_WIDTH = 280;
const BUBBLE_TOP_SAFE_ZONE = 96;

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
    dragOffset.y < BUBBLE_TOP_SAFE_ZONE || stageBounds.height < 360
      ? "below"
      : "above";

  return { placement, shiftX };
}
