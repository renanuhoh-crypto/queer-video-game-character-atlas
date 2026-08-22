export type AnalyticsCategoryGroup = "Characters" | "Queer systems" | "Research coverage";

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
  | "research-status"
  | "evidence-confidence"
  | "source-languages";

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
  },
  {
    slug: "sexuality",
    title: "Sexuality",
    menuLabel: "Sexuality",
    group: "Characters",
    eyebrow: "Documented identity",
    summary: "The sexual-orientation and sexuality terms documented for characters.",
    meaning: "Sexuality records how a character’s sexual orientation is described or evidenced. A label may be explicit in the game, confirmed externally, inferred from relationships, or unavailable in the current evidence.",
    calculation: "Each character contributes once to every recorded sexuality tag. Missing, none, and unknown values are kept visible as Not recorded rather than silently removed.",
    interpretation: "The chart measures documentation within Press Q. It should not be read as a demographic estimate, and the same character may appear in more than one category when a composite identity is documented.",
    denominator: "all documented character records",
    multiple: true,
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
  },
  {
    slug: "intersectionality",
    title: "Intersectional markers",
    menuLabel: "Intersectionality",
    group: "Characters",
    eyebrow: "Context and overlap",
    summary: "Documented social and cultural markers that shape how queer representation is situated.",
    meaning: "Intersectionality considers how sexuality and gender interact with race, ethnicity, disability, religion, class, age, nationality, migration, and other contexts. Press Q records only markers supported by evidence.",
    calculation: "Explicit marker values are counted directly. For older yes/no records, detailed marker text is used when it contains structured terms. Records marked no are shown as None documented.",
    interpretation: "None documented means the field currently lacks a supported marker; it does not prove that the character has no intersectional identity. Percentages may overlap because one character can carry several markers.",
    denominator: "all documented character records",
    multiple: true,
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
  },
  {
    slug: "research-status",
    title: "Research status",
    menuLabel: "Research status",
    group: "Research coverage",
    eyebrow: "Workflow transparency",
    summary: "Where character and system records currently sit in the Press Q research workflow.",
    meaning: "Research status makes unfinished work visible through stages such as identified or queued, in research, reviewed, and needs verification.",
    calculation: "Character and queer-system records are combined only for this workflow view. Each record contributes to one status, with blank or unrecognized values shown as Not recorded.",
    interpretation: "Reviewed means the record passed the project’s current review stage; it does not mean the evidence can never change or that the archive is complete.",
    denominator: "all character and queer-system records",
    multiple: false,
  },
  {
    slug: "evidence-confidence",
    title: "Evidence confidence",
    menuLabel: "Evidence confidence",
    group: "Research coverage",
    eyebrow: "Evidence quality",
    summary: "The curator’s recorded confidence in the evidence supporting each entry.",
    meaning: "Confidence summarizes how strongly the available sources support an entry. Low, medium, and high describe evidence quality and clarity, not the value or importance of a character or system.",
    calculation: "Character and queer-system records are counted by their single confidence value. Blank or unrecognized values appear as Not recorded.",
    interpretation: "Confidence is a curatorial assessment that can change when better sources are found. Compare it with research status rather than treating it as a permanent score.",
    denominator: "all character and queer-system records",
    multiple: false,
  },
  {
    slug: "source-languages",
    title: "Source languages",
    menuLabel: "Source languages",
    group: "Research coverage",
    eyebrow: "Language gaps",
    summary: "The languages of sources used to document character and system records.",
    meaning: "Source language helps reveal which linguistic communities are represented in the research process and where the archive may be relying too heavily on a narrow set of sources.",
    calculation: "Each record contributes once to every source-language code attached to it. Records without a language code are shown as Not recorded.",
    interpretation: "This measures records by source language, not the number of individual sources or the language in which a game was originally released. Multi-language records can overlap.",
    denominator: "all character and queer-system records",
    multiple: true,
  },
];

export const ANALYTICS_CATEGORY_GROUPS = (
  ["Characters", "Queer systems", "Research coverage"] as AnalyticsCategoryGroup[]
).map((group) => ({
  group,
  categories: ANALYTICS_CATEGORIES.filter((category) => category.group === group),
}));

export function getAnalyticsCategory(slug: string) {
  return ANALYTICS_CATEGORIES.find((category) => category.slug === slug);
}
