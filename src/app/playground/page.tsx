import { getHomePageData } from "@/mocks/home-gateway";

import { PlaygroundPageClient } from "./playground-page-client";

interface PlaygroundPageProps {
  searchParams?: Promise<{
    ancestor?: string;
  }>;
}

export default async function PlaygroundPage({
  searchParams,
}: PlaygroundPageProps = {}) {
  const { ancestor } = searchParams
    ? await searchParams
    : { ancestor: undefined };
  const data = await getHomePageData();

  return <PlaygroundPageClient data={data} initialAncestorId={ancestor} />;
}
