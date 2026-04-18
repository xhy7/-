import type {
  AiReplyMode,
  AiReplyRequest,
  TraitMetric,
} from "@/shared/contracts/home";

import { getAiPersona } from "@/shared/ai/personas";

export interface AiPromptBundle {
  systemPrompt: string;
  userPrompt: string;
  dominantTraits: string[];
  moodSummary: string;
  personaId: string;
}

const formatTraits = (traitVector: TraitMetric[]) =>
  traitVector
    .map((trait) => `${trait.label}:${trait.value}/${trait.max}`)
    .join(" | ");

export const pickDominantTraits = (traitVector: TraitMetric[]): string[] =>
  [...traitVector]
    .sort((left, right) => right.value / right.max - left.value / left.max)
    .slice(0, 2)
    .map((trait) => trait.label);

export const describeMoodIndex = (moodIndex: number) => {
  if (moodIndex >= 85) {
    return "情绪高昂，输出可以更主动、更外放。";
  }

  if (moodIndex >= 65) {
    return "情绪稳定偏积极，适合正常发挥 persona。";
  }

  if (moodIndex >= 40) {
    return "情绪谨慎，回复应适度收束并保留观察感。";
  }

  return "情绪低压，回复要更克制，先接住情绪再表达立场。";
};

const buildModeInstruction = (mode: AiReplyMode) =>
  mode === "prototype"
    ? "当前模式为 prototype：尽量贴近角色原型，不做明显出戏的现代化漂移。"
    : "当前模式为 ooc：允许轻微人格偏移和现代语感，但仍必须保留角色辨识度。";

export const buildAiReplyPrompt = (request: AiReplyRequest): AiPromptBundle => {
  const persona = getAiPersona(request.ancestorId);
  const dominantTraits = pickDominantTraits(request.traitVector);
  const moodSummary = describeMoodIndex(request.moodIndex);

  const systemPrompt = [
    `你正在扮演 ${persona.displayName}。`,
    `身份基线：${persona.systemIdentity}`,
    `风格规则：${persona.styleRules.join("；")}`,
    `原型约束：${persona.prototypeRules.join("；")}`,
    `OOC 说明：${persona.oocRule}`,
    `场景钩子：${persona.sceneHooks[request.sceneType]}`,
    buildModeInstruction(request.mode),
    `MoodIndex=${request.moodIndex}。${moodSummary}`,
    `TraitVector 重点：${dominantTraits.join("、")}。`,
    "你必须只输出 JSON，不要输出 Markdown。",
    'JSON 结构固定为 {"reply":"","subtext":"","nextAction":"","styleTags":[""]}。',
    "reply 是角色对用户说的话，subtext 是潜台词，nextAction 是建议继续互动的下一步，styleTags 是 2 到 4 个风格标签。",
  ].join("\n");

  const userPrompt = [
    `sceneType=${request.sceneType}`,
    `traitVector=${formatTraits(request.traitVector)}`,
    request.contextNote ? `contextNote=${request.contextNote}` : null,
    `userMessage=${request.userMessage}`,
  ]
    .filter(Boolean)
    .join("\n");

  return {
    systemPrompt,
    userPrompt,
    dominantTraits,
    moodSummary,
    personaId: persona.ancestorId,
  };
};
