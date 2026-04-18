import { getHomePageData } from "@/mocks/home-gateway";

import { GrowthPageClient } from "./growth-page-client";

interface GrowthPageProps {
  searchParams?: Promise<{
    ancestor?: string;
  }>;
}

export default async function GrowthPage({ searchParams }: GrowthPageProps) {
  const { ancestor } = searchParams
    ? await searchParams
    : { ancestor: undefined };
  const data = await getHomePageData();

  return <GrowthPageClient data={data} initialAncestorId={ancestor} />;
}
