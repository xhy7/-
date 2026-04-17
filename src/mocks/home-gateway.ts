import type { HomePageGateway } from "@/shared/contracts/gateway";
import type {
  AncestorDetailPreview,
  ModeIntentPreview,
} from "@/shared/contracts/home";
import {
  ancestorDetailPreviews,
  homePageData,
  modeIntentPreviews,
} from "@/mocks/home-data";

const wait = async (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

const clone = <T,>(value: T): T => structuredClone(value);

const getFallbackAncestorPreview = (): AncestorDetailPreview =>
  clone(ancestorDetailPreviews[homePageData.featuredAncestor.id]);

const getFallbackModePreview = (): ModeIntentPreview =>
  clone(modeIntentPreviews[homePageData.gameplayModes[0].id]);

export const homeGateway: HomePageGateway = {
  async getHomePageData() {
    await wait(20);
    return clone(homePageData);
  },
  async getAncestorDetailPreview(ancestorId) {
    await wait(80);
    return clone(ancestorDetailPreviews[ancestorId] ?? getFallbackAncestorPreview());
  },
  async prepareModeIntent(modeId) {
    await wait(80);
    return clone(modeIntentPreviews[modeId] ?? getFallbackModePreview());
  },
};

export const getHomePageData = homeGateway.getHomePageData;
export const getAncestorDetailPreview = homeGateway.getAncestorDetailPreview;
export const prepareModeIntent = homeGateway.prepareModeIntent;

