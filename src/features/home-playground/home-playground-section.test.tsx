import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";

import { homePageData } from "@/mocks/home-data";
import { HomePlaygroundSection } from "@/features/home-playground/home-playground-section";

describe("HomePlaygroundSection", () => {
  it("emits mode preview requests and renders creation previews", async () => {
    const user = userEvent.setup();
    const onRequestMode = vi.fn();

    render(
      <HomePlaygroundSection
        gameplayModes={homePageData.gameplayModes}
        creationHighlights={homePageData.creationHighlights}
        onRequestMode={onRequestMode}
      />,
    );

    expect(screen.getByText("跨时空吵架")).toBeInTheDocument();
    expect(screen.getByText("《深夜加班赋》")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "预览争端脚本" }));

    expect(onRequestMode).toHaveBeenCalledWith("cross-time-quarrel");
  });
});
