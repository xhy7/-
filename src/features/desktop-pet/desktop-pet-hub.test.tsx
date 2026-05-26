/* eslint-disable @next/next/no-img-element */

import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { DesktopPetConfig } from "@/shared/contracts/home";
import { homePageData } from "@/mocks/home-data";
import { resetTestMediaQueryState, setTestMobileLayout } from "@/test/setup";

import { DesktopPetHub } from "./desktop-pet-hub";

vi.mock("next/image", () => ({
  default: ({
    alt,
    src,
  }: {
    alt: string;
    src: string;
  }) => <img alt={alt} src={src} />,
}));

class ResizeObserverMock {
  observe() {}

  unobserve() {}

  disconnect() {}
}

vi.stubGlobal("ResizeObserver", ResizeObserverMock);

function mockMatchMedia(options?: { mobile?: boolean }) {
  setTestMobileLayout(Boolean(options?.mobile));
  return () => setTestMobileLayout(false);
}

const petConfig = homePageData.desktopPet;
const profilePanel = petConfig.panelItems.find((panel) => panel.id === "profile")!;
const growthPanel = petConfig.panelItems.find((panel) => panel.id === "growth")!;
const playgroundPanel = petConfig.panelItems.find(
  (panel) => panel.id === "playground",
)!;

function renderHub(
  config: DesktopPetConfig = petConfig,
  options?: { layoutMode?: "mobile" | "desktop" },
) {
  return render(
    <DesktopPetHub config={config} layoutMode={options?.layoutMode} />,
  );
}

describe("DesktopPetHub", () => {
  beforeEach(() => {
    sessionStorage.clear();
    resetTestMediaQueryState();
    mockMatchMedia();
    vi.spyOn(Math, "random").mockReturnValue(0);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the hub shell and default character copy", () => {
    renderHub();

    expect(screen.getByLabelText("桌宠中枢")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: petConfig.helperTitle, level: 2 }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "苏轼" })).toBeInTheDocument();
    expect(
      screen.getByText(/卷轴 Tab 与快捷意图优先，完整页在面板内展开。/),
    ).toBeInTheDocument();
    expect(screen.getAllByText("北宋").length).toBeGreaterThan(0);
    expect(screen.getAllByText("东坡居士").length).toBeGreaterThan(0);
  });

  it("renders the default profile panel title from config", () => {
    renderHub();
    const panel = screen.getByRole("tabpanel");

    expect(
      within(panel).getByRole("heading", { name: profilePanel.title, level: 3 }),
    ).toBeInTheDocument();
    expect(within(panel).getByText(profilePanel.summary)).toBeInTheDocument();
  });

  it("renders compact entrance pills on mobile-oriented menu", () => {
    renderHub();

    const menu = screen.getByRole("navigation", { name: "桌宠快捷入口" });
    const buttons = within(menu).getAllByRole("button");

    expect(buttons.map((button) => button.textContent?.trim())).toEqual(
      petConfig.entranceItems.map((item) => item.label),
    );
    expect(within(menu).queryByRole("link")).not.toBeInTheDocument();
  });

  it("renders supported dock actions", () => {
    renderHub();

    expect(screen.getByRole("toolbar", { name: "桌宠轻互动" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "说话" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "吟诗" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "开心" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "小憩" })).toBeInTheDocument();
  });

  it("greets on first visit for the active character", async () => {
    renderHub();

    await waitFor(() => {
      expect(
        screen.getByText("来得正好，东坡肉还温着，话也还热着。"),
      ).toBeInTheDocument();
    });
    expect(sessionStorage.getItem("desktop-pet-greeted-su-shi")).toBe("1");
  });

  it("skips the session greet when the character was already greeted", async () => {
    sessionStorage.setItem("desktop-pet-greeted-su-shi", "1");

    renderHub();

    await waitFor(() => {
      expect(screen.getAllByText(profilePanel.summary).length).toBeGreaterThan(0);
    });
    expect(
      screen.queryByText("来得正好，东坡肉还温着，话也还热着。"),
    ).not.toBeInTheDocument();
  });

  it("shows talk copy when the pet is clicked", async () => {
    const user = userEvent.setup();
    renderHub();

    await user.click(screen.getByRole("button", { name: /拖动苏轼，点击互动/i }));

    expect(
      screen.getByText("你问网页入口？卷轴在旁边，点开便是。"),
    ).toBeInTheDocument();
    expect(screen.getByText("苏轼 · 此刻")).toBeInTheDocument();
  });

  it("shows poem styling when the poem dock action is used", async () => {
    const user = userEvent.setup();
    renderHub();

    await user.click(screen.getByRole("button", { name: "吟诗" }));

    expect(
      screen.getByText("竹杖芒鞋轻胜马，谁怕？一蓑烟雨任平生。"),
    ).toBeInTheDocument();
    expect(screen.getByText("苏轼 · 吟咏")).toBeInTheDocument();
  });

  it("shows happy styling when the happy dock action is used", async () => {
    const user = userEvent.setup();
    renderHub();

    await user.click(screen.getByRole("button", { name: "开心" }));

    expect(screen.getByText("苏轼 · 欣然")).toBeInTheDocument();
  });

  it("enters annoyed state after rapid clicks", async () => {
    const user = userEvent.setup();
    renderHub();

    const petButton = screen.getByRole("button", { name: /拖动苏轼，点击互动/i });
    await user.click(petButton);
    await user.click(petButton);
    await user.click(petButton);
    await user.click(petButton);
    await user.click(petButton);

    await waitFor(() => {
      expect(
        document.querySelector('[data-action-state="annoyed"]'),
      ).toBeInTheDocument();
    });
  });

  it("opens the growth panel when the growth entrance pill is clicked", async () => {
    const user = userEvent.setup();
    renderHub();

    const menu = screen.getByRole("navigation", { name: "桌宠快捷入口" });
    await user.click(within(menu).getByRole("button", { name: "养成中枢" }));

    await waitFor(() => {
      expect(
        within(screen.getByRole("tabpanel")).getByRole("heading", {
          name: growthPanel.title,
          level: 3,
        }),
      ).toBeInTheDocument();
      expect(screen.getByText("苏轼 · 养成")).toBeInTheDocument();
    });
  });

  it("opens a panel and shows quick intent prompt when a quick intent chip is clicked", async () => {
    const user = userEvent.setup();
    renderHub();
    const chatIntent = petConfig.quickIntents.find(
      (intent) => intent.panelId === "chat",
    )!;

    await user.click(screen.getByRole("button", { name: chatIntent.label }));

    await waitFor(() => {
      expect(screen.getByText(chatIntent.prompt)).toBeInTheDocument();
      expect(
        screen.getByRole("heading", {
          name: petConfig.panelItems.find((panel) => panel.id === "chat")!.title,
          level: 3,
        }),
      ).toBeInTheDocument();
    });
  });

  it("switches panels through the tablist", async () => {
    const user = userEvent.setup();
    renderHub();

    await user.click(screen.getByRole("tab", { name: "玩法工坊" }));

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: playgroundPanel.title, level: 3 }),
      ).toBeInTheDocument();
    });
  });

  it("exposes the profile primary CTA href inside the panel", () => {
    renderHub();

    expect(
      screen.getByRole("link", { name: profilePanel.primaryCtaLabel }),
    ).toHaveAttribute("href", profilePanel.primaryHref);
  });

  it("exposes playground mode links inside the playground panel", async () => {
    const user = userEvent.setup();
    renderHub();

    await user.click(screen.getByRole("tab", { name: "玩法工坊" }));

    await waitFor(() => {
      expect(
        screen.getByRole("link", { name: /跨时空吵架/i }),
      ).toHaveAttribute(
        "href",
        "/playground?ancestorId=su-shi&source=pet&mode=cross-time-quarrel",
      );
    });
  });

  it("previews entrance intent on click, not pointer enter or focus alone", async () => {
    const user = userEvent.setup();
    renderHub();

    await user.click(screen.getByRole("button", { name: "吟诗" }));
    expect(screen.getByText("苏轼 · 吟咏")).toBeInTheDocument();

    const menu = screen.getByRole("navigation", { name: "桌宠快捷入口" });
    const ancestorsButton = within(menu).getByRole("button", { name: "古人台" });
    ancestorsButton.dispatchEvent(
      new Event("pointerenter", { bubbles: true }),
    );

    expect(screen.getByText("苏轼 · 吟咏")).toBeInTheDocument();

    ancestorsButton.focus();
    expect(screen.getByText("苏轼 · 吟咏")).toBeInTheDocument();

    await user.click(ancestorsButton);
    await waitFor(() => {
      expect(
        within(screen.getByRole("tabpanel")).getByText(profilePanel.summary),
      ).toBeInTheDocument();
    });
  });

  it("shows the character switcher when multiple characters are configured", async () => {
    const user = userEvent.setup();
    const multiConfig: DesktopPetConfig = {
      ...petConfig,
      characters: [
        petConfig.characters[0]!,
        {
          ...petConfig.characters[0]!,
          ancestorId: "li-bai",
          displayName: "李白",
          title: "青莲居士",
          defaultSpeech: "天生我材必有用。",
          speechLines: [
            {
              id: "li-bai-greet",
              state: "greet",
              text: "将进酒，杯莫停。",
            },
          ],
        },
      ],
    };

    renderHub(multiConfig);

    expect(
      screen.getByRole("radiogroup", { name: "切换桌宠角色" }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("radio", { name: "李白" }));

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "李白" })).toBeInTheDocument();
      expect(screen.getByText("将进酒，杯莫停。")).toBeInTheDocument();
    }, { timeout: 1000 });
  });

  it("uses quick intent actionState instead of the panel default action", async () => {
    sessionStorage.setItem("desktop-pet-greeted-su-shi", "1");
    const user = userEvent.setup();
    const config: DesktopPetConfig = {
      ...petConfig,
      quickIntents: petConfig.quickIntents.map((intent) =>
        intent.id === "intent-profile"
          ? { ...intent, actionState: "poem" }
          : intent,
      ),
    };

    renderHub(config);
    await user.click(screen.getByRole("button", { name: "看苏轼档案" }));

    await waitFor(() => {
      expect(screen.getByText("苏轼 · 吟咏")).toBeInTheDocument();
      expect(
        document.querySelector('[data-action-state="poem"]'),
      ).toBeInTheDocument();
      expect(
        screen.getByText("先看看东坡今天是什么状态。"),
      ).toBeInTheDocument();
    });
  });

  it("shows a stage happy burst when opening the growth panel", async () => {
    sessionStorage.setItem("desktop-pet-greeted-su-shi", "1");
    const user = userEvent.setup();
    renderHub();

    await user.click(screen.getByRole("tab", { name: "养成状态" }));

    await waitFor(() => {
      const stage = screen.getByRole("group", { name: "苏轼桌宠舞台" });
      expect(stage.className).toMatch(/stageHappy/);
      expect(
        document.querySelector('[data-action-state="happy"]'),
      ).toBeInTheDocument();
    });
  });

  it("wakes the pet and opens the requested panel from sleep", async () => {
    sessionStorage.setItem("desktop-pet-greeted-su-shi", "1");
    const user = userEvent.setup();
    renderHub();

    await user.click(screen.getByRole("button", { name: "小憩" }));
    expect(screen.getByText("苏轼 · 小憩")).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "养成状态" }));

    await waitFor(() => {
      expect(screen.queryByText("苏轼 · 小憩")).not.toBeInTheDocument();
      expect(screen.getByText("苏轼 · 养成")).toBeInTheDocument();
      expect(
        within(screen.getByRole("tabpanel")).getByRole("heading", {
          name: growthPanel.title,
          level: 3,
        }),
      ).toBeInTheDocument();
    });
  });

  it("collapses the panel region on mobile when the toggle is clicked", async () => {
    sessionStorage.setItem("desktop-pet-greeted-su-shi", "1");
    const user = userEvent.setup();
    renderHub(petConfig, { layoutMode: "mobile" });

    const toggle = screen.getByRole("button", { name: "收起卷轴面板" });
    expect(toggle).toHaveAttribute("aria-expanded", "true");

    await user.click(toggle);

    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByRole("button", { name: "展开卷轴面板" })).toBeInTheDocument();
  });

  it("switches panels with arrow keys on the tablist", async () => {
    sessionStorage.setItem("desktop-pet-greeted-su-shi", "1");
    renderHub();

    const tablist = screen.getByRole("tablist", { name: "桌宠内容面板" });
    const profileTab = within(tablist).getByRole("tab", { name: "人物档案" });
    profileTab.focus();
    fireEvent.keyDown(tablist, { key: "ArrowRight" });

    await waitFor(() => {
      expect(
        within(screen.getByRole("tabpanel")).getByRole("heading", {
          name: growthPanel.title,
          level: 3,
        }),
      ).toBeInTheDocument();
      expect(within(tablist).getByRole("tab", { name: "养成状态" })).toHaveAttribute(
        "aria-selected",
        "true",
      );
    });
  });

  it("previews panel action state on pointer enter", async () => {
    sessionStorage.setItem("desktop-pet-greeted-su-shi", "1");
    const user = userEvent.setup();
    renderHub();

    await user.click(screen.getByRole("tab", { name: "玩法工坊" }));
    const actionLink = await screen.findByRole("link", { name: /跨时空吵架/i });
    await user.hover(actionLink);

    await waitFor(() => {
      expect(screen.getByText("苏轼 · 此刻")).toBeInTheDocument();
    });
  });

  it("points all tabs at the active tabpanel region", () => {
    sessionStorage.setItem("desktop-pet-greeted-su-shi", "1");
    renderHub();

    expect(screen.getByRole("tabpanel")).toHaveAttribute("id", "pet-panel-active");
    for (const tab of screen.getAllByRole("tab")) {
      expect(tab).toHaveAttribute("aria-controls", "pet-panel-active");
    }
  });
});
