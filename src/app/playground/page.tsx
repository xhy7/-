import { getHomePageData } from "@/mocks/home-gateway";
import { PlaygroundPageClient } from "./playground-page-client";

// 1. 明确定义页面 Props 类型，符合 Next.js App Router 规范
interface PlaygroundPageProps {
  searchParams?: Promise<{
    ancestor?: string;
  }>;
}

// 2. 确保组件 Props 有默认值 {}，避免类型出现 undefined
export default async function PlaygroundPage({
  searchParams,
}: PlaygroundPageProps = {}) {
  // 3. 安全解析 searchParams，保持原有逻辑
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const ancestor = resolvedSearchParams.ancestor;
  const data = await getHomePageData();

  return <PlaygroundPageClient data={data} initialAncestorId={ancestor} />;
}