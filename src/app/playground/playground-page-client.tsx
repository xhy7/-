"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";

import playgroundStyles from "@/features/home-playground/home-playground-section.module.css";
import {
  appendConversationRecord,
  buildDerivedNurtureSummary,
  createConversationRecord,
  getConversationMemory,
  subscribeConversationMemory,
} from "@/shared/ai/interaction-memory";
import type {
  AiReplyRequest,
  AiReplyResponse,
  AiSceneType,
  HomePageData,
} from "@/shared/contracts/home";
import { InkButton, TagPill } from "@/shared/ui/primitives";

import styles from "../page-shell.module.css";

interface PlaygroundPageClientProps {
  data: HomePageData;
  initialAncestorId?: string;
}

type PlayableModeId =
  | "cross-time-quarrel"
  | "truth-or-dare"
  | "fusion-creation"
  | "modern-reframe";

type CreationFormat = "诗" | "词" | "对联" | "短文";
type ReviewStyle = "毒舌" | "委婉挖苦" | "降维打击" | "难得认可";

interface PlayResult {
  title: string;
  summary: string;
  body: string;
  tags: string[];
  hook: string;
  reviewContext?: {
    authors: string;
    originalWork: string;
    sourceLabel: string;
  };
}

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
    "如果大秦只能留下一项制度，你会留下哪一个？",
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

const modernTopicOptions = [
  {
    id: "delivery",
    label: "外卖备注文学",
    friction: "认真写备注却仍收到错误餐品",
  },
  {
    id: "office",
    label: "职场汇报表演",
    friction: "会开会的人很多，真扛事的人很少",
  },
  {
    id: "shopping",
    label: "双十一冲动下单",
    friction: "抢券时像出征，收快递时像清点战损",
  },
  {
    id: "social",
    label: "朋友圈精修人生",
    friction: "看似处处体面，实则全靠滤镜续命",
  },
];

const reviewStyleNotes: Record<ReviewStyle, string> = {
  毒舌: "优先放大作品里的逞强与装饰感，批评会更狠。",
  委婉挖苦: "字面留情，弦外音更尖刻。",
  降维打击: "直接从气骨、格局和标准上否定。",
  难得认可: "仍有锋芒，但会给出少量真肯定。",
};

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
  ancestorReviewVoices[ancestorId] ??
  "点评必须保留点评者本人经历、气质和说话习惯，避免只套用风格标签。";

export function PlaygroundPageClient({
  data,
  initialAncestorId,
}: PlaygroundPageClientProps) {
  const [activityNote, setActivityNote] = useState(
    "这里集中承载真正可玩的玩法工坊，你可以直接切换祖宗、切换模式并生成结果。",
  );
  const [activeWorkshopMode, setActiveWorkshopMode] =
    useState<PlayableModeId>("cross-time-quarrel");
  const [playResult, setPlayResult] = useState<PlayResult | null>(null);
  const [reviewOutput, setReviewOutput] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isReviewGenerating, setIsReviewGenerating] = useState(false);
  const [selectedAncestorId, setSelectedAncestorId] = useState(
    initialAncestorId ?? data.featuredAncestor.id,
  );
  const conversationRecords = useSyncExternalStore(
    subscribeConversationMemory,
    getConversationMemory,
    () => [],
  );
  const ancestors = [data.featuredAncestor, ...data.roster];
  const selectedAncestor =
    ancestors.find((ancestor) => ancestor.id === selectedAncestorId) ??
    data.featuredAncestor;
  const selectedRecords = conversationRecords.filter(
    (record) => record.ancestorId === selectedAncestorId,
  );
  const selectedSummary = buildDerivedNurtureSummary(
    selectedAncestor,
    data.nurtureSummary,
    selectedRecords,
  );
  const dominantTraits = [...selectedSummary.traitVector]
    .sort((left, right) => right.value / right.max - left.value / left.max)
    .slice(0, 3)
    .map((trait) => trait.label);
  const activeMode =
    data.gameplayModes.find((mode) => mode.id === activeWorkshopMode) ??
    data.gameplayModes[0];
  const [quarrelDraft, setQuarrelDraft] = useState({
    challengerId: data.featuredAncestor.id,
    opponentId: data.roster[0]?.id ?? data.featuredAncestor.id,
    mediatorId: "",
    conflictTopic: "到底谁该为今日风波先认错",
    rulingBias: "关系偏袒优先",
  });
  const [truthDraft, setTruthDraft] = useState({
    speakerId: data.featuredAncestor.id,
    questionText: getDefaultTruthQuestion(data.featuredAncestor.id),
    honesty: 58,
    playMode: "真心话",
  });
  const [fusionDraft, setFusionDraft] = useState({
    primaryId: data.featuredAncestor.id,
    secondaryId: data.roster[0]?.id ?? data.featuredAncestor.id,
    ratio: 70,
    theme: "把加班外卖写成值得传阅的深夜短诗",
    format: "诗" as CreationFormat,
  });
  const [modernDraft, setModernDraft] = useState({
    speakerId: data.featuredAncestor.id,
    topicId: modernTopicOptions[1].id,
    customTopic: "",
  });
  const [reviewDraft, setReviewDraft] = useState({
    reviewerId: data.roster[0]?.id ?? data.featuredAncestor.id,
    style: "毒舌" as ReviewStyle,
  });

  const getAncestorById = (id: string) =>
    ancestors.find((ancestor) => ancestor.id === id) ?? data.featuredAncestor;
  const getAncestorName = (id: string) =>
    getAncestorById(id).name;
  const getRuntimeSummary = (ancestorId: string) => {
    const ancestor = getAncestorById(ancestorId);
    const records = conversationRecords.filter(
      (record) => record.ancestorId === ancestorId,
    );

    return buildDerivedNurtureSummary(ancestor, data.nurtureSummary, records);
  };

  const requestAiResult = async (
    sceneType: AiSceneType,
    mode: AiReplyRequest["mode"],
    userMessage: string,
    contextNote: string,
    ancestorId = selectedAncestor.id,
  ) => {
    const runtimeSummary = getRuntimeSummary(ancestorId);
    const request: AiReplyRequest = {
      ancestorId,
      userMessage,
      mode,
      sceneType,
      moodIndex: runtimeSummary.moodSnapshot.value,
      traitVector: runtimeSummary.traitVector,
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
    reviewContext?: PlayResult["reviewContext"],
  ): PlayResult => {
    const tags = [...new Set([...seedTags, ...response.output.styleTags])].slice(0, 6);
    return {
      title: fallbackTitle,
      summary: `${fallbackSummary} ${response.output.subtext}`,
      body: response.output.reply,
      tags,
      hook: response.output.nextAction,
      reviewContext,
    };
  };

  const generateCrossTimeQuarrel = async () => {
    const challenger = getAncestorName(quarrelDraft.challengerId);
    const opponent = getAncestorName(quarrelDraft.opponentId);
    const mediator = quarrelDraft.mediatorId
      ? getAncestorName(quarrelDraft.mediatorId)
      : "无人拉架";

    setIsGenerating(true);
    try {
      const aiResponse = await requestAiResult(
        "conflict-mediation",
        "prototype",
        `请直接输出最终争端现场文本，不要分析过程。甲方：${challenger}；乙方：${opponent}；第三人：${mediator}；主题：${quarrelDraft.conflictTopic}；裁决重心：${quarrelDraft.rulingBias}。`,
        `${selectedAncestor.name} 当前性格向量：${dominantTraits.join("、")}。`,
      );
      setPlayResult(
        toPlayResult(
          aiResponse,
          `${challenger} vs ${opponent}`,
          `已生成最终争端现场，裁决偏向「${quarrelDraft.rulingBias}」。`,
          [challenger, opponent, quarrelDraft.rulingBias, ...dominantTraits.slice(0, 2)],
        ),
      );
      setActivityNote("争端现场已由 AI 生成并写入互动记忆。");
      setReviewOutput(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "生成失败，请稍后重试。";
      setActivityNote(message);
    } finally {
      setIsGenerating(false);
    }
  };

  const generateTruthOrDare = async () => {
    const speaker = getAncestorName(truthDraft.speakerId);
    const question = truthDraft.questionText.trim() || getDefaultTruthQuestion(truthDraft.speakerId);
    const promptHints = getTruthQuestionPrompts(truthDraft.speakerId).join(" / ");
    const truthTone =
      truthDraft.honesty >= 70 ? "直球" : truthDraft.honesty <= 35 ? "闪躲" : "留白";

    setIsGenerating(true);
    try {
      const aiResponse = await requestAiResult(
        "daily-chat",
        truthDraft.playMode === "真心话" ? "prototype" : "ooc",
        `请输出${truthDraft.playMode}的最终内容，不要解释过程。出场人物：${speaker}；玩家自由提问：${question}；坦率度：${truthDraft.honesty}%（${truthTone}）。`,
        `${selectedAncestor.name} 当前性格向量：${dominantTraits.join("、")}。同一玩法下请贴合${speaker}的生平、口吻与心理盲点；可参考但不要照抄这些提示：${promptHints}。`,
      );
      setPlayResult(
        toPlayResult(
          aiResponse,
          `${speaker}的${truthDraft.playMode}回答`,
          "【最终回答】",
          [speaker, truthDraft.playMode, truthTone, ...dominantTraits.slice(0, 1)],
        ),
      );
      setActivityNote(`${truthDraft.playMode}结果已由 AI 生成并写入互动记忆。`);
      setReviewOutput(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "生成失败，请稍后重试。";
      setActivityNote(message);
    } finally {
      setIsGenerating(false);
    }
  };

  const generateFusionCreation = async () => {
    const primary = getAncestorName(fusionDraft.primaryId);
    const secondary = getAncestorName(fusionDraft.secondaryId);

    setIsGenerating(true);
    try {
      const aiResponse = await requestAiResult(
        "creative-feedback",
        "ooc",
        `请直接输出最终作品，不要分析过程。主题：${fusionDraft.theme}；体裁：${fusionDraft.format}；主风格：${primary}（${fusionDraft.ratio}%）；副风格：${secondary}（${100 - fusionDraft.ratio}%）。`,
        `${selectedAncestor.name} 当前性格向量：${dominantTraits.join("、")}。`,
      );
      const title = `《${fusionDraft.theme.slice(0, 10)}${fusionDraft.theme.length > 10 ? "..." : ""}》`;
      setPlayResult(
        toPlayResult(
          aiResponse,
          title,
          `主笔：${primary} · 合笔：${secondary} · 体裁：${fusionDraft.format}`,
          [primary, secondary, `${fusionDraft.format}创作`, ...dominantTraits.slice(0, 1)],
          {
            authors: `${primary}与${secondary}`,
            originalWork: aiResponse.output.reply,
            sourceLabel: `${fusionDraft.format}混写结果`,
          },
        ),
      );
      setActivityNote("融合创作已由 AI 生成并写入互动记忆。");
      setReviewOutput(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "生成失败，请稍后重试。";
      setActivityNote(message);
    } finally {
      setIsGenerating(false);
    }
  };

  const generateModernReframe = async () => {
    const speaker = getAncestorName(modernDraft.speakerId);
    const topic =
      modernDraft.topicId === "custom"
        ? {
            label: modernDraft.customTopic || "未命名命题",
            friction: "等待你补完更具体的现代场景。",
          }
        : modernTopicOptions.find((item) => item.id === modernDraft.topicId) ??
          modernTopicOptions[0];

    setIsGenerating(true);
    try {
      const aiResponse = await requestAiResult(
        "event-reaction",
        "ooc",
        `请直接输出最终重构文本，不要分析过程。出场古人：${speaker}；现代命题：${topic.label}；现实摩擦：${topic.friction}。`,
        `${selectedAncestor.name} 当前性格向量：${dominantTraits.join("、")}。`,
      );
      setPlayResult(
        toPlayResult(
          aiResponse,
          `${speaker}重构：${topic.label}`,
          `${speaker}已接管现代命题的解释权，结果已生成。`,
          [speaker, topic.label, "现代命题"],
          {
            authors: speaker,
            originalWork: aiResponse.output.reply,
            sourceLabel: `${topic.label}重构稿`,
          },
        ),
      );
      setActivityNote("现代重构已由 AI 生成并写入互动记忆。");
      setReviewOutput(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "生成失败，请稍后重试。";
      setActivityNote(message);
    } finally {
      setIsGenerating(false);
    }
  };

  const generateReview = async () => {
    if (!playResult?.reviewContext) {
      return;
    }

    const reviewer = getAncestorById(reviewDraft.reviewerId);
    const reviewerRuntime = getRuntimeSummary(reviewer.id);
    const reviewerVoice = getAncestorReviewVoice(reviewer.id);

    setIsReviewGenerating(true);
    try {
      const aiResponse = await requestAiResult(
        "creative-feedback",
        "prototype",
        `请直接输出对这份${playResult.reviewContext.sourceLabel}的最终互评，不要分析过程。点评者：${reviewer.name}；点评风格：${reviewDraft.style}；作者：${playResult.reviewContext.authors}；原作内容：${playResult.reviewContext.originalWork}。同一点评风格下，不同点评者必须有明显不同的关注点、比喻、句式和价值判断。`,
        `点评风格要求：${reviewStyleNotes[reviewDraft.style]} 点评者专属声音：${reviewerVoice} 请让${reviewer.name}先按自己的历史处境和性格挑刺，再套入风格强度；不要写成通用评论模板。当前性格向量：${reviewerRuntime.traitVector
          .slice()
          .sort((left, right) => right.value / right.max - left.value / left.max)
          .slice(0, 3)
          .map((trait) => trait.label)
          .join("、")}。`,
        reviewer.id,
      );

      setReviewOutput(aiResponse.output.reply);
      setActivityNote(`${reviewer.name} 的互评已生成，同一风格下也会保留人物差异。`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "互评生成失败，请稍后重试。";
      setActivityNote(message);
    } finally {
      setIsReviewGenerating(false);
    }
  };

  const renderWorkshopForm = () => {
    const truthPromptSuggestions = getTruthQuestionPrompts(truthDraft.speakerId);

    switch (activeWorkshopMode) {
      case "cross-time-quarrel":
        return (
          <div className={playgroundStyles.formStack}>
            <label className={playgroundStyles.field}>
              <span className={playgroundStyles.fieldLabel}>甲方</span>
              <select
                className={playgroundStyles.select}
                value={quarrelDraft.challengerId}
                onChange={(event) => {
                  setQuarrelDraft((current) => ({
                    ...current,
                    challengerId: event.target.value,
                  }));
                }}
              >
                {ancestors.map((ancestor) => (
                  <option key={ancestor.id} value={ancestor.id}>
                    {ancestor.name}
                  </option>
                ))}
              </select>
            </label>
            <label className={playgroundStyles.field}>
              <span className={playgroundStyles.fieldLabel}>乙方</span>
              <select
                className={playgroundStyles.select}
                value={quarrelDraft.opponentId}
                onChange={(event) => {
                  setQuarrelDraft((current) => ({
                    ...current,
                    opponentId: event.target.value,
                  }));
                }}
              >
                {ancestors.map((ancestor) => (
                  <option key={ancestor.id} value={ancestor.id}>
                    {ancestor.name}
                  </option>
                ))}
              </select>
            </label>
            <label className={playgroundStyles.field}>
              <span className={playgroundStyles.fieldLabel}>第三人拉架</span>
              <select
                className={playgroundStyles.select}
                value={quarrelDraft.mediatorId}
                onChange={(event) => {
                  setQuarrelDraft((current) => ({
                    ...current,
                    mediatorId: event.target.value,
                  }));
                }}
              >
                <option value="">暂不召唤</option>
                {ancestors.map((ancestor) => (
                  <option key={ancestor.id} value={ancestor.id}>
                    {ancestor.name}
                  </option>
                ))}
              </select>
            </label>
            <label className={playgroundStyles.field}>
              <span className={playgroundStyles.fieldLabel}>裁决重心</span>
              <select
                className={playgroundStyles.select}
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
            <label className={playgroundStyles.field}>
              <span className={playgroundStyles.fieldLabel}>争端主题</span>
              <textarea
                className={playgroundStyles.textarea}
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
            <p className={playgroundStyles.formHint}>
              这场争端会继承 {selectedAncestor.name} 当前的 {dominantTraits.join("、")} 倾向。
            </p>
            <div className={playgroundStyles.actionRow}>
              <InkButton onClick={generateCrossTimeQuarrel} disabled={isGenerating}>
                {isGenerating ? "生成中..." : "生成争端现场"}
              </InkButton>
            </div>
          </div>
        );
      case "truth-or-dare":
        return (
          <div className={playgroundStyles.formStack}>
            <label className={playgroundStyles.field}>
              <span className={playgroundStyles.fieldLabel}>出场人物</span>
              <select
                className={playgroundStyles.select}
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
                {ancestors.map((ancestor) => (
                  <option key={ancestor.id} value={ancestor.id}>
                    {ancestor.name}
                  </option>
                ))}
              </select>
            </label>
            <label className={playgroundStyles.field}>
              <span className={playgroundStyles.fieldLabel}>玩法走向</span>
              <select
                className={playgroundStyles.select}
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
            <label className={playgroundStyles.field}>
              <span className={playgroundStyles.fieldLabel}>自由提问</span>
              <textarea
                className={playgroundStyles.textarea}
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
            <div className={playgroundStyles.field}>
              <span className={playgroundStyles.fieldLabel}>和当前祖宗相关的问题提示</span>
              <div className={playgroundStyles.promptSuggestionGrid}>
                {truthPromptSuggestions.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    className={playgroundStyles.promptSuggestionButton}
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
            <label className={playgroundStyles.field}>
              <span className={playgroundStyles.fieldLabel}>
                坦率度 {truthDraft.honesty}%
              </span>
              <input
                className={playgroundStyles.range}
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
            <div className={playgroundStyles.actionRow}>
              <InkButton onClick={generateTruthOrDare} disabled={isGenerating}>
                {isGenerating ? "生成中..." : "生成回答界面"}
              </InkButton>
            </div>
          </div>
        );
      case "fusion-creation":
        return (
          <div className={playgroundStyles.formStack}>
            <label className={playgroundStyles.field}>
              <span className={playgroundStyles.fieldLabel}>主风格人物</span>
              <select
                className={playgroundStyles.select}
                value={fusionDraft.primaryId}
                onChange={(event) => {
                  setFusionDraft((current) => ({
                    ...current,
                    primaryId: event.target.value,
                  }));
                }}
              >
                {ancestors.map((ancestor) => (
                  <option key={ancestor.id} value={ancestor.id}>
                    {ancestor.name}
                  </option>
                ))}
              </select>
            </label>
            <label className={playgroundStyles.field}>
              <span className={playgroundStyles.fieldLabel}>副风格人物</span>
              <select
                className={playgroundStyles.select}
                value={fusionDraft.secondaryId}
                onChange={(event) => {
                  setFusionDraft((current) => ({
                    ...current,
                    secondaryId: event.target.value,
                  }));
                }}
              >
                {ancestors.map((ancestor) => (
                  <option key={ancestor.id} value={ancestor.id}>
                    {ancestor.name}
                  </option>
                ))}
              </select>
            </label>
            <label className={playgroundStyles.field}>
              <span className={playgroundStyles.fieldLabel}>
                风格占比 {fusionDraft.ratio}% / {100 - fusionDraft.ratio}%
              </span>
              <input
                className={playgroundStyles.range}
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
            <label className={playgroundStyles.field}>
              <span className={playgroundStyles.fieldLabel}>作品形式</span>
              <select
                className={playgroundStyles.select}
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
            <label className={playgroundStyles.field}>
              <span className={playgroundStyles.fieldLabel}>创作主题</span>
              <textarea
                className={playgroundStyles.textarea}
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
            <div className={playgroundStyles.actionRow}>
              <InkButton onClick={generateFusionCreation} disabled={isGenerating}>
                {isGenerating ? "生成中..." : "生成融合创作"}
              </InkButton>
            </div>
          </div>
        );
      case "modern-reframe":
        return (
          <div className={playgroundStyles.formStack}>
            <label className={playgroundStyles.field}>
              <span className={playgroundStyles.fieldLabel}>出场古人</span>
              <select
                className={playgroundStyles.select}
                value={modernDraft.speakerId}
                onChange={(event) => {
                  setModernDraft((current) => ({
                    ...current,
                    speakerId: event.target.value,
                  }));
                }}
              >
                {ancestors.map((ancestor) => (
                  <option key={ancestor.id} value={ancestor.id}>
                    {ancestor.name}
                  </option>
                ))}
              </select>
            </label>
            <label className={playgroundStyles.field}>
              <span className={playgroundStyles.fieldLabel}>现代命题</span>
              <select
                className={playgroundStyles.select}
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
              <label className={playgroundStyles.field}>
                <span className={playgroundStyles.fieldLabel}>自定义内容</span>
                <input
                  className={playgroundStyles.input}
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
            <div className={playgroundStyles.actionRow}>
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
    <main className={`${styles.page} ${styles.pageLarge}`}>
      <header className={`${styles.header} section-shell`}>
        <div>
          <div className={styles.brandMeta}>
            <TagPill tone="seal">{data.seasonLabel}</TagPill>
            <TagPill tone="muted">{selectedAncestor.name}</TagPill>
          </div>
          <h1 className="display-title">玩法入口</h1>
          <p className={styles.subtitle}>
            在这里直接进入玩法工坊，让老祖宗当前的情绪和性格继续影响吵架、创作与现代命题重构。
          </p>
          <div className={styles.quickActions}>
            <Link href="/" className={styles.quickLink}>
              返回首页
            </Link>
            <Link href="/ancestors" className={styles.quickLink}>
              去古人台
            </Link>
            <Link href="/growth" className={styles.quickLink}>
              去养成页
            </Link>
          </div>
        </div>
        <div className={styles.asideBlock}>
          <p className="section-body">{activityNote}</p>
          <div className={styles.asideList}>
            <div className={styles.asideItem}>
              <span>模式数量</span>
              <strong>{data.gameplayModes.length}</strong>
            </div>
            <div className={styles.asideItem}>
              <span>创作预览</span>
              <strong>{data.creationHighlights.length}</strong>
            </div>
            <div className={styles.asideItem}>
              <span>当前祖宗</span>
              <strong>{selectedAncestor.name}</strong>
            </div>
          </div>
        </div>
      </header>

      <div className={styles.layout}>
        <div className={styles.mainColumn}>
          <section className="section-shell">
            <div className="section-heading">
              <p className="eyebrow">玩法继承视角</p>
              <h2 className="section-title">祖宗性格向量</h2>
              <p className="section-body">
                选择一位祖宗后，玩法预览和创作传播会继承他当前由对话历史派生出的性格向量。
              </p>
            </div>
            <div className={styles.selectorGrid}>
              {ancestors.map((ancestor) => {
                const turns = conversationRecords.filter(
                  (record) => record.ancestorId === ancestor.id,
                ).length;

                return (
                  <button
                    key={ancestor.id}
                    type="button"
                    className={styles.selectorButton}
                    data-active={ancestor.id === selectedAncestorId}
                    onClick={() => {
                      setSelectedAncestorId(ancestor.id);
                      setPlayResult(null);
                      setReviewOutput(null);
                      setActivityNote(`已切换到 ${ancestor.name} 的玩法工坊视角。`);
                    }}
                  >
                    <strong>{ancestor.name}</strong>
                    <span className={styles.selectorMeta}>{ancestor.currentMoodLabel}</span>
                    <span className={styles.selectorMeta}>历史回合 {turns}</span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className={`${playgroundStyles.studioSection} section-shell`}>
            <div className={playgroundStyles.studioHeader}>
              <p className="eyebrow">玩法工坊</p>
              <h2 className={playgroundStyles.studioTitle}>真正可玩的模式台</h2>
              <p className={playgroundStyles.creationLead}>
                先选玩法，再填写参数并生成结果。当前输出会继承 {selectedAncestor.name}
                的派生性格向量。
              </p>
            </div>

            <div className={playgroundStyles.studioLaunchBar}>
              {data.gameplayModes.map((mode) => (
                <button
                  key={mode.id}
                  type="button"
                  className={playgroundStyles.studioTab}
                  data-active={activeWorkshopMode === mode.id}
                  onClick={() => {
                    setActiveWorkshopMode(mode.id as PlayableModeId);
                    setPlayResult(null);
                    setReviewOutput(null);
                    setActivityNote(`已切换到可玩模式「${mode.title}」。`);
                  }}
                >
                  {mode.title}
                </button>
              ))}
            </div>

            <div className={playgroundStyles.studioGrid}>
              <div className={`${playgroundStyles.studioPanel} paper-card`}>
                {renderWorkshopForm()}
              </div>

              <div className={`${playgroundStyles.resultPanel} paper-card paper-card--muted`}>
                {playResult ? (
                  <div className={playgroundStyles.resultStack}>
                    <div>
                      <p className="eyebrow">结果预览</p>
                      <h3 className={playgroundStyles.resultTitle}>{playResult.title}</h3>
                    </div>
                    <p className="section-body">{playResult.summary}</p>
                    <div className={playgroundStyles.resultExcerpt}>
                      <p className={playgroundStyles.resultLabel}>内容结果</p>
                      <p className={playgroundStyles.resultText}>{playResult.body}</p>
                    </div>
                    <div className={styles.tagRow}>
                      {playResult.tags.map((tag) => (
                        <TagPill key={tag}>{tag}</TagPill>
                      ))}
                    </div>
                    <p className={styles.nextStep}>{playResult.hook}</p>

                    {playResult.reviewContext ? (
                      <div className={playgroundStyles.reviewContinuation}>
                        <div className={playgroundStyles.reviewHeader}>
                          <div>
                            <p className="eyebrow">作品互评</p>
                            <h4 className={playgroundStyles.reviewTitle}>继续锐评这份结果</h4>
                          </div>
                          <TagPill tone="muted">可继续推进</TagPill>
                        </div>
                        <div className={playgroundStyles.reviewControls}>
                          <label className={playgroundStyles.field}>
                            <span className={playgroundStyles.fieldLabel}>点评者</span>
                            <select
                              className={playgroundStyles.select}
                              value={reviewDraft.reviewerId}
                              onChange={(event) => {
                                setReviewDraft((current) => ({
                                  ...current,
                                  reviewerId: event.target.value,
                                }));
                              }}
                            >
                              {ancestors.map((ancestor) => (
                                <option key={ancestor.id} value={ancestor.id}>
                                  {ancestor.name}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label className={playgroundStyles.field}>
                            <span className={playgroundStyles.fieldLabel}>点评风格</span>
                            <select
                              className={playgroundStyles.select}
                              value={reviewDraft.style}
                              onChange={(event) => {
                                setReviewDraft((current) => ({
                                  ...current,
                                  style: event.target.value as ReviewStyle,
                                }));
                              }}
                            >
                              <option value="毒舌">毒舌</option>
                              <option value="委婉挖苦">委婉挖苦</option>
                              <option value="降维打击">降维打击</option>
                              <option value="难得认可">难得认可</option>
                            </select>
                          </label>
                        </div>
                        <p className="muted-note">{reviewStyleNotes[reviewDraft.style]}</p>
                        <div className={playgroundStyles.actionRow}>
                          <InkButton
                            tone="ghost"
                            onClick={generateReview}
                            disabled={isReviewGenerating}
                          >
                            {isReviewGenerating ? "互评生成中..." : "生成互评"}
                        
                          </InkButton>
                        </div>
                        {reviewOutput ? (
                          <div className={playgroundStyles.reviewResult}>
                            <p className={playgroundStyles.resultLabel}>互评结果</p>
                            <p className={playgroundStyles.resultText}>{reviewOutput}</p>
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <div className={playgroundStyles.resultStack}>
                    <p className="section-body">
                      先在左侧填写玩法参数，再点击生成按钮，这里就会出现真正的玩法结果。
                    </p>
                    <div className={styles.tagRow}>
                      {dominantTraits.map((trait) => (
                        <TagPill key={trait} tone="muted">
                          {trait}
                        </TagPill>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>

        <aside className={styles.rail}>
          <section className={`${styles.railCard} section-shell`}>
            <div>
              <p className="eyebrow">工坊侧记</p>
              <h2 className={styles.railTitle}>{activeMode?.title ?? "玩法工坊"}</h2>
            </div>
            <div className={styles.previewStack}>
              <p className="section-body">
                {activeMode
                  ? `${selectedAncestor.name} 当前会以 ${dominantTraits.join("、")} 的倾向进入「${activeMode.title}」。`
                  : "当前工坊会继承所选祖宗的派生性格向量。"}
              </p>
              {activeMode ? (
                <>
                  <p className="muted-note">{activeMode.description}</p>
                  <p className={styles.nextStep}>{activeMode.interactionHint}</p>
                </>
              ) : null}
              <div className={styles.tagRow}>
                <TagPill tone="seal">情绪指数 {selectedSummary.moodSnapshot.value}</TagPill>
                {dominantTraits.map((trait) => (
                  <TagPill key={trait} tone="muted">
                    {trait}
                  </TagPill>
                ))}
              </div>
              {playResult ? (
                <div className={styles.previewStack}>
                  <p className="eyebrow">本轮结果</p>
                  <p className="section-body">{playResult.title}</p>
                  <p className="muted-note">{playResult.hook}</p>
                </div>
              ) : (
                <p className="section-body">
                  直接在中间工坊选择模式并填写参数，不再经过单独的玩法入口。
                </p>
              )}
              <Link href={`/chat/${selectedAncestor.id}`} className={styles.quickLink}>
                去和 {selectedAncestor.name} 对话，继续改变玩法倾向
              </Link>
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}
