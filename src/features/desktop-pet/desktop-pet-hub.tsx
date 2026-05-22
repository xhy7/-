"use client";

import type { DesktopPetConfig } from "@/shared/contracts/home";
import { SectionHeading, TagPill } from "@/shared/ui/primitives";

import styles from "./desktop-pet-hub.module.css";
import { PetActionDock } from "./pet-action-dock";
import { PetEntranceMenu } from "./pet-entrance-menu";
import { PetStage } from "./pet-stage";
import { usePetController } from "./use-pet-controller";

export interface DesktopPetHubProps {
  config: DesktopPetConfig;
}

export function DesktopPetHub({ config }: DesktopPetHubProps) {
  const {
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
  } = usePetController({ config });

  const hasMultipleCharacters = config.characters.length > 1;
  const isSleeping = actionState === "sleep";
  const dockDisabled = actionState === "dragging";

  return (
    <section className={`${styles.root} section-shell`} aria-label="桌宠中枢">
      <div className={styles.header}>
        <SectionHeading
          eyebrow="桌宠舞台"
          title={config.helperTitle}
          description={config.helperText}
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
            点按说话，拖曳换位置；卷轴入口在下方，带着
            {activeCharacter.displayName}，继续推进关系。
          </p>
        </div>

        {hasMultipleCharacters ? (
          <div
            className={styles.characterSwitcher}
            role="tablist"
            aria-label="切换桌宠角色"
          >
            {config.characters.map((character) => (
              <button
                key={character.ancestorId}
                type="button"
                role="tab"
                aria-selected={character.ancestorId === activeAncestorId}
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

      <PetStage
        displayName={activeCharacter.displayName}
        title={activeCharacter.title}
        speechText={speechText}
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
        onEntranceIntent={handleEntranceIntent}
      />
    </section>
  );
}
