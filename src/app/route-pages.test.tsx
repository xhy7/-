import { render, screen } from "@testing-library/react";
import { vi } from "vitest";

import AncestorsPage from "@/app/ancestors/page";
import ChatPage from "@/app/chat/[ancestorId]/page";
import GrowthPage from "@/app/growth/page";
import PlaygroundPage from "@/app/playground/page";

vi.mock("next/navigation", async () => {
  const actual = await vi.importActual<typeof import("next/navigation")>(
    "next/navigation",
  );

  return {
    ...actual,
    useRouter: () => ({
      push: vi.fn(),
    }),
  };
});

describe("feature route pages", () => {
  it("renders the ancestors page with the hero stage", async () => {
    const page = await AncestorsPage();

    render(page);

    expect(screen.getAllByRole("heading", { name: "古人台" }).length).toBeGreaterThan(
      0,
    );
    expect(screen.getByAltText("嬴政肖像")).toBeInTheDocument();
    expect(screen.getByText("进入 嬴政 的对话场")).toBeInTheDocument();
  });

  it("renders the growth page as a standalone route", async () => {
    const page = await GrowthPage({
      searchParams: Promise.resolve({}),
    });

    render(page);

    expect(screen.getAllByRole("heading", { name: "养成中枢" }).length).toBeGreaterThan(
      0,
    );
    expect(screen.getByText("对话影响面板")).toBeInTheDocument();
  });

  it("renders the playground page as a standalone route", async () => {
    const page = await PlaygroundPage({
      searchParams: Promise.resolve({}),
    });

    render(page);

    expect(screen.getAllByRole("heading", { name: "玩法入口" }).length).toBeGreaterThan(
      0,
    );
    expect(screen.getByText("真正可玩的模式台")).toBeInTheDocument();
  });

  it("renders a dedicated chat page for one ancestor", async () => {
    const page = await ChatPage({
      params: Promise.resolve({ ancestorId: "su-shi" }),
    });

    render(page);

    expect(screen.getByRole("heading", { name: "苏轼 的对话场" })).toBeInTheDocument();
    expect(screen.getByText("角色 AI 对话")).toBeInTheDocument();
  });
});
