"use client";

import { useState } from "react";

import type {
  DesktopPetPanelId,
  DesktopPetQuickIntent,
} from "@/shared/contracts/home";

import styles from "./pet-content-panel.module.css";

interface PetQuickIntentsProps {
  intents: DesktopPetQuickIntent[];
  activePanelId: DesktopPetPanelId;
  defaultPanelId: DesktopPetPanelId;
  disabled?: boolean;
  onSelectIntent: (intent: DesktopPetQuickIntent) => void;
}

const PULSE_SESSION_KEY = "desktop-pet-intent-pulse";

function readInitialPulsePanelId(
  defaultPanelId: DesktopPetPanelId,
): DesktopPetPanelId | null {
  if (typeof window === "undefined") {
    return null;
  }

  if (window.sessionStorage.getItem(PULSE_SESSION_KEY) === "1") {
    return null;
  }

  window.sessionStorage.setItem(PULSE_SESSION_KEY, "1");
  return defaultPanelId;
}

export function PetQuickIntents({
  intents,
  activePanelId,
  defaultPanelId,
  disabled = false,
  onSelectIntent,
}: PetQuickIntentsProps) {
  const [pulsePanelId] = useState(() => readInitialPulsePanelId(defaultPanelId));

  return (
    <div className={styles.quickIntentRow} aria-label="桌宠快捷意图">
      {intents.map((intent) => {
        const isActive = intent.panelId === activePanelId;
        const shouldPulse = pulsePanelId === intent.panelId;

        return (
          <button
            key={intent.id}
            type="button"
            disabled={disabled}
            className={[
              styles.quickIntentChip,
              isActive && styles.quickIntentChipActive,
              shouldPulse && styles.quickIntentPulse,
            ]
              .filter(Boolean)
              .join(" ")}
            onClick={() => onSelectIntent(intent)}
          >
            {intent.label}
          </button>
        );
      })}
    </div>
  );
}
