import { afterEach, describe, expect, it, vi } from "vitest";

import { homePageData } from "@/mocks/home-data";
import { createRemoteAiAdapter } from "@/shared/ai/remote-ai-adapter";

describe("createRemoteAiAdapter", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("normalizes a base api url to the chat completions endpoint", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify({
                reply: "先把话说完。",
                subtext: "他在接住情绪。",
                nextAction: "继续补一句。",
                styleTags: ["prototype"],
              }),
            },
          },
        ],
      }),
    });

    vi.stubGlobal("fetch", fetchMock);

    const adapter = createRemoteAiAdapter({
      apiUrl: "https://api.example.com",
      apiKey: "test-key",
      model: "test-model",
    });

    await adapter.generateReply({
      ancestorId: "su-shi",
      userMessage: "今天有点累。",
      mode: "prototype",
      sceneType: "daily-chat",
      moodIndex: 78,
      traitVector: homePageData.nurtureSummary.traitVector,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.com/v1/chat/completions",
      expect.any(Object),
    );
  });
});
