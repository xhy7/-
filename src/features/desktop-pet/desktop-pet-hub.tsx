"use client";

import { useCallback, useRef, useSyncExternalStore, useState } from "react";

import type { DesktopPetConfig, DesktopPetPanelId } from "@/shared/contracts/home";
import { SectionHeading, TagPill } from "@/shared/ui/primitives";

import styles from "./desktop-pet-hub.module.css";
import panelStyles from "./pet-content-panel.module.css";
import { PetActionDock } from "./pet-action-dock";
import { PetContentPanel } from "./pet-content-panel";
import { PetEntranceMenu } from "./pet-entrance-menu";
import { PetPanelTabs } from "./pet-panel-tabs";
import { PetQuickIntents } from "./pet-quick-intents";
import { PetStage } from "./pet-stage";
import { usePetController } from "./use-pet-controller";

export interface DesktopPetHubProps {
  config: DesktopPetConfig;
  layoutMode?: "mobile" | "desktop";
}

const PANEL_SHELL_CLASS: Record<DesktopPetPanelId, string> = {
  profile: panelStyles.panelShellProfile,
  growth: panelStyles.panelShellGrowth,
  playground: panelStyles.panelShellPlayground,
  chat: panelStyles.panelShellChat,
};

const MOBILE_MEDIA_QUERY = "(max-width: 900px)";

function subscribeMobileLayout(onStoreChange: () => void) {
  const media = window.matchMedia(MOBILE_MEDIA_QUERY);
  media.addEventListener("change", onStoreChange);
  return () => media.removeEventListener("change", onStoreChange);
}

function getMobileLayoutSnapshot() {
  return window.matchMedia(MOBILE_MEDIA_QUERY).matches;
}

function getMobileLayoutServerSnapshot() {
  return false;
}

export function DesktopPetHub({ config, layoutMode }: DesktopPetHubProps) {
  const panelTitleRef = useRef<HTMLHeadingElement>(null);
  const detectedMobileLayout = useSyncExternalStore(
    subscribeMobileLayout,
    getMobileLayoutSnapshot,
    getMobileLayoutServerSnapshot,
  );
  const isMobileLayout =
    layoutMode !== undefined ? layoutMode === "mobile" : detectedMobileLayout;
  const [isPanelExpanded, setIsPanelExpanded] = useState(true);

  const {
    activeAncestorId,
    activeCharacter,
    activePanelId,
    activePanelItem,
    actionState,
    speechText,
    speechContextLabel,
    isPoemReveal,
    panelSwitchNonce,
    showPanelHappyBurst,
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
  } = usePetController({ config });

  const focusPanelTitle = useCallback(() => {
    window.requestAnimationFrame(() => {
      panelTitleRef.current?.focus({ preventScroll: true });
    });
  }, []);

  const hasMultipleCharacters = config.characters.length > 1;
  const isSleeping = actionState === "sleep";
  const dockDisabled = actionState === "dragging" || isDragging;
  const panelDisabled = isDragging;
  const showDockHappy = actionState === "happy" && !speechContextLabel;

  return (
    <section className={`${styles.root} section-shell`} aria-label="桌宠中枢">
      <div className={styles.header}>
        <SectionHeading
          eyebrow="桌宠舞台"
          title={config.helperTitle}
          description="先在桌宠旁打开卷轴面板，再展开完整页面继续深度体验。"
        />
        <div className={styles.headerMeta}>
          <TagPill tone="seal">{activeCharacter.era}</TagPill>
          <TagPill tone="muted">{activeCharacter.title}</TagPill>
        </div>
      </div>

      <div className={styles.identityRow}>
        <div className={styles.identityCopy}>
          <h3 className={styles.identityName}>{activeCharacter.displayName}</h3>
          <p className={styles.identityHint}>
            点按说话、拖曳换位置；卷轴 Tab 与快捷意图优先，完整页在面板内展开。
          </p>
        </div>

        {hasMultipleCharacters ? (
          <div
            className={styles.characterSwitcher}
            role="radiogroup"
            aria-label="切换桌宠角色"
          >
            {config.characters.map((character) => (
              <button
                key={character.ancestorId}
                type="button"
                role="radio"
                aria-checked={character.ancestorId === activeAncestorId}
                className={[
                  styles.characterChip,
                  character.ancestorId === activeAncestorId &&
                    styles.characterChipActive,
                ]
                  .filter(Boolean)
                  .join(" ")}
                onClick={() => selectAncestor(character.ancestorId)}
              >
                {character.displayName}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className={styles.mainGrid}>
        <div className={styles.stageColumn}>
          <PetQuickIntents
            intents={config.quickIntents}
            activePanelId={activePanelId}
            defaultPanelId={config.defaultPanelId}
            disabled={panelDisabled}
            onSelectIntent={handleQuickIntent}
          />

          <PetStage
            displayName={activeCharacter.displayName}
            title={activeCharacter.title}
            speechText={speechText}
            panelContext={speechContextLabel}
            panelAmbientId={activePanelId}
            panelSwitchNonce={panelSwitchNonce}
            showDockHappy={showDockHappy}
            showPanelHappyBurst={showPanelHappyBurst}
            actionState={actionState}
            frameSet={frameSet}
            previewFallbackSrc={activeCharacter.assetManifest.previewImageSrc}
            isPoemReveal={isPoemReveal}
            isSleeping={isSleeping}
            isStageFading={isStageFading}
            dragOffset={dragOffset}
            onDragOffsetChange={setDragOffset}
            onPetClick={handlePetClick}
            onPetPointerDown={handlePetPointerDown}
            onPetPointerUp={handlePetPointerUp}
          />

          <PetActionDock
            supportedActions={activeCharacter.supportedActions}
            activeState={actionState}
            disabled={dockDisabled}
            onTriggerAction={triggerAction}
          />

          <PetEntranceMenu
            items={config.entranceItems}
            activePanelId={activePanelId}
            disabled={panelDisabled}
            onEntranceOpen={handleEntranceIntent}
          />
        </div>

        <aside className={styles.panelColumn}>
          {isMobileLayout ? (
            <button
              type="button"
              className={styles.panelMobileToggle}
              aria-expanded={isPanelExpanded}
              aria-controls="desktop-pet-panel-region"
              onClick={() => setIsPanelExpanded((current) => !current)}
            >
              {isPanelExpanded ? "收起卷轴面板" : "展开卷轴面板"}
              <span aria-hidden="true">{isPanelExpanded ? "↑" : "↓"}</span>
            </button>
          ) : null}

          <div
            id="desktop-pet-panel-region"
            className={[
              panelStyles.panelShell,
              PANEL_SHELL_CLASS[activePanelId],
              isMobileLayout && !isPanelExpanded && panelStyles.panelShellCollapsed,
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <PetPanelTabs
              panels={config.panelItems}
              activePanelId={activePanelId}
              disabled={panelDisabled}
              onSelectPanel={openPanel}
              onPanelTitleFocus={focusPanelTitle}
            />
            <div
              id="pet-panel-active"
              role="tabpanel"
              aria-labelledby={`pet-panel-tab-${activePanelId}`}
              className={panelStyles.tabPanel}
            >
              <PetContentPanel
                panelItem={activePanelItem}
                variant={activePanelId}
                panelKey={activePanelId}
                titleRef={panelTitleRef}
                onActionPreview={previewPanelAction}
              />
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
