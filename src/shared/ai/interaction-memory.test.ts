import { homePageData } from "@/mocks/home-data";
import {
  buildAncestorBaseTraitVector,
  evaluateFateUnlock,
  deriveMoodSnapshotFromHistory,
  deriveTraitVectorFromHistory,
} from "@/shared/ai/interaction-memory";

describe("interaction memory", () => {
  it("derives trait changes from conversation history", () => {
    const baseTraits = buildAncestorBaseTraitVector(
      homePageData.featuredAncestor,
      homePageData.nurtureSummary.traitVector,
    );

    const derived = deriveTraitVectorFromHistory(baseTraits, [
      {
        id: "turn-1",
        ancestorId: "su-shi",
        timestamp: 1,
        userMessage: "谢谢你安慰我，我还是想听听你的看法。",
        mode: "prototype",
        sceneType: "daily-chat",
        reply: "先坐下来。",
        subtext: "接住情绪。",
        styleTags: ["prototype"],
      },
      {
        id: "turn-2",
        ancestorId: "su-shi",
        timestamp: 2,
        userMessage: "我现在压力很大，但还是想让你毒舌一点。",
        mode: "ooc",
        sceneType: "creative-feedback",
        reply: "那我就不客气了。",
        subtext: "开始偏移。",
        styleTags: ["ooc"],
      },
    ]);

    expect(derived.find((trait) => trait.id === "humor")?.value).toBeGreaterThan(
      baseTraits.find((trait) => trait.id === "humor")!.value,
    );
    expect(
      derived.find((trait) => trait.id === "rebellion")?.value,
    ).toBeGreaterThan(
      baseTraits.find((trait) => trait.id === "rebellion")!.value,
    );
  });

  it("derives mood changes from conversation history", () => {
    const moodSnapshot = deriveMoodSnapshotFromHistory(
      homePageData.nurtureSummary.moodSnapshot,
      [
        {
          id: "turn-1",
          ancestorId: "su-shi",
          timestamp: 1,
          userMessage: "谢谢你，我现在好多了。",
          mode: "prototype",
          sceneType: "daily-chat",
          reply: "慢慢来。",
          subtext: "稳定情绪。",
          styleTags: ["prototype"],
        },
      ],
    );

    expect(moodSnapshot.value).toBeGreaterThan(
      homePageData.nurtureSummary.moodSnapshot.value,
    );
    expect(moodSnapshot.summary).toContain("对话");
  });

  it("evaluates fate unlock progress from derived state", () => {
    const baseTraits = buildAncestorBaseTraitVector(
      homePageData.featuredAncestor,
      homePageData.nurtureSummary.traitVector,
    );
    const derivedTraits = deriveTraitVectorFromHistory(baseTraits, [
      {
        id: "turn-1",
        ancestorId: "su-shi",
        timestamp: 1,
        userMessage: "谢谢你，我还是愿意相信你。",
        mode: "prototype",
        sceneType: "daily-chat",
        reply: "慢慢来。",
        subtext: "稳定情绪。",
        styleTags: ["prototype"],
      },
      {
        id: "turn-2",
        ancestorId: "su-shi",
        timestamp: 2,
        userMessage: "你帮我把这段文章改得再有一点机锋。",
        mode: "prototype",
        sceneType: "creative-feedback",
        reply: "那我来给你提提神。",
        subtext: "开始调高幽默感。",
        styleTags: ["creative-feedback"],
      },
    ]);
    const moodSnapshot = deriveMoodSnapshotFromHistory(
      homePageData.nurtureSummary.moodSnapshot,
      [
        {
          id: "turn-1",
          ancestorId: "su-shi",
          timestamp: 1,
          userMessage: "谢谢你，我还是愿意相信你。",
          mode: "prototype",
          sceneType: "daily-chat",
          reply: "慢慢来。",
          subtext: "稳定情绪。",
          styleTags: ["prototype"],
        },
      ],
    );

    const evaluation = evaluateFateUnlock(
      homePageData.fatePreviews[0],
      derivedTraits,
      moodSnapshot,
      [
        {
          id: "turn-1",
          ancestorId: "su-shi",
          timestamp: 1,
          userMessage: "谢谢你，我还是愿意相信你。",
          mode: "prototype",
          sceneType: "daily-chat",
          reply: "慢慢来。",
          subtext: "稳定情绪。",
          styleTags: ["prototype"],
        },
      ],
    );

    expect(["locked", "evolving", "ready"]).toContain(evaluation.status);
    expect(evaluation.threshold).toBeGreaterThan(0);
    expect(evaluation.reasons.length).toBeGreaterThan(0);
  });
});
