import type { Metadata } from "next";
import Link from "next/link";
import PrismPageHero from "@/components/PrismPageHero";
import ResearchReferences from "@/components/ResearchReferences";

export const metadata: Metadata = {
  title: "Methodology",
  description:
    "How the Press Q dataset, visual analytics, and Quiu support research into queer game representation.",
};

const PANEL =
  "pq-panel relative overflow-hidden p-5 sm:p-7";

const methods = [
  {
    label: "Structured data",
    text: "Press Q keeps characters, game systems, and queer readings in separate datasets so interpretation is not mistaken for identity confirmation.",
  },
  {
    label: "Queer game studies",
    text: "The project treats representation as cultural context, not just category counting, so the archive can support interpretation.",
  },
  {
    label: "AI-assisted querying",
    text: "Quiu's responses are constrained to information registered in the Press Q dataset to reduce unsupported claims and keep answers traceable.",
  },
  {
    label: "Visual analytics",
    text: "The interface surfaces patterns across identities and systems while giving contested or creator-refuted readings their own clearly qualified view.",
  },
];

const workflow = [
  {
    step: "01",
    title: "Discover",
    text: "Find candidate cases through existing archives, scholarship, journalism, community contributions, targeted searches, playthrough evidence, and official material. Discovery identifies a lead; it does not confirm it.",
  },
  {
    step: "02",
    title: "Choose the unit",
    text: "Decide whether the evidence concerns an identifiable character, a game-level affordance, or a documented queer reading. When more than one unit applies, create linked but separate records.",
  },
  {
    step: "03",
    title: "Gather evidence",
    text: "Record the source, evidence type, relevant quotation or scene context, language, platform or version, image provenance when applicable, and known counterevidence.",
  },
  {
    step: "04",
    title: "Code conservatively",
    text: "Use specific supported terms, preserve player-dependent outcomes, avoid inferring protected or personal identities, and leave a field unknown when the evidence cannot support a classification.",
  },
  {
    step: "05",
    title: "Qualify the claim",
    text: "Assign research status and evidence confidence, document limitations, and distinguish confirmation from implication, interpretation, rumor, or creator refutation.",
  },
  {
    step: "06",
    title: "Review and revise",
    text: "Check required fields and internal consistency before publication. Reviewed records remain versioned and correctable when new sources, releases, translations, or community knowledge emerge.",
  },
];

const codingRules = [
  {
    title: "No default identities",
    text: "Blank or unknown gender and sexuality fields remain visible as documentation gaps. They are never recoded as cisgender or heterosexual defaults.",
  },
  {
    title: "Specific terms are not opposites",
    text: "Trans man remains a man and trans woman remains a woman. Specific trans labels are stored for research visibility, not to place trans people outside their gender.",
  },
  {
    title: "Identity is not behavior",
    text: "A relationship, animation, costume, pronoun, or mannerism can be relevant evidence but does not automatically establish gender identity or sexual orientation.",
  },
  {
    title: "Player choice stays conditional",
    text: "Mutually exclusive routes are documented as player-defined outcomes. They are not split into several simultaneous canonical identities.",
  },
  {
    title: "Systems do not assign NPC identities",
    text: "Gender-independent romance documents a mechanic. It does not by itself make every compatible NPC canonically bisexual or pansexual.",
  },
  {
    title: "Interpretation remains interpretation",
    text: "Queer readings preserve reception history, including contested and creator-refuted cases, but never enter confirmed character-identity totals.",
  },
  {
    title: "Intersectionality requires evidence",
    text: "Race, ethnicity, religion, disability, class, nationality, and migration context are coded only when supported. Appearance and names are not sufficient.",
  },
  {
    title: "The researched version matters",
    text: "Platform, patch, expansion, localization, and release context can change content. Records should identify the version actually supported by the evidence.",
  },
];

const confidenceLevels = [
  {
    level: "High",
    text: "The specific claim is clearly supported by strong in-game, official, creator, or well-corroborated evidence.",
    caution: "Still revisable; it is not a score for representation quality.",
  },
  {
    level: "Medium",
    text: "The claim is supported but has a meaningful gap, indirect source, version restriction, translation issue, or interpretive qualification.",
    caution: "Not a numerical probability and not ‘half true.’",
  },
  {
    level: "Low",
    text: "The case is research-relevant but relies on limited, indirect, or substantially contested evidence.",
    caution: "Must be presented as uncertain and used as a lead for further research.",
  },
];

export default function MethodologyPage() {
  return (
    <main className="pq-page min-h-screen bg-[#f7f7fb] text-[#12152b]">
      <PrismPageHero
        eyebrow="Research protocol"
        title="Research"
        accent="Methodology"
        description="Press Q combines queer game studies, structured archive design, and constrained AI querying through Quiu to make representation patterns legible without flattening them."
      />

      <section className="relative px-5 py-12 sm:px-8 md:px-14 md:py-16 lg:px-20">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_0%,rgba(217,70,239,0.12),transparent_30%),radial-gradient(circle_at_82%_20%,rgba(34,211,238,0.1),transparent_28%)]" />

        <div className="relative z-10 mx-auto grid max-w-[1500px] gap-6 md:grid-cols-2">
          {methods.map((method) => (
            <section key={method.label} className={PANEL}>
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-fuchsia-400 via-cyan-300 to-yellow-200" />
              <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-cyan-300 sm:text-xs sm:tracking-[0.34em]">
                Method
              </p>
              <h2 className="mt-4 text-2xl font-black italic text-white sm:text-3xl">
                {method.label}
              </h2>
              <p className="mt-5 text-base leading-relaxed text-slate-300 sm:text-lg">
                {method.text}
              </p>
            </section>
          ))}
        </div>

        <section className={`${PANEL} relative z-10 mx-auto mt-8 max-w-[1500px]`}>
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-fuchsia-400 via-cyan-300 to-yellow-200" />
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-fuchsia-300 sm:text-xs sm:tracking-[0.34em]">
            Data boundaries
          </p>
          <h2 className="mt-4 text-2xl font-black italic text-white sm:text-3xl">
            The archive is built for cautious interpretation.
          </h2>
          <p className="mt-5 max-w-4xl text-base leading-relaxed text-slate-300 sm:text-lg">
            Press Q uses three distinct research units rather than guessing
            missing identity information. Queer readings preserve criticism,
            audience interpretation, and creator responses, but never enter
            confirmed character-identity percentages. When details are absent,
            Quiu should surface that absence instead of filling the gap with an
            unsupported inference.
          </p>
        </section>

        <section className={`${PANEL} relative z-10 mx-auto mt-8 max-w-[1500px]`}>
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-fuchsia-400 via-cyan-300 to-yellow-200" />
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-cyan-300 sm:text-xs sm:tracking-[0.34em]">
            Research workflow
          </p>
          <h2 className="mt-4 max-w-4xl text-2xl font-black italic text-white sm:text-3xl">
            From research lead to revisable archive record
          </h2>
          <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {workflow.map((item) => (
              <article key={item.step} className="border border-white/10 bg-black/25 p-5">
                <p className="font-mono text-[10px] font-black uppercase tracking-[0.2em] text-fuchsia-300">
                  Step {item.step}
                </p>
                <h3 className="mt-3 text-xl font-black text-white">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-300">{item.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className={`${PANEL} relative z-10 mx-auto mt-8 max-w-[1500px]`}>
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-fuchsia-400 via-cyan-300 to-yellow-200" />
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-fuchsia-300 sm:text-xs sm:tracking-[0.34em]">
            Coding protocol
          </p>
          <h2 className="mt-4 max-w-4xl text-2xl font-black italic text-white sm:text-3xl">
            Rules that prevent a label from outrunning its evidence
          </h2>
          <div className="mt-7 grid gap-4 md:grid-cols-2">
            {codingRules.map((rule) => (
              <article key={rule.title} className="border border-white/10 bg-black/25 p-5">
                <h3 className="text-lg font-black text-white">{rule.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-300">{rule.text}</p>
              </article>
            ))}
          </div>
        </section>

        <div className="relative z-10 mx-auto mt-8 grid max-w-[1500px] gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <section className={PANEL}>
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-fuchsia-400 via-cyan-300 to-yellow-200" />
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-yellow-200 sm:text-xs sm:tracking-[0.34em]">
              Evidence confidence
            </p>
            <h2 className="mt-4 text-2xl font-black italic text-white">
              Strength of support, not value
            </h2>
            <div className="mt-6 space-y-4">
              {confidenceLevels.map((item) => (
                <article key={item.level} className="border border-white/10 bg-black/25 p-4">
                  <h3 className="font-black text-white">{item.level}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{item.text}</p>
                  <p className="mt-2 text-xs leading-5 text-slate-400">
                    Caution: {item.caution}
                  </p>
                </article>
              ))}
            </div>
          </section>

          <section className={PANEL}>
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-fuchsia-400 via-cyan-300 to-yellow-200" />
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-cyan-300 sm:text-xs sm:tracking-[0.34em]">
              Analytics protocol
            </p>
            <h2 className="mt-4 text-2xl font-black italic text-white">
              Every percentage needs a denominator and a boundary
            </h2>
            <div className="mt-5 space-y-4 text-sm leading-6 text-slate-300 sm:text-base">
              <p>
                Character pages use all documented character records as their
                denominator; system pages use queer-system records; and
                queer-reading pages use queer-reading records. Research
                coverage pages combine the three units only to examine workflow
                metadata.
              </p>
              <p>
                Multi-value fields can place one record in more than one bar,
                so category assignments and percentages may add to more than
                the record total or 100%. Game-scale charts are weighted by
                character records rather than unique games.
              </p>
              <p>
                “Unknown,” “Not recorded,” and “None documented” are different
                limits. They are never evidence of a presumed cisgender,
                heterosexual, white, able-bodied, or otherwise default identity.
              </p>
            </div>
            <Link
              href="/analytics"
              className="mt-6 inline-flex border border-cyan-300/45 px-4 py-3 font-mono text-xs font-black uppercase tracking-[0.16em] text-white transition hover:bg-white/10"
            >
              Open annotated analytics →
            </Link>
          </section>
        </div>

        <section className={`${PANEL} relative z-10 mx-auto mt-8 max-w-[1500px]`}>
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-fuchsia-400 via-cyan-300 to-yellow-200" />
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-yellow-200 sm:text-xs sm:tracking-[0.34em]">
            Review, correction, and provenance
          </p>
          <h2 className="mt-4 text-2xl font-black italic text-white sm:text-3xl">
            “Reviewed” describes a stage, not permanent truth.
          </h2>
          <div className="mt-5 grid gap-5 text-base leading-relaxed text-slate-300 md:grid-cols-3">
            <p>
              Discovery source, evidence type, evidence source,
              platform/version, last-reviewed date, and confidence make the
              conditions of each record inspectable.
            </p>
            <p>
              Conflicting evidence should be preserved in notes or
              counterevidence rather than silently removed. Creator-refuted and
              contested readings remain visible with their qualification.
            </p>
            <p>
              Corrections can change labels, status, evidence, or inclusion.
              Future versions should retain a change history so researchers can
              understand why a record changed.
            </p>
          </div>
        </section>

        <div className="relative z-10 mx-auto mt-8 max-w-[1500px]">
          <ResearchReferences
            ids={[
              "lgbtq-archive",
              "glaad-terms",
              "data-feminism",
              "crenshaw-intersectionality",
              "fair-principles",
            ]}
            title="Methodological and terminological foundations"
          />
        </div>
      </section>
    </main>
  );
}
