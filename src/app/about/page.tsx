import type { Metadata } from "next";
import PrismPageHero from "@/components/PrismPageHero";
import ResearchReferences from "@/components/ResearchReferences";

export const metadata: Metadata = {
  title: "About",
  description:
    "Learn about Press Q, its research goals, the Press Q dataset, and Quiu.",
};

const PANEL =
  "pq-panel relative overflow-hidden p-5 sm:p-7";

const goals = [
  {
    title: "Representation",
    text: "Make queer characters, game systems, and the history of critical interpretation visible through structured data.",
  },
  {
    title: "Research",
    text: "Support analysis of identity, playability, narrative role, intersectionality, game systems, evidence quality, and research gaps without presenting the corpus as universal.",
  },
  {
    title: "Access",
    text: "Create a public-facing interface where users can ask questions about queer game characters naturally.",
  },
];

const quickFacts = [
  ["Name", "Press Q"],
  ["Project type", "AI-Assisted Queer Game Archive"],
  ["Focus", "Characters, systems, and queer readings"],
  ["Status", "Prototype v1.0"],
];

const researchUnits = [
  {
    number: "01",
    title: "Character records",
    definition:
      "Identifiable characters whose queer identity, coding, or relevance can be documented with record-level evidence.",
    includes:
      "Names, games, roles, playability, supported gender or sexuality terms, intersectional context, evidence, version, and review metadata.",
    excludes:
      "A generic customizable avatar, an isolated game mechanic, or a fan interpretation without independently supported character evidence.",
  },
  {
    number: "02",
    title: "Queer-system records",
    definition:
      "Game-level affordances that let players create, configure, choose, or experience queer possibilities.",
    includes:
      "Gender and sexuality customization, romance, marriage, relationship, and family systems together with scope, dependency, access, and limitations.",
    excludes:
      "Automatic claims that every compatible NPC has a fixed queer identity or that every possible player route is simultaneously canonical.",
  },
  {
    number: "03",
    title: "Queer-reading records",
    definition:
      "Documented critical, audience, or community interpretations whose historical and cultural significance should be preserved without being converted into canon.",
    includes:
      "Reading type, subject, summary, status, counterevidence, source, confidence, and known creator response.",
    excludes:
      "Confirmed character-identity totals. A documented interpretation remains an interpretation, including when it is widespread or compelling.",
  },
];

const canAnswer = [
  "Which documented characters or systems match a defined research category?",
  "How are records distributed inside the current Press Q corpus?",
  "Which examples, evidence notes, and qualifications sit behind a number?",
  "Where are language, evidence, review, version, or metadata gaps visible?",
];

const cannotAnswer = [
  "What percentage of all video games contains LGBTQ+ representation.",
  "Whether one identity, studio, platform, or production scale is represented fairly across the entire medium.",
  "A character’s unstated identity based on appearance, name, behavior, pronouns alone, or stereotype.",
  "Whether representation is good or harmful from a count alone; cultural and narrative analysis is still required.",
];

export default function AboutPage() {
  return (
    <main className="pq-page min-h-screen bg-[#f7f7fb] text-[#12152b]">
      <PrismPageHero
        eyebrow="Archive identity"
        title="About"
        accent="Press Q"
        description="Press Q is a digital humanities prototype for reading queer game representation through the Press Q dataset, visual analytics, and AI-assisted querying through Quiu."
      />

      <section className="relative px-5 py-12 sm:px-8 md:px-14 md:py-16 lg:px-20">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_0%,rgba(217,70,239,0.12),transparent_30%),radial-gradient(circle_at_88%_14%,rgba(34,211,238,0.1),transparent_28%)]" />

        <div className="relative z-10 mx-auto grid max-w-[1500px] gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <section className={PANEL}>
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-fuchsia-400 via-cyan-300 to-yellow-200" />
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-cyan-300 sm:text-xs sm:tracking-[0.34em]">
              Description
            </p>

            <div className="mt-5 space-y-5 text-base leading-relaxed text-slate-300 sm:mt-6 sm:text-lg">
              <p>
                Press Q is an AI-Assisted Queer Game Archive for exploring
                queer representation in video games.
              </p>

              <p>
                The project combines three separate research units — queer
                characters, game systems, and queer readings — with visual
                analytics and natural-language querying.
              </p>

              <p>
                Press Q is designed as a living archive interface: a way to
                make patterns of queer game representation easier to explore
                while keeping the Press Q dataset grounded, structured, and
                reviewable.
              </p>

              <p>
                “Archive” here describes a curated, evolving collection of
                research information rather than a complete repository of all
                primary materials. Press Q is a starting point for inquiry,
                not a final authority on queer game history.
              </p>
            </div>
          </section>

          <aside className={PANEL}>
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-fuchsia-400 via-cyan-300 to-yellow-200" />
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-fuchsia-300 sm:text-xs sm:tracking-[0.34em]">
              Quick facts
            </p>

            <div className="mt-7 space-y-6">
              {quickFacts.map(([label, value]) => (
                <div key={label}>
                  <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-slate-500 sm:text-xs sm:tracking-[0.24em]">
                    {label}
                  </p>
                  <p className="mt-2 text-lg font-black text-white">{value}</p>
                </div>
              ))}
            </div>
          </aside>
        </div>

        <section className={`${PANEL} relative z-10 mx-auto mt-8 max-w-[1500px]`}>
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-fuchsia-400 via-cyan-300 to-yellow-200" />
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-cyan-300 sm:text-xs sm:tracking-[0.34em]">
            Scope of the archive
          </p>
          <h2 className="mt-4 max-w-4xl text-2xl font-black italic text-white sm:text-3xl">
            Three research units answer different questions.
          </h2>
          <p className="mt-4 max-w-5xl text-base leading-relaxed text-slate-300 sm:text-lg">
            Press Q never treats a character, a game mechanic, and an
            interpretation as interchangeable evidence. Separating them makes
            the analytics more conservative and lets users see where a claim
            comes from.
          </p>

          <div className="mt-7 grid gap-4 lg:grid-cols-3">
            {researchUnits.map((unit) => (
              <article key={unit.title} className="border border-white/10 bg-black/25 p-5">
                <p className="font-mono text-[10px] font-black uppercase tracking-[0.2em] text-fuchsia-300">
                  Unit {unit.number}
                </p>
                <h3 className="mt-3 text-xl font-black text-white">{unit.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  {unit.definition}
                </p>
                <p className="mt-4 text-xs font-black uppercase tracking-[0.14em] text-cyan-300">
                  Includes
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-300">{unit.includes}</p>
                <p className="mt-4 text-xs font-black uppercase tracking-[0.14em] text-yellow-200">
                  Kept outside this unit
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-300">{unit.excludes}</p>
              </article>
            ))}
          </div>
        </section>

        <div className="relative z-10 mx-auto mt-8 grid max-w-[1500px] gap-6 md:grid-cols-3">
          {goals.map((goal) => (
            <section key={goal.title} className={PANEL}>
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-fuchsia-400 via-cyan-300 to-yellow-200" />
              <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-cyan-300 sm:text-xs sm:tracking-[0.34em]">
                Goal
              </p>
              <h2 className="mt-4 text-2xl font-black italic text-white">
                {goal.title}
              </h2>
              <p className="mt-5 leading-relaxed text-slate-300">{goal.text}</p>
            </section>
          ))}
        </div>

        <section className={`${PANEL} relative z-10 mx-auto mt-8 max-w-[1500px]`}>
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-fuchsia-400 via-cyan-300 to-yellow-200" />
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-yellow-200 sm:text-xs sm:tracking-[0.34em]">
            Research framework
          </p>
          <h2 className="mt-4 text-2xl font-black italic text-white sm:text-3xl">
            A guided archive, not an unrestricted chatbot.
          </h2>

          <div className="mt-6 grid gap-6 text-base leading-relaxed text-slate-300 md:grid-cols-3">
            <p>
              Press Q is informed by queer game studies, representation
              studies, and digital humanities approaches to data visualization.
            </p>
            <p>
              Press Q separates confirmed or evidenced character identities,
              player-facing game systems, and contested critical readings so
              their counts and claims are never treated as equivalent.
            </p>
            <p>
              Quiu answers using only the Press Q dataset, allowing the
              assistant to work as a focused research interface.
            </p>
          </div>
        </section>

        <div className="relative z-10 mx-auto mt-8 grid max-w-[1500px] gap-6 lg:grid-cols-2">
          <section className={PANEL}>
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-fuchsia-400 via-cyan-300 to-yellow-200" />
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-cyan-300 sm:text-xs sm:tracking-[0.34em]">
              Appropriate questions
            </p>
            <h2 className="mt-4 text-2xl font-black italic text-white">
              What Press Q can support
            </h2>
            <ul className="mt-5 space-y-3 text-sm leading-6 text-slate-300 sm:text-base">
              {canAnswer.map((item) => (
                <li key={item} className="flex gap-3">
                  <span className="font-black text-cyan-300">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className={PANEL}>
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-fuchsia-400 via-cyan-300 to-yellow-200" />
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-yellow-200 sm:text-xs sm:tracking-[0.34em]">
              Unsupported conclusions
            </p>
            <h2 className="mt-4 text-2xl font-black italic text-white">
              What the corpus cannot establish
            </h2>
            <ul className="mt-5 space-y-3 text-sm leading-6 text-slate-300 sm:text-base">
              {cannotAnswer.map((item) => (
                <li key={item} className="flex gap-3">
                  <span className="font-black text-fuchsia-300">×</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div className="relative z-10 mx-auto mt-8 max-w-[1500px]">
          <ResearchReferences
            ids={["lgbtq-archive", "data-feminism", "fair-principles"]}
            title="Foundations for scope and data stewardship"
          />
        </div>
      </section>
    </main>
  );
}
