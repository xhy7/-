import { getHomePageData } from "@/mocks/home-gateway";

import { HomePageClient } from "./home-page-client";

export default async function Page() {
  const data = await getHomePageData();

  return <HomePageClient data={data} />;
}

