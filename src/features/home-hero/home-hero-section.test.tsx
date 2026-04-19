import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

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
        getChatHref={(ancestorId) => `/chat/${ancestorId}`}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: /赵高 · 秦/i }),
    );

    expect(screen.getByAltText("赵高肖像")).toBeInTheDocument();
    expect(screen.getByText(/中车府令/)).toBeInTheDocument();
    expect(screen.getByText(/陛下/)).toBeInTheDocument();
    expect(screen.getByText("已切换轮播祖宗")).toBeInTheDocument();
    expect(screen.getByText("进入 赵高 的对话场")).toBeInTheDocument();
  });

  it("keeps the featured state visible", async () => {
    render(
      <HomeHeroSection
        featuredAncestor={homePageData.featuredAncestor}
        roster={homePageData.roster}
        aiSandbox={homePageData.aiSandbox}
        moodIndex={homePageData.nurtureSummary.moodSnapshot.value}
        traitVector={homePageData.nurtureSummary.traitVector}
        getChatHref={(ancestorId) => `/chat/${ancestorId}`}
      />,
    );

    expect(screen.getByText("当前主推祖宗")).toBeInTheDocument();
    expect(screen.getByAltText("嬴政肖像")).toBeInTheDocument();
    expect(screen.getByText("朱印题签")).toBeInTheDocument();
    expect(screen.getByText("进入 嬴政 的对话场")).toBeInTheDocument();
  });
});
