# Press Q data units and research coverage

Press Q keeps different kinds of LGBTQ+ game content in separate units of
analysis. This prevents a player-enabled possibility from being counted as a
canonical character identity.

## Data units

- `pressq_seed_dataset.csv` records identifiable characters and their coded
  gender, sexuality, narrative role, evidence, and intersectional context.
- `game_queer_systems.csv` records game-level affordances: character creation,
  gender or pronoun customization, romance, marriage, family creation, and
  related systems.

One system affordance occupies one row. A customizable avatar is not entered as
a canonical character unless the game provides an identifiable character whose
coding can be supported independently.

## Coverage principles

This schema responds to limitations articulated by Adrienne Shaw and the
[LGBTQ Video Game Archive](https://lgbtqgamearchive.com/about/limitations/),
while addressing a complementary research question about game systems.

1. **Documented cases are not prevalence estimates.** Press Q counts what has
   been identified and researched. It does not use its corpus to claim what
   percentage of all published games contains LGBTQ+ content.
2. **Research status remains visible.** `research_status` distinguishes an
   identified lead from work in progress, a reviewed entry, or an entry needing
   verification.
3. **Language gaps are measurable.** `source_language` records the language of
   the evidence rather than silently treating English-language coverage as
   universal.
4. **Discovery is not limited to prior lists.** `discovery_source` records
   whether a case came from an existing archive, community contribution,
   targeted search, playthrough, or another path.
5. **Games change across releases.** `platform_version` and `last_reviewed`
   preserve the platform, patch, expansion, or edition that was actually
   researched.
6. **Uncertainty is data.** `evidence_confidence` records the strength of the
   available evidence. Ambiguous or queerly read content should not be silently
   converted into canonical identity.
7. **Intersectionality requires evidence.** Character records may document
   race, class, disability, religion, and other axes when a source supports the
   coding. These identities must not be inferred from appearance or name.

## Boundaries and future units

Ambient LGBTQ+ content, queer readings, and homophobia or transphobia are not
automatically character records or system affordances. If Press Q expands to
those cases, they should use a third observation-level dataset. Analog games and
LGBTQ+ creators are also distinct research units. Creator identity in particular
requires careful sourcing and must not be inferred.

These separations let Press Q complement existing archival work without
presenting different kinds of evidence as equivalent.
