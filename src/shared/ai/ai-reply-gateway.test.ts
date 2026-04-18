import { afterEach, describe, expect, it } from "vitest";

import { homePageData } from "@/mocks/home-data";
import { generateAiReply } from "@/shared/ai/ai-reply-gateway";

describe("aiReplyGateway", () => {
  afterEach(() => {
    delete process.env.AI_PROVIDER;
    delete process.env.AI_API_URL;
    delete process.env.AI_API_KEY;
    delete process.env.AI_MODEL;
  });

  it("uses the mock adapter by default", async () => {
    const result = await generateAiReply({
      ancestorId: "su-shi",
      userMessage: "给我一句打起精神的话。",
      mode: "prototype",
      sceneType: "daily-chat",
      moodIndex: 78,
      traitVector: homePageData.nurtureSummary.traitVector,
    });

    expect(result.debug.provider).toBe("mock");
    expect(result.output.reply).toContain("给我一句打起精神的话");
  });

  it("throws when remote mode is enabled without required env config", async () => {
    process.env.AI_PROVIDER = "remote";

    await expect(
      generateAiReply({
        ancestorId: "su-shi",
        userMessage: "测试远程模式。",
        mode: "prototype",
        sceneType: "daily-chat",
        moodIndex: 78,
        traitVector: homePageData.nurtureSummary.traitVector,
      }),
    ).rejects.toThrow("AI_PROVIDER=remote");
  });
});
