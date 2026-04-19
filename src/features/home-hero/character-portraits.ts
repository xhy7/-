import characterRecords from "../../../characters.json";

interface CharacterRelation {
  Target: string;
  Type: string;
}

interface CharacterTimelineEvent {
  Age?: number;
  Event: string;
  Type?: string;
  Effect?: string;
  Description?: string;
  Decision_Required?: boolean;
}

interface CharacterRecord {
  PersonID: number;
  Name: string;
  Image_Config?: {
    Base_Path?: string;
    Dynamic_Effect?: string;
  };
  Title?: string;
  Portrait: {
    Traits: Record<string, number>;
    Labels?: string[];
    Tags?: string[];
  };
  Tone: {
    Style: string;
    Keywords: string[];
  };
  Life_Timeline?: CharacterTimelineEvent[];
  Relations?: {
    Kinship?: CharacterRelation[];
    Social?: CharacterRelation[];
  };
  Social_Relations?: CharacterRelation[];
}

export interface CharacterPortraitProfile {
  personId: number;
  name: string;
  imageSrc: string;
  labels: string[];
  toneStyle: string;
  keywords: string[];
  topTraits: Array<{
    id: string;
    label: string;
    value: number;
  }>;
  timelineNote: string;
  relationHooks: string[];
}

const traitLabelMap: Record<string, string> = {
  humor: "幽默感",
  loyalty: "忠诚度",
  orthodoxy: "正统度",
  aggression: "攻击性",
  empathy: "共情力",
  tsundere: "傲娇值",
  modern_adaptability: "现代适配",
  resilience: "韧性",
  scheming: "谋略",
  cruelty: "残酷",
  manipulation: "操控",
  ambition: "野心",
  decisiveness: "决断",
  ruthlessness: "狠厉",
  vision: "远见",
  paranoia: "多疑",
  arrogance: "傲慢",
};

const relationLabelMap: Record<string, string> = {
  Brother: "手足",
  Mentor: "师承",
  Political_Enemy: "政敌",
  Protege: "门生",
  Student: "学生",
  Disciple: "门徒",
  BFF: "知己",
  Idol: "敬仰对象",
};

const toTraitLabel = (traitId: string) => traitLabelMap[traitId] ?? traitId;

const toRelationLabel = (relationType: string) =>
  relationLabelMap[relationType] ?? relationType;

const buildTimelineNote = (record: CharacterRecord) => {
  const pivotEvent =
    record.Life_Timeline?.find((item) => item.Type === "Historical_Pivot") ??
    record.Life_Timeline?.[0];

  if (!pivotEvent) {
    return "当前档案以气质与关系信息为主，尚未写入关键人生节点。";
  }

  const prefix = typeof pivotEvent.Age === "number" ? `${pivotEvent.Age} 岁 · ` : "";
  const suffix =
    pivotEvent.Description ??
    pivotEvent.Effect ??
    (pivotEvent.Decision_Required ? "该节点会影响后续性格走向。" : "适合作为后续互动引线。");

  return `${prefix}${pivotEvent.Event}：${suffix}`;
};

const buildRelationHooks = (record: CharacterRecord) => {
  const relations = [
    ...(record.Relations?.Kinship ?? []),
    ...(record.Relations?.Social ?? []),
    ...(record.Social_Relations ?? []),
  ];

  return relations
    .slice(0, 3)
    .map((relation) => `${relation.Target} · ${toRelationLabel(relation.Type)}`);
};

export const characterPortraitCatalog = (
  characterRecords as unknown as CharacterRecord[]
).map((record) => ({
  personId: record.PersonID,
  name: record.Name,
  imageSrc: record.Image_Config?.Base_Path ?? `/portraits/${record.PersonID}.jpg`,
  labels: [
    ...(record.Title ? [record.Title] : []),
    ...(record.Portrait.Labels ?? record.Portrait.Tags ?? []),
  ],
  toneStyle: record.Tone.Style,
  keywords: record.Tone.Keywords,
  topTraits: Object.entries(record.Portrait.Traits)
    .sort((left, right) => right[1] - left[1])
    .slice(0, 3)
    .map(([traitId, value]) => ({
      id: traitId,
      label: toTraitLabel(traitId),
      value,
    })),
  timelineNote: buildTimelineNote(record),
  relationHooks: buildRelationHooks(record),
}));

export const getCharacterPortraitProfile = (name: string) =>
  characterPortraitCatalog.find((profile) => profile.name === name) ?? null;
