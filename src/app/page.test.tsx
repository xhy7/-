import { render, screen } from "@testing-library/react";

import Page from "@/app/page";
import { homePageData } from "@/mocks/home-data";

describe("home page assembly", () => {
  it("renders the homepage with the three core sections", async () => {
    const page = await Page();

    render(page);

    expect(
      screen.getByRole("heading", { name: "老祖宗养成计划" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "今日主推祖宗" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "养成中枢" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "玩法入口" }),
    ).toBeInTheDocument();
  });

  it("exposes the desktop pet contract for parallel feature work", () => {
    const suShiPet = homePageData.desktopPet.characters.find(
      (character) => character.ancestorId === "su-shi",
    );

    expect(homePageData.desktopPet.defaultAncestorId).toBe("su-shi");
    expect(
      homePageData.desktopPet.entranceItems.map((item) => item.href),
    ).toContain("/playground?ancestorId=su-shi&source=pet");
    expect(suShiPet?.supportedActions).toEqual(
      expect.arrayContaining(["idle", "talk", "poem"]),
    );
  });
});
