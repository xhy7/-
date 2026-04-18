import type { AiReplyGateway } from "@/shared/contracts/gateway";
import type { AiReplyRequest, AiReplyResponse } from "@/shared/contracts/home";

import { getAiPersona } from "@/shared/ai/personas";
import { buildAiReplyPrompt } from "@/shared/ai/prompt-builder";

const wait = async (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

const createRequestId = () => `mock-${Math.random().toString(36).slice(2, 10)}`;

const buildMoodLead = (moodIndex: number) => {
  if (moodIndex >= 80) {
    return "今日本就谈兴正盛";
  }

  if (moodIndex >= 60) {
    return "此刻心绪尚稳";
  }

  if (moodIndex >= 40) {
    return "我先不急着替你下结论";
  }

  return "你先别催我把话说得太满";
};

export const mockAiReplyAdapter: AiReplyGateway = {
  async generateReply(request: AiReplyRequest): Promise<AiReplyResponse> {
    await wait(120);

    const persona = getAiPersona(request.ancestorId);
    const promptBundle = buildAiReplyPrompt(request);
    const dominantTraits = promptBundle.dominantTraits.join("、");
    const moodLead = buildMoodLead(request.moodIndex);
    const modeLead =
      request.mode === "prototype"
        ? "我尽量照着本来的性情答你。"
        : "你既准我稍微放肆一点，那我便不全照旧谱说话。";

    return {
      requestId: createRequestId(),
      ancestorId: request.ancestorId,
      mode: request.mode,
      sceneType: request.sceneType,
      output: {
        reply: `${moodLead}，${modeLead}${persona.sceneHooks[request.sceneType]}。关于“${request.userMessage}”，我的答复是：先把最要紧的一层说清，再决定要不要把情绪往前推。`,
        subtext: `${persona.displayName} 当前更受 ${dominantTraits} 影响，因此会优先用符合 persona 的方式接话，而不是直接给模板答案。`,
        nextAction: `继续补一句更具体的场景，我会按 ${request.sceneType} 方向把回应再收紧一层。`,
        styleTags: [
          request.mode,
          request.sceneType,
          ...promptBundle.dominantTraits,
        ].slice(0, 4),
      },
      debug: {
        provider: "mock",
        model: "mock-single-role-writer",
        personaId: promptBundle.personaId,
        moodSummary: promptBundle.moodSummary,
        dominantTraits: promptBundle.dominantTraits,
      },
    };
  },
};
