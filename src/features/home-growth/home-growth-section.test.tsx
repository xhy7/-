import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";

import { homePageData } from "@/mocks/home-data";
import { HomeGrowthSection } from "@/features/home-growth/home-growth-section";

describe("HomeGrowthSection", () => {
  it("renders the nurturing data and emits fate callbacks", async () => {
    const user = userEvent.setup();
    const onOpenFatePreview = vi.fn();

    render(
      <HomeGrowthSection
        nurtureSummary={homePageData.nurtureSummary}
        fatePreviews={homePageData.fatePreviews}
        onOpenFatePreview={onOpenFatePreview}
      />,
    );

    expect(screen.getByText("MoodIndex")).toBeInTheDocument();
    expect(screen.getByText("乌台诗案")).toBeInTheDocument();

    await user.click(screen.getAllByRole("button", { name: "聚焦节点" })[0]);

    expect(onOpenFatePreview).toHaveBeenCalledWith("wutai-poem-case");
  });

  it("displays delta with correct sign", () => {
    render(
      <HomeGrowthSection
        nurtureSummary={homePageData.nurtureSummary}
        fatePreviews={homePageData.fatePreviews}
      />,
    );

    expect(screen.getByText("+12")).toBeInTheDocument();
  });

  it("displays mood status label", () => {
    render(
      <HomeGrowthSection
        nurtureSummary={homePageData.nurtureSummary}
        fatePreviews={homePageData.fatePreviews}
      />,
    );

    const metricsCard = screen.getByText("MoodIndex").closest("article");
    expect(metricsCard).toBeInTheDocument();
    expect(metricsCard!.textContent).toContain("微醺灵感");
  });

  it("renders trait meters with correct labels", () => {
    render(
      <HomeGrowthSection
        nurtureSummary={homePageData.nurtureSummary}
        fatePreviews={homePageData.fatePreviews}
      />,
    );

    const traitLabels = ["幽默感", "OOC 偏移", "共情力"];
    traitLabels.forEach((label) => {
      expect(screen.getByText(label)).toBeInTheDocument();
    });

    const meters = screen.getAllByRole("meter");
    expect(meters.length).toBe(4);
  });

  it("handles empty fatePreviews gracefully", () => {
    render(
      <HomeGrowthSection
        nurtureSummary={homePageData.nurtureSummary}
        fatePreviews={[]}
      />,
    );

    expect(
      screen.getByText("暂无命运节点预告。继续培养祖宗，新的命运线将在此展开。"),
    ).toBeInTheDocument();
  });

  it("calls onOpenFatePreview with correct fateId for each node", async () => {
    const user = userEvent.setup();
    const onOpenFatePreview = vi.fn();

    render(
      <HomeGrowthSection
        nurtureSummary={homePageData.nurtureSummary}
        fatePreviews={homePageData.fatePreviews}
        onOpenFatePreview={onOpenFatePreview}
      />,
    );

    const buttons = screen.getAllByRole("button", { name: "聚焦节点" });

    await user.click(buttons[0]);
    expect(onOpenFatePreview).toHaveBeenLastCalledWith("wutai-poem-case");

    await user.click(buttons[1]);
    expect(onOpenFatePreview).toHaveBeenLastCalledWith("hongmen-banquet");

    await user.click(buttons[2]);
    expect(onOpenFatePreview).toHaveBeenLastCalledWith("late-rain-night");
  });

  it("renders all active tags", () => {
    render(
      <HomeGrowthSection
        nurtureSummary={homePageData.nurtureSummary}
        fatePreviews={homePageData.fatePreviews}
      />,
    );

    const tagRow = screen.getByText("嘴硬心软").closest("div");
    expect(tagRow).toBeInTheDocument();
    expect(tagRow!.textContent).toContain("嘴硬心软");
    expect(tagRow!.textContent).toContain("乌台余震");
    expect(tagRow!.textContent).toContain("微醺灵感");
    expect(tagRow!.textContent).toContain("适合互评");
  });

  it("renders cultivation stage and leaf balance", () => {
    render(
      <HomeGrowthSection
        nurtureSummary={homePageData.nurtureSummary}
        fatePreviews={homePageData.fatePreviews}
      />,
    );

    expect(screen.getByText("知己未满 · 默契升温中")).toBeInTheDocument();
    expect(screen.getByText("128")).toBeInTheDocument();
  });

  it("renders next bond milestone", () => {
    render(
      <HomeGrowthSection
        nurtureSummary={homePageData.nurtureSummary}
        fatePreviews={homePageData.fatePreviews}
      />,
    );

    expect(
      screen.getByText(/再获得 22 枚金叶子/),
    ).toBeInTheDocument();
  });
});
