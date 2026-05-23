"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type {
  DesktopPetConfig,
  DesktopPetPanelId,
  DesktopPetPanelItem,
  DesktopPetQuickIntent,
  PetActionState,
  PetEntranceItem,
} from "@/shared/contracts/home";

import {
  getActiveCharacter,
  getPanelItem,
  PANEL_SPEECH_CONTEXT,
  pickSpeechLine,
  resolveFrameSet,
  resolvePanelActionState,
  resolvePanelByEntranceId,
} from "./pet-utils";

const ONE_SHOT_STATES: PetActionState[] = [
  "greet",
  "poem",
  "happy",
  "annoyed",
];

const RETURN_IDLE_MS: Record<PetActionState, number> = {
  idle: 0,
  greet: 2400,
  talk: 4200,
  poem: 3600,
  dragging: 0,
  happy: 2800,
  annoyed: 3200,
  sleep: 0,
};

const SLEEP_AFTER_IDLE_MS = 120_000;
const ANNOYED_RAPID_CLICK_THRESHOLD = 5;
const ANNOYED_CLICK_WINDOW_MS = 1400;
const CHARACTER_SWITCH_FADE_MS = 240;

export interface OpenPanelOptions {
  speechOverride?: string;
  force?: boolean;
  silent?: boolean;
  actionState?: PetActionState;
}

export interface UsePetControllerOptions {
  config: DesktopPetConfig;
}

export interface UsePetControllerResult {
  activeAncestorId: string;
  activeCharacter: ReturnType<typeof getActiveCharacter>;
  activePanelId: DesktopPetPanelId;
  activePanelItem: DesktopPetPanelItem;
  actionState: PetActionState;
  speechText: string;
  speechContextLabel?: string;
  isPoemReveal: boolean;
  showPanelHappyBurst: boolean;
  panelSwitchNonce: number;
  dragOffset: { x: number; y: number };
  setDragOffset: (offset: { x: number; y: number }) => void;
  selectAncestor: (ancestorId: string) => void;
  triggerAction: (state: PetActionState, speechOverride?: string) => void;
  openPanel: (panelId: DesktopPetPanelId, options?: OpenPanelOptions) => void;
  handleQuickIntent: (intent: DesktopPetQuickIntent) => void;
  previewPanelAction: (actionState: PetActionState) => void;
  handlePetClick: () => void;
  handlePetPointerDown: () => void;
  handlePetPointerUp: () => void;
  handleEntranceIntent: (item: PetEntranceItem) => void;
  frameSet: ReturnType<typeof resolveFrameSet>;
  isStageFading: boolean;
  isDragging: boolean;
  syncPanelSpeech: (panelId?: DesktopPetPanelId) => void;
}

export function usePetController({
  config,
}: UsePetControllerOptions): UsePetControllerResult {
  const [activeAncestorId, setActiveAncestorId] = useState(
    config.defaultAncestorId,
  );
  const [activePanelId, setActivePanelId] = useState<DesktopPetPanelId>(
    config.defaultPanelId,
  );
  const [actionState, setActionState] = useState<PetActionState>("idle");
  const [speechText, setSpeechText] = useState(() => {
    const panel = getPanelItem(config, config.defaultPanelId);
    return panel?.summary ?? getActiveCharacter(config, config.defaultAncestorId).defaultSpeech;
  });
  const [speechContextLabel, setSpeechContextLabel] = useState<
    string | undefined
  >(() => {
    const panel = getPanelItem(config, config.defaultPanelId);
    return panel ? PANEL_SPEECH_CONTEXT[panel.id] : undefined;
  });
  const [isPoemReveal, setIsPoemReveal] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isStageFading, setIsStageFading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [panelSwitchNonce, setPanelSwitchNonce] = useState(0);
  const [showPanelHappyBurst, setShowPanelHappyBurst] = useState(false);

  const resetTimerRef = useRef<number | null>(null);
  const panelHappyBurstTimerRef = useRef<number | null>(null);
  const idlePromptTimerRef = useRef<number | null>(null);
  const sleepTimerRef = useRef<number | null>(null);
  const switchFadeTimerRef = useRef<number | null>(null);
  const clickTimestampsRef = useRef<number[]>([]);
  const hasGreetedRef = useRef(false);
  const isDraggingRef = useRef(false);
  const actionStateRef = useRef<PetActionState>("idle");
  const activePanelIdRef = useRef<DesktopPetPanelId>(config.defaultPanelId);
  const lastInteractionAtRef = useRef(0);

  const activeCharacter = getActiveCharacter(config, activeAncestorId);
  const activePanelItem =
    getPanelItem(config, activePanelId) ?? config.panelItems[0]!;
  const frameSet = resolveFrameSet(activeCharacter.assetManifest, actionState);

  useEffect(() => {
    activePanelIdRef.current = activePanelId;
  }, [activePanelId]);

  const markInteraction = useCallback(() => {
    lastInteractionAtRef.current = Date.now();
  }, []);

  useEffect(() => {
    actionStateRef.current = actionState;
  }, [actionState]);

  useEffect(() => {
    lastInteractionAtRef.current = Date.now();
  }, []);

  const clearResetTimer = useCallback(() => {
    if (resetTimerRef.current !== null) {
      window.clearTimeout(resetTimerRef.current);
      resetTimerRef.current = null;
    }
  }, []);

  const syncPanelSpeech = useCallback(
    (panelId: DesktopPetPanelId = activePanelIdRef.current) => {
      const panelItem = getPanelItem(config, panelId);
      if (!panelItem) {
        return;
      }

      setSpeechContextLabel(PANEL_SPEECH_CONTEXT[panelId]);
      setSpeechText(panelItem.summary);
      setIsPoemReveal(false);
    },
    [config],
  );

  const bumpPanelSwitch = useCallback((panelId: DesktopPetPanelId) => {
    if (panelId !== activePanelIdRef.current) {
      setPanelSwitchNonce((current) => current + 1);
    }
  }, []);

  const bumpPanelHappyBurst = useCallback(() => {
    if (panelHappyBurstTimerRef.current !== null) {
      window.clearTimeout(panelHappyBurstTimerRef.current);
    }

    setShowPanelHappyBurst(true);
    panelHappyBurstTimerRef.current = window.setTimeout(() => {
      panelHappyBurstTimerRef.current = null;
      setShowPanelHappyBurst(false);
    }, 600);
  }, []);

  const applySpeech = useCallback(
    (state: PetActionState, override?: string) => {
      const nextSpeech =
        override ??
        pickSpeechLine(
          activeCharacter,
          state,
          activeCharacter.defaultSpeech,
        );
      setSpeechText(nextSpeech);
      setIsPoemReveal(state === "poem");
    },
    [activeCharacter],
  );

  const scheduleReturnToIdle = useCallback(
    (state: PetActionState) => {
      clearResetTimer();
      const delay = RETURN_IDLE_MS[state];
      if (delay <= 0 || state === "idle" || state === "sleep") {
        return;
      }

      resetTimerRef.current = window.setTimeout(() => {
        setActionState("idle");
        syncPanelSpeech(activePanelIdRef.current);
      }, delay);
    },
    [clearResetTimer, syncPanelSpeech],
  );

  const triggerAction = useCallback(
    (state: PetActionState, speechOverride?: string) => {
      if (isDraggingRef.current && state !== "dragging") {
        return;
      }

      markInteraction();
      clearResetTimer();
      setSpeechContextLabel(undefined);
      setActionState(state);
      applySpeech(state, speechOverride);

      if (ONE_SHOT_STATES.includes(state)) {
        scheduleReturnToIdle(state);
      } else if (state === "talk") {
        scheduleReturnToIdle(state);
      }
    },
    [applySpeech, clearResetTimer, markInteraction, scheduleReturnToIdle],
  );

  const openPanel = useCallback(
    (panelId: DesktopPetPanelId, options?: OpenPanelOptions) => {
      if (isDraggingRef.current) {
        return;
      }

      const panelItem = getPanelItem(config, panelId);
      if (!panelItem) {
        return;
      }

      const isSamePanel =
        panelId === activePanelIdRef.current && !options?.force;

      if (isSamePanel && !options?.force) {
        const hasIntentOverride =
          Boolean(options?.speechOverride) || Boolean(options?.actionState);

        if (!hasIntentOverride) {
          markInteraction();
          syncPanelSpeech(panelId);
          return;
        }
      }

      markInteraction();
      setActivePanelId(panelId);
      bumpPanelSwitch(panelId);

      if (options?.silent) {
        setSpeechContextLabel(PANEL_SPEECH_CONTEXT[panelId]);
        if (options.speechOverride) {
          setSpeechText(options.speechOverride);
        } else {
          setSpeechText(panelItem.summary);
        }
        setIsPoemReveal(false);
        return;
      }

      if (actionStateRef.current === "sleep") {
        isDraggingRef.current = false;
        setIsDragging(false);
        const wakeSpeech = options?.speechOverride ?? panelItem.summary;
        triggerAction("greet", wakeSpeech);
        setSpeechContextLabel(PANEL_SPEECH_CONTEXT[panelId]);
        return;
      }

      const nextAction =
        options?.actionState ?? resolvePanelActionState(panelItem);
      const nextSpeech = options?.speechOverride ?? panelItem.summary;
      triggerAction(nextAction, nextSpeech);
      setSpeechContextLabel(PANEL_SPEECH_CONTEXT[panelId]);
      if (nextAction === "happy") {
        bumpPanelHappyBurst();
      }
    },
    [
      bumpPanelHappyBurst,
      bumpPanelSwitch,
      config,
      markInteraction,
      syncPanelSpeech,
      triggerAction,
    ],
  );

  const handleQuickIntent = useCallback(
    (intent: DesktopPetQuickIntent) => {
      openPanel(intent.panelId, {
        speechOverride: intent.prompt,
        actionState: intent.actionState,
      });
    },
    [openPanel],
  );

  const previewPanelAction = useCallback(
    (state: PetActionState) => {
      if (isDraggingRef.current || actionStateRef.current === "dragging") {
        return;
      }

      setSpeechContextLabel(undefined);
      setActionState(state);
      applySpeech(state);
    },
    [applySpeech],
  );

  const bumpSleepTimer = useCallback(() => {
    if (sleepTimerRef.current !== null) {
      window.clearTimeout(sleepTimerRef.current);
    }

    sleepTimerRef.current = window.setTimeout(() => {
      if (!isDraggingRef.current && actionStateRef.current === "idle") {
        triggerAction("sleep");
      }
    }, SLEEP_AFTER_IDLE_MS);
  }, [triggerAction]);

  const handlePetClick = useCallback(() => {
    const now = Date.now();
    clickTimestampsRef.current = clickTimestampsRef.current.filter(
      (timestamp) => now - timestamp < ANNOYED_CLICK_WINDOW_MS,
    );
    clickTimestampsRef.current.push(now);

    if (clickTimestampsRef.current.length >= ANNOYED_RAPID_CLICK_THRESHOLD) {
      clickTimestampsRef.current = [];
      triggerAction("annoyed");
      return;
    }

    if (actionState === "sleep") {
      triggerAction("greet");
      setSpeechContextLabel(PANEL_SPEECH_CONTEXT[activePanelIdRef.current]);
      return;
    }

    triggerAction("talk");
    bumpSleepTimer();
  }, [actionState, bumpSleepTimer, triggerAction]);

  const handlePetPointerDown = useCallback(() => {
    markInteraction();
    isDraggingRef.current = true;
    setIsDragging(true);
    clearResetTimer();
    setActionState("dragging");
    setIsPoemReveal(false);
  }, [clearResetTimer, markInteraction]);

  const handlePetPointerUp = useCallback(() => {
    markInteraction();
    isDraggingRef.current = false;
    setIsDragging(false);
    setActionState("idle");
    syncPanelSpeech(activePanelIdRef.current);
    bumpSleepTimer();
  }, [bumpSleepTimer, markInteraction, syncPanelSpeech]);

  const handleEntranceIntent = useCallback(
    (item: PetEntranceItem) => {
      openPanel(resolvePanelByEntranceId(item.id));
    },
    [openPanel],
  );

  const selectAncestor = useCallback(
    (ancestorId: string) => {
      if (ancestorId === activeAncestorId || isStageFading) {
        return;
      }

      markInteraction();
      if (switchFadeTimerRef.current !== null) {
        window.clearTimeout(switchFadeTimerRef.current);
      }

      setIsStageFading(true);
      switchFadeTimerRef.current = window.setTimeout(() => {
        switchFadeTimerRef.current = null;
        const nextCharacter = getActiveCharacter(config, ancestorId);
        const currentPanelId = activePanelIdRef.current;
        const currentPanel = getPanelItem(config, currentPanelId);

        setActiveAncestorId(ancestorId);
        setDragOffset({ x: 0, y: 0 });
        setIsPoemReveal(false);
        setIsStageFading(false);
        clearResetTimer();
        setActionState("greet");
        setSpeechText(
          pickSpeechLine(nextCharacter, "greet", nextCharacter.defaultSpeech),
        );
        setSpeechContextLabel(
          currentPanel ? PANEL_SPEECH_CONTEXT[currentPanelId] : undefined,
        );
        scheduleReturnToIdle("greet");
      }, CHARACTER_SWITCH_FADE_MS);
    },
    [
      activeAncestorId,
      clearResetTimer,
      config,
      isStageFading,
      markInteraction,
      scheduleReturnToIdle,
    ],
  );

  useEffect(() => {
    if (hasGreetedRef.current) {
      return;
    }

    hasGreetedRef.current = true;
    const greetedKey = `desktop-pet-greeted-${activeCharacter.ancestorId}`;
    const hasGreetedBefore = window.sessionStorage.getItem(greetedKey) === "1";

    const timer = window.setTimeout(() => {
      if (hasGreetedBefore) {
        return;
      }

      window.sessionStorage.setItem(greetedKey, "1");
      setActivePanelId(config.defaultPanelId);
      bumpPanelSwitch(config.defaultPanelId);
      triggerAction("greet");
      setSpeechContextLabel(PANEL_SPEECH_CONTEXT[config.defaultPanelId]);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [activeCharacter.ancestorId, bumpPanelSwitch, config.defaultPanelId, triggerAction]);

  useEffect(() => {
    if (idlePromptTimerRef.current !== null) {
      window.clearInterval(idlePromptTimerRef.current);
    }

    idlePromptTimerRef.current = window.setInterval(() => {
      if (isDraggingRef.current || actionStateRef.current !== "idle") {
        return;
      }

      const idleElapsed = Date.now() - lastInteractionAtRef.current;
      if (idleElapsed < config.idlePromptIntervalMs) {
        return;
      }

      syncPanelSpeech(activePanelIdRef.current);
      lastInteractionAtRef.current = Date.now();
    }, config.idlePromptIntervalMs);

    return () => {
      if (idlePromptTimerRef.current !== null) {
        window.clearInterval(idlePromptTimerRef.current);
      }
    };
  }, [config.idlePromptIntervalMs, syncPanelSpeech]);

  useEffect(() => {
    bumpSleepTimer();
    return () => {
      if (sleepTimerRef.current !== null) {
        window.clearTimeout(sleepTimerRef.current);
      }
    };
  }, [bumpSleepTimer]);

  useEffect(() => {
    return () => {
      clearResetTimer();
      if (idlePromptTimerRef.current !== null) {
        window.clearInterval(idlePromptTimerRef.current);
      }
      if (sleepTimerRef.current !== null) {
        window.clearTimeout(sleepTimerRef.current);
      }
      if (switchFadeTimerRef.current !== null) {
        window.clearTimeout(switchFadeTimerRef.current);
      }
      if (panelHappyBurstTimerRef.current !== null) {
        window.clearTimeout(panelHappyBurstTimerRef.current);
      }
    };
  }, [clearResetTimer]);

  return {
    activeAncestorId,
    activeCharacter,
    activePanelId,
    activePanelItem,
    actionState,
    speechText,
    speechContextLabel,
    isPoemReveal,
    showPanelHappyBurst,
    panelSwitchNonce,
    dragOffset,
    setDragOffset,
    selectAncestor,
    triggerAction,
    openPanel,
    handleQuickIntent,
    previewPanelAction,
    handlePetClick,
    handlePetPointerDown,
    handlePetPointerUp,
    handleEntranceIntent,
    frameSet,
    isStageFading,
    isDragging,
    syncPanelSpeech,
  };
}
