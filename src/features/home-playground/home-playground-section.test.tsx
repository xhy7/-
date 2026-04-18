import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";

import { homePageData } from "@/mocks/home-data";
import { HomePlaygroundSection } from "@/features/home-playground/home-playground-section";

describe("HomePlaygroundSection", () => {
  it("emits mode requests for the four entry cards", async () => {
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
    expect(screen.getByText("下方工坊可直接游玩")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "预览争端脚本" }));
    await user.click(screen.getByRole("button", { name: "预览提问意图" }));
    await user.click(screen.getByRole("button", { name: "打开创作台" }));
    await user.click(screen.getByRole("button", { name: "打开命题台" }));

    expect(onRequestMode).toHaveBeenNthCalledWith(1, "cross-time-quarrel");
    expect(onRequestMode).toHaveBeenNthCalledWith(2, "truth-or-dare");
    expect(onRequestMode).toHaveBeenNthCalledWith(3, "fusion-creation");
    expect(onRequestMode).toHaveBeenNthCalledWith(4, "modern-reframe");
  });

  it("still supports creation preview callbacks", async () => {
    const user = userEvent.setup();
    const onPreviewCreation = vi.fn();

    render(
      <HomePlaygroundSection
        gameplayModes={homePageData.gameplayModes}
        creationHighlights={homePageData.creationHighlights}
        onPreviewCreation={onPreviewCreation}
      />,
    );

    await user.click(screen.getAllByRole("button", { name: "查看传播脚本" })[0]);

    expect(onPreviewCreation).toHaveBeenCalledWith("fusion-poem");
  });
});
