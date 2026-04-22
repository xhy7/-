"use client";

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";

import {
  appendConversationRecord,
  createConversationRecord,
  deriveMoodSnapshotFromHistory,
  deriveTraitVectorFromHistory,
  getConversationMemory,
  subscribeConversationMemory,
} from "@/shared/ai/interaction-memory";
import type {
  AiReplyRequest,
  AiReplyResponse,
  CreationHighlight,
  GameplayModeCard,
  MoodSnapshot,
  TraitMetric,
} from "@/shared/contracts/home";
import {
  InkButton,
  SectionHeading,
  TagPill,
} from "@/shared/ui/primitives";

import styles from "./home-playground-section.module.css";

type PlayableModeId =
  | "cross-time-quarrel"
  | "truth-or-dare"
  | "fusion-creation"
  | "modern-reframe";

type CreationFormat = "诗" | "词" | "对联" | "短文";
type ReviewStyle = "毒舌" | "委婉挖苦" | "降维打击" | "难得认可";

interface AncestorOption {
  id: string;
  name: string;
}

interface PlayReviewContext {
  authors: string;
  originalWork: string;
  sourceLabel: string;
}

interface PlayResult {
  title: string;
  summary: string;
  body: string;
  tags: string[];
  hook: string;
  debugLine: string;
  reviewContext?: PlayReviewContext;
}

interface ReviewResult {
  reviewerName: string;
  summary: string;
  body: string;
  hook: string;
  debugLine: string;
  tags: string[];
}

const modePresentation = {
  "cross-time-quarrel": {
    glyph: "甲",
    eyebrow: "对峙剧场",
    signal: "火气先起",
    footer: "适合演示祖宗站队、互怼与局面失控的戏剧张力。",
  },
  "truth-or-dare": {
    glyph: "乙",
    eyebrow: "剖心问案",
    signal: "真话逼近",
    footer: "更适合做历史争议提问和人格反转，突出问答压迫感。",
  },
  "fusion-creation": {
    glyph: "丙",
    eyebrow: "合卷试笔",
    signal: "文风混写",
    footer: "适合直接发起联合作诗、改词或混写，随后继续把结果带入互评。",
  },
  "modern-reframe": {
    glyph: "丁",
    eyebrow: "今题借古",
    signal: "反差拉满",
    footer: "主打现代命题和古人视角错位，天然适合传播切条。",
  },
} satisfies Record<
  string,
  {
    glyph: string;
    eyebrow: string;
    signal: string;
    footer: string;
  }
>;

const creationRankLabels = ["头牌热传", "评论引线", "余波扩散"];
const playableModeIds: PlayableModeId[] = [
  "cross-time-quarrel",
  "truth-or-dare",
  "fusion-creation",
  "modern-reframe",
];
const supportedAncestors: AncestorOption[] = [
  { id: "su-shi", name: "苏轼" },
  { id: "li-qingzhao", name: "李清照" },
  { id: "li-bai", name: "李白" },
  { id: "wang-an-shi", name: "王安石" },
  { id: "wu-zetian", name: "武则天" },
  { id: "ying-zheng", name: "嬴政" },
  { id: "zhao-gao", name: "赵高" },
];
const truthQuestionPrompts: Record<string, string[]> = {
  "su-shi": [
    "如果乌台诗案重来一次，哪一句话你仍然忍不住要写？",
    "你最怕别人把你的豁达误读成什么？",
    "如果被贬黄州当天能收到一条现代私信，你希望里面写什么？",
  ],
  "li-qingzhao": [
    "你最不愿意被后人只用哪一个词概括？",
    "如果《如梦令》下面出现吵架评论区，你会亲自回哪一句？",
    "哪一段离散记忆最不适合被改成热搜标题？",
  ],
  "li-bai": [
    "如果把酒全撤掉，你还剩下几分狂气？",
    "你写给朋友的诗里，哪一句其实最像求救？",
    "如果今天不能远游，你会把豪情砸向哪里？",
  ],
  "wang-an-shi": [
    "如果变法失败只能怪一个环节，你会先承认哪一个？",
    "你最受不了反对者把你说成哪一种人？",
    "当所有人都说稳一点时，你会怎样判断还能不能再推一步？",
  ],
  "wu-zetian": [
    "如果无字碑能弹出一条弹幕，你最不想看见哪一句？",
    "你更在意后人承认你的能力，还是承认你的代价？",
    "当权力和亲情正面冲突时，你会先保住什么？",
  ],
  "ying-zheng": [
    "如果大秦只能留下一个制度，你会留下哪一个？",
    "你最不能容忍后人把统一说成什么？",
    "如果群臣匿名给你打分，你最想知道哪一项？",
  ],
  "zhao-gao": [
    "指鹿为马那一刻，你最想测试的到底是谁？",
    "如果你有一次洗白机会，你会先改写哪件事？",
    "你最怕别人看穿你的哪一种算计？",
  ],
};
const fallbackTruthQuestionPrompts = [
  "如果后人只能问你一个不体面的问题，你觉得会是什么？",
  "你最希望被理解的一面，和最怕被看穿的一面分别是什么？",
  "如果当年的关键抉择重来一次，你会改掉哪一个细节？",
];
const getTruthQuestionPrompts = (ancestorId: string) =>
  truthQuestionPrompts[ancestorId] ?? fallbackTruthQuestionPrompts;
const getDefaultTruthQuestion = (ancestorId: string) =>
  getTruthQuestionPrompts(ancestorId)[0] ?? fallbackTruthQuestionPrompts[0];
const ancestorReviewVoices: Record<string, string> = {
  "su-shi": "苏轼点评要有松弛幽默、转圜能力和生活气，先把刺化成笑，再落到一句可改的地方。",
  "li-qingzhao": "李清照点评要细、准、带审美洁癖，抓字词气息和情绪真伪，不要写成豪放派口吻。",
  "li-bai": "李白点评要有飞扬气和夸张判断，重看气势、胆量、酒意般的腾挪，少做工整论文腔。",
  "wang-an-shi": "王安石点评要像在审方案，重结构、利弊、执行路径和是否敢破旧局。",
  "wu-zetian": "武则天点评要有上位者视角，重权力叙事、名声控制和作品是否镇得住场。",
  "ying-zheng": "嬴政点评要有帝王裁断感，重秩序、统一、尺度和作品能否立成制度般的句子。",
  "zhao-gao": "赵高点评要阴柔、试探、带操控感，专挑话术漏洞和可以借势翻盘的地方。",
};
const getAncestorReviewVoice = (ancestorId: string) =>
  ancestorReviewVoices[ancestorId] ?? "点评必须保留点评者本人经历、气质和说话习惯，避免只套用风格标签。";
const modernTopicOptions = [
  {
    id: "office",
    label: "职场汇报表演",
    friction: "会开会的人很多，真扛事的人很少。",
  },
  {
    id: "delivery",
    label: "外卖备注文学",
    friction: "认真写备注却仍收到错误餐品。",
  },
  {
    id: "shopping",
    label: "双十一冲动下单",
    friction: "抢券时像出征，收快递时像清点战损。",
  },
  {
    id: "social",
    label: "朋友圈精修人生",
    friction: "看似体面，实际全靠滤镜维持秩序。",
  },
];
const reviewStyleNotes: Record<ReviewStyle, string> = {
  毒舌: "优先放大作品里的逞强与装饰感，批评要狠，但仍保留点评者本人风格。",
  委婉挖苦: "字面留情，弦外音更尖刻，像是在给体面但实际处处下刀。",
  降维打击: "直接从格局、气骨和标准上否定，不做温和铺垫。",
  难得认可: "仍保持锋芒，但允许给出少量真实肯定和可执行修改建议。",
};

const getModePresentation = (modeId: string) => modePresentation[modeId as keyof typeof modePresentation];
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const getAncestorById = (ancestorId: string) =>
  supportedAncestors.find((ancestor) => ancestor.id === ancestorId) ?? supportedAncestors[0];
const getAncestorByName = (ancestorName?: string) =>
  supportedAncestors.find((ancestor) => ancestor.name === ancestorName) ?? supportedAncestors[0];
const getFallbackAncestorId = (excludedId: string) =>
  supportedAncestors.find((ancestor) => ancestor.id !== excludedId)?.id ?? excludedId;

const buildBaseMoodSnapshot = (selectedMoodValue?: number): MoodSnapshot => ({
  label: "MoodIndex",
  value: clamp(selectedMoodValue ?? 72, 0, 100),
  delta: 0,
  statusLabel: "玩法继承态",
  summary: "当前玩法工坊会继承首页传入的情绪指数，再叠加本地互动记忆。",
  cause: "来自首页焦点祖宗的当前情绪快照。",
});

const buildBaseTraitVector = (
  selectedTraitTags: string[],
  selectedMoodValue?: number,
): TraitMetric[] => {
  const joinedTags = selectedTraitTags.join(" ");
  const moodBase = clamp(selectedMoodValue ?? 72, 0, 100);
  const hasHumor = /(幽默|松弛|俏皮|风趣)/.test(joinedTags);
  const hasFidelity = /(历史|忠诚|原型|考据)/.test(joinedTags);
  const hasRebellion = /(ooc|反骨|偏移|嘴硬|失控)/i.test(joinedTags);
  const hasEmpathy = /(共情|安抚|温柔|体贴|细腻)/.test(joinedTags);

  return [
    {
      id: "humor",
      label: "幽默感",
      value: clamp(moodBase + (hasHumor ? 14 : 4), 35, 98),
      max: 100,
      note: hasHumor
        ? "当前标签已显式指向幽默转译能力。"
        : "默认按首页情绪状态估算角色的化解与转译能力。",
      tone: "gold",
    },
    {
      id: "fidelity",
      label: "历史忠诚度",
      value: clamp(76 + (hasFidelity ? 12 : 0) - (hasRebellion ? 6 : 0), 40, 99),
      max: 100,
      note: hasFidelity
        ? "当前标签强调了史实人格和原型稳定性。"
        : "若未显式提供忠诚标签，则按玩法区保守基线估算。",
      tone: "ink",
    },
    {
      id: "rebellion",
      label: "OOC 偏移",
      value: clamp(42 + (hasRebellion ? 20 : 6) + Math.round((moodBase - 60) / 6), 8, 90),
      max: 100,
      note: hasRebellion
        ? "当前标签明显带有偏移、嘴硬或失控倾向。"
        : "未显式走 OOC 时，仍保留少量出戏张力以支撑玩法戏剧性。",
      tone: "vermilion",
    },
    {
      id: "empathy",
      label: "共情力",
      value: clamp(58 + (hasEmpathy ? 18 : 6) + Math.round((moodBase - 55) / 8), 24, 96),
      max: 100,
      note: hasEmpathy
        ? "当前标签更偏向安抚、接情绪和细腻判断。"
        : "默认保留中位共情水平，让角色先接住局面再输出。",
      tone: "gold",
    },
  ];
};

export interface HomePlaygroundSectionProps {
  gameplayModes: GameplayModeCard[];
  creationHighlights: CreationHighlight[];
  selectedAncestorName?: string;
  selectedMoodValue?: number;
  selectedTraitTags?: string[];
  onRequestMode?: (modeId: string) => void | Promise<void>;
  onPreviewCreation?: (creationId: string) => void | Promise<void>;
}

export function HomePlaygroundSection({
  gameplayModes,
  creationHighlights,
  selectedAncestorName,
  selectedMoodValue,
  selectedTraitTags = [],
  onRequestMode,
  onPreviewCreation,
}: HomePlaygroundSectionProps) {
  const selectedAncestor = getAncestorByName(selectedAncestorName);
  const baseMoodSnapshot = useMemo(
    () => buildBaseMoodSnapshot(selectedMoodValue),
    [selectedMoodValue],
  );
  const baseTraitVector = useMemo(
    () => buildBaseTraitVector(selectedTraitTags, selectedMoodValue),
    [selectedMoodValue, selectedTraitTags],
  );
  const conversationRecords = useSyncExternalStore(
    subscribeConversationMemory,
    getConversationMemory,
    () => [],
  );
  const buildAncestorDerivedState = useCallback((ancestorId: string) => {
    const records = conversationRecords.filter((record) => record.ancestorId === ancestorId);
    const moodSnapshot = deriveMoodSnapshotFromHistory(baseMoodSnapshot, records);
    const traitVector = deriveTraitVectorFromHistory(baseTraitVector, records);
    const dominantTraitLabels = [...traitVector]
      .sort((left, right) => right.value / right.max - left.value / left.max)
      .slice(0, 3)
      .map((trait) => trait.label);

    return {
      records,
      moodSnapshot,
      traitVector,
      dominantTraitLabels,
    };
  }, [baseMoodSnapshot, baseTraitVector, conversationRecords]);
  const selectedRuntime = useMemo(
    () => buildAncestorDerivedState(selectedAncestor.id),
    [buildAncestorDerivedState, selectedAncestor.id],
  );
  const selectedRecords = selectedRuntime.records;
  const derivedMoodSnapshot = selectedRuntime.moodSnapshot;
  const dominantTraits = selectedRuntime.dominantTraitLabels;
  const [activeWorkshopMode, setActiveWorkshopMode] = useState<PlayableModeId>("cross-time-quarrel");
  const [activityNote, setActivityNote] = useState(
    "四个玩法现已直接接入 AI，可在当前区块内生成结果。",
  );
  const [playResult, setPlayResult] = useState<PlayResult | null>(null);
  const [reviewResult, setReviewResult] = useState<ReviewResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isReviewGenerating, setIsReviewGenerating] = useState(false);
  const [quarrelDraft, setQuarrelDraft] = useState({
    challengerId: selectedAncestor.id,
    opponentId: supportedAncestors[1]?.id ?? supportedAncestors[0].id,
    mediatorId: "",
    conflictTopic: "到底谁该为今日风波先认错",
    rulingBias: "关系偏袒优先",
  });
  const [truthDraft, setTruthDraft] = useState({
    speakerId: selectedAncestor.id,
    questionText: getDefaultTruthQuestion(selectedAncestor.id),
    honesty: 58,
    playMode: "真心话",
  });
  const [fusionDraft, setFusionDraft] = useState({
    primaryId: selectedAncestor.id,
    secondaryId: supportedAncestors[2]?.id ?? supportedAncestors[0].id,
    ratio: 70,
    theme: "把加班外卖写成值得传阅的深夜短诗",
    format: "诗" as CreationFormat,
  });
  const [modernDraft, setModernDraft] = useState({
    speakerId: selectedAncestor.id,
    topicId: modernTopicOptions[0].id,
    customTopic: "",
  });
  const [reviewDraft, setReviewDraft] = useState({
    reviewerId: getFallbackAncestorId(selectedAncestor.id),
    style: "毒舌" as ReviewStyle,
  });

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const fallbackAncestorId = getFallbackAncestorId(selectedAncestor.id);

    setQuarrelDraft((current) => ({
      ...current,
      challengerId: selectedAncestor.id,
      opponentId:
        current.opponentId === current.challengerId ? fallbackAncestorId : current.opponentId,
    }));
    setTruthDraft((current) => ({
      ...current,
      speakerId: selectedAncestor.id,
      questionText: getDefaultTruthQuestion(selectedAncestor.id),
    }));
    setFusionDraft((current) => ({
      ...current,
      primaryId: selectedAncestor.id,
      secondaryId:
        current.secondaryId === current.primaryId ? fallbackAncestorId : current.secondaryId,
    }));
    setModernDraft((current) => ({
      ...current,
      speakerId: selectedAncestor.id,
    }));
    setReviewDraft((current) => ({
      ...current,
      reviewerId:
        !current.reviewerId || current.reviewerId === selectedAncestor.id
          ? fallbackAncestorId
          : current.reviewerId,
    }));
  }, [selectedAncestor.id]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const requestAiResult = async (
    ancestorId: string,
    sceneType: AiReplyRequest["sceneType"],
    mode: AiReplyRequest["mode"],
    userMessage: string,
    contextNote: string,
  ) => {
    const runtime = buildAncestorDerivedState(ancestorId);
    const request: AiReplyRequest = {
      ancestorId,
      userMessage,
      mode,
      sceneType,
      moodIndex: runtime.moodSnapshot.value,
      traitVector: runtime.traitVector,
      contextNote,
    };
    const response = await fetch("/api/ai-reply", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error("AI 服务暂时不可用，请稍后重试。");
    }

    const payload = (await response.json()) as AiReplyResponse;
    appendConversationRecord(createConversationRecord(request, payload));
    return payload;
  };

  const toPlayResult = (
    response: AiReplyResponse,
    fallbackTitle: string,
    fallbackSummary: string,
    seedTags: string[],
    reviewContext?: PlayReviewContext,
  ): PlayResult => ({
    title: fallbackTitle,
    summary: `${fallbackSummary} ${response.output.subtext}`,
    body: response.output.reply,
    tags: [...new Set([...seedTags, ...response.output.styleTags])].slice(0, 6),
    hook: response.output.nextAction,
    debugLine: `${response.debug.provider} · ${response.debug.model} · ${response.debug.personaId}`,
    reviewContext,
  });

  const generateCrossTimeQuarrel = async () => {
    const challenger = getAncestorById(quarrelDraft.challengerId).name;
    const opponent = getAncestorById(quarrelDraft.opponentId).name;
    const mediator = quarrelDraft.mediatorId ? getAncestorById(quarrelDraft.mediatorId).name : "无人拉架";

    setIsGenerating(true);
    try {
      const aiResponse = await requestAiResult(
        selectedAncestor.id,
        "conflict-mediation",
        "prototype",
        `请直接输出最终争端现场文本，不要分析过程。甲方：${challenger}；乙方：${opponent}；第三人：${mediator}；主题：${quarrelDraft.conflictTopic}；裁决重心：${quarrelDraft.rulingBias}。`,
        `${selectedAncestor.name} 当前性格向量：${dominantTraits.join("、")}。`,
      );
      setPlayResult(
        toPlayResult(
          aiResponse,
          `${challenger} vs ${opponent}`,
          `已生成争端现场，裁决偏向「${quarrelDraft.rulingBias}」。`,
          [challenger, opponent, quarrelDraft.rulingBias],
        ),
      );
      setReviewResult(null);
      setActivityNote(`争端现场已生成，当前由 ${selectedAncestor.name} 的人格视角统筹输出。`);
    } catch (error) {
      setActivityNote(error instanceof Error ? error.message : "生成失败，请稍后重试。");
    } finally {
      setIsGenerating(false);
    }
  };

  const generateTruthOrDare = async () => {
    const speaker = getAncestorById(truthDraft.speakerId).name;
    const question = truthDraft.questionText.trim() || getDefaultTruthQuestion(truthDraft.speakerId);
    const promptHints = getTruthQuestionPrompts(truthDraft.speakerId).join(" / ");
    const truthTone =
      truthDraft.honesty >= 70 ? "直球" : truthDraft.honesty <= 35 ? "闪躲" : "留白";

    setIsGenerating(true);
    try {
      const aiResponse = await requestAiResult(
        selectedAncestor.id,
        "daily-chat",
        truthDraft.playMode === "真心话" ? "prototype" : "ooc",
        `请输出${truthDraft.playMode}的最终内容，不要解释过程。出场人物：${speaker}；玩家自由提问：${question}；坦率度：${truthDraft.honesty}%（${truthTone}）。`,
        `${selectedAncestor.name} 当前性格向量：${dominantTraits.join("、")}。同一玩法下请贴合${speaker}的生平、口吻与心理盲点；可参考但不要照抄这些提示：${promptHints}。`,
      );
      setPlayResult(
        toPlayResult(
          aiResponse,
          `${speaker}的${truthDraft.playMode}回答`,
          `已生成 ${truthDraft.playMode} 结果。`,
          [speaker, truthDraft.playMode, truthTone],
        ),
      );
      setReviewResult(null);
      setActivityNote(`${truthDraft.playMode}结果已生成，并写入本地互动记忆。`);
    } catch (error) {
      setActivityNote(error instanceof Error ? error.message : "生成失败，请稍后重试。");
    } finally {
      setIsGenerating(false);
    }
  };

  const generateFusionCreation = async () => {
    const primary = getAncestorById(fusionDraft.primaryId).name;
    const secondary = getAncestorById(fusionDraft.secondaryId).name;

    setIsGenerating(true);
    try {
      const aiResponse = await requestAiResult(
        selectedAncestor.id,
        "creative-feedback",
        "ooc",
        `请直接输出最终作品，不要分析过程。主题：${fusionDraft.theme}；体裁：${fusionDraft.format}；主风格：${primary}（${fusionDraft.ratio}%）；副风格：${secondary}（${100 - fusionDraft.ratio}%）。`,
        `${selectedAncestor.name} 当前性格向量：${dominantTraits.join("、")}。`,
      );
      setPlayResult(
        toPlayResult(
          aiResponse,
          `《${fusionDraft.theme.slice(0, 12)}${fusionDraft.theme.length > 12 ? "..." : ""}》`,
          `已生成 ${primary} × ${secondary} 的 ${fusionDraft.format} 混写结果。`,
          [primary, secondary, `${fusionDraft.format}创作`],
          {
            authors: `${primary} 与 ${secondary}`,
            originalWork: aiResponse.output.reply,
            sourceLabel: `${fusionDraft.format}混写结果`,
          },
        ),
      );
      setReviewResult(null);
      setActivityNote("跨时代创作已生成，可直接继续查看传播钩子。");
    } catch (error) {
      setActivityNote(error instanceof Error ? error.message : "生成失败，请稍后重试。");
    } finally {
      setIsGenerating(false);
    }
  };

  const generateModernReframe = async () => {
    const speaker = getAncestorById(modernDraft.speakerId).name;
    const topic =
      modernDraft.topicId === "custom"
        ? {
            label: modernDraft.customTopic || "未命名命题",
            friction: "等待补充更具体的现代场景与摩擦。",
          }
        : modernTopicOptions.find((item) => item.id === modernDraft.topicId) ?? modernTopicOptions[0];

    setIsGenerating(true);
    try {
      const aiResponse = await requestAiResult(
        selectedAncestor.id,
        "event-reaction",
        "ooc",
        `请直接输出最终重构文本，不要分析过程。出场古人：${speaker}；现代命题：${topic.label}；现实摩擦：${topic.friction}。`,
        `${selectedAncestor.name} 当前性格向量：${dominantTraits.join("、")}。`,
      );
      setPlayResult(
        toPlayResult(
          aiResponse,
          `${speaker}重构：${topic.label}`,
          `${speaker} 已接管这个现代命题的解释权。`,
          [speaker, topic.label, "现代命题"],
          {
            authors: speaker,
            originalWork: aiResponse.output.reply,
            sourceLabel: `${topic.label}重构稿`,
          },
        ),
      );
      setReviewResult(null);
      setActivityNote("现代命题重构已生成，反差输出可直接用于传播切片。");
    } catch (error) {
      setActivityNote(error instanceof Error ? error.message : "生成失败，请稍后重试。");
    } finally {
      setIsGenerating(false);
    }
  };

  const generateAiReview = async () => {
    if (!playResult?.reviewContext) {
      return;
    }

    const reviewer = getAncestorById(reviewDraft.reviewerId);
    const reviewerRuntime = buildAncestorDerivedState(reviewer.id);
    const reviewerVoice = getAncestorReviewVoice(reviewer.id);

    setIsReviewGenerating(true);
    try {
      const aiResponse = await requestAiResult(
        reviewer.id,
        "creative-feedback",
        "prototype",
        `请直接输出对这份${playResult.reviewContext.sourceLabel}的最终互评，不要分析过程。点评者：${reviewer.name}；点评风格：${reviewDraft.style}；作者：${playResult.reviewContext.authors}；原作内容：${playResult.reviewContext.originalWork}。同一点评风格下，不同点评者必须有明显不同的关注点、比喻、句式和价值判断。`,
        `点评风格要求：${reviewStyleNotes[reviewDraft.style]} 点评者专属声音：${reviewerVoice} 请让${reviewer.name}先按自己的历史处境和性格挑刺，再套入风格强度；不要写成通用评论模板。当前性格向量：${reviewerRuntime.dominantTraitLabels.join("、")}。`,
      );

      setReviewResult({
        reviewerName: reviewer.name,
        summary: `${reviewer.name} 已按「${reviewDraft.style}」风格给出 AI 互评。${aiResponse.output.subtext}`,
        body: aiResponse.output.reply,
        hook: aiResponse.output.nextAction,
        debugLine: `${aiResponse.debug.provider} · ${aiResponse.debug.model} · ${aiResponse.debug.personaId}`,
        tags: [...new Set([reviewDraft.style, reviewer.name, ...aiResponse.output.styleTags])].slice(0, 6),
      });
      setActivityNote(`${reviewer.name} 的 AI 互评已生成，同一风格下也会保留人物差异。`);
    } catch (error) {
      setActivityNote(error instanceof Error ? error.message : "互评生成失败，请稍后重试。");
    } finally {
      setIsReviewGenerating(false);
    }
  };

  const renderWorkshopForm = () => {
    const truthPromptSuggestions = getTruthQuestionPrompts(truthDraft.speakerId);

    switch (activeWorkshopMode) {
      case "cross-time-quarrel":
        return (
          <div className={styles.formStack}>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>甲方</span>
              <select
                className={styles.select}
                value={quarrelDraft.challengerId}
                onChange={(event) => {
                  setQuarrelDraft((current) => ({
                    ...current,
                    challengerId: event.target.value,
                  }));
                }}
              >
                {supportedAncestors.map((ancestor) => (
                  <option key={ancestor.id} value={ancestor.id}>
                    {ancestor.name}
                  </option>
                ))}
              </select>
            </label>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>乙方</span>
              <select
                className={styles.select}
                value={quarrelDraft.opponentId}
                onChange={(event) => {
                  setQuarrelDraft((current) => ({
                    ...current,
                    opponentId: event.target.value,
                  }));
                }}
              >
                {supportedAncestors.map((ancestor) => (
                  <option key={ancestor.id} value={ancestor.id}>
                    {ancestor.name}
                  </option>
                ))}
              </select>
            </label>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>第三人拉架</span>
              <select
                className={styles.select}
                value={quarrelDraft.mediatorId}
                onChange={(event) => {
                  setQuarrelDraft((current) => ({
                    ...current,
                    mediatorId: event.target.value,
                  }));
                }}
              >
                <option value="">暂不召唤</option>
                {supportedAncestors.map((ancestor) => (
                  <option key={ancestor.id} value={ancestor.id}>
                    {ancestor.name}
                  </option>
                ))}
              </select>
            </label>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>裁决重心</span>
              <select
                className={styles.select}
                value={quarrelDraft.rulingBias}
                onChange={(event) => {
                  setQuarrelDraft((current) => ({
                    ...current,
                    rulingBias: event.target.value,
                  }));
                }}
              >
                <option value="关系偏袒优先">关系偏袒优先</option>
                <option value="性格向量优先">性格向量优先</option>
                <option value="围观起哄优先">围观起哄优先</option>
              </select>
            </label>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>争端主题</span>
              <textarea
                className={styles.textarea}
                rows={4}
                value={quarrelDraft.conflictTopic}
                onChange={(event) => {
                  setQuarrelDraft((current) => ({
                    ...current,
                    conflictTopic: event.target.value,
                  }));
                }}
              />
            </label>
            <p className={styles.formHint}>
              当前由 {selectedAncestor.name} 的人格基线生成结果，重点 traits：{dominantTraits.join("、")}。
            </p>
            <div className={styles.actionRow}>
              <InkButton onClick={generateCrossTimeQuarrel} disabled={isGenerating}>
                {isGenerating ? "生成中..." : "生成争端现场"}
              </InkButton>
            </div>
          </div>
        );
      case "truth-or-dare":
        return (
          <div className={styles.formStack}>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>出场人物</span>
              <select
                className={styles.select}
                value={truthDraft.speakerId}
                onChange={(event) => {
                  const speakerId = event.target.value;
                  setTruthDraft((current) => ({
                    ...current,
                    speakerId,
                    questionText: getDefaultTruthQuestion(speakerId),
                  }));
                }}
              >
                {supportedAncestors.map((ancestor) => (
                  <option key={ancestor.id} value={ancestor.id}>
                    {ancestor.name}
                  </option>
                ))}
              </select>
            </label>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>玩法走向</span>
              <select
                className={styles.select}
                value={truthDraft.playMode}
                onChange={(event) => {
                  setTruthDraft((current) => ({
                    ...current,
                    playMode: event.target.value,
                  }));
                }}
              >
                <option value="真心话">真心话</option>
                <option value="大冒险">大冒险</option>
              </select>
            </label>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>自由提问</span>
              <textarea
                className={styles.textarea}
                rows={4}
                value={truthDraft.questionText}
                onChange={(event) => {
                  setTruthDraft((current) => ({
                    ...current,
                    questionText: event.target.value,
                  }));
                }}
              />
            </label>
            <div className={styles.field}>
              <span className={styles.fieldLabel}>和当前祖宗相关的问题提示</span>
              <div className={styles.promptSuggestionGrid}>
                {truthPromptSuggestions.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    className={styles.promptSuggestionButton}
                    onClick={() => {
                      setTruthDraft((current) => ({
                        ...current,
                        questionText: prompt,
                      }));
                    }}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>坦率度 {truthDraft.honesty}%</span>
              <input
                className={styles.range}
                type="range"
                min={0}
                max={100}
                value={truthDraft.honesty}
                onChange={(event) => {
                  setTruthDraft((current) => ({
                    ...current,
                    honesty: Number(event.target.value),
                  }));
                }}
              />
            </label>
            <div className={styles.actionRow}>
              <InkButton onClick={generateTruthOrDare} disabled={isGenerating}>
                {isGenerating ? "生成中..." : "生成回答界面"}
              </InkButton>
            </div>
          </div>
        );
      case "fusion-creation":
        return (
          <div className={styles.formStack}>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>主风格人物</span>
              <select
                className={styles.select}
                value={fusionDraft.primaryId}
                onChange={(event) => {
                  setFusionDraft((current) => ({
                    ...current,
                    primaryId: event.target.value,
                  }));
                }}
              >
                {supportedAncestors.map((ancestor) => (
                  <option key={ancestor.id} value={ancestor.id}>
                    {ancestor.name}
                  </option>
                ))}
              </select>
            </label>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>副风格人物</span>
              <select
                className={styles.select}
                value={fusionDraft.secondaryId}
                onChange={(event) => {
                  setFusionDraft((current) => ({
                    ...current,
                    secondaryId: event.target.value,
                  }));
                }}
              >
                {supportedAncestors.map((ancestor) => (
                  <option key={ancestor.id} value={ancestor.id}>
                    {ancestor.name}
                  </option>
                ))}
              </select>
            </label>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>
                风格占比 {fusionDraft.ratio}% / {100 - fusionDraft.ratio}%
              </span>
              <input
                className={styles.range}
                type="range"
                min={0}
                max={100}
                value={fusionDraft.ratio}
                onChange={(event) => {
                  setFusionDraft((current) => ({
                    ...current,
                    ratio: Number(event.target.value),
                  }));
                }}
              />
            </label>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>作品形式</span>
              <select
                className={styles.select}
                value={fusionDraft.format}
                onChange={(event) => {
                  setFusionDraft((current) => ({
                    ...current,
                    format: event.target.value as CreationFormat,
                  }));
                }}
              >
                <option value="诗">诗</option>
                <option value="词">词</option>
                <option value="对联">对联</option>
                <option value="短文">短文</option>
              </select>
            </label>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>创作主题</span>
              <textarea
                className={styles.textarea}
                rows={4}
                value={fusionDraft.theme}
                onChange={(event) => {
                  setFusionDraft((current) => ({
                    ...current,
                    theme: event.target.value,
                  }));
                }}
              />
            </label>
            <div className={styles.actionRow}>
              <InkButton onClick={generateFusionCreation} disabled={isGenerating}>
                {isGenerating ? "生成中..." : "生成融合创作"}
              </InkButton>
            </div>
          </div>
        );
      case "modern-reframe":
        return (
          <div className={styles.formStack}>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>出场古人</span>
              <select
                className={styles.select}
                value={modernDraft.speakerId}
                onChange={(event) => {
                  setModernDraft((current) => ({
                    ...current,
                    speakerId: event.target.value,
                  }));
                }}
              >
                {supportedAncestors.map((ancestor) => (
                  <option key={ancestor.id} value={ancestor.id}>
                    {ancestor.name}
                  </option>
                ))}
              </select>
            </label>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>现代命题</span>
              <select
                className={styles.select}
                value={modernDraft.topicId}
                onChange={(event) => {
                  setModernDraft((current) => ({
                    ...current,
                    topicId: event.target.value,
                  }));
                }}
              >
                {modernTopicOptions.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
                <option value="custom">自定义命题</option>
              </select>
            </label>
            {modernDraft.topicId === "custom" ? (
              <label className={styles.field}>
                <span className={styles.fieldLabel}>自定义内容</span>
                <input
                  className={styles.input}
                  value={modernDraft.customTopic}
                  onChange={(event) => {
                    setModernDraft((current) => ({
                      ...current,
                      customTopic: event.target.value,
                    }));
                  }}
                />
              </label>
            ) : null}
            <div className={styles.actionRow}>
              <InkButton onClick={generateModernReframe} disabled={isGenerating}>
                {isGenerating ? "生成中..." : "生成现代重构"}
              </InkButton>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <section className={`${styles.root} section-shell`}>
      <SectionHeading
        eyebrow="玩法总览"
        title="玩法入口"
        description="先从这里选择玩法，再在下方玩法工坊里真正操作。作品互评会并入创作类玩法的结果区。"
      />

      <div className={styles.stageNote}>
        <p className={styles.stageCopy}>
          点击任一玩法后，下方会切换到对应的可玩工坊；这里保留入口差异和传播样张预览。
        </p>
        <div className={styles.stageSignals} aria-label="玩法区状态总览">
          <TagPill tone="seal">{gameplayModes.length} 个入口已挂载</TagPill>
          <TagPill tone="seal">下方工坊已接入 AI</TagPill>
          <TagPill tone="muted">互评并入创作结果</TagPill>
          <TagPill tone="muted">{creationHighlights.length} 条传播样张</TagPill>
          <TagPill tone="muted">{selectedRecords.length} 条本地互动记忆</TagPill>
          {selectedAncestorName ? (
            <TagPill tone="muted">{selectedAncestorName} 的玩法视角</TagPill>
          ) : null}
          {typeof selectedMoodValue === "number" ? (
            <TagPill tone="muted">情绪指数 {selectedMoodValue}</TagPill>
          ) : null}
          {selectedTraitTags.slice(0, 2).map((tag) => (
            <TagPill key={tag} tone="muted">
              {tag}
            </TagPill>
          ))}
        </div>
      </div>

      <div className={styles.modeGrid}>
        {gameplayModes.map((mode) => {
          const presentation = getModePresentation(mode.id);

          return (
            <article
              key={mode.id}
              className={`${styles.modeCard} paper-card`}
              data-accent={mode.accent}
            >
              <div className={styles.modeHeader}>
                <div className={styles.modeTitleGroup}>
                  <span className={styles.modeGlyph} aria-hidden="true">
                    {presentation?.glyph ?? "卷"}
                  </span>
                  <div className={styles.modeTitleStack}>
                    <p className={styles.modeEyebrow}>
                      {presentation?.eyebrow ?? "卷轴入口"}
                    </p>
                    <h3 className={styles.modeTitle}>{mode.title}</h3>
                  </div>
                </div>
                <div className={styles.modeState}>
                  <TagPill tone={playableModeIds.includes(mode.id as PlayableModeId) ? "seal" : "muted"}>
                    {playableModeIds.includes(mode.id as PlayableModeId) ? "AI 已接入" : "敬请期待"}
                  </TagPill>
                  <span className={styles.modeSignal}>
                    {presentation?.signal ?? "意图待发"}
                  </span>
                </div>
              </div>

              <div className={styles.modeBody}>
                <p className={styles.modeTagline}>{mode.tagline}</p>
                <p className="section-body">{mode.description}</p>
              </div>

              <div className={styles.modeFooter}>
                <p className={styles.modePrompt}>
                  {presentation?.footer ?? "当前已开放玩法工坊，可继续生成实际结果。"}
                </p>
                <p className="muted-note">{mode.interactionHint}</p>
              </div>

              <InkButton
                tone="primary"
                className={styles.modeButton}
                onClick={() => {
                  if (playableModeIds.includes(mode.id as PlayableModeId)) {
                    setActiveWorkshopMode(mode.id as PlayableModeId);
                    setPlayResult(null);
                    setReviewResult(null);
                    setActivityNote(`已切换到「${mode.title}」AI 工坊。`);
                  }
                  void onRequestMode?.(mode.id);
                }}
              >
                {mode.id === "fusion-creation"
                  ? "打开创作台"
                  : mode.id === "modern-reframe"
                    ? "打开命题台"
                    : mode.ctaLabel}
              </InkButton>
            </article>
          );
        })}
      </div>

      <div className={styles.studioSection}>
        <div className={styles.studioHeader}>
          <div>
            <p className="eyebrow">玩法工坊</p>
            <h3 className={styles.studioTitle}>四个玩法都可直接生成</h3>
            <p className={styles.creationLead}>
              当前以 {selectedAncestor.name} 为人格主视角，继承情绪指数 {derivedMoodSnapshot.value}，
              并持续吸收本地互动记忆。
            </p>
          </div>
          <TagPill tone="seal">{activityNote}</TagPill>
        </div>

        <div className={styles.studioLaunchBar}>
          {gameplayModes.map((mode) => (
            <button
              key={mode.id}
              type="button"
              className={styles.studioTab}
              data-active={activeWorkshopMode === mode.id}
              onClick={() => {
                if (!playableModeIds.includes(mode.id as PlayableModeId)) {
                  return;
                }
                setActiveWorkshopMode(mode.id as PlayableModeId);
                setPlayResult(null);
                setReviewResult(null);
                setActivityNote(`已切换到「${mode.title}」AI 工坊。`);
              }}
            >
              {mode.title}
            </button>
          ))}
        </div>

        <div className={styles.studioGrid}>
          <div className={`${styles.studioPanel} paper-card`}>{renderWorkshopForm()}</div>

          <div className={`${styles.resultPanel} paper-card paper-card--muted`}>
            {playResult ? (
              <div className={styles.resultStack}>
                <div>
                  <p className="eyebrow">结果预览</p>
                  <h3 className={styles.resultTitle}>{playResult.title}</h3>
                </div>
                <p className="section-body">{playResult.summary}</p>
                <div className={styles.resultExcerpt}>
                  <p className={styles.resultLabel}>内容结果</p>
                  <p className={styles.resultText}>{playResult.body}</p>
                </div>
                <div className={styles.tagRow}>
                  {playResult.tags.map((tag) => (
                    <TagPill key={tag}>{tag}</TagPill>
                  ))}
                </div>
                <p className={styles.formHint}>{playResult.hook}</p>
                <p className="muted-note">{playResult.debugLine}</p>

                {playResult.reviewContext ? (
                  <div className={styles.reviewContinuation}>
                    <div className={styles.reviewHeader}>
                      <div>
                        <p className="eyebrow">作品互评</p>
                        <h4 className={styles.reviewTitle}>让另一位祖宗继续下评语</h4>
                      </div>
                      <TagPill tone="muted">{playResult.reviewContext.sourceLabel}</TagPill>
                    </div>

                    <div className={styles.reviewControls}>
                      <label className={styles.field}>
                        <span className={styles.fieldLabel}>点评者</span>
                        <select
                          className={styles.select}
                          value={reviewDraft.reviewerId}
                          onChange={(event) => {
                            setReviewDraft((current) => ({
                              ...current,
                              reviewerId: event.target.value,
                            }));
                          }}
                        >
                          {supportedAncestors.map((ancestor) => (
                            <option key={ancestor.id} value={ancestor.id}>
                              {ancestor.name}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className={styles.field}>
                        <span className={styles.fieldLabel}>互评风格</span>
                        <select
                          className={styles.select}
                          value={reviewDraft.style}
                          onChange={(event) => {
                            setReviewDraft((current) => ({
                              ...current,
                              style: event.target.value as ReviewStyle,
                            }));
                          }}
                        >
                          {Object.keys(reviewStyleNotes).map((style) => (
                            <option key={style} value={style}>
                              {style}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>

                    <p className={styles.formHint}>{reviewStyleNotes[reviewDraft.style]}</p>
                    <div className={styles.actionRow}>
                      <InkButton onClick={generateAiReview} disabled={isReviewGenerating}>
                        {isReviewGenerating ? "互评生成中..." : "生成 AI 互评"}
                      </InkButton>
                    </div>

                    {reviewResult ? (
                      <div className={styles.reviewResult}>
                        <p className="section-body">{reviewResult.summary}</p>
                        <div className={styles.resultExcerpt}>
                          <p className={styles.resultLabel}>{reviewResult.reviewerName} 的互评</p>
                          <p className={styles.resultText}>{reviewResult.body}</p>
                        </div>
                        <div className={styles.tagRow}>
                          {reviewResult.tags.map((tag) => (
                            <TagPill key={tag}>{tag}</TagPill>
                          ))}
                        </div>
                        <p className={styles.reviewConclusion}>{reviewResult.hook}</p>
                        <p className="muted-note">{reviewResult.debugLine}</p>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ) : (
              <div className={styles.resultStack}>
                <div>
                  <p className="eyebrow">等待出招</p>
                  <h3 className={styles.resultTitle}>
                    {getModePresentation(activeWorkshopMode)?.eyebrow ?? "玩法工坊"}
                  </h3>
                </div>
                <p className="section-body">
                  填完左侧参数后即可直接请求 AI。当前主导 traits：{dominantTraits.join("、")}。
                </p>
                <div className={styles.resultExcerpt}>
                  <p className={styles.resultLabel}>继承状态</p>
                  <p className={styles.resultText}>
                    {selectedAncestor.name} 当前 MoodIndex 为 {derivedMoodSnapshot.value}，最近已记录
                    {" "}
                    {selectedRecords.length}
                    {" "}
                    次玩法互动。
                  </p>
                </div>
                <div className={styles.tagRow}>
                  {dominantTraits.map((trait) => (
                    <TagPill key={trait}>{trait}</TagPill>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className={styles.creationSection}>
        <div className={styles.creationHeader}>
          <div>
            <p className="eyebrow">Creative Output</p>
            <h3 className={styles.creationTitle}>创作预览</h3>
            <p className={styles.creationLead}>
              不做普通资讯流，而是把作品、互评和评论区热度压成可传播样张。
            </p>
          </div>
          <TagPill tone="muted">适合传播切片</TagPill>
        </div>

        <div className={styles.creationList}>
          {creationHighlights.map((highlight, index) => (
            <article
              key={highlight.id}
              className={`${styles.creationCard} paper-card paper-card--muted`}
            >
              <div className={styles.creationMeta}>
                <div>
                  <p className={styles.creationSerial}>
                    {creationRankLabels[index] ?? "热传增幅"}
                  </p>
                  <h4 className={styles.highlightTitle}>{highlight.title}</h4>
                  <p className={styles.highlightFormat}>{highlight.format}</p>
                </div>
                <TagPill tone="seal">热度 {highlight.heat}</TagPill>
              </div>

              <p className={styles.creationHook}>{highlight.hook}</p>
              <p className="section-body">{highlight.summary}</p>
              <div className={styles.tagRow}>
                {highlight.ancestors.map((ancestor) => (
                  <TagPill key={ancestor}>{ancestor}</TagPill>
                ))}
              </div>

              <InkButton
                tone="ghost"
                className={styles.creationButton}
                onClick={() => {
                  void onPreviewCreation?.(highlight.id);
                }}
              >
                查看传播脚本
              </InkButton>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
