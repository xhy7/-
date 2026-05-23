"use client";

import { useEffect, useRef } from "react";

import type { DesktopPetPanelId, DesktopPetPanelItem } from "@/shared/contracts/home";

import styles from "./pet-content-panel.module.css";

interface PetPanelTabsProps {
  panels: DesktopPetPanelItem[];
  activePanelId: DesktopPetPanelId;
  disabled?: boolean;
  onSelectPanel: (panelId: DesktopPetPanelId) => void;
  onPanelTitleFocus?: () => void;
}

export function PetPanelTabs({
  panels,
  activePanelId,
  disabled = false,
  onSelectPanel,
  onPanelTitleFocus,
}: PetPanelTabsProps) {
  const tabRefs = useRef<Partial<Record<DesktopPetPanelId, HTMLButtonElement>>>(
    {},
  );

  useEffect(() => {
    const activeTab = tabRefs.current[activePanelId];
    if (typeof activeTab?.scrollIntoView === "function") {
      activeTab.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
    onPanelTitleFocus?.();
  }, [activePanelId, onPanelTitleFocus]);

  return (
    <div
      className={styles.tabList}
      role="tablist"
      aria-label="桌宠内容面板"
    >
      {panels.map((panel) => {
        const isActive = panel.id === activePanelId;

        return (
          <button
            key={panel.id}
            ref={(node) => {
              if (node) {
                tabRefs.current[panel.id] = node;
              }
            }}
            type="button"
            role="tab"
            id={`pet-panel-tab-${panel.id}`}
            aria-selected={isActive}
            aria-controls={`pet-panel-${panel.id}`}
            disabled={disabled}
            className={[
              styles.tabButton,
              isActive && styles.tabButtonActive,
            ]
              .filter(Boolean)
              .join(" ")}
            onClick={() => onSelectPanel(panel.id)}
          >
            {panel.label}
            <span className={styles.tabIndicator} aria-hidden="true" />
          </button>
        );
      })}
    </div>
  );
}
