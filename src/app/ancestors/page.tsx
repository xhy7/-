import { getHomePageData } from "@/mocks/home-gateway";

import { AncestorsPageClient } from "./ancestors-page-client";

export default async function AncestorsPage() {
  const data = await getHomePageData();

  return <AncestorsPageClient data={data} />;
}
