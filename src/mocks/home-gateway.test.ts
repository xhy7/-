import {
  ancestorDetailPreviews,
  homePageData,
  modeIntentPreviews,
} from "@/mocks/home-data";
import {
  getAncestorDetailPreview,
  getHomePageData,
  prepareModeIntent,
} from "@/mocks/home-gateway";

describe("homeGateway", () => {
  it("returns cloned homepage data for the app shell", async () => {
    const data = await getHomePageData();

    expect(data).toEqual(homePageData);
    expect(data).not.toBe(homePageData);

    data.brandTitle = "临时标题";
    data.shellStatuses[0].value = "临时模式";

    expect(homePageData.brandTitle).toBe("老祖宗养成计划");
    expect(homePageData.shellStatuses[0].value).toBe("当前可体验");
  });

  it("falls back to the default previews for unknown identifiers", async () => {
    const ancestorPreview = await getAncestorDetailPreview("unknown-ancestor");
    const modePreview = await prepareModeIntent("unknown-mode");

    expect(ancestorPreview).toEqual(ancestorDetailPreviews["ying-zheng"]);
    expect(ancestorPreview).not.toBe(ancestorDetailPreviews["ying-zheng"]);
    expect(modePreview).toEqual(modeIntentPreviews["cross-time-quarrel"]);
    expect(modePreview).not.toBe(modeIntentPreviews["cross-time-quarrel"]);
  });
});
