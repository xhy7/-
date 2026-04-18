"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";

import playgroundStyles from "@/features/home-playground/home-playground-section.module.css";
import {
  buildDerivedNurtureSummary,
  getConversationMemory,
  subscribeConversationMemory,
} from "@/shared/ai/interaction-memory";
import type { HomePageData } from "@/shared/contracts/home";
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
  };
}

const truthQuestionOptions = [
  {
    id: "hongmen-banquet",
    label: "鸿门宴到底谁先动了杀心？",
    reveal: "一旦坦率度偏高，回答会明显指向权力结构与犹疑时刻。",
  },
  {
    id: "wutai-poetry",
    label: "乌台诗案里最不该说出口的是哪一句？",
    reveal: "焦点不止是诗句，而是谁在等一句可被借题发挥的话。",
  },
  {
    id: "chenqiao",
    label: "陈桥兵变更像众望所归还是排演好的戏？",
    reveal: "当反骨值更高时，回答会明显偏向拆台视角。",
  },
];

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

const buildCrossEraText = (
  theme: string,
  format: CreationFormat,
  primaryName: string,
  secondaryName: string,
  dominantTraits: string[],
) => {
  const traitLine = dominantTraits.join("、");

  switch (format) {
    case "诗":
      return [
        "【作品】",
        `把“${theme}”写成一首带着${traitLine}气味的短诗。`,
        `${primaryName}先起势，${secondaryName}后收束，让日常狼狈也像一段能被传阅的旧事。`,
        "【创作注】",
        "适合继续扩写成社交平台短文本或旁白。",
      ].join("\n");
    case "词":
      return [
        "【作品】",
        `《今夜小令》\n将“${theme}”写成半阙不肯示弱的慢词。`,
        `${primaryName}负责情绪重心，${secondaryName}负责尾句余味。`,
        "【创作注】",
        `当前作品明显受 ${traitLine} 这几项特质影响。`,
      ].join("\n");
    case "对联":
      return [
        "【作品】",
        `上联：把${theme}写得先见${primaryName}气口，再见人间狼狈`,
        `下联：让收束里藏着${secondaryName}尾劲，也藏着${traitLine}`,
        "横批：跨代同题",
      ].join("\n");
    case "短文":
      return [
        "【作品】",
        `${theme}原本只是现代生活里一小块不体面的裂纹，被${primaryName}提亮情绪，再经${secondaryName}收束成一段能被反复转述的短文。`,
        `整段文本当前更偏向 ${traitLine} 的表达方式。`,
      ].join("\n");
  }
};

const buildReviewText = (
  reviewer: string,
  reviewStyle: ReviewStyle,
  authors: string,
  originalWork: string,
) => {
  const styleLine =
    reviewStyle === "毒舌"
      ? "热闹有了，狠劲还差一寸，漂亮得太急着讨人喜欢。"
      : reviewStyle === "委婉挖苦"
        ? "句子不算难看，只是太知道自己想被夸，反而少了真气。"
        : reviewStyle === "降维打击"
          ? "你们忙着拼贴风格，可真正能留名的句子还没站稳。"
          : "难得两股文风没有互相弄脏，至少还留住了一点真意思。";

  return [
    `【${reviewer}锐评】`,
    `${authors}这份作品先声够响，后劲却未必都落到了实处。${styleLine}`,
    `原作片段提示：${originalWork.slice(0, 52)}${originalWork.length > 52 ? "..." : ""}`,
  ].join("\n");
};

export function PlaygroundPageClient({
  data,
  initialAncestorId,
}: PlaygroundPageClientProps) {
  const [activityNote, setActivityNote] = useState(
    "这里集中承载真正可玩的玩法工坊，不再在中间重复展示入口卡片。",
  );
  const [activeWorkshopMode, setActiveWorkshopMode] =
    useState<PlayableModeId>("cross-time-quarrel");
  const [playResult, setPlayResult] = useState<PlayResult | null>(null);
  const [reviewOutput, setReviewOutput] = useState<string | null>(null);
  const [selectedAncestorId, setSelectedAncestorId] = useState(
    initialAncestorId ?? data.featuredAncestor.id,
  );
  const conversationRecords = useSyncExternalStore(
    subscribeConversationMemory,
    getConversationMemory,
    getConversationMemory,
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
    questionId: truthQuestionOptions[0].id,
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

  const getAncestorName = (id: string) =>
    ancestors.find((ancestor) => ancestor.id === id)?.name ?? "佚名祖宗";

  const generateCrossTimeQuarrel = () => {
    const challenger = getAncestorName(quarrelDraft.challengerId);
    const opponent = getAncestorName(quarrelDraft.opponentId);
    const mediator = quarrelDraft.mediatorId
      ? getAncestorName(quarrelDraft.mediatorId)
      : "无人拉架";

    setPlayResult({
      title: `${challenger} vs ${opponent}`,
      summary: `${selectedAncestor.name} 当前的 ${dominantTraits.join("、")} 倾向，正在放大这场争端的火药味。`,
      body: `${challenger}围绕“${quarrelDraft.conflictTopic}”先抢话权，${opponent}不肯退让，${mediator === "无人拉架" ? "现场失去缓冲，语气节节抬高。" : `${mediator}出场后明显站向一边，使局势进一步失衡。`} 当前裁决更偏向「${quarrelDraft.rulingBias}」，所以争端的戏剧点会落在偏袒、误判和情绪反扑上。`,
      tags: [challenger, opponent, quarrelDraft.rulingBias, ...dominantTraits.slice(0, 2)],
      hook: `如果继续推进，建议让 ${selectedAncestor.name} 作为场外评价者或偏袒者加入下一轮。`,
    });
    setReviewOutput(null);
  };

  const generateTruthOrDare = () => {
    const speaker = getAncestorName(truthDraft.speakerId);
    const question =
      truthQuestionOptions.find((item) => item.id === truthDraft.questionId) ??
      truthQuestionOptions[0];
    const truthTone =
      truthDraft.honesty >= 70 ? "偏揭露真相" : truthDraft.honesty <= 35 ? "偏掩饰回避" : "半真半假";

    setPlayResult({
      title: `${speaker}的${truthDraft.playMode}回答`,
      summary: `${selectedAncestor.name} 当前的性格偏移，让这轮回答更接近「${truthTone}」。`,
      body: `${speaker}面对「${question.label}」时，先判断提问者到底想听真相还是想看表演。${question.reveal} 在当前坦率度 ${truthDraft.honesty}% 和 ${dominantTraits.join("、")} 倾向下，答案会刻意留一截余地，让真话、狠话和自保同时存在。`,
      tags: [speaker, truthDraft.playMode, truthTone],
      hook: "继续调高坦率度或切换提问人物，可以得到完全不同的口供版本。",
    });
    setReviewOutput(null);
  };

  const generateFusionCreation = () => {
    const primary = getAncestorName(fusionDraft.primaryId);
    const secondary = getAncestorName(fusionDraft.secondaryId);
    const ratioB = 100 - fusionDraft.ratio;
    const body = buildCrossEraText(
      fusionDraft.theme,
      fusionDraft.format,
      primary,
      secondary,
      dominantTraits,
    );

    setPlayResult({
      title: `《${fusionDraft.theme.slice(0, 10)}${fusionDraft.theme.length > 10 ? "..." : ""}》`,
      summary: `${primary}${fusionDraft.ratio}% 领笔，${secondary}${ratioB}% 添调，整体口吻继承 ${selectedAncestor.name} 的当前性格偏向。`,
      body,
      tags: [primary, secondary, `${fusionDraft.format}创作`, ...dominantTraits.slice(0, 1)],
      hook: "生成后可以继续指定人物做互评，把作品推进成真正可传播的版本。",
      reviewContext: {
        authors: `${primary}与${secondary}`,
        originalWork: body,
      },
    });
    setReviewOutput(null);
  };

  const generateModernReframe = () => {
    const speaker = getAncestorName(modernDraft.speakerId);
    const topic =
      modernDraft.topicId === "custom"
        ? {
            label: modernDraft.customTopic || "未命名命题",
            friction: "等待你补完更具体的现代场景。",
          }
        : modernTopicOptions.find((item) => item.id === modernDraft.topicId) ??
          modernTopicOptions[0];
    const body = [
      `【${speaker}重构】`,
      `若论${topic.label}，最荒唐处不在事难，而在人人都太懂得把狼狈装成体面。`,
      `${topic.friction}。在 ${selectedAncestor.name} 当前的 ${dominantTraits.join("、")} 倾向影响下，这段重构会更偏向辛辣、讽刺或带安抚感的表达。`,
      "【传播注】",
      "这段结果适合继续切成评论区引战开头或短视频文案引子。",
    ].join("\n");

    setPlayResult({
      title: `${speaker}重构：${topic.label}`,
      summary: `${speaker}已接管现代命题的解释权，当前结果继承了 ${selectedAncestor.name} 的派生性格向量。`,
      body,
      tags: [speaker, topic.label, "现代命题"],
      hook: "继续换人物或换命题，可以快速生成不同口气的现代重构版本。",
      reviewContext: {
        authors: speaker,
        originalWork: body,
      },
    });
    setReviewOutput(null);
  };

  const generateReview = () => {
    if (!playResult?.reviewContext) {
      return;
    }

    const reviewer = getAncestorName(reviewDraft.reviewerId);
    setReviewOutput(
      buildReviewText(
        reviewer,
        reviewDraft.style,
        playResult.reviewContext.authors,
        playResult.reviewContext.originalWork,
      ),
    );
  };

  const renderWorkshopForm = () => {
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
              <InkButton onClick={generateCrossTimeQuarrel}>生成争端现场</InkButton>
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
                  setTruthDraft((current) => ({
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
              <span className={playgroundStyles.fieldLabel}>历史问题</span>
              <select
                className={playgroundStyles.select}
                value={truthDraft.questionId}
                onChange={(event) => {
                  setTruthDraft((current) => ({
                    ...current,
                    questionId: event.target.value,
                  }));
                }}
              >
                {truthQuestionOptions.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
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
              <InkButton onClick={generateTruthOrDare}>生成回答界面</InkButton>
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
              <InkButton onClick={generateFusionCreation}>生成融合创作</InkButton>
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
              <InkButton onClick={generateModernReframe}>生成现代重构</InkButton>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <main className={styles.page}>
      <header className={`${styles.header} section-shell`}>
        <div>
          <div className={styles.brandMeta}>
            <TagPill tone="seal">Playground</TagPill>
            <TagPill tone="muted">Developer 4</TagPill>
          </div>
          <h1 className="display-title">玩法入口</h1>
          <p className={styles.subtitle}>
            把模式意图和创作传播预览拆成独立页面，让首页只保留入口，不再承担全部演示内容。
          </p>
          <div className={styles.quickActions}>
            <Link href="/" className={styles.quickLink}>
              返回首页中枢
            </Link>
            <Link href="/ancestors" className={styles.quickLink}>
              去祖宗页
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
                          <InkButton tone="ghost" onClick={generateReview}>
                            生成互评
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
