import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";

import { homePageData } from "@/mocks/home-data";
import { HomeHeroSection } from "@/features/home-hero/home-hero-section";

describe("HomeHeroSection", () => {
  it("switches ancestors inside the roster", async () => {
    const user = userEvent.setup();

    render(
      <HomeHeroSection
        featuredAncestor={homePageData.featuredAncestor}
        roster={homePageData.roster}
        aiSandbox={homePageData.aiSandbox}
        moodIndex={homePageData.nurtureSummary.moodSnapshot.value}
        traitVector={homePageData.nurtureSummary.traitVector}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: /李清照 · 两宋之际/i }),
    );

    expect(screen.getByText(/易安居士/)).toBeInTheDocument();
    expect(
      screen.getByText(/你若让我评词，我先看你敢不敢受这口薄命锋芒。/),
    ).toBeInTheDocument();
    expect(screen.getByText("已切换轮播祖宗")).toBeInTheDocument();
    expect(screen.getByText("轮播人物卷")).toBeInTheDocument();
  });

  it("keeps the featured state visible and emits detail callbacks", async () => {
    const user = userEvent.setup();
    const onOpenAncestorDetail = vi.fn();

    render(
      <HomeHeroSection
        featuredAncestor={homePageData.featuredAncestor}
        roster={homePageData.roster}
        aiSandbox={homePageData.aiSandbox}
        moodIndex={homePageData.nurtureSummary.moodSnapshot.value}
        traitVector={homePageData.nurtureSummary.traitVector}
        onOpenAncestorDetail={onOpenAncestorDetail}
      />,
    );

    expect(screen.getByText("当前主推祖宗")).toBeInTheDocument();
    expect(screen.getByText("主推人物卷")).toBeInTheDocument();
    expect(screen.getByText("朱印题签")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "展开人物卷" }));

    expect(onOpenAncestorDetail).toHaveBeenCalledWith("su-shi");
  });

  it("submits an embedded AI reply request for the active ancestor", async () => {
    const user = userEvent.setup();
    const onGenerateAiReply = vi.fn();

    render(
      <HomeHeroSection
        featuredAncestor={homePageData.featuredAncestor}
        roster={homePageData.roster}
        aiSandbox={homePageData.aiSandbox}
        moodIndex={homePageData.nurtureSummary.moodSnapshot.value}
        traitVector={homePageData.nurtureSummary.traitVector}
        onGenerateAiReply={onGenerateAiReply}
      />,
    );

    expect(screen.getByText("苏轼 的角色代答")).toBeInTheDocument();
    expect(screen.getAllByText("AI 在线").length).toBeGreaterThan(0);

    await user.click(screen.getByRole("button", { name: "让 苏轼 开口" }));

    expect(onGenerateAiReply).toHaveBeenCalledWith(
      expect.objectContaining({
        ancestorId: "su-shi",
        mode: "prototype",
        sceneType: "daily-chat",
      }),
    );
  });
});
