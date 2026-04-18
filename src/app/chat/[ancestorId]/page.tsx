import { getHomePageData } from "@/mocks/home-gateway";

import { ChatPageClient } from "./chat-page-client";

interface ChatPageProps {
  params: Promise<{
    ancestorId: string;
  }>;
}

export default async function ChatPage({ params }: ChatPageProps) {
  const [{ ancestorId }, data] = await Promise.all([params, getHomePageData()]);

  return <ChatPageClient data={data} ancestorId={ancestorId} />;
}
