import { homePageData } from "@/mocks/home-data";
import { buildAiReplyPrompt } from "@/shared/ai/prompt-builder";

describe("buildAiReplyPrompt", () => {
  it("includes mode, mood and trait information in the prompt bundle", () => {
    const bundle = buildAiReplyPrompt({
      ancestorId: "su-shi",
      userMessage: "我今天真不想上班。",
      mode: "ooc",
      sceneType: "daily-chat",
      moodIndex: 78,
      traitVector: homePageData.nurtureSummary.traitVector,
      contextNote: "现代通勤场景",
    });

    expect(bundle.personaId).toBe("su-shi");
    expect(bundle.systemPrompt).toContain("当前模式为 ooc");
    expect(bundle.systemPrompt).toContain("MoodIndex=78");
    expect(bundle.userPrompt).toContain("sceneType=daily-chat");
    expect(bundle.userPrompt).toContain("contextNote=现代通勤场景");
    expect(bundle.dominantTraits.length).toBeGreaterThan(0);
  });
});
