import { getHomePageData } from "@/mocks/home-gateway";

import { GrowthPageClient } from "./growth-page-client";

interface GrowthPageProps {
  searchParams?: Promise<{
    ancestor?: string;
  }>;
}

export default async function GrowthPage({ searchParams }: GrowthPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const ancestor = resolvedSearchParams.ancestor;
  const data = await getHomePageData();

  return <GrowthPageClient data={data} initialAncestorId={ancestor} />;
}
