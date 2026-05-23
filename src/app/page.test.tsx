/* eslint-disable @next/next/no-img-element */

import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, vi } from "vitest";

import Page from "@/app/page";
import { homePageData } from "@/mocks/home-data";
import { resetTestMediaQueryState } from "@/test/setup";
import suShiManifest from "../../public/pets/su-shi/manifest.json";

vi.mock("next/image", () => ({
  default: ({
    alt,
    src,
    className,
    draggable,
    onError,
  }: {
    alt: string;
    src: string;
    className?: string;
    draggable?: boolean;
    onError?: () => void;
  }) => (
    <img
      alt={alt}
      src={src}
      className={className}
      draggable={draggable}
      onError={onError}
    />
  ),
}));

vi.mock("@/features/auth", () => ({
  UserAvatar: ({
    glyph,
    name,
  }: {
    glyph: string;
    name?: string;
  }) => <span aria-label={name}>{glyph}</span>,
  UserProfile: () => <div>用户资料</div>,
  authGateway: {
    getSession: vi.fn(() => new Promise(() => {})),
    logout: vi.fn(),
  },
  clearSession: vi.fn(),
}));

class ResizeObserverMock {
  observe() {}

  unobserve() {}

  disconnect() {}
}

describe("home page assembly", () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.stubGlobal("ResizeObserver", ResizeObserverMock);
    resetTestMediaQueryState();
  });

  it("renders the homepage as a route hub instead of the full feature stack", async () => {
    const page = await Page();

    render(page);

    expect(
      screen.getByRole("heading", { name: "老祖宗养成计划" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "今日主推祖宗" }),
    ).not.toBeInTheDocument();
    expect(
      within(screen.getByRole("navigation", { name: "首页功能入口" })).getByText(
        "古人台",
      ),
    ).toBeInTheDocument();
  });

  it("mounts the desktop pet hub with the home desktop pet config", async () => {
    const user = userEvent.setup();
    const page = await Page();

    render(page);

    expect(screen.getByLabelText("桌宠中枢")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: homePageData.desktopPet.helperTitle }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "苏轼" })).toBeInTheDocument();
    const desktopPetNavigation = screen.getByRole("navigation", {
      name: "桌宠快捷入口",
    });
    expect(desktopPetNavigation).toBeInTheDocument();
    expect(
      within(desktopPetNavigation).getByRole("button", { name: /玩法工坊/ }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "玩法工坊" }));

    expect(
      screen.getByRole("link", { name: "展开玩法工坊" }),
    ).toHaveAttribute("href", "/playground?ancestorId=su-shi&source=pet");
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
    expect(within(navigation).getByText("古人台")).toBeInTheDocument();
    expect(within(navigation).getByText("养成中枢")).toBeInTheDocument();
    expect(within(navigation).getByText("玩法入口")).toBeInTheDocument();
  });

  it("exposes the desktop pet contract for parallel feature work", () => {
    const suShiPet = homePageData.desktopPet.characters.find(
      (character) => character.ancestorId === "su-shi",
    );
    const panelIds = homePageData.desktopPet.panelItems.map((panel) => panel.id);
    const quickIntentPanelIds = homePageData.desktopPet.quickIntents.map(
      (intent) => intent.panelId,
    );

    expect(homePageData.desktopPet.defaultAncestorId).toBe("su-shi");
    expect(homePageData.desktopPet.defaultPanelId).toBe("profile");
    expect(
      homePageData.desktopPet.entranceItems.map((item) => item.href),
    ).toContain("/playground?ancestorId=su-shi&source=pet");
    expect(suShiPet?.supportedActions).toEqual(
      expect.arrayContaining(["idle", "talk", "poem"]),
    );
    expect(panelIds).toEqual(["profile", "growth", "playground", "chat"]);
    expect(quickIntentPanelIds).toEqual(
      expect.arrayContaining(["profile", "growth", "playground", "chat"]),
    );
  });

  it("provides desktop pet content panels for profile, growth, gameplay, and chat", () => {
    const panels = homePageData.desktopPet.panelItems;
    const panelById = Object.fromEntries(
      panels.map((panel) => [panel.id, panel]),
    );

    expect(panelById.profile?.primaryHref).toBe(
      "/ancestors?ancestorId=su-shi&source=pet",
    );
    expect(panelById.growth?.primaryHref).toBe(
      "/growth?ancestor=su-shi&source=pet",
    );
    expect(panelById.playground?.primaryHref).toBe(
      "/playground?ancestorId=su-shi&source=pet",
    );
    expect(panelById.chat?.primaryHref).toBe("/chat/su-shi?source=pet");

    expect(panelById.profile?.metrics.map((metric) => metric.label)).toContain(
      "时代",
    );
    expect(panelById.growth?.metrics.map((metric) => metric.label)).toContain(
      "MoodIndex",
    );
    expect(panelById.playground?.actions.map((action) => action.modeId)).toEqual(
      expect.arrayContaining([
        "cross-time-quarrel",
        "truth-or-dare",
        "modern-reframe",
      ]),
    );
    expect(panelById.chat?.actions.map((action) => action.sceneType)).toEqual(
      expect.arrayContaining(["daily-chat", "creative-feedback"]),
    );
  });

  it("provides quick intents that map to existing desktop pet panels", () => {
    const panelIds = new Set(
      homePageData.desktopPet.panelItems.map((panel) => panel.id),
    );

    expect(homePageData.desktopPet.quickIntents).toHaveLength(4);
    for (const intent of homePageData.desktopPet.quickIntents) {
      expect(panelIds.has(intent.panelId)).toBe(true);
      expect(intent.href).toContain("source=pet");
    }
  });

  it("uses the real Su Shi pet manifest frames in the homepage config", () => {
    const suShiPet = homePageData.desktopPet.characters.find(
      (character) => character.ancestorId === "su-shi",
    );

    expect(suShiPet?.assetManifest.basePath).toBe(suShiManifest.basePath);
    expect(suShiPet?.assetManifest.previewImageSrc).toBe(
      suShiManifest.previewImageSrc,
    );
    expect(suShiPet?.assetManifest.frameSets).toEqual(
      suShiManifest.frameSets,
    );
  });
});
