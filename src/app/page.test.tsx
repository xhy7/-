/* eslint-disable @next/next/no-img-element */

import { render, screen, within } from "@testing-library/react";
import { beforeEach, vi } from "vitest";

import Page from "@/app/page";
import { homePageData } from "@/mocks/home-data";
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

describe("home page assembly", () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.stubGlobal("ResizeObserver", ResizeObserverMock);
    mockMatchMedia();
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
    const page = await Page();

    render(page);

    expect(screen.getByLabelText("桌宠中枢")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: homePageData.desktopPet.helperTitle }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "苏轼" })).toBeInTheDocument();
    const desktopPetNavigation = screen.getByRole("navigation", {
      name: "桌宠网页入口",
    });
    expect(desktopPetNavigation).toBeInTheDocument();
    expect(
      within(desktopPetNavigation).getByRole("link", { name: /玩法工坊/ }),
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

    expect(homePageData.desktopPet.defaultAncestorId).toBe("su-shi");
    expect(
      homePageData.desktopPet.entranceItems.map((item) => item.href),
    ).toContain("/playground?ancestorId=su-shi&source=pet");
    expect(suShiPet?.supportedActions).toEqual(
      expect.arrayContaining(["idle", "talk", "poem"]),
    );
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
