import { getHomePageData } from "@/mocks/home-gateway";

import { FateDetailPageClient } from "./fate-detail-page-client";

interface FateDetailPageProps {
  params: Promise<{
    fateId: string;
  }>;
  searchParams: Promise<{
    ancestor?: string;
  }>;
}

export default async function FateDetailPage({
  params,
  searchParams,
}: FateDetailPageProps) {
  const [{ fateId }, { ancestor }] = await Promise.all([params, searchParams]);
  const data = await getHomePageData();

  return (
    <FateDetailPageClient
      data={data}
      fateId={fateId}
      ancestorId={ancestor}
    />
  );
}
