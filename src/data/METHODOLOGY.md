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
- `queer_readings.csv` records critical and audience interpretations that are
  documented as queerly read, contested, or creator-refuted. These rows preserve
  reception history without turning speculation into canonical identity.

One system affordance occupies one row. A customizable avatar is not entered as
a canonical character unless the game provides an identifiable character whose
coding can be supported independently.

## Coverage principles

This schema responds to limitations articulated by Adrienne Shaw and the
[LGBTQ Video Game Archive](https://lgbtqgamearchive.com/about/about-archive/),
while addressing a complementary research question about game systems.

1. **Documented cases are not prevalence estimates.** Press Q counts what has
   been identified and researched. It does not use its corpus to claim what
   percentage of all published games contains LGBTQ+ content.
2. **Research status remains visible.** `research_status` distinguishes an
   identified lead from work in progress, a reviewed entry, or an entry needing
   verification.
3. **Discovery is not limited to prior lists.** `discovery_source` records
   whether a case came from an existing archive, community contribution,
   targeted search, playthrough, or another path.
4. **Games change across releases.** `platform_version` and `last_reviewed`
   preserve the platform, patch, expansion, or edition that was actually
   researched.
5. **Uncertainty is data.** `evidence_confidence` records the strength of the
   available evidence. Ambiguous or queerly read content should not be silently
   converted into canonical identity.
6. **Intersectionality requires evidence.** Character records may document
   race, class, disability, religion, and other axes when a source supports the
   coding. These identities must not be inferred from appearance or name.
7. **Player-defined outcomes are not fixed identities.** When mutually
   exclusive choices can produce queer and non-queer outcomes for the same
   character, the character uses `player_defined`, keeps the possible outcomes
   in its evidence notes, and remains separate from confirmed identity counts.
   The corresponding choice structure belongs in the queer-systems dataset.

## Queer readings and boundaries

Queer readings never contribute to confirmed character-identity percentages.
Their `evidence_confidence` field assesses how well the existence and context of
the reading are documented, not whether the proposed identity is canonically
true. `reading_status` keeps creator-refuted and contested interpretations
visible, and `counterevidence` prevents a reading from being presented without
its known qualifications.

Ambient LGBTQ+ content and homophobia or transphobia are not automatically
character records, system affordances, or queer readings. Analog games and
LGBTQ+ creators are also distinct research units. Creator identity in particular
requires careful sourcing and must not be inferred.

These separations let Press Q complement existing archival work without
presenting different kinds of evidence as equivalent.

## Research workflow

1. **Discover a lead.** Candidate records can come from existing archives,
   academic research, journalism, community contributions, targeted searches,
   playthroughs, videos, game text, or official material. Discovery is recorded
   separately from confirmation.
2. **Choose the unit of analysis.** Determine whether the evidence concerns an
   identifiable character, a game-level affordance, or a queer reading. When a
   case involves more than one unit, create separate records rather than
   collapsing the claims.
3. **Record evidence and provenance.** Preserve evidence type and source,
   platform/version, discovery source, relevant limitations, and the date of
   the most recent review. Image records should also preserve credit and a
   source URL.
4. **Code conservatively.** Use supported terms, do not infer identities from
   stereotypes, and leave fields unknown when evidence is insufficient.
5. **Qualify the record.** Assign research status and evidence confidence. For
   queer readings, record status and counterevidence.
6. **Review and revise.** Internal review checks required fields and consistency,
   but reviewed records remain correctable as new sources, translations,
   releases, or community knowledge become available.

## Controlled categories and identity terms

- General gender labels do not imply cisgender status. Trans men are men and
  trans women are women; trans-specific values preserve a documented trans
  dimension rather than defining an opposing gender.
- Gender identity, gender expression, sexual orientation, and romantic
  orientation are different analytical dimensions. Evidence for one must not
  be silently converted into another.
- Relationship behavior and romance mechanics can contribute evidence but do
  not automatically confirm a fixed sexual orientation.
- `unknown`, `not_recorded`, and `none_documented` are not interchangeable.
  Unknown means the value cannot currently be established; not recorded means
  the metadata are absent; none documented means the current record contains no
  supported marker. None of these is a presumed default identity.
- `other` is provisional schema feedback, not a judgment that an identity or
  system is marginal. Repeated use should trigger a controlled-vocabulary
  review.

Terminology is informed by the
[GLAAD glossary](https://glaad.org/whereweareontv23/glossary-of-terms/) while
specific terminology and historical context remain visible.

## Intersectional markers

Press Q uses intersectionality to examine how queer representation is situated
through multiple social positions and structures. Current controlled axes can
include race/ethnicity, person-of-color identification, nationality/migration,
religion, class, and disability. The interface derives these axes only from
supported structured values or explicit evidence notes; it does not infer them
from a name or image.

The controlled axes are broad and can overlap. They do not replace specific
community, national, racial, ethnic, religious, disability, or class terms in
the record. The approach is informed by Kimberlé Crenshaw’s foundational
[intersectionality analysis](https://chicagounbound.uchicago.edu/uclf/vol1989/iss1/8/),
which demonstrates why isolated, mutually exclusive categories can obscure
experiences at their intersections.

## Confidence and status

`research_status` describes workflow:

- `identified`: a queued research lead;
- `in_progress`: sources and coding are being developed;
- `reviewed`: the record passed the project’s current internal review stage;
- `needs_verification`: a material claim or source needs additional support.

Reviewed does not mean peer reviewed, exhaustive, permanently correct, or
creator endorsed.

`evidence_confidence` describes support for the specific record:

- `high`: clear direct, official, creator, or well-corroborated evidence;
- `medium`: supported but meaningfully qualified, indirect, version-specific,
  translated, incomplete, or in tension with other evidence;
- `low`: research-relevant but limited, indirect, or substantially contested.

Confidence is not a probability or a representation-quality score. For queer
readings it measures documentation of the reading and its context, not whether
the interpreted identity is canonically true.

## Analytics rules

- Character pages use all documented character records as the denominator.
- Queer-system pages use all documented queer-system records.
- Queer-reading pages use all documented queer-reading records.
- Research-coverage pages combine the three units only to examine shared
  workflow metadata.
- Multi-value fields can place one record in several categories. Assignments and
  percentages may therefore add to more than the record total or 100%.
- Game-scale analytics are weighted by character records, not unique games.
- Percentages describe the current Press Q corpus. They are never estimates of
  LGBTQ+ prevalence across all games.

Each detailed Analytics category provides its definition, inclusion boundary,
non-implications, denominator, examples, and an interpretation note.

## Responsible AI boundary

Quiu is instructed to use only the three Press Q datasets, follow the language
of the user’s latest question, preserve material qualifications, and state when
information is missing. The assistant must not convert system affordances or
queer readings into confirmed character identities.

Grounding reduces unsupported claims but does not guarantee accuracy. Quiu’s
answers remain generated summaries and require human source review before
publication or consequential use. This approach is informed by the
[NIST AI Risk Management Framework](https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-ai-rmf-10),
especially its emphasis on validity, transparency, explainability,
accountability, and human oversight.

## Research foundations

- Shaw, Adrienne, et al.
  [“About (Please Read First!).”](https://lgbtqgamearchive.com/about/about-archive/)
  *LGBTQ Video Game Archive*.
- D’Ignazio, Catherine, and Lauren F. Klein.
  [*Data Feminism*](https://data-feminism.mitpress.mit.edu/). MIT Press, 2020.
- Crenshaw, Kimberlé.
  [“Demarginalizing the Intersection of Race and Sex.”](https://chicagounbound.uchicago.edu/uclf/vol1989/iss1/8/)
  *University of Chicago Legal Forum*, 1989.
- Wilkinson, Mark D., et al.
  [“The FAIR Guiding Principles for Scientific Data Management and Stewardship.”](https://www.nature.com/articles/sdata201618)
  *Scientific Data* 3, 2016.
- GLAAD.
  [“Glossary of Terms.”](https://glaad.org/whereweareontv23/glossary-of-terms/)
  *Where We Are on TV 2023–2024*.
