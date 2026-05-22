import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { DesktopPetConfig } from "@/shared/contracts/home";
import { homePageData } from "@/mocks/home-data";

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

function mockMatchMedia() {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

const petConfig = homePageData.desktopPet;

function renderHub(config: DesktopPetConfig = petConfig) {
  return render(<DesktopPetHub config={config} />);
}

describe("DesktopPetHub", () => {
  beforeEach(() => {
    sessionStorage.clear();
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
      screen.getByText(/带着苏轼，继续推进关系。/),
    ).toBeInTheDocument();
    expect(screen.getByText("北宋")).toBeInTheDocument();
    expect(screen.getByText("东坡居士")).toBeInTheDocument();
  });

  it("renders entrance links from config", () => {
    renderHub();

    const menu = screen.getByRole("navigation", { name: "桌宠网页入口" });
    const links = within(menu).getAllByRole("link");

    expect(links.map((link) => link.getAttribute("href"))).toEqual(
      petConfig.entranceItems.map((item) => item.href),
    );
    expect(within(menu).getByRole("link", { name: /玩法工坊/i })).toHaveAttribute(
      "href",
      "/playground?ancestorId=su-shi&source=pet",
    );
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
      expect(screen.getByText(petConfig.characters[0]!.defaultSpeech)).toBeInTheDocument();
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

  it("previews entrance intent on focus and click, not pointer enter", async () => {
    const user = userEvent.setup();
    renderHub();

    await user.click(screen.getByRole("button", { name: "吟诗" }));
    expect(screen.getByText("苏轼 · 吟咏")).toBeInTheDocument();

    const ancestorsLink = screen.getByRole("link", { name: /古人台/i });
    ancestorsLink.dispatchEvent(
      new Event("pointerenter", { bubbles: true }),
    );

    expect(screen.getByText("苏轼 · 吟咏")).toBeInTheDocument();

    ancestorsLink.focus();
    await waitFor(() => {
      expect(
        screen.getByText("来得正好，东坡肉还温着，话也还热着。"),
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
      screen.getByRole("tablist", { name: "切换桌宠角色" }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "李白" }));

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "李白" })).toBeInTheDocument();
      expect(screen.getByText("将进酒，杯莫停。")).toBeInTheDocument();
    }, { timeout: 1000 });
  });
});
