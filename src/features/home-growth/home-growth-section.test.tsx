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
});

