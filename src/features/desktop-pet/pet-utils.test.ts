import { describe, expect, it, vi } from "vitest";

import type { PetAssetManifest } from "@/shared/contracts/home";
import { homePageData } from "@/mocks/home-data";

import {
  clampOffset,
  getActiveCharacter,
  getBubbleFollowLayout,
  getDefaultStageOffset,
  pickSpeechLine,
  resolveFrameSet,
} from "./pet-utils";

const suShi = homePageData.desktopPet.characters[0]!;

describe("pet-utils", () => {
  describe("getActiveCharacter", () => {
    it("returns the matching character", () => {
      expect(
        getActiveCharacter(homePageData.desktopPet, "su-shi").displayName,
      ).toBe("苏轼");
    });

    it("falls back to the first character when id is unknown", () => {
      expect(
        getActiveCharacter(homePageData.desktopPet, "unknown").ancestorId,
      ).toBe("su-shi");
    });
  });

  describe("resolveFrameSet", () => {
    it("returns the frame set for the requested state", () => {
      const frameSet = resolveFrameSet(suShi.assetManifest, "poem");
      expect(frameSet.state).toBe("poem");
      expect(frameSet.framePaths[0]).toContain("/poem/");
    });

    it("falls back to idle when the state has no frames", () => {
      const manifest: PetAssetManifest = {
        ...suShi.assetManifest,
        frameSets: suShi.assetManifest.frameSets.filter(
          (set) => set.state !== "happy",
        ),
      };

      const frameSet = resolveFrameSet(manifest, "happy");
      expect(frameSet.state).toBe("idle");
    });

    it("falls back to preview when idle is also missing", () => {
      const manifest: PetAssetManifest = {
        basePath: "/pets/test",
        previewImageSrc: "/pets/test/preview.png",
        defaultState: "idle",
        frameSets: [],
      };

      const frameSet = resolveFrameSet(manifest, "talk");
      expect(frameSet.framePaths).toEqual(["/pets/test/preview.png"]);
    });
  });

  describe("pickSpeechLine", () => {
    it("returns a matching line for the state", () => {
      vi.spyOn(Math, "random").mockReturnValue(0);

      expect(pickSpeechLine(suShi, "poem", suShi.defaultSpeech)).toBe(
        "竹杖芒鞋轻胜马，谁怕？一蓑烟雨任平生。",
      );
    });

    it("returns fallback when no lines exist for the state", () => {
      expect(pickSpeechLine(suShi, "happy", suShi.defaultSpeech)).toBe(
        suShi.defaultSpeech,
      );
    });
  });

  describe("clampOffset", () => {
    it("keeps the sprite inside stage bounds", () => {
      expect(
        clampOffset(
          { x: 999, y: -40 },
          { width: 400, height: 320 },
          { width: 168, height: 168 },
        ),
      ).toEqual({
        x: 216,
        y: 16,
      });
    });
  });

  describe("getDefaultStageOffset", () => {
    it("anchors the sprite toward the lower-right of the stage", () => {
      const offset = getDefaultStageOffset({ width: 500, height: 400 });
      expect(offset.x).toBeGreaterThan(100);
      expect(offset.y).toBeGreaterThan(20);
    });
  });

  describe("getBubbleFollowLayout", () => {
    it("places the bubble above when the sprite is low on the stage", () => {
      expect(
        getBubbleFollowLayout({ x: 120, y: 200 }, { width: 500, height: 400 }),
      ).toMatchObject({ placement: "above", shiftX: 0 });
    });

    it("places the bubble below when the sprite is near the top", () => {
      expect(
        getBubbleFollowLayout({ x: 120, y: 40 }, { width: 500, height: 400 }),
      ).toMatchObject({ placement: "below" });
    });

    it("shifts the bubble horizontally when it would overflow", () => {
      const layout = getBubbleFollowLayout(
        { x: 20, y: 200 },
        { width: 500, height: 400 },
      );
      expect(layout.shiftX).toBeGreaterThan(0);
    });
  });
});
