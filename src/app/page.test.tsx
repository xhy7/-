import { render, screen, within } from "@testing-library/react";

import Page from "@/app/page";

describe("home page assembly", () => {
  it("renders the homepage as a route hub instead of the full feature stack", async () => {
    const page = await Page();

    render(page);

    expect(
      screen.getByRole("heading", { name: "老祖宗养成计划" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "今日主推祖宗" }),
    ).not.toBeInTheDocument();
    expect(screen.getByText("角色 AI 已嵌入祖宗形象")).toBeInTheDocument();
  });

  it("renders route links for the three feature pages", async () => {
    const page = await Page();

    render(page);

    const navigation = screen.getByRole("navigation", {
      name: "首页功能入口",
    });
    const links = within(navigation).getAllByRole("link");

    expect(links.map((link) => link.getAttribute("href"))).toEqual([
      "/ancestors",
      "/growth",
      "/playground",
    ]);
    expect(within(navigation).getByText("英雄台")).toBeInTheDocument();
    expect(within(navigation).getByText("养成中枢")).toBeInTheDocument();
    expect(within(navigation).getByText("玩法入口")).toBeInTheDocument();
  });
});
