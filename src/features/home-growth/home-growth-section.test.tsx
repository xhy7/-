import { render, screen } from "@testing-library/react";

import { homePageData } from "@/mocks/home-data";
import { HomeGrowthSection } from "@/features/home-growth/home-growth-section";

describe("HomeGrowthSection", () => {
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

  it("applies breathing animation class when mood value >= 70", () => {
    render(
      <HomeGrowthSection
        nurtureSummary={homePageData.nurtureSummary}
        fatePreviews={homePageData.fatePreviews}
      />,
    );

    const moodValue = screen.getByText("78");
    expect(moodValue.className).toContain("metricsValueBreathing");
  });

  it("applies dimmed animation class when mood value < 30", () => {
    const lowMoodSummary = {
      ...homePageData.nurtureSummary,
      moodSnapshot: {
        ...homePageData.nurtureSummary.moodSnapshot,
        value: 20,
        delta: -5,
      },
    };

    render(
      <HomeGrowthSection
        nurtureSummary={lowMoodSummary}
        fatePreviews={homePageData.fatePreviews}
      />,
    );

    const moodValue = screen.getByText("20");
    expect(moodValue.className).toContain("metricsValueDimmed");
  });

  it("renders empty traitVector placeholder", () => {
    const emptyTraitSummary = {
      ...homePageData.nurtureSummary,
      traitVector: [],
    };

    render(
      <HomeGrowthSection
        nurtureSummary={emptyTraitSummary}
        fatePreviews={homePageData.fatePreviews}
      />,
    );

    expect(screen.getByText("性格向量数据待补充。")).toBeInTheDocument();
  });

  it("hides tagRow when activeTags is empty", () => {
    const emptyTagsSummary = {
      ...homePageData.nurtureSummary,
      activeTags: [],
    };

    render(
      <HomeGrowthSection
        nurtureSummary={emptyTagsSummary}
        fatePreviews={homePageData.fatePreviews}
      />,
    );

    const tagRow = document.querySelector("._tagRow_");
    expect(tagRow).toBeNull();
  });

  it("renders golden particles when delta > 0", () => {
    render(
      <HomeGrowthSection
        nurtureSummary={homePageData.nurtureSummary}
        fatePreviews={homePageData.fatePreviews}
      />,
    );

    const metricsValue = screen.getByText("78");
    const particleContainer = metricsValue.querySelector("span");
    expect(particleContainer).toBeInTheDocument();
    expect(particleContainer!.querySelectorAll("span").length).toBe(3);
  });

  it("does not render particles when delta <= 0", () => {
    const negativeDeltaSummary = {
      ...homePageData.nurtureSummary,
      moodSnapshot: {
        ...homePageData.nurtureSummary.moodSnapshot,
        delta: -5,
      },
    };

    render(
      <HomeGrowthSection
        nurtureSummary={negativeDeltaSummary}
        fatePreviews={homePageData.fatePreviews}
      />,
    );

    const metricsValue = screen.getByText("78");
    const particleContainer = metricsValue.querySelector("span");
    expect(particleContainer).toBeNull();
  });

  it("clamps trait value to [0, 100] range", () => {
    const outOfRangeSummary = {
      ...homePageData.nurtureSummary,
      traitVector: [
        {
          id: "test",
          label: "测试",
          value: 150,
          max: 100,
          note: "超出范围",
          tone: "ink" as const,
        },
      ],
    };

    render(
      <HomeGrowthSection
        nurtureSummary={outOfRangeSummary}
        fatePreviews={homePageData.fatePreviews}
      />,
    );

    const meter = screen.getByRole("meter", { name: /测试/ });
    expect(meter.getAttribute("aria-valuenow")).toBe("100");
  });
});
