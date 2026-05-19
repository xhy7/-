import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, vi } from "vitest";

import { PlaygroundPageClient } from "@/app/playground/playground-page-client";
import { homePageData } from "@/mocks/home-data";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("PlaygroundPageClient", () => {
  it("renders a playable workshop and generates a result", async () => {
    const user = userEvent.setup();
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          requestId: "test-request-id",
          ancestorId: "ying-zheng",
          mode: "prototype",
          sceneType: "conflict-mediation",
          output: {
            reply: "【最终争端现场】嬴政与王安石正面对线，火药味拉满。",
            subtext: "语气偏强硬，裁决明显偏向关系判断。",
            nextAction: "继续切换裁决重心，查看不同版本。",
            styleTags: ["强硬", "高压"],
          },
          debug: {
            provider: "mock",
            model: "unit-test",
            personaId: "ying-zheng",
            moodSummary: "stable",
            dominantTraits: ["历史忠诚度"],
          },
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      ),
    );

    render(<PlaygroundPageClient data={homePageData} />);

    expect(screen.getByText("真正可玩的模式台")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "打开创作台" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "开始对峙" }));

    expect(await screen.findAllByText(/最终争端现场/)).toHaveLength(1);
    expect(screen.getAllByText(/vs/).length).toBeGreaterThan(0);
  });

  it("honors desktop pet entry params for ancestor and mode", () => {
    render(
      <PlaygroundPageClient
        data={homePageData}
        initialAncestorId="su-shi"
        initialModeId="modern-reframe"
        entrySource="pet"
      />,
    );

    expect(screen.getByText("来自桌宠入口")).toBeInTheDocument();
    expect(screen.getByText("生成现代重构")).toBeInTheDocument();
    expect(screen.getAllByRole("combobox")[0]).toHaveValue("su-shi");
  });
});
