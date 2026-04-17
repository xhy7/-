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
      />,
    );

    await user.click(
      screen.getByRole("button", { name: /李清照 · 两宋之际/i }),
    );

    expect(screen.getByText(/易安居士/)).toBeInTheDocument();
    expect(
      screen.getByText(/你若让我评词，我先看你敢不敢受这口薄命锋芒。/),
    ).toBeInTheDocument();
  });
});
