"use client";

import type { PetActionState } from "@/shared/contracts/home";
import { InkButton } from "@/shared/ui/primitives";

import { DOCK_ACTION_LABELS, USER_TRIGGERED_ACTIONS } from "./pet-utils";
import styles from "./desktop-pet-hub.module.css";

interface PetActionDockProps {
  supportedActions: PetActionState[];
  activeState: PetActionState;
  disabled: boolean;
  onTriggerAction: (state: PetActionState) => void;
}

export function PetActionDock({
  supportedActions,
  activeState,
  disabled,
  onTriggerAction,
}: PetActionDockProps) {
  const dockActions = USER_TRIGGERED_ACTIONS.filter((action) =>
    supportedActions.includes(action),
  );

  return (
    <div className={styles.dock} role="toolbar" aria-label="桌宠轻互动">
      {dockActions.map((action) => {
        const label =
          DOCK_ACTION_LABELS[
            action as keyof typeof DOCK_ACTION_LABELS
          ] ?? action;

        return (
          <InkButton
            key={action}
            type="button"
            tone={activeState === action ? "primary" : "ghost"}
            className={styles.dockButton}
            aria-pressed={activeState === action}
            disabled={disabled}
            onClick={() => onTriggerAction(action)}
          >
            {label}
          </InkButton>
        );
      })}
    </div>
  );
}
