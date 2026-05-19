import { vi } from "vitest";

import { homePageData } from "@/mocks/home-data";

const generateAiReply = vi.fn();

vi.mock("@/shared/ai/ai-reply-gateway", () => ({
  generateAiReply,
}));

describe("POST /api/ai-reply", () => {
  it("returns a structured AI reply payload", async () => {
    generateAiReply.mockResolvedValue({
      requestId: "mock-1",
      ancestorId: "su-shi",
      mode: "prototype",
      sceneType: "daily-chat",
      output: {
        reply: "先把心定下来。",
        subtext: "他在安抚你。",
        nextAction: "继续补充上下文。",
        styleTags: ["prototype", "daily-chat"],
      },
      debug: {
        provider: "mock",
        model: "mock-single-role-writer",
        personaId: "su-shi",
        moodSummary: "情绪稳定偏积极，适合正常发挥 persona。",
        dominantTraits: ["幽默感", "历史忠诚度"],
      },
    });

    const { POST } = await import("@/app/api/ai-reply/route");
    const response = await POST(
      new Request("http://localhost/api/ai-reply", {
        method: "POST",
        body: JSON.stringify({
          ancestorId: "su-shi",
          userMessage: "我今天有点烦。",
          mode: "prototype",
          sceneType: "daily-chat",
          moodIndex: 78,
          traitVector: homePageData.nurtureSummary.traitVector,
        }),
      }),
    );

    const payload = (await response.json()) as { output: { reply: string } };

    expect(response.status).toBe(200);
    expect(payload.output.reply).toBe("先把心定下来。");
  });

  it("returns 400 for invalid payloads", async () => {
    const { POST } = await import("@/app/api/ai-reply/route");
    const response = await POST(
      new Request("http://localhost/api/ai-reply", {
        method: "POST",
        body: JSON.stringify({
          mode: "prototype",
        }),
      }),
    );

    expect(response.status).toBe(400);
  });
});
