import type { ResearchReferenceId } from "@/lib/researchReferences";

export type AnalyticsCategoryGroup =
  | "Characters"
  | "Queer systems"
  | "Queer readings"
  | "Research coverage";

export type AnalyticsCategorySlug =
  | "playability"
  | "gender"
  | "sexuality"
  | "identity-categories"
  | "intersectionality"
  | "game-scale"
  | "system-types"
  | "affected-scopes"
  | "player-dependency"
  | "availability"
  | "queer-readings"
  | "research-status"
  | "evidence-confidence";

export type AnalyticsCategory = {
  slug: AnalyticsCategorySlug;
  title: string;
  menuLabel: string;
  group: AnalyticsCategoryGroup;
  eyebrow: string;
  summary: string;
  meaning: string;
  calculation: string;
  interpretation: string;
  denominator: string;
  multiple: boolean;
  sourceIds: ResearchReferenceId[];
};

export const ANALYTICS_CATEGORIES: AnalyticsCategory[] = [
  {
    slug: "playability",
    title: "Character playability",
    menuLabel: "Playability",
    group: "Characters",
    eyebrow: "Participation in play",
    summary: "Who the player can control, who remains non-playable, and which roles depend on a game option.",
    meaning: "Playability describes whether a documented character can be directly controlled by the player. It is separate from narrative importance: a protagonist may be non-playable, while a supporting character may be playable only in specific modes or chapters.",
    calculation: "Each character record is assigned to its recorded playable status. The API’s playable flag is used as a fallback when the status field is incomplete.",
    interpretation: "A higher playable share suggests more opportunities to inhabit a queer character, but it does not by itself measure narrative depth, agency, or quality of representation.",
    denominator: "all documented character records",
    multiple: false,
    sourceIds: ["lgbtq-archive", "data-feminism"],
  },
  {
    slug: "gender",
    title: "Gender and gender identity",
    menuLabel: "Gender identity",
    group: "Characters",
    eyebrow: "Documented identity",
    summary: "The gender identities explicitly recorded for characters in the Press Q dataset.",
    meaning: "This category records gender and gender-identity terms supported by the available evidence. It can include broad terms and more specific identities, while preserving the wording available to the archive.",
    calculation: "Each character contributes once to every gender or gender-identity tag recorded for that character. Empty and unknown values are grouped separately on this detailed page.",
    interpretation: "Percentages describe the documented character corpus, not the prevalence of an identity across games. Multi-identity records can make the percentages add up to more than 100%.",
    denominator: "all documented character records",
    multiple: true,
    sourceIds: ["lgbtq-archive", "glaad-terms", "data-feminism"],
  },
  {
    slug: "sexuality",
    title: "Sexuality",
    menuLabel: "Sexuality",
    group: "Characters",
    eyebrow: "Documented identity",
    summary: "Confirmed sexuality terms, with conditional and player-defined representation kept separate.",
    meaning: "Sexuality records how a character’s sexual orientation is described or evidenced. Fixed, confirmed identities are distinguished from identities that depend on player choices, remain implicit, or are not confirmed by the current evidence.",
    calculation: "Characters with confirmed queer status contribute to their recorded sexuality tags. Player-defined, ambiguous, and not-confirmed sexual-orientation records are grouped under Conditional or player-defined representation instead of being counted as fixed identities. Missing or none values appear as Not recorded, while an explicit unknown remains visible as Unknown.",
    interpretation: "The chart measures documentation within Press Q, not demographic prevalence. A possible heterosexual, bisexual, or asexual route is not treated as several simultaneous identities, and conditional cases remain available for research without inflating confirmed categories.",
    denominator: "all documented character records",
    multiple: true,
    sourceIds: ["lgbtq-archive", "glaad-terms", "data-feminism"],
  },
  {
    slug: "identity-categories",
    title: "Identity categories",
    menuLabel: "Identity categories",
    group: "Characters",
    eyebrow: "Analytical structure",
    summary: "Broad research dimensions used to organize identity evidence without replacing a character’s own terms.",
    meaning: "Identity categories are analytical groupings such as gender identity, sexual orientation, romantic orientation, intersex variation, and gender expression. They describe what kind of identity information a record contains.",
    calculation: "A character is counted once in every analytical category attached to the record. These categories are separate from the specific identity labels shown on the gender and sexuality pages.",
    interpretation: "Use this view to understand the archive’s structure and research coverage. Do not treat an analytical category as a personal identity label.",
    denominator: "all documented character records",
    multiple: true,
    sourceIds: ["glaad-terms", "data-feminism"],
  },
  {
    slug: "intersectionality",
    title: "Intersectional markers",
    menuLabel: "Intersectionality",
    group: "Characters",
    eyebrow: "Context and overlap",
    summary: "Documented social and cultural markers that shape how queer representation is situated.",
    meaning: "Intersectionality considers how sexuality and gender interact with race, ethnicity, disability, religion, class, age, nationality, migration, and other contexts. Press Q records only markers supported by evidence.",
    calculation: "Structured values and supported terms in older evidence notes are normalized to controlled axes such as race/ethnicity, nationality/migration, religion, class, and disability. Specific community details remain in the record cards. Records marked no are shown as None documented.",
    interpretation: "None documented means the field currently lacks a supported marker; it does not prove that the character has no intersectional identity. Percentages may overlap because one character can carry several markers.",
    denominator: "all documented character records",
    multiple: true,
    sourceIds: ["crenshaw-intersectionality", "data-feminism"],
  },
  {
    slug: "game-scale",
    title: "Game production scale",
    menuLabel: "Game scale",
    group: "Characters",
    eyebrow: "Production context",
    summary: "The recorded production scale of games associated with character entries.",
    meaning: "Game scale provides production context through labels such as AAA, AA, independent, mobile, browser, or student/amateur. It is a descriptive archive field, not a judgment of quality or reach.",
    calculation: "The chart counts character records by the game-scale tags attached to their game. A title with several documented characters contributes once for each character record.",
    interpretation: "This is not a unique-game distribution. Use the examples to see which characters and titles create each count, and note that hybrid scale labels can overlap.",
    denominator: "all documented character records",
    multiple: true,
    sourceIds: ["lgbtq-archive", "data-feminism"],
  },
  {
    slug: "system-types",
    title: "Queer system types",
    menuLabel: "System types",
    group: "Queer systems",
    eyebrow: "Game affordances",
    summary: "What games allow players to create, choose, express, or experience through their systems.",
    meaning: "A queer system is a game-level affordance rather than a character. Examples include pronoun selection, gender customization, same-gender romance, marriage, relationship systems, and queer family creation.",
    calculation: "Each system row contributes to one recorded system type. A single game can contribute several rows when it supports several distinct possibilities.",
    interpretation: "Counts describe documented affordances, not how prominently they appear or how well they are implemented. Character representation and systemic possibility remain separate units.",
    denominator: "all documented queer-system records",
    multiple: false,
    sourceIds: ["lgbtq-archive", "data-feminism"],
  },
  {
    slug: "affected-scopes",
    title: "Affected system scopes",
    menuLabel: "Affected scopes",
    group: "Queer systems",
    eyebrow: "Where systems operate",
    summary: "Which parts of a game are affected by each documented queer possibility.",
    meaning: "Scope identifies whether a system affects the player avatar, NPCs, relationships, family structures, or the broader game world.",
    calculation: "Each system record contributes once to every selected scope. A relationship system that affects both NPCs and the player avatar appears in both bars.",
    interpretation: "Because scopes can overlap, their percentages may exceed 100% when added together. The measure describes reach within game structures, not the quality of the experience.",
    denominator: "all documented queer-system records",
    multiple: true,
    sourceIds: ["lgbtq-archive", "data-feminism"],
  },
  {
    slug: "player-dependency",
    title: "Player dependency",
    menuLabel: "Player dependency",
    group: "Queer systems",
    eyebrow: "Agency and activation",
    summary: "How much a queer possibility depends on a player’s choice or configuration.",
    meaning: "Dependency distinguishes systems that exist without player action from those that are partially or fully activated by a choice. Full dependency means the experience exists only when the player selects it.",
    calculation: "Every system record is grouped by its single dependency value: none, partial, full, or Not recorded.",
    interpretation: "Dependency is not inherently positive or negative. It helps distinguish authored representation from optional or player-created representation.",
    denominator: "all documented queer-system records",
    multiple: false,
    sourceIds: ["lgbtq-archive", "data-feminism"],
  },
  {
    slug: "availability",
    title: "System availability",
    menuLabel: "Availability",
    group: "Queer systems",
    eyebrow: "Access conditions",
    summary: "How and when a documented queer system becomes available to players.",
    meaning: "Availability distinguishes systems present by default from optional, conditional, expansion or DLC, and mod-only content.",
    calculation: "Each system record contributes to its recorded availability value. Missing values are shown as Not recorded.",
    interpretation: "Availability reveals access conditions but does not indicate discoverability, cost, regional access, or how easy a condition is to satisfy unless those details are documented separately.",
    denominator: "all documented queer-system records",
    multiple: false,
    sourceIds: ["lgbtq-archive", "data-feminism"],
  },
  {
    slug: "queer-readings",
    title: "Queer readings",
    menuLabel: "Reading types",
    group: "Queer readings",
    eyebrow: "Reception and interpretation",
    summary: "Critical and audience interpretations preserved separately from canonical character identities.",
    meaning: "Queer readings document how critics, fans, or communities have interpreted a character, group, or theme when the available evidence does not establish a canonical LGBTQ+ identity. A reading may be open, contested, or explicitly refuted by a creator.",
    calculation: "Each queer-reading row contributes once to its documented reading type, such as sexuality, gender identity, gender expression, or queer theme. These records use only the queer-readings dataset and never enter character-identity denominators.",
    interpretation: "A count shows that an interpretation has been documented, not that the proposed identity is true. Read each card together with its status, counterevidence, confidence, and notes.",
    denominator: "all documented queer-reading records",
    multiple: false,
    sourceIds: ["lgbtq-archive", "data-feminism"],
  },
  {
    slug: "research-status",
    title: "Research status",
    menuLabel: "Research status",
    group: "Research coverage",
    eyebrow: "Workflow transparency",
    summary: "Where character, system, and queer-reading records currently sit in the Press Q research workflow.",
    meaning: "Research status makes unfinished work visible through stages such as identified or queued, in research, reviewed, and needs verification.",
    calculation: "Character, queer-system, and queer-reading records are combined only for this workflow view. Each record contributes to one status, with blank or unrecognized values shown as Not recorded.",
    interpretation: "Reviewed means the record passed the project’s current review stage; it does not mean the evidence can never change or that the archive is complete.",
    denominator: "all character, queer-system, and queer-reading records",
    multiple: false,
    sourceIds: ["lgbtq-archive", "fair-principles"],
  },
  {
    slug: "evidence-confidence",
    title: "Evidence confidence",
    menuLabel: "Evidence confidence",
    group: "Research coverage",
    eyebrow: "Evidence quality",
    summary: "The curator’s recorded confidence in the evidence supporting each entry.",
    meaning: "Confidence summarizes how strongly the available sources support an entry. Low, medium, and high describe evidence quality and clarity, not the value or importance of a character or system.",
    calculation: "Character, queer-system, and queer-reading records are counted by their single confidence value. For queer readings, confidence describes documentation of the interpretation and its context, not the truth of an identity claim.",
    interpretation: "Confidence is a curatorial assessment that can change when better sources are found. Compare it with research status rather than treating it as a permanent score.",
    denominator: "all character, queer-system, and queer-reading records",
    multiple: false,
    sourceIds: ["fair-principles", "data-feminism"],
  },
];

export const ANALYTICS_CATEGORY_GROUPS = (
  [
    "Characters",
    "Queer systems",
    "Queer readings",
    "Research coverage",
  ] as AnalyticsCategoryGroup[]
).map((group) => ({
  group,
  categories: ANALYTICS_CATEGORIES.filter((category) => category.group === group),
}));

export function getAnalyticsCategory(slug: string) {
  return ANALYTICS_CATEGORIES.find((category) => category.slug === slug);
}
