export interface HomePageData {
  brandTitle: string;
  brandSubtitle: string;
  seasonLabel: string;
  heroNotice: string;
  floatingActionLabel: string;
  shellStatuses: ShellStatusCard[];
  sectionOrder: HomeSectionBlueprint[];
  aiSandbox: AiReplySandboxConfig;
  featuredAncestor: FeaturedAncestor;
  roster: AncestorCardSummary[];
  nurtureSummary: NurtureSummary;
  fatePreviews: FatePreview[];
  gameplayModes: GameplayModeCard[];
  creationHighlights: CreationHighlight[];
}

export type HomeSectionId =
  | "hero-stage"
  | "growth-core"
  | "playground-entry";

export interface ShellStatusCard {
  id: string;
  label: string;
  value: string;
  note: string;
  tone: "ink" | "seal" | "muted";
}

export interface HomeSectionBlueprint {
  id: HomeSectionId;
  eyebrow: string;
  title: string;
  summary: string;
}

export type AiReplyMode = "prototype" | "ooc";

export type AiSceneType =
  | "daily-chat"
  | "conflict-mediation"
  | "creative-feedback"
  | "event-reaction";

export interface AiSceneOption {
  id: AiSceneType;
  label: string;
  description: string;
}

export interface AiReplySandboxConfig {
  helperTitle: string;
  helperText: string;
  defaultAncestorId: string;
  supportedModes: AiReplyMode[];
  sceneOptions: AiSceneOption[];
  maxUserMessageLength: number;
}

export interface AiReplyRequest {
  ancestorId: string;
  userMessage: string;
  mode: AiReplyMode;
  sceneType: AiSceneType;
  moodIndex: number;
  traitVector: TraitMetric[];
  contextNote?: string;
}

export interface AiReplyContent {
  reply: string;
  subtext: string;
  nextAction: string;
  styleTags: string[];
}

export interface AiReplyDebugInfo {
  provider: "mock" | "remote";
  model: string;
  personaId: string;
  moodSummary: string;
  dominantTraits: string[];
}

export interface AiReplyResponse {
  requestId: string;
  ancestorId: string;
  mode: AiReplyMode;
  sceneType: AiSceneType;
  output: AiReplyContent;
  debug: AiReplyDebugInfo;
}

export interface AncestorCardSummary {
  id: string;
  name: string;
  era: string;
  epithet: string;
  portraitGlyph: string;
  oneLiner: string;
  quote: string;
  currentMoodLabel: string;
  historicalFidelity: number;
  signatureTags: string[];
}

export interface FeaturedAncestor extends AncestorCardSummary {
  playerBondTitle: string;
  resonanceSummary: string;
  rareForm: string;
  currentResidence: string;
  supportModes: string[];
}

export interface AncestorDetailPreview {
  id: string;
  name: string;
  courtesyName: string;
  era: string;
  profile: string;
  relationshipHooks: string[];
  unlockHints: string[];
  archiveLabel: string;
}

export interface NurtureSummary {
  cultivationStage: string;
  leafBalance: number;
  historicalFidelity: number;
  activeTags: string[];
  traitVector: TraitMetric[];
  moodSnapshot: MoodSnapshot;
  nextBondMilestone: string;
}

export interface TraitMetric {
  id: string;
  label: string;
  value: number;
  max: number;
  note: string;
  tone: "ink" | "vermilion" | "gold";
}

export interface MoodSnapshot {
  label: string;
  value: number;
  delta: number;
  statusLabel: string;
  summary: string;
  cause: string;
}

export interface FatePreview {
  id: string;
  title: string;
  era: string;
  statusLabel: string;
  tension: number;
  description: string;
  triggerHint: string;
  rewardLabel: string;
}

export interface GameplayModeCard {
  id: string;
  title: string;
  tagline: string;
  description: string;
  readiness: "mock-ready" | "future-hook";
  interactionHint: string;
  accent: "ink" | "vermilion" | "gold";
  ctaLabel: string;
}

export interface CreationHighlight {
  id: string;
  title: string;
  summary: string;
  ancestors: string[];
  format: string;
  hook: string;
  heat: number;
}

export interface ModeIntentPreview {
  modeId: string;
  title: string;
  intentSummary: string;
  requiredAncestors: string[];
  systemNotice: string;
  nextStepLabel: string;
}
