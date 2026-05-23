"use client";

import type { DesktopPetPanelId, PetEntranceItem } from "@/shared/contracts/home";

import panelStyles from "./pet-content-panel.module.css";
import { resolvePanelByEntranceId } from "./pet-utils";

interface PetEntranceMenuProps {
  items: PetEntranceItem[];
  activePanelId: DesktopPetPanelId;
  disabled?: boolean;
  onEntranceOpen: (item: PetEntranceItem) => void;
}

export function PetEntranceMenu({
  items,
  activePanelId,
  disabled = false,
  onEntranceOpen,
}: PetEntranceMenuProps) {
  return (
    <nav
      className={panelStyles.entranceMenuCompact}
      aria-label="桌宠快捷入口"
    >
      {items.map((item) => {
        const panelId = resolvePanelByEntranceId(item.id);
        const isActive = panelId === activePanelId;

        return (
          <button
            key={item.id}
            type="button"
            disabled={disabled}
            className={[
              panelStyles.entrancePill,
              isActive && panelStyles.entrancePillActive,
            ]
              .filter(Boolean)
              .join(" ")}
            aria-pressed={isActive}
            title={item.description}
            onClick={() => onEntranceOpen(item)}
          >
            {item.label}
          </button>
        );
      })}
    </nav>
  );
}
