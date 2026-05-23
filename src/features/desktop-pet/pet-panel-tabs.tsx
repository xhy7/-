"use client";

import {
  useCallback,
  useEffect,
  useRef,
  type KeyboardEvent,
} from "react";

import type { DesktopPetPanelId, DesktopPetPanelItem } from "@/shared/contracts/home";

import styles from "./pet-content-panel.module.css";

const ACTIVE_PANEL_ID = "pet-panel-active";

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

  const activeIndex = panels.findIndex((panel) => panel.id === activePanelId);

  const focusTab = useCallback((panelId: DesktopPetPanelId) => {
    tabRefs.current[panelId]?.focus({ preventScroll: true });
  }, []);

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

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (disabled || panels.length === 0) {
      return;
    }

    let nextIndex = activeIndex;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      nextIndex = (activeIndex + 1) % panels.length;
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      nextIndex = (activeIndex - 1 + panels.length) % panels.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = panels.length - 1;
    } else {
      return;
    }

    event.preventDefault();
    const nextPanel = panels[nextIndex];
    if (!nextPanel) {
      return;
    }

    onSelectPanel(nextPanel.id);
    focusTab(nextPanel.id);
  };

  return (
    <div
      className={styles.tabList}
      role="tablist"
      aria-label="桌宠内容面板"
      aria-orientation="horizontal"
      onKeyDown={handleKeyDown}
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
            aria-controls={ACTIVE_PANEL_ID}
            tabIndex={isActive ? 0 : -1}
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
