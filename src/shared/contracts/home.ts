export interface HomePageData {
  brandTitle: string;
  brandSubtitle: string;
  seasonLabel: string;
  heroNotice: string;
  floatingActionLabel: string;
  featuredAncestor: FeaturedAncestor;
  roster: AncestorCardSummary[];
  nurtureSummary: NurtureSummary;
  fatePreviews: FatePreview[];
  gameplayModes: GameplayModeCard[];
  creationHighlights: CreationHighlight[];
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

