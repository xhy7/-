import { render, screen } from "@testing-library/react";
import { vi } from "vitest";

import AncestorsPage from "@/app/ancestors/page";
import ChatPage from "@/app/chat/[ancestorId]/page";
import FateDetailPage from "@/app/growth/fates/[fateId]/page";
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
  it("renders the ancestors page with persona AI embedded in the hero stage", async () => {
    const page = await AncestorsPage();

    render(page);

    expect(screen.getByRole("heading", { name: "祖宗主舞台" })).toBeInTheDocument();
    expect(screen.getByText("苏轼 的角色代答")).toBeInTheDocument();
  });

  it("renders the growth page as a standalone route", async () => {
    const page = await GrowthPage({
      searchParams: Promise.resolve({}),
    });

    render(page);

    expect(screen.getAllByRole("heading", { name: "养成中枢" }).length).toBeGreaterThan(
      0,
    );
    expect(screen.getByText("命运节点预告")).toBeInTheDocument();
  });

  it("renders the playground page as a standalone route", async () => {
    const page = await PlaygroundPage();

    render(page);

    expect(screen.getAllByRole("heading", { name: "玩法入口" }).length).toBeGreaterThan(
      0,
    );
    expect(screen.getByText("真正可玩的模式台")).toBeInTheDocument();
  });

  it("renders a standalone fate detail page after focus navigation", async () => {
    const page = await FateDetailPage({
      params: Promise.resolve({ fateId: "wutai-poem-case" }),
      searchParams: Promise.resolve({ ancestor: "su-shi" }),
    });

    render(page);

    expect(screen.getByRole("heading", { name: "乌台诗案" })).toBeInTheDocument();
    expect(screen.getByText(/当前按 苏轼 的养成视角计算/)).toBeInTheDocument();
    expect(screen.getByText("解锁状态")).toBeInTheDocument();
  });

  it("renders a dedicated chat page for one ancestor", async () => {
    const page = await ChatPage({
      params: Promise.resolve({ ancestorId: "su-shi" }),
    });

    render(page);

    expect(screen.getByRole("heading", { name: "苏轼 的对话页" })).toBeInTheDocument();
    expect(screen.getByText("角色 AI 对话")).toBeInTheDocument();
  });
});
