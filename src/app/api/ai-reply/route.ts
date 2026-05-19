import { generateAiReply } from "@/shared/ai/ai-reply-gateway";
import type {
  AiReplyMode,
  AiReplyRequest,
  AiSceneType,
  TraitMetric,
} from "@/shared/contracts/home";

const aiModes: AiReplyMode[] = ["prototype", "ooc"];
const sceneTypes: AiSceneType[] = [
  "daily-chat",
  "conflict-mediation",
  "creative-feedback",
  "event-reaction",
];

const isTraitMetric = (value: unknown): value is TraitMetric =>
  typeof value === "object" &&
  value !== null &&
  typeof (value as TraitMetric).id === "string" &&
  typeof (value as TraitMetric).label === "string" &&
  typeof (value as TraitMetric).value === "number" &&
  typeof (value as TraitMetric).max === "number" &&
  typeof (value as TraitMetric).note === "string" &&
  ["ink", "vermilion", "gold"].includes((value as TraitMetric).tone);

const isAiReplyRequest = (value: unknown): value is AiReplyRequest =>
  typeof value === "object" &&
  value !== null &&
  typeof (value as AiReplyRequest).ancestorId === "string" &&
  typeof (value as AiReplyRequest).userMessage === "string" &&
  aiModes.includes((value as AiReplyRequest).mode) &&
  sceneTypes.includes((value as AiReplyRequest).sceneType) &&
  typeof (value as AiReplyRequest).moodIndex === "number" &&
  Array.isArray((value as AiReplyRequest).traitVector) &&
  (value as AiReplyRequest).traitVector.every(isTraitMetric) &&
  (typeof (value as AiReplyRequest).contextNote === "undefined" ||
    typeof (value as AiReplyRequest).contextNote === "string");

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as unknown;

    if (!isAiReplyRequest(payload)) {
      return Response.json(
        {
          error: "Invalid AI reply request payload.",
        },
        {
          status: 400,
        },
      );
    }

    const response = await generateAiReply(payload);

    return Response.json(response);
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unknown AI reply generation error.",
      },
      {
        status: 500,
      },
    );
  }
}
