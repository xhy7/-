import type { AiReplyGateway } from "@/shared/contracts/gateway";
import type { AiReplyRequest, AiReplyResponse } from "@/shared/contracts/home";

import { mockAiReplyAdapter } from "@/mocks/ai-reply-adapter";
import { createRemoteAiAdapter } from "@/shared/ai/remote-ai-adapter";

const resolveAdapter = (): AiReplyGateway => {
  if (process.env.AI_PROVIDER !== "remote") {
    return mockAiReplyAdapter;
  }

  const apiUrl = process.env.AI_API_URL;
  const apiKey = process.env.AI_API_KEY;
  const model = process.env.AI_MODEL;

  if (!apiUrl || !apiKey || !model) {
    throw new Error(
      "AI_PROVIDER=remote 时必须同时配置 AI_API_URL、AI_API_KEY、AI_MODEL。",
    );
  }

  return createRemoteAiAdapter({
    apiUrl,
    apiKey,
    model,
  });
};

export const aiReplyGateway: AiReplyGateway = {
  async generateReply(request: AiReplyRequest): Promise<AiReplyResponse> {
    const adapter = resolveAdapter();
    return adapter.generateReply(request);
  },
};

export const generateAiReply = aiReplyGateway.generateReply;
