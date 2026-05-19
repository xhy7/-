import { getHomePageData } from "@/mocks/home-gateway";
import { PlaygroundPageClient } from "./playground-page-client";

interface PlaygroundPageProps {
  searchParams?: Promise<{
    ancestor?: string;
    ancestorId?: string;
    mode?: string;
    source?: string;
  }>;
}

export default async function PlaygroundPage({
  searchParams,
}: PlaygroundPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const ancestor = resolvedSearchParams.ancestorId ?? resolvedSearchParams.ancestor;
  const data = await getHomePageData();

  return (
    <PlaygroundPageClient
      data={data}
      initialAncestorId={ancestor}
      initialModeId={resolvedSearchParams.mode}
      entrySource={resolvedSearchParams.source}
    />
  );
}
