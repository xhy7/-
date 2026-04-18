import type { AiReplyGateway } from "@/shared/contracts/gateway";
import type {
  AiReplyContent,
  AiReplyRequest,
  AiReplyResponse,
} from "@/shared/contracts/home";

import { buildAiReplyPrompt } from "@/shared/ai/prompt-builder";

interface RemoteAiAdapterConfig {
  apiUrl: string;
  apiKey: string;
  model: string;
}

const createRequestId = () => `remote-${Math.random().toString(36).slice(2, 10)}`;

const resolveChatCompletionsUrl = (apiUrl: string) => {
  const normalizedUrl = apiUrl.replace(/\/+$/, "");

  if (normalizedUrl.endsWith("/chat/completions")) {
    return normalizedUrl;
  }

  if (normalizedUrl.endsWith("/v1")) {
    return `${normalizedUrl}/chat/completions`;
  }

  return `${normalizedUrl}/v1/chat/completions`;
};

const parseStructuredContent = (content: string): AiReplyContent => {
  const jsonText = (() => {
    try {
      JSON.parse(content);
      return content;
    } catch {
      const firstBrace = content.indexOf("{");
      const lastBrace = content.lastIndexOf("}");

      if (firstBrace >= 0 && lastBrace > firstBrace) {
        return content.slice(firstBrace, lastBrace + 1);
      }

      throw new Error("AI response is not valid JSON.");
    }
  })();

  const parsed = JSON.parse(jsonText) as Partial<AiReplyContent>;

  if (
    typeof parsed.reply !== "string" ||
    typeof parsed.subtext !== "string" ||
    typeof parsed.nextAction !== "string" ||
    !Array.isArray(parsed.styleTags)
  ) {
    throw new Error("AI response JSON does not match the required structure.");
  }

  return {
    reply: parsed.reply,
    subtext: parsed.subtext,
    nextAction: parsed.nextAction,
    styleTags: parsed.styleTags.filter(
      (tag): tag is string => typeof tag === "string",
    ),
  };
};

export const createRemoteAiAdapter = (
  config: RemoteAiAdapterConfig,
): AiReplyGateway => ({
  async generateReply(request: AiReplyRequest): Promise<AiReplyResponse> {
    const promptBundle = buildAiReplyPrompt(request);
    const response = await fetch(resolveChatCompletionsUrl(config.apiUrl), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        temperature: request.mode === "ooc" ? 0.9 : 0.7,
        response_format: {
          type: "json_object",
        },
        messages: [
          {
            role: "system",
            content: promptBundle.systemPrompt,
          },
          {
            role: "user",
            content: promptBundle.userPrompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();

      try {
        const errorPayload = JSON.parse(errorText) as {
          error?: {
            message?: string;
          };
        };

        throw new Error(
          errorPayload.error?.message
            ? `AI provider request failed: ${errorPayload.error.message}`
            : `AI provider request failed with status ${response.status}.`,
        );
      } catch {
        throw new Error(
          errorText
            ? `AI provider request failed: ${errorText}`
            : `AI provider request failed with status ${response.status}.`,
        );
      }
    }

    const payload = (await response.json()) as {
      choices?: Array<{
        message?: {
          content?: string;
        };
      }>;
    };

    const content = payload.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("AI provider returned an empty message.");
    }

    return {
      requestId: createRequestId(),
      ancestorId: request.ancestorId,
      mode: request.mode,
      sceneType: request.sceneType,
      output: parseStructuredContent(content),
      debug: {
        provider: "remote",
        model: config.model,
        personaId: promptBundle.personaId,
        moodSummary: promptBundle.moodSummary,
        dominantTraits: promptBundle.dominantTraits,
      },
    };
  },
});
