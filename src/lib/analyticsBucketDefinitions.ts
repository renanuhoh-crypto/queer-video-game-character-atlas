import type { AnalyticsCategorySlug } from "@/lib/analyticsCategories";

export type AnalyticsBucketDefinition = {
  definition: string;
  included: string;
  doesNotMean: string;
  interpretation: string;
};

type PartialDefinition = Partial<AnalyticsBucketDefinition>;

const DEFAULTS: Record<AnalyticsCategorySlug, AnalyticsBucketDefinition> = {
  playability: {
    definition: "A recorded relationship between a character and direct player control.",
    included: "A record is included when its playability field matches this category.",
    doesNotMean: "It does not establish narrative importance, agency, screen time, or representation quality.",
    interpretation: "Read the percentage as a description of Press Q character records, not all queer characters or all games.",
  },
  gender: {
    definition: "A gender or gender-identity term supported by the evidence attached to a character record.",
    included: "A record is included only when this term is documented in the current coding.",
    doesNotMean: "It does not authorize assumptions about anatomy, sex assigned at birth, pronouns, transition, or cisgender status.",
    interpretation: "Treat the category as a documented label within a partial corpus; gender terms can overlap conceptually even when the dataset stores them separately.",
  },
  sexuality: {
    definition: "A sexual-orientation category or a qualified record of player-dependent representation.",
    included: "A record is included when the current evidence and queer-status fields support this classification.",
    doesNotMean: "A romance scene, player option, behavior, or fan interpretation alone does not automatically establish a fixed orientation.",
    interpretation: "The percentage describes the Press Q corpus and must be read with confirmation status, notes, and source evidence.",
  },
  "identity-categories": {
    definition: "A research dimension describing the kind of identity evidence contained in a record.",
    included: "A character is included when this analytical dimension is attached to the record.",
    doesNotMean: "This heading is not necessarily the character’s own identity label.",
    interpretation: "Use it to assess what Press Q is documenting, then consult the character’s specific labels and evidence.",
  },
  intersectionality: {
    definition: "A documented axis of social position or power that intersects with queer representation.",
    included: "A record is included when the structured field or evidence note supports this axis without relying on appearance or name-based inference.",
    doesNotMean: "The marker does not reduce the character to one trait or prove how the intersection operates in every scene.",
    interpretation: "Overlapping percentages are expected because a character can be situated across several axes at once.",
  },
  "game-scale": {
    definition: "A descriptive production-scale label attached to the game associated with a character record.",
    included: "Every character in a game carrying this tag contributes one record to the category.",
    doesNotMean: "It does not measure budget precisely, audience size, critical success, independence of creative control, or representation quality.",
    interpretation: "This is a character-weighted distribution, not a count of unique games or studios.",
  },
  "system-types": {
    definition: "A game-level affordance that can enable queer expression, relationships, or family structures.",
    included: "A system row is included when its primary system type matches this category.",
    doesNotMean: "The existence of an affordance does not confirm a specific character’s identity or guarantee equal narrative depth.",
    interpretation: "Read the card evidence for implementation, limits, platform, and access conditions.",
  },
  "affected-scopes": {
    definition: "The part of a game’s structure affected by a documented queer affordance.",
    included: "A system contributes once to every scope recorded for it.",
    doesNotMean: "Scope does not measure prominence, quality, frequency, or player satisfaction.",
    interpretation: "Totals can exceed the number of systems because a single affordance may affect several scopes.",
  },
  "player-dependency": {
    definition: "The degree to which a queer possibility requires player selection, configuration, or action.",
    included: "A system is included according to its single recorded dependency level.",
    doesNotMean: "More or less dependency is not automatically better; authored visibility and player agency answer different research questions.",
    interpretation: "Use this together with availability and system type to understand how the possibility is encountered.",
  },
  availability: {
    definition: "The access condition under which a documented queer system is available.",
    included: "A system contributes to the access category recorded for the researched version.",
    doesNotMean: "The label alone does not establish cost, regional availability, discoverability, accessibility, or permanence across patches.",
    interpretation: "Consult platform/version and limitations before comparing games.",
  },
  "queer-readings": {
    definition: "A documented critical, audience, or community interpretation organized by the focus of the reading.",
    included: "A reading is included when Press Q records evidence that the interpretation exists and preserves its status and counterevidence.",
    doesNotMean: "It does not confirm the subject’s canonical gender, sexuality, or creator intent.",
    interpretation: "Confidence measures documentation of the reading, not whether the proposed identity is true.",
  },
  "research-status": {
    definition: "A workflow state for a character, system, or queer-reading record.",
    included: "Each research unit contributes according to its current recorded stage.",
    doesNotMean: "A workflow label does not rank cultural value or guarantee that a conclusion will never change.",
    interpretation: "Use the status to distinguish provisional leads from entries that completed the project’s current review process.",
  },
  "evidence-confidence": {
    definition: "A curatorial assessment of how clearly the available sources support the specific record.",
    included: "Each research unit contributes to its current confidence level.",
    doesNotMean: "Confidence is not a score for representation quality, popularity, moral value, or canonical importance.",
    interpretation: "It is revisable and should be considered alongside evidence type, research status, platform/version, and notes.",
  },
};

const DEFINITIONS: Partial<
  Record<AnalyticsCategorySlug, Record<string, PartialDefinition>>
> = {
  playability: {
    playable: {
      definition: "The player can directly control the documented character in at least one researched part, mode, chapter, or version of the game.",
      included: "The record’s playable status is coded as Playable; the character does not need to be the sole or primary protagonist.",
      doesNotMean: "Playable does not guarantee continuous control, meaningful choice, a positive portrayal, or equal prominence with other playable characters.",
      interpretation: "This category captures an opportunity for player embodiment, which should be evaluated together with narrative role and evidence notes.",
    },
    non_playable: {
      definition: "The documented character is not directly controlled by the player in the researched game context.",
      included: "NPCs, companions, antagonists, historical figures, and other authored characters can enter this category when no playable segment is documented.",
      doesNotMean: "Non-playable does not mean unimportant, passive, minor, poorly written, or absent from the central narrative.",
      interpretation: "The percentage distinguishes control from observation; it does not evaluate the character’s agency inside the story.",
    },
    optional: {
      definition: "Direct control is available only through an optional route, mode, chapter, expansion, or configuration.",
      included: "The record must document the condition that makes the character playable.",
      doesNotMean: "Optional control should not be treated as universal across every playthrough or edition.",
      interpretation: "Check the record’s platform/version and notes to understand the boundary of the option.",
    },
  },
  gender: {
    man: {
      definition: "The evidence supports describing the character as a man.",
      included: "Records using the general label Man enter this category.",
      doesNotMean: "The label does not establish that the character is cisgender; trans men are men, even when a source or dataset preserves the more specific Trans man label separately.",
      interpretation: "Compare the specific evidence fields before treating general and trans-specific labels as mutually exclusive social categories.",
    },
    woman: {
      definition: "The evidence supports describing the character as a woman.",
      included: "Records using the general label Woman enter this category.",
      doesNotMean: "The label does not establish that the character is cisgender; trans women are women, even when a source or dataset preserves the more specific Trans woman label separately.",
      interpretation: "The bucket reflects stored terminology, not a claim that woman and trans woman are opposing genders.",
    },
    trans_man: {
      definition: "The evidence specifically documents the character as a trans man.",
      included: "The trans-specific classification must be supported by the game, official material, creator statement, or other evidence identified in the record.",
      doesNotMean: "Trans man is not a gender separate from man, and the category does not imply any particular body, transition history, or medical experience.",
      interpretation: "The separate bucket preserves a documented trans dimension for research while affirming that the character is a man.",
    },
    trans_woman: {
      definition: "The evidence specifically documents the character as a trans woman.",
      included: "The trans-specific classification must be supported by the game, official material, creator statement, or other evidence identified in the record.",
      doesNotMean: "Trans woman is not a gender separate from woman, and the category does not imply any particular body, transition history, or medical experience.",
      interpretation: "The separate bucket preserves a documented trans dimension for research while affirming that the character is a woman.",
    },
    non_binary: {
      definition: "The evidence documents a gender outside or not fully contained by the man/woman binary.",
      included: "The record must support the nonbinary label or a source term normalized to this umbrella category.",
      doesNotMean: "Nonbinary is not one uniform third gender, and it does not automatically mean that the character uses they/them pronouns or identifies as trans.",
      interpretation: "Consult the character’s specific wording and notes because experiences within the umbrella vary.",
    },
    genderfluid: {
      definition: "The evidence documents a gender that changes over time or across contexts, using the term genderfluid.",
      included: "The record must support the specific label rather than infer fluidity from clothing, avatar options, or inconsistent presentation.",
      doesNotMean: "Genderfluid does not prescribe which genders are experienced, how often change occurs, or which pronouns the character uses.",
      interpretation: "Preserve more specific source terminology and any temporal or narrative context recorded for the character.",
    },
    agender: {
      definition: "The evidence documents the character as agender or as not identifying with a gender.",
      included: "The specific term or a clearly equivalent supported description is required.",
      doesNotMean: "Agender does not imply androgynous expression, asexuality, or any particular pronouns.",
      interpretation: "Keep gender identity separate from expression, sexuality, and character design.",
    },
    genderqueer: {
      definition: "The evidence documents the character with the specific term genderqueer.",
      included: "The term is preserved when supported by the source or character context.",
      doesNotMean: "Genderqueer should not be treated as automatically identical to every nonbinary identity or to queer sexuality.",
      interpretation: "Respect the historical and source-specific use of the label rather than silently replacing it with a newer umbrella term.",
    },
    other: {
      definition: "The evidence supports a gender term not adequately represented by the current controlled vocabulary.",
      included: "Other is provisional and should be accompanied by the specific self-described or source term in the record.",
      doesNotMean: "It does not mean the identity is unknowable, marginal, or less valid.",
      interpretation: "Repeated use should trigger a vocabulary review so the supported term can be represented directly.",
    },
  },
  sexuality: {
    lesbian: {
      definition: "The current evidence supports the character’s lesbian identity or orientation.",
      included: "Confirmed records explicitly coded Lesbian enter this bucket.",
      doesNotMean: "A single same-gender interaction, fan reading, or player-selected route is not sufficient by itself.",
      interpretation: "Read the label with the record’s confirmation method and source evidence.",
    },
    gay: {
      definition: "The current evidence supports the character’s gay identity or orientation.",
      included: "Confirmed records explicitly coded Gay enter this bucket.",
      doesNotMean: "The category should not be inferred from gender expression, mannerisms, or a romance mechanic alone.",
      interpretation: "The count represents documented Press Q records, not all gay characters or games.",
    },
    bisexual: {
      definition: "The current evidence supports the character’s capacity for attraction to more than one gender or an explicit bisexual identity.",
      included: "Confirmed records explicitly coded Bisexual enter this bucket.",
      doesNotMean: "Bisexuality does not require equal attraction, prior relationships, or simultaneous partners, and it should not be inferred solely from a gender-independent romance system.",
      interpretation: "Preserve the source’s language and distinguish fixed characterization from player-dependent routes.",
    },
    pansexual: {
      definition: "The current evidence explicitly supports the character’s pansexual identity or orientation.",
      included: "Confirmed records coded Pansexual enter this bucket when the specific term is supported.",
      doesNotMean: "Compatibility with avatars of different genders does not automatically establish pansexuality for every romanceable NPC.",
      interpretation: "Use the specific label only when evidence supports it; otherwise document the game system separately.",
    },
    asexual: {
      definition: "The evidence supports an asexual identity or an experience of little or no sexual attraction.",
      included: "Confirmed records explicitly coded Asexual enter this bucket.",
      doesNotMean: "Asexual does not automatically mean aromantic, celibate, without relationships, or incapable of intimacy.",
      interpretation: "Sexual and romantic orientation should be recorded separately when the evidence distinguishes them.",
    },
    aromantic: {
      definition: "The evidence supports an aromantic identity or an experience of little or no romantic attraction.",
      included: "Confirmed records explicitly coded Aromantic enter this bucket.",
      doesNotMean: "Aromantic does not automatically mean asexual, without relationships, unemotional, or incapable of intimacy.",
      interpretation: "Romantic and sexual orientation should remain separate when the evidence distinguishes them.",
    },
    queer: {
      definition: "The evidence supports Queer as the character’s specific or intentionally broad identity term.",
      included: "The label is used when supported, including when a narrower term would not accurately preserve the source terminology.",
      doesNotMean: "Queer should not be imposed on a character or source that does not use or support it, especially given the term’s contested histories.",
      interpretation: "Treat it as a substantive label rather than a miscellaneous category.",
    },
    heterosexual: {
      definition: "The evidence supports a heterosexual orientation for a character whose inclusion in the queer-character dataset rests on another documented queer dimension, such as gender identity.",
      included: "The term should appear only when fixed heterosexual identity is supported independently of player-defined routes.",
      doesNotMean: "Heterosexuality does not make a trans, intersex, aromantic, or otherwise queer character non-queer, but a solely heterosexual cisgender character does not belong in the queer-character unit.",
      interpretation: "Use the character’s other identity categories to understand why the record is in scope.",
    },
    other: {
      definition: "The evidence supports a sexuality term not adequately represented by the current controlled vocabulary.",
      included: "Other is provisional and should retain the specific source or self-described term in notes.",
      doesNotMean: "It is not a synonym for unknown and does not make the identity less valid.",
      interpretation: "Repeated use should prompt a controlled-vocabulary update.",
    },
    conditional_or_player_defined: {
      definition: "The represented outcome depends on player choice, mutually exclusive routes, or evidence that does not support one fixed orientation.",
      included: "Player-defined sexuality and sexual-orientation records without confirmed queer status are kept here instead of being split across several fixed labels.",
      doesNotMean: "Every possible route is not simultaneously canonical, and a heterosexual route is not counted as a queer character identity merely because it is selectable.",
      interpretation: "This category preserves research value without inflating confirmed identity totals; consult the system record and character notes for the available possibilities.",
    },
  },
  "identity-categories": {
    gender_identity: {
      definition: "The character record contains evidence about gender or gender identity.",
      included: "The analytical tag is used when gender is relevant to why the record is included or how its queerness is documented.",
      doesNotMean: "Gender identity is not a specific identity label and does not imply that the character is transgender or nonbinary.",
      interpretation: "Consult the Gender page and the character card for the specific supported term.",
    },
    sexual_orientation: {
      definition: "The character record contains evidence about sexual orientation.",
      included: "The tag marks records where orientation is a documented analytical dimension.",
      doesNotMean: "It does not identify which orientation applies or whether the evidence is fixed, conditional, or player-defined.",
      interpretation: "Consult the Sexuality page, queer status, and evidence notes for the qualified classification.",
    },
    romantic_orientation: {
      definition: "The record distinguishes patterns of romantic attraction from sexual attraction.",
      included: "The tag is used only when the evidence supports a romantic-orientation dimension.",
      doesNotMean: "Romantic and sexual orientation should not be collapsed into one category without evidence.",
      interpretation: "Read the specific label and evidence rather than assuming equivalence with sexuality.",
    },
    intersex_variation: {
      definition: "The record documents an intersex variation as a relevant identity dimension.",
      included: "The tag requires explicit, appropriately sourced evidence.",
      doesNotMean: "Intersex is not a gender identity or sexual orientation and should not be inferred from appearance or anatomy speculation.",
      interpretation: "Use precise source terminology and avoid treating diverse intersex experiences as uniform.",
    },
    gender_expression: {
      definition: "The record concerns outward presentation or expression of gender rather than a confirmed gender identity.",
      included: "The tag applies when clothing, performance, name, pronouns, voice, or other presentation is the documented analytical focus.",
      doesNotMean: "Gender expression alone does not establish gender identity or sexuality.",
      interpretation: "Keep expression distinct from identity, especially when a case is better documented as a queer reading.",
    },
    other: {
      definition: "The record contains queer-relevant identity evidence not adequately represented by the project’s current controlled categories.",
      included: "Other is used provisionally when the evidence is relevant but the schema requires refinement.",
      doesNotMean: "It is not a judgment that the identity is marginal, unclear, or less important.",
      interpretation: "Treat repeated use of Other as a prompt to revise the schema and document a more precise category.",
    },
  },
  intersectionality: {
    race_ethnicity: {
      definition: "The record documents racial or ethnic positioning as relevant to the character’s representation or narrative context.",
      included: "Evidence may identify a racialized community, ethnicity, or a narrative shaped by racism; appearance and name alone are not sufficient.",
      doesNotMean: "This umbrella does not make race and ethnicity interchangeable or capture all differences within the category.",
      interpretation: "Read the character’s detailed evidence to understand the specific community and context being documented.",
    },
    person_of_color: {
      definition: "The evidence explicitly situates the character within a racialized group commonly described by the umbrella term Person of color.",
      included: "The category is applied only from supported details, not visual inference.",
      doesNotMean: "The umbrella should not replace a more specific racial, ethnic, Indigenous, or national identification when one is available.",
      interpretation: "Use it for aggregate coverage while retaining the precise identity and source terminology in the record.",
    },
    nationality_migration: {
      definition: "Nationality, migration, diaspora, borders, or citizenship materially situates the documented queer representation.",
      included: "The evidence must connect this context to the character or narrative rather than merely naming a game’s setting.",
      doesNotMean: "Nationality is not the same as race or ethnicity, and a country of origin should not be inferred from a name.",
      interpretation: "Read the detailed note for the specific relationship among place, migration, culture, and representation.",
    },
    religion: {
      definition: "Religious identity, institution, belief, or community context intersects with the character’s queer representation.",
      included: "The record must document religion as part of the character’s identity or narrative conditions.",
      doesNotMean: "The category does not imply one uniform relationship between religion and queerness.",
      interpretation: "Use the evidence note to distinguish personal belief, family context, institutions, conflict, and affirmation.",
    },
    class: {
      definition: "Socioeconomic position, labor, wealth, poverty, or class hierarchy is documented as relevant context.",
      included: "The evidence must support the class dimension; occupation or clothing alone is not enough without context.",
      doesNotMean: "Class cannot be reduced to income alone and should not be inferred from stereotypes.",
      interpretation: "Read the detailed record for how class interacts with identity, agency, and narrative conditions.",
    },
    disability: {
      definition: "Disability, chronic illness, neurodivergence, or access is documented as an intersecting dimension.",
      included: "The marker requires evidence appropriate to the specific representation and terminology.",
      doesNotMean: "It should not be inferred from scars, behavior, gameplay mechanics, or medicalized stereotypes.",
      interpretation: "Preserve the source’s specificity and the difference between impairment, disability, and narrative metaphor.",
    },
    age: {
      definition: "Age, generation, life stage, or age-based power is documented as relevant to the queer representation.",
      included: "The marker is used when age materially shapes the character’s position or narrative context, not merely because every character has an age.",
      doesNotMean: "The category should not flatten children, adolescents, adults, and elders into one experience.",
      interpretation: "Consult the evidence note for the specific life stage and why it matters to the analysis.",
    },
    other_axis: {
      definition: "A supported intersectional axis is present but is not yet represented by the project’s controlled vocabulary.",
      included: "The specific axis must be documented in the record even though the aggregate label is provisional.",
      doesNotMean: "Other does not mean unimportant, unknowable, or outside intersectional analysis.",
      interpretation: "Use the detailed note and treat repeated cases as evidence that the schema needs revision.",
    },
  },
  "game-scale": {
    aaa: {
      definition: "The associated game is coded as a large-scale commercial production commonly described as AAA.",
      included: "Each Press Q character record from a game carrying the AAA tag contributes to this count, including hybrid-tagged titles.",
      doesNotMean: "AAA is not a standardized budget threshold and does not guarantee reach, quality, or institutional support for queer content.",
      interpretation: "Compare characters and titles carefully because several characters from one game can dominate the count.",
    },
    aa: {
      definition: "The associated game is coded as a mid-scale commercial production commonly described as AA.",
      included: "Every character record from a game carrying this production tag contributes.",
      doesNotMean: "AA has no universal industry definition and should not be read as a precise budget or quality score.",
      interpretation: "Use the tag as provisional production context, not a stable market taxonomy.",
    },
    independent: {
      definition: "The associated game is coded as an independent production.",
      included: "Every character record from a game carrying the Independent tag contributes.",
      doesNotMean: "Independent does not necessarily mean small budget, self-published, single-author, or free from corporate funding.",
      interpretation: "The label describes the project’s current production-context coding and may require more specific funding or publishing metadata later.",
    },
    indie: {
      definition: "The associated game carries an Indie tag, including hybrid records that also use another production-scale label.",
      included: "Each matching character record contributes once to this tag.",
      doesNotMean: "Indie is not a precise or universally agreed production category.",
      interpretation: "Hybrid tags intentionally overlap; do not add the percentages as though the categories were exclusive.",
    },
    mobile: {
      definition: "The associated game is coded as a production designed primarily for mobile platforms.",
      included: "Every character record from a game carrying the Mobile production tag contributes to this count.",
      doesNotMean: "Mobile does not establish budget, business model, audience size, permanence of service, or representation quality.",
      interpretation: "Check platform, version, availability, and shutdown history before comparing a mobile title with currently accessible games.",
    },
  },
  "system-types": {
    gender_customization: {
      definition: "The game lets a player configure a gender-related aspect of an avatar or character.",
      included: "The system must expose a documented gender-related choice such as a body type, gender marker, title, or presentation option.",
      doesNotMean: "Customization does not guarantee nonbinary recognition, respectful language, narrative acknowledgement, or independence from binary constraints.",
      interpretation: "Consult the limitations field for what can be combined and how the game responds to the choice.",
    },
    sexuality_customization: {
      definition: "The game lets player choices shape a protagonist or avatar’s represented sexual or romantic possibilities.",
      included: "The system row documents selectable or route-dependent outcomes related to sexuality.",
      doesNotMean: "Possible outcomes are not simultaneous fixed identities, and the system does not confirm every compatible NPC’s orientation.",
      interpretation: "Character identity claims remain separate; use the system to describe player-authored possibility.",
    },
    same_gender_romance: {
      definition: "The game permits at least one romance between characters presented as the same gender in the researched configuration.",
      included: "A documented romance route, relationship option, or equivalent mechanic supports the system row.",
      doesNotMean: "Availability alone does not establish equal content, a happy outcome, a fixed protagonist identity, or a partner’s canonical orientation.",
      interpretation: "Review route length, restrictions, consequences, and platform/version where those details are available.",
    },
    gender_independent_romance: {
      definition: "A romance option remains available across more than one player-avatar gender configuration.",
      included: "The documented romance logic does not restrict compatibility to one avatar gender.",
      doesNotMean: "The mechanic does not automatically make every romanceable NPC bisexual or pansexual as a canonical character identity.",
      interpretation: "Treat this as a property of the romance system unless character-specific evidence establishes an identity independently.",
    },
    same_gender_marriage: {
      definition: "The game permits a marriage between characters presented as the same gender in the researched configuration.",
      included: "A documented marriage mechanic or route supports the row.",
      doesNotMean: "Marriage access alone does not establish romantic depth, social recognition throughout the game world, or fixed character orientation.",
      interpretation: "Use scope and limitations to understand whether marriage changes family, inheritance, dialogue, or world state.",
    },
    queer_family_creation: {
      definition: "The game permits a family structure that can include queer partners, parents, or player-created identities.",
      included: "A documented system supports family creation beyond a solely different-gender default.",
      doesNotMean: "The category does not guarantee equal mechanics, narrative acknowledgement, or freedom from heteronormative constraints.",
      interpretation: "Read the system description for adoption, parenting, inheritance, household, or generation-specific limits.",
    },
    relationship_system: {
      definition: "A broader relationship mechanic supports queer possibilities that are not adequately described by one narrower romance or marriage tag.",
      included: "The row documents relationship logic, compatibility, partnership, or social bonds relevant to queer play.",
      doesNotMean: "A generic relationship meter is not queer by itself; the recorded possibility must be supported by evidence.",
      interpretation: "Use the system description to see which relationships are possible and which restrictions remain.",
    },
    other: {
      definition: "A documented queer-relevant affordance is not yet represented by the controlled system-type vocabulary.",
      included: "Other is used provisionally when the system is supported but the schema lacks an adequate specific tag.",
      doesNotMean: "It does not imply the system is minor or methodologically unimportant.",
      interpretation: "Repeated Other records should trigger a vocabulary review and, when justified, a new controlled category.",
    },
  },
  "affected-scopes": {
    player_avatar: {
      definition: "The affordance changes or enables something about the player-controlled avatar.",
      included: "Character creation, identity configuration, avatar relationships, or avatar family systems can contribute.",
      doesNotMean: "An avatar-facing system does not necessarily affect NPC dialogue, world recognition, or authored characters.",
      interpretation: "Compare with NPC, relationship, and family scopes to understand how far the system extends.",
    },
    npc: {
      definition: "The affordance affects non-player characters, their compatibility, roles, dialogue, or relationships.",
      included: "The system description explicitly documents an NPC-facing effect.",
      doesNotMean: "It does not confirm that every affected NPC has a fixed queer identity.",
      interpretation: "Character-specific claims require separate evidence in the character dataset.",
    },
    relationships: {
      definition: "The affordance structures romance, partnership, marriage, or another relationship between characters.",
      included: "A system contributes when relationships are a documented operational scope.",
      doesNotMean: "Relationship scope does not indicate depth, equality, duration, or narrative outcome.",
      interpretation: "Read it with system type, dependency, and availability to understand the actual possibility.",
    },
    family: {
      definition: "The affordance affects household, parenting, adoption, descendants, or another family structure.",
      included: "The system must document a family-level consequence or possibility.",
      doesNotMean: "Family scope does not guarantee that every family form receives equivalent mechanics or recognition.",
      interpretation: "Consult the limitations for generational, gender, partner, or platform restrictions.",
    },
    world: {
      definition: "The affordance affects broader social rules, institutions, simulation, or world-state responses.",
      included: "The evidence must show impact beyond an individual character or relationship.",
      doesNotMean: "World scope does not imply that the entire game world is affirming or consistently responsive.",
      interpretation: "Use documented examples to determine the breadth and contradictions of the response.",
    },
  },
  "player-dependency": {
    none: {
      definition: "The documented queer possibility exists without the player selecting or constructing it.",
      included: "The system or authored content is present by default in the researched context.",
      doesNotMean: "No dependency does not guarantee visibility, prominence, discoverability, or positive treatment.",
      interpretation: "This category is useful for distinguishing authored presence from player-activated possibility.",
    },
    partial: {
      definition: "The queer possibility has an authored basis but depends partly on player choice, route, or configuration.",
      included: "A player action affects whether or how the possibility appears, while the game supplies meaningful pre-authored structure.",
      doesNotMean: "Partial is not a precise percentage and does not rank the quality of authorship or agency.",
      interpretation: "The system description should identify which elements are fixed and which are selected.",
    },
    full: {
      definition: "The queer possibility appears only when the player chooses, builds, or activates it.",
      included: "Without the relevant player action, the documented possibility is absent from that playthrough or configuration.",
      doesNotMean: "Full dependency does not make the representation unreal or unimportant, but it should not be described as unavoidable authored characterization.",
      interpretation: "Use this label to study player agency and optionality, not as a simple quality score.",
    },
  },
  availability: {
    default: {
      definition: "The system is part of the researched base version without a separate optional add-on.",
      included: "The affordance is available under ordinary access conditions for that version.",
      doesNotMean: "Default does not necessarily mean immediately visible, universally unlocked, free in every market, or unchanged across platforms.",
      interpretation: "Check version and limitations before generalizing access.",
    },
    optional: {
      definition: "The system is available through an optional feature, mode, path, or configuration.",
      included: "Players can access it without it being mandatory for all playthroughs.",
      doesNotMean: "Optional does not specify whether the feature costs money, is hidden, or is available on every platform.",
      interpretation: "The record should be read with its documented access condition.",
    },
    conditional: {
      definition: "The system becomes available only when documented in-game requirements or choices are satisfied.",
      included: "Routes, compatibility rules, progression, configuration, or other conditions gate the possibility.",
      doesNotMean: "Conditional does not reveal how difficult, obscure, unequal, or reversible the requirement is.",
      interpretation: "Consult the limitations for the precise condition and affected version.",
    },
    expansion: {
      definition: "The system is documented in an expansion, DLC, or comparable added release rather than solely in the base game.",
      included: "The researched affordance requires or originates in the named additional content.",
      doesNotMean: "Expansion content is not necessarily available, affordable, or canonically integrated for every player and platform.",
      interpretation: "Compare release, price, platform, and version only when those facts are separately documented.",
    },
    mod_only: {
      definition: "The queer possibility is documented only through player-created modification rather than the unmodified researched release.",
      included: "A specific mod or modification pathway supports the affordance.",
      doesNotMean: "Mod-only content should not be attributed to the original developer or counted as a base-game system.",
      interpretation: "Preserve the mod, version, community, and access context wherever possible.",
    },
  },
  "queer-readings": {
    sexuality: {
      definition: "The documented interpretation concerns a subject’s possible sexuality, desire, romance, or erotic meaning.",
      included: "Press Q records the existence and context of a supported audience or critical reading.",
      doesNotMean: "The subject is not counted as canonically lesbian, gay, bisexual, pansexual, asexual, or queer from this reading alone.",
      interpretation: "Read status and counterevidence to see whether the interpretation is open, contested, or creator-refuted.",
    },
    gender_identity: {
      definition: "The documented interpretation concerns a subject’s possible gender identity.",
      included: "The reading must be traceable to criticism, audience discourse, textual analysis, or another documented source.",
      doesNotMean: "Pronouns, body design, transformation, or symbolism alone do not become a confirmed identity claim.",
      interpretation: "Keep the reading separate from character gender totals and preserve creator responses or counterevidence.",
    },
    gender_expression: {
      definition: "The documented interpretation concerns gender presentation, performance, coding, or expression.",
      included: "The evidence documents how a subject has been read in relation to gendered presentation.",
      doesNotMean: "Gender expression does not by itself establish gender identity or sexual orientation.",
      interpretation: "Use this category to preserve reception history while keeping identity claims qualified.",
    },
    queer_theme: {
      definition: "The documented reading concerns a theme, metaphor, mechanic, world, or narrative pattern rather than one character identity.",
      included: "A source supports a queer interpretive framework for the broader subject.",
      doesNotMean: "A queer theme does not make every character canonically queer or prove creator intent.",
      interpretation: "Assess the reading’s argument, context, counterevidence, and reception status.",
    },
    queerly_read: {
      definition: "A documented audience, community, or critical interpretation reads the subject through a queer lens.",
      included: "Press Q can trace the interpretation to a source and records its context, evidence, and relevant qualifications.",
      doesNotMean: "The reading does not confirm canonical identity, creator intent, or universal agreement among players and critics.",
      interpretation: "Treat the entry as reception history and consult its evidence and counterevidence before repeating the interpretation.",
    },
    contested: {
      definition: "The queer interpretation is documented, but material evidence or competing interpretations substantially qualify or dispute it.",
      included: "Press Q preserves both the reading and the counterevidence instead of resolving uncertainty as a confirmed identity.",
      doesNotMean: "Contested does not automatically mean false, malicious, or methodologically irrelevant.",
      interpretation: "Describe the disagreement explicitly and never include this bucket in confirmed character-identity totals.",
    },
    creator_refuted: {
      definition: "A documented queer interpretation was explicitly rejected or contradicted by a relevant creator, publisher, or official source.",
      included: "The record preserves the original reading together with a traceable official response or contradiction.",
      doesNotMean: "Creator refutation erases neither audience reception nor the text’s capacity to support critical analysis.",
      interpretation: "Report the interpretation and refutation together; do not present the proposed identity as canonical.",
    },
  },
  "research-status": {
    identified: {
      definition: "The record is a discovered research lead that has not completed full investigation.",
      included: "Enough information exists to queue the case, but coding and evidence review remain incomplete.",
      doesNotMean: "Identified does not mean confirmed or ready for unqualified public claims.",
      interpretation: "Treat it as a visible research backlog and invitation for evidence, not a finished entry.",
    },
    in_progress: {
      definition: "Research and coding are actively underway.",
      included: "Sources are being gathered, compared, or translated and fields may still change.",
      doesNotMean: "In research is not a confidence rating and does not imply that the entry will be accepted unchanged.",
      interpretation: "Cite provisional details cautiously and revisit after review.",
    },
    reviewed: {
      definition: "The record completed Press Q’s current internal review stage.",
      included: "Required fields and available evidence have been checked against the project’s present protocol.",
      doesNotMean: "Reviewed does not mean peer reviewed, exhaustive, permanently correct, or endorsed by a character’s creators.",
      interpretation: "The record can still be revised when stronger sources, versions, corrections, or community knowledge emerge.",
    },
    needs_verification: {
      definition: "A material claim or source requires additional confirmation before the record can be treated as reviewed.",
      included: "Conflicting evidence, inaccessible sources, uncertain translation, or incomplete provenance can trigger this state.",
      doesNotMean: "The category does not prove that the claim is false.",
      interpretation: "Use the record as a research lead and inspect its notes before citing it.",
    },
  },
  "evidence-confidence": {
    high: {
      definition: "The available evidence clearly supports the specific claim recorded in the research unit.",
      included: "Strong in-game evidence, official documentation, direct creator statements, or well-corroborated sources may support this assessment.",
      doesNotMean: "High confidence is not a representation-quality score, and for queer readings it supports the documented existence of the reading rather than proving the proposed identity.",
      interpretation: "Even high-confidence records remain versioned and open to correction.",
    },
    medium: {
      definition: "The evidence supports the record but retains a meaningful qualification, gap, or interpretive dependency.",
      included: "Sources may be credible yet incomplete, indirect, version-specific, translated, or in tension with other evidence.",
      doesNotMean: "Medium does not mean a fifty-percent probability or a half-true claim.",
      interpretation: "Read the evidence type, notes, limitations, and counterevidence before reuse.",
    },
    low: {
      definition: "The record preserves a relevant lead or documented interpretation whose supporting evidence is limited, indirect, or substantially contested.",
      included: "The project keeps the case visible when its uncertainty is itself research-relevant.",
      doesNotMean: "Low confidence does not make a claim false, but it does prevent unqualified presentation as established fact.",
      interpretation: "Use it as a prompt for further research and state the uncertainty explicitly.",
    },
  },
};

const MISSING_DEFINITIONS: Record<string, PartialDefinition> = {
  unknown: {
    definition: "The source or current coding explicitly leaves this value unknown.",
    included: "The record contains an Unknown value rather than a supported specific classification.",
    doesNotMean: "Unknown is not an identity and must not be converted into a presumed default.",
    interpretation: "Its percentage measures a documentation gap in Press Q, not the absence of queer identity or content.",
  },
  not_recorded: {
    definition: "No usable value is currently recorded for this field.",
    included: "Blank, none, or not-provided values are grouped here for analytical transparency.",
    doesNotMean: "Not recorded does not mean none exists, not applicable, heterosexual, cisgender, or negative evidence.",
    interpretation: "Treat the count as a data-completeness indicator and a priority for further research.",
  },
  none_documented: {
    definition: "The current record does not document a supported marker for this analytical field.",
    included: "The source field is explicitly marked no or the existing note states that none is documented.",
    doesNotMean: "It does not prove that the character lacks intersecting identities or social context.",
    interpretation: "Read it as a limit of the present record and evidence, not an ontological claim about the character.",
  },
  documented_unspecified: {
    definition: "The record indicates that a relevant marker exists but does not yet provide a sufficiently structured, specific category.",
    included: "A positive marker is present without enough supported detail for a more precise axis.",
    doesNotMean: "The project should not guess the missing identity or social category.",
    interpretation: "This is a visible metadata problem that should be resolved through source review.",
  },
};

export function getAnalyticsBucketDefinition(
  slug: AnalyticsCategorySlug,
  key: string,
): AnalyticsBucketDefinition {
  return {
    ...DEFAULTS[slug],
    ...(MISSING_DEFINITIONS[key] || {}),
    ...(DEFINITIONS[slug]?.[key] || {}),
  };
}
