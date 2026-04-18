"use client";

import { useMemo, useState, useTransition } from "react";

import {
  HomeGrowthSection,
  type HomeGrowthSectionProps,
} from "@/features/home-growth/home-growth-section";
import {
  HomeHeroSection,
  type HomeHeroSectionProps,
} from "@/features/home-hero/home-hero-section";
import {
  HomePlaygroundSection,
  type HomePlaygroundSectionProps,
} from "@/features/home-playground/home-playground-section";
import { getAncestorDetailPreview } from "@/mocks/home-gateway";
import type {
  AncestorDetailPreview,
  CreationHighlight,
  HomePageData,
} from "@/shared/contracts/home";
import { InkButton, TagPill } from "@/shared/ui/primitives";

import styles from "./home-page-client.module.css";

interface HomePageClientProps {
  data: HomePageData;
}

type ConsoleModeId =
  | "cross-time-quarrel"
  | "truth-or-dare"
  | "fusion-creation"
  | "modern-reframe";
type CreationFormat = "诗" | "词" | "对联" | "短文";
type ReviewStyle = "毒舌" | "委婉挖苦" | "降维打击" | "难得认可";

interface ConsoleAncestorOption {
  id: string;
  name: string;
  era: string;
  oneLiner: string;
}

interface ConsoleOutput {
  modeId: ConsoleModeId;
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

const initialConsoleNote =
  "右侧首页控制台现在承接四个玩法入口。点击卡片后，会在这里展开对应的交互界面。";

const truthQuestionOptions = [
  {
    id: "hongmen-banquet",
    label: "鸿门宴到底谁先动了杀心？",
    reveal: "牵扯旧权力格局与临场犹疑，越坦率越接近真相。",
  },
  {
    id: "wutai-poetry",
    label: "乌台诗案里最不该说出口的是哪一句？",
    reveal: "问题核心不是诗句本身，而是谁在等一个借题发挥的机会。",
  },
  {
    id: "chenqiao",
    label: "陈桥兵变究竟是众望所归还是设计好的戏？",
    reveal: "一旦选择揭露路线，答案会更像拆台而不是科普。",
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
  毒舌: "优先放大作品里的逞强与装饰感，捧一踩一。",
  委婉挖苦: "字面留情，弦外音更伤人。",
  降维打击: "直接从标准和气骨层面否定。",
  难得认可: "保留锋芒，但给出少量真肯定。",
};

const buildCrossEraText = (
  theme: string,
  format: CreationFormat,
  primaryName: string,
  secondaryName: string,
) => {
  switch (format) {
    case "诗":
      return [
        "【作品】",
        `卷灯未尽，偏将${theme}写入人间小风波。`,
        `${primaryName}先提气骨，${secondaryName}后添收束，便让狼狈也有了题签。`,
        "【风格溯源】",
        `- ${primaryName} 影响：负责起势、情绪与主要语调。`,
        `- ${secondaryName} 影响：负责修辞、尾势与辨识度。`,
        "【创作注】",
        "先能被朗读，再适合被转发和互评。",
      ].join("\n");
    case "词":
      return [
        "【作品】",
        `《卷上今题》\n把${theme}写成半阙浮沉，再留一笔回甘。`,
        "【风格溯源】",
        `- ${primaryName} 影响：决定词心与情绪走向。`,
        `- ${secondaryName} 影响：决定尾句的收束与陈列感。`,
        "【创作注】",
        "适合做古风题签和旁白开场。",
      ].join("\n");
    case "对联":
      return [
        "【作品】",
        `上联：把${theme}写得三分真火七分戏，先见${primaryName}气口`,
        `下联：将尘世琐碎收成半卷评语，还留${secondaryName}尾韵`,
        "横批：跨代同题",
        "【风格溯源】",
        `- ${primaryName} 影响：承担主攻笔力。`,
        `- ${secondaryName} 影响：补齐工整与姿态。`,
        "【创作注】",
        "适合做封面标题和主视觉主文案。",
      ].join("\n");
    case "短文":
      return [
        "【作品】",
        `${theme}原本只是现代生活里一小块不体面的裂纹，被${primaryName}写后先有了情绪温度，再经${secondaryName}收束成能被反复转述的一段短文。`,
        "【风格溯源】",
        `- ${primaryName} 影响：主要负责叙述重心。`,
        `- ${secondaryName} 影响：主要负责句式包装。`,
        "【创作注】",
        "适合做长图文开头或评论区置顶。",
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
    `${authors}这份作品先声够响，后劲却未必全都落到了实处。${styleLine}`,
    `原作片段提示：${originalWork.slice(0, 48)}${originalWork.length > 48 ? "..." : ""}`,
    "【定论】",
    `${reviewer}认为这稿子已经能传，但还需要更鲜明的偏爱与偏见。`,
  ].join("\n");
};

export function HomePageClient({ data }: HomePageClientProps) {
  const [activityNote, setActivityNote] = useState(initialConsoleNote);
  const [ancestorPreview, setAncestorPreview] =
    useState<AncestorDetailPreview | null>(null);
  const [creationPreview, setCreationPreview] = useState<CreationHighlight | null>(null);
  const [activeConsoleMode, setActiveConsoleMode] = useState<ConsoleModeId | null>(null);
  const [consoleOutput, setConsoleOutput] = useState<ConsoleOutput | null>(null);
  const [reviewOutput, setReviewOutput] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const ancestorOptions = useMemo<ConsoleAncestorOption[]>(
    () =>
      [data.featuredAncestor, ...data.roster].map((ancestor) => ({
        id: ancestor.id,
        name: ancestor.name,
        era: ancestor.era,
        oneLiner: ancestor.oneLiner,
      })),
    [data],
  );
  const [quarrelDraft, setQuarrelDraft] = useState({
    challengerId: ancestorOptions[0]?.id ?? "",
    opponentId: ancestorOptions[1]?.id ?? ancestorOptions[0]?.id ?? "",
    mediatorId: "",
    conflictTopic: "到底谁该为今日风波先认错",
    rulingBias: "关系偏袒优先",
  });
  const [truthDraft, setTruthDraft] = useState({
    speakerId: ancestorOptions[0]?.id ?? "",
    questionId: truthQuestionOptions[0].id,
    honesty: 58,
    playMode: "真心话",
  });
  const [fusionDraft, setFusionDraft] = useState({
    primaryId: ancestorOptions[0]?.id ?? "",
    secondaryId: ancestorOptions[1]?.id ?? ancestorOptions[0]?.id ?? "",
    ratio: 70,
    theme: "把加班外卖写成值得传阅的深夜短诗",
    format: "诗" as CreationFormat,
  });
  const [modernDraft, setModernDraft] = useState({
    speakerId: ancestorOptions[0]?.id ?? "",
    topicId: modernTopicOptions[1].id,
    customTopic: "",
  });
  const [reviewDraft, setReviewDraft] = useState({
    reviewerId: ancestorOptions[1]?.id ?? ancestorOptions[0]?.id ?? "",
    style: "毒舌" as ReviewStyle,
  });
  const gameplayModesById = useMemo(
    () => new Map(data.gameplayModes.map((mode) => [mode.id, mode])),
    [data.gameplayModes],
  );

  const getAncestorName = (id: string) =>
    ancestorOptions.find((ancestor) => ancestor.id === id)?.name ?? "佚名祖宗";

  const getActiveModeTitle = () =>
    (activeConsoleMode && gameplayModesById.get(activeConsoleMode)?.title) || "首页控制台";

  const openGameplayConsole = (modeId: string) => {
    const mode = gameplayModesById.get(modeId);

    if (!mode) {
      return;
    }

    setActiveConsoleMode(modeId as ConsoleModeId);
    setAncestorPreview(null);
    setCreationPreview(null);
    setConsoleOutput(null);
    setReviewOutput(null);
    setActivityNote(`玩法「${mode.title}」已在右侧首页控制台展开。`);
  };

  const renderQuarrel = () => {
    const challenger = getAncestorName(quarrelDraft.challengerId);
    const opponent = getAncestorName(quarrelDraft.opponentId);
    const mediator = quarrelDraft.mediatorId
      ? getAncestorName(quarrelDraft.mediatorId)
      : "无人拉架";

    return (
      <div className={styles.consoleSection}>
        <p className="section-body">
          选择互怼双方、是否拉第三人偏袒，以及判定更偏向关系还是性格硬碰。
        </p>
        <div className={styles.consoleFields}>
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
              {ancestorOptions.map((ancestor) => (
                <option key={ancestor.id} value={ancestor.id}>
                  {ancestor.name} · {ancestor.era}
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
              {ancestorOptions.map((ancestor) => (
                <option key={ancestor.id} value={ancestor.id}>
                  {ancestor.name} · {ancestor.era}
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
              {ancestorOptions.map((ancestor) => (
                <option key={ancestor.id} value={ancestor.id}>
                  {ancestor.name} · {ancestor.era}
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
          <label className={styles.fieldFull}>
            <span className={styles.fieldLabel}>争端主题</span>
            <textarea
              className={styles.textarea}
              rows={3}
              value={quarrelDraft.conflictTopic}
              onChange={(event) => {
                setQuarrelDraft((current) => ({
                  ...current,
                  conflictTopic: event.target.value,
                }));
              }}
            />
          </label>
        </div>
        <div className={styles.consoleActions}>
          <InkButton
            onClick={() => {
              setConsoleOutput({
                modeId: "cross-time-quarrel",
                title: `${challenger} vs ${opponent}`,
                summary: `围绕「${quarrelDraft.conflictTopic}」发起争端，当前判定以「${quarrelDraft.rulingBias}」为主。`,
                body: `${challenger}先抢话权，${opponent}不肯退让，${mediator} ${mediator === "无人拉架" ? "导致现场全面失控" : "开始明显偏袒其中一方"}。这类结果适合继续扩成多轮互怼台词和拉偏架判词。`,
                tags: [challenger, opponent, mediator, quarrelDraft.rulingBias],
                hook: "戏剧点来自站队、误判和第三人下场带节奏。",
              });
            }}
          >
            生成争端现场
          </InkButton>
        </div>
      </div>
    );
  };

  const renderTruth = () => {
    const speaker = getAncestorName(truthDraft.speakerId);
    const question =
      truthQuestionOptions.find((item) => item.id === truthDraft.questionId) ??
      truthQuestionOptions[0];
    const truthTone =
      truthDraft.honesty >= 70 ? "偏揭露真相" : truthDraft.honesty <= 35 ? "偏掩饰回避" : "半真半假";

    return (
      <div className={styles.consoleSection}>
        <p className="section-body">
          选择历史争议点和人格坦率度，让回答在“腹黑掩饰”和“直给真相”之间摆动。
        </p>
        <div className={styles.consoleFields}>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>出场人物</span>
            <select
              className={styles.select}
              value={truthDraft.speakerId}
              onChange={(event) => {
                setTruthDraft((current) => ({
                  ...current,
                  speakerId: event.target.value,
                }));
              }}
            >
              {ancestorOptions.map((ancestor) => (
                <option key={ancestor.id} value={ancestor.id}>
                  {ancestor.name} · {ancestor.era}
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
          <label className={styles.fieldFull}>
            <span className={styles.fieldLabel}>历史问题</span>
            <select
              className={styles.select}
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
          <label className={styles.fieldFull}>
            <span className={styles.fieldLabel}>坦率权重 {truthDraft.honesty}%</span>
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
        </div>
        <div className={styles.consoleActions}>
          <InkButton
            onClick={() => {
              setConsoleOutput({
                modeId: "truth-or-dare",
                title: `${speaker}的${truthDraft.playMode}回答`,
                summary: `当前问题是「${question.label}」，回答倾向为「${truthTone}」。`,
                body: `${speaker}面对这道题时，先会判断提问者到底想听真相还是想看表演。${question.reveal} 在当前人格权重下，答案会故意保留一截余地，让冷知识与情绪反转同时出现。`,
                tags: [speaker, truthDraft.playMode, truthTone],
                hook: "趣味点在于：同一个历史问题，会因坦率度不同而改写成完全不同的口供。",
              });
            }}
          >
            生成回答界面
          </InkButton>
        </div>
      </div>
    );
  };

  const renderCreationReview = () => {
    if (
      !consoleOutput ||
      (consoleOutput.modeId !== "fusion-creation" &&
        consoleOutput.modeId !== "modern-reframe") ||
      !consoleOutput.reviewContext
    ) {
      return null;
    }

    const reviewer = getAncestorName(reviewDraft.reviewerId);

    return (
      <div className={styles.reviewSection}>
        <div className={styles.reviewHeader}>
          <div>
            <p className="eyebrow">Review Continuation</p>
            <h3 className={styles.reviewTitle}>作品互评</h3>
          </div>
          <TagPill tone="muted">已并入当前玩法</TagPill>
        </div>
        <div className={styles.consoleFields}>
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
              {ancestorOptions.map((ancestor) => (
                <option key={ancestor.id} value={ancestor.id}>
                  {ancestor.name} · {ancestor.era}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>点评风格</span>
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
              <option value="毒舌">毒舌</option>
              <option value="委婉挖苦">委婉挖苦</option>
              <option value="降维打击">降维打击</option>
              <option value="难得认可">难得认可</option>
            </select>
          </label>
        </div>
        <p className="muted-note">{reviewStyleNotes[reviewDraft.style]}</p>
        <InkButton
          tone="ghost"
          onClick={() => {
            setReviewOutput(
              buildReviewText(
                reviewer,
                reviewDraft.style,
                consoleOutput.reviewContext?.authors ?? "佚名合著",
                consoleOutput.reviewContext?.originalWork ?? consoleOutput.body,
              ),
            );
          }}
        >
          生成互评
        </InkButton>
        {reviewOutput ? (
          <div className={styles.outputBlock}>
            <p className={styles.outputLabel}>互评结果</p>
            <pre className={styles.outputText}>{reviewOutput}</pre>
          </div>
        ) : null}
      </div>
    );
  };

  const renderFusion = () => {
    const primary = getAncestorName(fusionDraft.primaryId);
    const secondary = getAncestorName(fusionDraft.secondaryId);
    const ratioB = 100 - fusionDraft.ratio;

    return (
      <div className={styles.consoleSection}>
        <p className="section-body">
          跨时代创作的互评已并入结果区。先生成作品，再直接选择人物继续锐评。
        </p>
        <div className={styles.consoleFields}>
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
              {ancestorOptions.map((ancestor) => (
                <option key={ancestor.id} value={ancestor.id}>
                  {ancestor.name} · {ancestor.era}
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
              {ancestorOptions.map((ancestor) => (
                <option key={ancestor.id} value={ancestor.id}>
                  {ancestor.name} · {ancestor.era}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.fieldFull}>
            <span className={styles.fieldLabel}>
              风格占比 {fusionDraft.ratio}% / {ratioB}%
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
          <label className={styles.fieldFull}>
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
        </div>
        <div className={styles.consoleActions}>
          <InkButton
            onClick={() => {
              const body = buildCrossEraText(
                fusionDraft.theme,
                fusionDraft.format,
                primary,
                secondary,
              );

              setConsoleOutput({
                modeId: "fusion-creation",
                title: `《${fusionDraft.theme.slice(0, 10)}${fusionDraft.theme.length > 10 ? "..." : ""}》`,
                summary: `${primary}${fusionDraft.ratio}% 领笔，${secondary}${ratioB}% 添调，当前结果适合继续接人物互评。`,
                body,
                tags: [primary, secondary, `${fusionDraft.format}创作`],
                hook: "先生成作品，再立刻接互评，能把传播戏剧性拉满。",
                reviewContext: {
                  authors: `${primary}与${secondary}`,
                  originalWork: body,
                },
              });
              setReviewOutput(null);
            }}
          >
            生成融合创作
          </InkButton>
        </div>
      </div>
    );
  };

  const renderModern = () => {
    const speaker = getAncestorName(modernDraft.speakerId);
    const topic =
      modernDraft.topicId === "custom"
        ? {
            label: modernDraft.customTopic || "未命名命题",
            friction: "等待你补完更具体的现代场景。",
          }
        : modernTopicOptions.find((item) => item.id === modernDraft.topicId) ??
          modernTopicOptions[0];

    return (
      <div className={styles.consoleSection}>
        <p className="section-body">
          现代命题重构的结果下方同样直接挂接互评，不再独立拆出单独玩法。
        </p>
        <div className={styles.consoleFields}>
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
              {ancestorOptions.map((ancestor) => (
                <option key={ancestor.id} value={ancestor.id}>
                  {ancestor.name} · {ancestor.era}
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
            <label className={styles.fieldFull}>
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
        </div>
        <p className="muted-note">当前冲突点：{topic.friction}</p>
        <div className={styles.consoleActions}>
          <InkButton
            onClick={() => {
              const body = [
                `【${speaker}点评】`,
                `若论${topic.label}，最荒唐处不在事难，而在人人都太懂得把狼狈装成体面。`,
                `${topic.friction}，于是喜剧感不靠夸张，而靠古人话语把现代窘态照得太亮。`,
                "【传播注】",
                "这段文本适合切成评论区引战开头。",
              ].join("\n");

              setConsoleOutput({
                modeId: "modern-reframe",
                title: `${speaker}重构：${topic.label}`,
                summary: `${speaker}已接管现代命题解释权，接下来可继续指定人物对这份锐评做互评。`,
                body,
                tags: [speaker, topic.label, "现代命题"],
                hook: "真正的笑点来自古代修辞和现代日常的错位。",
                reviewContext: {
                  authors: speaker,
                  originalWork: body,
                },
              });
              setReviewOutput(null);
            }}
          >
            生成现代命题
          </InkButton>
        </div>
      </div>
    );
  };

  const renderGameplayConsole = () => {
    switch (activeConsoleMode) {
      case "cross-time-quarrel":
        return renderQuarrel();
      case "truth-or-dare":
        return renderTruth();
      case "fusion-creation":
        return renderFusion();
      case "modern-reframe":
        return renderModern();
      default:
        return null;
    }
  };

  const heroProps: HomeHeroSectionProps = {
    featuredAncestor: data.featuredAncestor,
    roster: data.roster,
    onSelectAncestor: (ancestorId) => {
      const activeAncestor = [data.featuredAncestor, ...data.roster].find(
        (item) => item.id === ancestorId,
      );

      if (activeAncestor) {
        setActiveConsoleMode(null);
        setConsoleOutput(null);
        setReviewOutput(null);
        setCreationPreview(null);
        setActivityNote(
          `已切换到 ${activeAncestor.name}。当前最适合尝试“${activeAncestor.signatureTags[0]}”相关玩法。`,
        );
      }
    },
    onOpenAncestorDetail: async (ancestorId) => {
      setActivityNote("正在展开人物卷轴预览...");
      const preview = await getAncestorDetailPreview(ancestorId);

      startTransition(() => {
        setAncestorPreview(preview);
        setActiveConsoleMode(null);
        setConsoleOutput(null);
        setReviewOutput(null);
        setCreationPreview(null);
        setActivityNote(
          `${preview.name} 的人物卷已展开。后续只需把这里换成 drawer 或 side sheet。`,
        );
      });
    },
  };

  const growthProps: HomeGrowthSectionProps = {
    nurtureSummary: data.nurtureSummary,
    fatePreviews: data.fatePreviews,
    onOpenFatePreview: (fateId) => {
      const fate = data.fatePreviews.find((item) => item.id === fateId);

      if (fate) {
        setAncestorPreview(null);
        setActiveConsoleMode(null);
        setConsoleOutput(null);
        setReviewOutput(null);
        setCreationPreview(null);
        setActivityNote(
          `命运节点「${fate.title}」已聚焦。触发提示：${fate.triggerHint}`,
        );
      }
    },
  };

  const previewCreation = (creation: CreationHighlight) => {
    setActivityNote(
      `已预览「${creation.title}」。右侧控制台现在展示传播样张，不切到单独玩法面板。`,
    );
    setAncestorPreview(null);
    setActiveConsoleMode(null);
    setConsoleOutput(null);
    setReviewOutput(null);
    setCreationPreview(creation);
  };

  const playgroundProps: HomePlaygroundSectionProps = {
    gameplayModes: data.gameplayModes,
    creationHighlights: data.creationHighlights,
    onRequestMode: (modeId) => {
      openGameplayConsole(modeId);
    },
    onPreviewCreation: (creationId) => {
      const creation = data.creationHighlights.find(
        (item) => item.id === creationId,
      );

      if (creation) {
        previewCreation(creation);
      }
    },
  };

  const featuredModeId = data.gameplayModes[0]?.id;

  return (
    <main className={styles.page}>
      <header className={`${styles.topBanner} section-shell`}>
        <div className={styles.brandBlock}>
          <div className={styles.brandMeta}>
            <TagPill tone="seal">{data.seasonLabel}</TagPill>
            <TagPill tone="muted">Mock First</TagPill>
            <TagPill tone="muted">契约冻结中</TagPill>
          </div>
          <h1 className="display-title">{data.brandTitle}</h1>
          <p className={styles.subtitle}>{data.brandSubtitle}</p>
        </div>
        <div className={styles.bannerAside}>
          <p className={styles.heroNotice}>{data.heroNotice}</p>
          <InkButton
            onClick={() => {
              if (featuredModeId) {
                void playgroundProps.onRequestMode?.(featuredModeId);
              }
            }}
          >
            立即进入主舞台
          </InkButton>
        </div>
      </header>

      <div className={styles.layout}>
        <div className={styles.mainColumn}>
          <HomeHeroSection {...heroProps} />
          <HomeGrowthSection {...growthProps} />
          <HomePlaygroundSection {...playgroundProps} />
        </div>

        <aside className={styles.rail}>
          <section className={`${styles.railCard} section-shell`}>
            <div className={styles.railHeader}>
              <div>
                <p className="eyebrow">Home Console</p>
                <h2 className={styles.railTitle}>
                  {ancestorPreview?.archiveLabel ??
                    creationPreview?.title ??
                    getActiveModeTitle()}
                </h2>
              </div>
              <TagPill tone={isPending ? "seal" : activeConsoleMode ? "seal" : "muted"}>
                {isPending
                  ? "加载中"
                  : activeConsoleMode
                    ? "玩法工坊"
                    : creationPreview
                      ? "传播预览"
                      : "待命中"}
              </TagPill>
            </div>

            <p className={styles.activityNote}>{activityNote}</p>

            {ancestorPreview ? (
              <div className={styles.previewStack}>
                <div className={styles.previewMeta}>
                  <strong>
                    {ancestorPreview.name} · {ancestorPreview.courtesyName}
                  </strong>
                  <span>{ancestorPreview.era}</span>
                </div>
                <p className="section-body">{ancestorPreview.profile}</p>
                <ul className={styles.previewList}>
                  {ancestorPreview.relationshipHooks.map((hook) => (
                    <li key={hook}>{hook}</li>
                  ))}
                </ul>
                <div className={styles.tagRow}>
                  {ancestorPreview.unlockHints.map((hint) => (
                    <TagPill key={hint} tone="muted">
                      {hint}
                    </TagPill>
                  ))}
                </div>
              </div>
            ) : null}

            {activeConsoleMode ? (
              <div className={styles.previewStack}>
                {renderGameplayConsole()}
                {consoleOutput ? (
                  <div className={styles.outputPanel}>
                    <div className={styles.outputHeader}>
                      <div>
                        <p className="eyebrow">Output Preview</p>
                        <h3 className={styles.outputTitle}>{consoleOutput.title}</h3>
                      </div>
                      <TagPill tone="seal">已生成</TagPill>
                    </div>
                    <p className="section-body">{consoleOutput.summary}</p>
                    <div className={styles.outputBlock}>
                      <p className={styles.outputLabel}>内容结果</p>
                      <pre className={styles.outputText}>{consoleOutput.body}</pre>
                    </div>
                    <div className={styles.tagRow}>
                      {consoleOutput.tags.map((tag) => (
                        <TagPill key={tag}>{tag}</TagPill>
                      ))}
                    </div>
                    <p className={styles.nextStep}>{consoleOutput.hook}</p>
                    {renderCreationReview()}
                  </div>
                ) : (
                  <div className={styles.consoleHintCard}>
                    <p className="section-body">
                      表单先在这里展开。等你点击生成按钮后，结果和互评区域会继续在控制台下方展开。
                    </p>
                    <div className={styles.tagRow}>
                      <TagPill>交互表单</TagPill>
                      <TagPill tone="muted">结果预览</TagPill>
                      <TagPill tone="muted">互评延续</TagPill>
                    </div>
                  </div>
                )}
              </div>
            ) : null}

            {creationPreview ? (
              <div className={styles.previewStack}>
                <div className={styles.previewMeta}>
                  <strong>{creationPreview.title}</strong>
                  <span>{creationPreview.format}</span>
                </div>
                <p className="section-body">{creationPreview.summary}</p>
                <div className={styles.tagRow}>
                  {creationPreview.ancestors.map((ancestor) => (
                    <TagPill key={ancestor}>{ancestor}</TagPill>
                  ))}
                </div>
                <p className={styles.nextStep}>{creationPreview.hook}</p>
              </div>
            ) : null}

            {!ancestorPreview && !activeConsoleMode && !creationPreview ? (
              <div className={styles.previewStack}>
                <p className="section-body">
                  点击祖宗人物卡会展开人物卷，点击玩法入口会在这里打开交互工坊，点击传播样张则显示可转化的内容预览。
                </p>
                <div className={styles.tagRow}>
                  <TagPill>人物卷预览</TagPill>
                  <TagPill tone="muted">玩法交互界面</TagPill>
                  <TagPill tone="muted">传播样张</TagPill>
                </div>
              </div>
            ) : null}

            <InkButton
              tone="ghost"
              className={styles.resetButton}
              onClick={() => {
                setAncestorPreview(null);
                setCreationPreview(null);
                setActiveConsoleMode(null);
                setConsoleOutput(null);
                setReviewOutput(null);
                setActivityNote(initialConsoleNote);
              }}
            >
              清空控制台
            </InkButton>
          </section>
        </aside>
      </div>

      {featuredModeId ? (
        <InkButton
          className={styles.floatingCta}
          onClick={() => {
            void playgroundProps.onRequestMode?.(featuredModeId);
          }}
        >
          {data.floatingActionLabel}
        </InkButton>
      ) : null}
    </main>
  );
}
