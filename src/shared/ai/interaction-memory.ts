import type {
  AiReplyRequest,
  AiReplyResponse,
  AncestorCardSummary,
  FatePreview,
  FeaturedAncestor,
  MoodSnapshot,
  NurtureSummary,
  TraitMetric,
} from "@/shared/contracts/home";

export interface AncestorConversationRecord {
  id: string;
  ancestorId: string;
  timestamp: number;
  userMessage: string;
  mode: AiReplyRequest["mode"];
  sceneType: AiReplyRequest["sceneType"];
  reply: string;
  subtext: string;
  styleTags: string[];
}

export interface FateUnlockEvaluation {
  status: "locked" | "evolving" | "ready";
  score: number;
  threshold: number;
  reasons: string[];
  nextStep: string;
}

const STORAGE_KEY = "laozuzong:conversation-memory";
const STORAGE_EVENT = "laozuzong:conversation-memory-change";
const EMPTY_RECORDS: AncestorConversationRecord[] = [];

let cachedRawMemory: string | null = null;
let cachedParsedMemory: AncestorConversationRecord[] = EMPTY_RECORDS;

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const getStorage = () => {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage;
};

export const getConversationMemory = (): AncestorConversationRecord[] => {
  const storage = getStorage();

  if (!storage) {
    return EMPTY_RECORDS;
  }

  try {
    const raw = storage.getItem(STORAGE_KEY);

    if (!raw) {
      cachedRawMemory = null;
      cachedParsedMemory = EMPTY_RECORDS;
      return cachedParsedMemory;
    }

    if (raw === cachedRawMemory) {
      return cachedParsedMemory;
    }

    const parsed = JSON.parse(raw) as AncestorConversationRecord[];
    cachedRawMemory = raw;
    cachedParsedMemory = Array.isArray(parsed) ? parsed : EMPTY_RECORDS;
    return cachedParsedMemory;
  } catch {
    cachedRawMemory = null;
    cachedParsedMemory = EMPTY_RECORDS;
    return cachedParsedMemory;
  }
};

export const saveConversationMemory = (
  records: AncestorConversationRecord[],
) => {
  const storage = getStorage();

  if (!storage) {
    return;
  }

  storage.setItem(STORAGE_KEY, JSON.stringify(records));
  cachedRawMemory = JSON.stringify(records);
  cachedParsedMemory = records;
  window.dispatchEvent(new Event(STORAGE_EVENT));
};

export const appendConversationRecord = (
  record: AncestorConversationRecord,
) => {
  const nextRecords = [...getConversationMemory(), record];
  saveConversationMemory(nextRecords);
  return nextRecords;
};

export const getAncestorConversationRecords = (ancestorId: string) =>
  getConversationMemory().filter((record) => record.ancestorId === ancestorId);

export const subscribeConversationMemory = (callback: () => void) => {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const notify = () => {
    callback();
  };

  window.addEventListener("storage", notify);
  window.addEventListener(STORAGE_EVENT, notify);

  return () => {
    window.removeEventListener("storage", notify);
    window.removeEventListener(STORAGE_EVENT, notify);
  };
};

export const createConversationRecord = (
  request: AiReplyRequest,
  response: AiReplyResponse,
): AncestorConversationRecord => ({
  id: response.requestId,
  ancestorId: request.ancestorId,
  timestamp: Date.now(),
  userMessage: request.userMessage,
  mode: request.mode,
  sceneType: request.sceneType,
  reply: response.output.reply,
  subtext: response.output.subtext,
  styleTags: response.output.styleTags,
});

const countMatches = (
  records: AncestorConversationRecord[],
  matcher: (record: AncestorConversationRecord) => boolean,
) => records.filter(matcher).length;

export const deriveTraitVectorFromHistory = (
  baseTraits: TraitMetric[],
  records: AncestorConversationRecord[],
): TraitMetric[] => {
  const supportiveTurns = countMatches(records, (record) =>
    /(谢谢|喜欢|相信|陪我|安慰|帮我|请你|想听听)/.test(record.userMessage),
  );
  const tenseTurns = countMatches(records, (record) =>
    /(烦|崩|累|讨厌|生气|焦虑|难受|压力)/.test(record.userMessage),
  );
  const prototypeTurns = countMatches(records, (record) => record.mode === "prototype");
  const oocTurns = countMatches(records, (record) => record.mode === "ooc");
  const creativeTurns = countMatches(
    records,
    (record) => record.sceneType === "creative-feedback",
  );
  const mediationTurns = countMatches(
    records,
    (record) => record.sceneType === "conflict-mediation",
  );
  const reactionTurns = countMatches(
    records,
    (record) => record.sceneType === "event-reaction",
  );

  const sceneWeights: Record<
    NonNullable<AncestorConversationRecord["sceneType"]>,
    Partial<Record<TraitMetric["id"], number>>
  > = {
    "daily-chat": {
      empathy: 2,
      humor: 1,
    },
    "conflict-mediation": {
      empathy: 1,
      fidelity: 2,
      rebellion: -1,
    },
    "creative-feedback": {
      humor: 2,
      rebellion: 1,
      fidelity: -1,
    },
    "event-reaction": {
      rebellion: 2,
      empathy: -1,
    },
  };

  return baseTraits.map((trait) => {
    let delta = 0;

    switch (trait.id) {
      case "humor":
        delta = supportiveTurns + creativeTurns * 2 - tenseTurns;
        break;
      case "fidelity":
        delta = prototypeTurns * 2 + mediationTurns - oocTurns;
        break;
      case "rebellion":
        delta = oocTurns * 3 + reactionTurns - prototypeTurns;
        break;
      case "empathy":
        delta = supportiveTurns * 2 + mediationTurns - tenseTurns;
        break;
      default:
        delta = Math.floor(records.length / 2);
        break;
    }

    delta += records.reduce(
      (sum, record) => sum + (sceneWeights[record.sceneType][trait.id] ?? 0),
      0,
    );

    return {
      ...trait,
      value: clamp(trait.value + delta, 0, trait.max),
    };
  });
};

export const deriveMoodSnapshotFromHistory = (
  baseMood: MoodSnapshot,
  records: AncestorConversationRecord[],
): MoodSnapshot => {
  const supportiveTurns = countMatches(records, (record) =>
    /(谢谢|喜欢|相信|陪我|安慰|帮我|请你|想听听)/.test(record.userMessage),
  );
  const tenseTurns = countMatches(records, (record) =>
    /(烦|崩|累|讨厌|生气|焦虑|难受|压力)/.test(record.userMessage),
  );
  const creativeTurns = countMatches(
    records,
    (record) => record.sceneType === "creative-feedback",
  );
  const mediationTurns = countMatches(
    records,
    (record) => record.sceneType === "conflict-mediation",
  );
  const reactionTurns = countMatches(
    records,
    (record) => record.sceneType === "event-reaction",
  );
  const delta =
    supportiveTurns * 3 -
    tenseTurns * 2 +
    records.length +
    creativeTurns +
    mediationTurns -
    reactionTurns;
  const value = clamp(baseMood.value + delta, 0, 100);

  return {
    ...baseMood,
    value,
    delta,
    summary:
      records.length > 0
        ? `最近 ${records.length} 次对话已回写情绪曲线，当前更明显地受互动历史影响。`
        : baseMood.summary,
    cause:
      records.length > 0
        ? `累计 ${supportiveTurns} 次正向对话，${tenseTurns} 次高压情境输入`
        : baseMood.cause,
  };
};

const defaultRebellionByAncestor: Record<string, number> = {
  "su-shi": 0,
  "li-qingzhao": -4,
  "li-bai": 8,
  "wu-zetian": 5,
};

const defaultEmpathyByAncestor: Record<string, number> = {
  "su-shi": 4,
  "li-qingzhao": -2,
  "li-bai": -3,
  "wu-zetian": -1,
};

const defaultHumorByAncestor: Record<string, number> = {
  "su-shi": 5,
  "li-qingzhao": -1,
  "li-bai": 3,
  "wu-zetian": -2,
};

export const buildAncestorBaseTraitVector = (
  ancestor: FeaturedAncestor | AncestorCardSummary,
  baseTraits: TraitMetric[],
) =>
  baseTraits.map((trait) => {
    if (trait.id === "fidelity") {
      return {
        ...trait,
        value: ancestor.historicalFidelity,
        note: `${ancestor.name} 的历史忠诚度会随对话风格轻微波动。`,
      };
    }

    if (trait.id === "rebellion") {
      return {
        ...trait,
        value: clamp(
          trait.value + (defaultRebellionByAncestor[ancestor.id] ?? 0),
          0,
          trait.max,
        ),
      };
    }

    if (trait.id === "empathy") {
      return {
        ...trait,
        value: clamp(
          trait.value + (defaultEmpathyByAncestor[ancestor.id] ?? 0),
          0,
          trait.max,
        ),
      };
    }

    if (trait.id === "humor") {
      return {
        ...trait,
        value: clamp(
          trait.value + (defaultHumorByAncestor[ancestor.id] ?? 0),
          0,
          trait.max,
        ),
      };
    }

    return trait;
  });

export const buildDerivedNurtureSummary = (
  ancestor: FeaturedAncestor | AncestorCardSummary,
  baseSummary: NurtureSummary,
  records: AncestorConversationRecord[],
): NurtureSummary => {
  const traitVector = deriveTraitVectorFromHistory(
    buildAncestorBaseTraitVector(ancestor, baseSummary.traitVector),
    records,
  );
  const moodSnapshot = deriveMoodSnapshotFromHistory(baseSummary.moodSnapshot, records);

  return {
    ...baseSummary,
    historicalFidelity: ancestor.historicalFidelity,
    traitVector,
    moodSnapshot,
    activeTags: [
      ...baseSummary.activeTags.slice(0, 2),
      `${ancestor.name} 专属养成`,
      `已记录 ${records.length} 次对话`,
    ],
    nextBondMilestone:
      records.length > 0
        ? `继续和 ${ancestor.name} 在不同 sceneType 下互动，可进一步改变性格向量。`
        : baseSummary.nextBondMilestone,
  };
};

export const evaluateFateUnlock = (
  fate: FatePreview,
  traitVector: TraitMetric[],
  moodSnapshot: MoodSnapshot,
  records: AncestorConversationRecord[],
): FateUnlockEvaluation => {
  const traitValue = (traitId: string) =>
    traitVector.find((trait) => trait.id === traitId)?.value ?? 0;

  const ruleMap: Record<
    string,
    {
      score: number;
      threshold: number;
      reasons: string[];
      nextStep: string;
    }
  > = {
    "wutai-poem-case": {
      score: traitValue("fidelity") + traitValue("humor") + moodSnapshot.value,
      threshold: 210,
      reasons: [
        "更高的历史忠诚度有助于稳住风评",
        "足够的幽默感能把高压处境转译成可承受的表达",
        "MoodIndex 过低会让节点难以顺利推进",
      ],
      nextStep: "优先在日常对话与作品互评中累积稳定互动，提升幽默感与忠诚度。",
    },
    "river-ink-alliance": {
      score:
        traitValue("empathy") +
        traitValue("rebellion") +
        records.filter((record) => record.sceneType === "creative-feedback").length * 8,
      threshold: 180,
      reasons: [
        "共情和表达锋芒都决定能否形成稳定的创作联盟",
        "作品互评类对话会显著推进这个节点",
      ],
      nextStep: "多进行 creative-feedback 对话，放大共情与锋芒并存的状态。",
    },
    "throne-echo": {
      score:
        traitValue("fidelity") +
        traitValue("rebellion") +
        records.filter((record) => record.sceneType === "conflict-mediation").length * 10,
      threshold: 190,
      reasons: [
        "这个节点依赖秩序感与掌控欲的平衡",
        "冲突调停类对话会更快推动节点成熟",
      ],
      nextStep: "多进行 conflict-mediation 对话，观察忠诚与反骨的拉扯结果。",
    },
  };

  const defaultRule = {
    score: moodSnapshot.value + records.length * 10,
    threshold: 120,
    reasons: ["节点会随着对话累积和情绪提升逐步靠近可解锁状态。"],
    nextStep: "继续和该祖宗保持互动，积累至少 3 次有效对话。",
  };

  const rule = ruleMap[fate.id] ?? defaultRule;

  return {
    status:
      rule.score >= rule.threshold
        ? "ready"
        : rule.score >= rule.threshold * 0.72
          ? "evolving"
          : "locked",
    score: rule.score,
    threshold: rule.threshold,
    reasons: rule.reasons,
    nextStep: rule.nextStep,
  };
};

export const summarizeConversationHistory = (
  ancestorName: string,
  records: AncestorConversationRecord[],
) => {
  if (records.length === 0) {
    return `${ancestorName} 还没有与你形成可回写性格的对话历史。`;
  }

  const latest = records.slice(-2);
  return latest
    .map(
      (record, index) =>
        `记忆片段 ${index + 1}: 用户说“${record.userMessage}”，${ancestorName} 以 ${record.mode} / ${record.sceneType} 方式回应。`,
    )
    .join("\n");
};
