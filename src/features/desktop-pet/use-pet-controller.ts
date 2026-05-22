"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type {
  DesktopPetConfig,
  PetActionState,
  PetEntranceItem,
} from "@/shared/contracts/home";

import {
  getActiveCharacter,
  pickSpeechLine,
  resolveFrameSet,
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

export interface UsePetControllerOptions {
  config: DesktopPetConfig;
}

export interface UsePetControllerResult {
  activeAncestorId: string;
  activeCharacter: ReturnType<typeof getActiveCharacter>;
  actionState: PetActionState;
  speechText: string;
  isPoemReveal: boolean;
  dragOffset: { x: number; y: number };
  setDragOffset: (offset: { x: number; y: number }) => void;
  selectAncestor: (ancestorId: string) => void;
  triggerAction: (state: PetActionState, speechOverride?: string) => void;
  handlePetClick: () => void;
  handlePetPointerDown: () => void;
  handlePetPointerUp: () => void;
  handleEntranceIntent: (item: PetEntranceItem) => void;
  frameSet: ReturnType<typeof resolveFrameSet>;
  isStageFading: boolean;
}

export function usePetController({
  config,
}: UsePetControllerOptions): UsePetControllerResult {
  const [activeAncestorId, setActiveAncestorId] = useState(
    config.defaultAncestorId,
  );
  const [actionState, setActionState] = useState<PetActionState>("idle");
  const [speechText, setSpeechText] = useState(() => {
    const character = getActiveCharacter(config, config.defaultAncestorId);
    return character.defaultSpeech;
  });
  const [isPoemReveal, setIsPoemReveal] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isStageFading, setIsStageFading] = useState(false);

  const resetTimerRef = useRef<number | null>(null);
  const idlePromptTimerRef = useRef<number | null>(null);
  const sleepTimerRef = useRef<number | null>(null);
  const switchFadeTimerRef = useRef<number | null>(null);
  const clickTimestampsRef = useRef<number[]>([]);
  const hasGreetedRef = useRef(false);
  const isDraggingRef = useRef(false);
  const actionStateRef = useRef<PetActionState>("idle");
  const lastInteractionAtRef = useRef(0);

  const activeCharacter = getActiveCharacter(config, activeAncestorId);
  const frameSet = resolveFrameSet(activeCharacter.assetManifest, actionState);

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
        setIsPoemReveal(false);
        applySpeech("idle");
      }, delay);
    },
    [applySpeech, clearResetTimer],
  );

  const triggerAction = useCallback(
    (state: PetActionState, speechOverride?: string) => {
      if (isDraggingRef.current && state !== "dragging") {
        return;
      }

      markInteraction();
      clearResetTimer();
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

  const bumpSleepTimer = useCallback(() => {
    if (sleepTimerRef.current !== null) {
      window.clearTimeout(sleepTimerRef.current);
    }

    sleepTimerRef.current = window.setTimeout(() => {
      if (!isDraggingRef.current && actionState === "idle") {
        triggerAction("sleep");
      }
    }, SLEEP_AFTER_IDLE_MS);
  }, [actionState, triggerAction]);

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
      return;
    }

    triggerAction("talk");
    bumpSleepTimer();
  }, [actionState, bumpSleepTimer, triggerAction]);

  const handlePetPointerDown = useCallback(() => {
    markInteraction();
    isDraggingRef.current = true;
    clearResetTimer();
    setActionState("dragging");
    setIsPoemReveal(false);
  }, [clearResetTimer, markInteraction]);

  const handlePetPointerUp = useCallback(() => {
    markInteraction();
    isDraggingRef.current = false;
    setActionState("idle");
    applySpeech("idle");
    bumpSleepTimer();
  }, [applySpeech, bumpSleepTimer, markInteraction]);

  const handleEntranceIntent = useCallback(
    (item: PetEntranceItem) => {
      triggerAction(item.actionState);
    },
    [triggerAction],
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

        setActiveAncestorId(ancestorId);
        setDragOffset({ x: 0, y: 0 });
        setIsPoemReveal(false);
        setIsStageFading(false);
        clearResetTimer();
        setActionState("greet");
        setSpeechText(
          pickSpeechLine(nextCharacter, "greet", nextCharacter.defaultSpeech),
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
      triggerAction("greet");
    }, 0);

    return () => window.clearTimeout(timer);
  }, [activeCharacter.ancestorId, triggerAction]);

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

      setSpeechText(activeCharacter.defaultSpeech);
      setIsPoemReveal(false);
      lastInteractionAtRef.current = Date.now();
    }, config.idlePromptIntervalMs);

    return () => {
      if (idlePromptTimerRef.current !== null) {
        window.clearInterval(idlePromptTimerRef.current);
      }
    };
  }, [activeCharacter.defaultSpeech, config.idlePromptIntervalMs]);

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
    };
  }, [clearResetTimer]);

  return {
    activeAncestorId,
    activeCharacter,
    actionState,
    speechText,
    isPoemReveal,
    dragOffset,
    setDragOffset,
    selectAncestor,
    triggerAction,
    handlePetClick,
    handlePetPointerDown,
    handlePetPointerUp,
    handleEntranceIntent,
    frameSet,
    isStageFading,
  };
}
