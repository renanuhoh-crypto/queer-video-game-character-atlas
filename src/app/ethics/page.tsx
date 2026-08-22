import type { Metadata } from "next";
import PrismPageHero from "@/components/PrismPageHero";
import ResearchReferences from "@/components/ResearchReferences";

export const metadata: Metadata = {
  title: "Ethics & Limitations",
  description:
    "Ethical considerations and limitations for Press Q, the Press Q dataset, and Quiu.",
};

const PANEL =
  "pq-panel relative overflow-hidden p-5 sm:p-7";

const principles = [
  {
    title: "Partial coverage",
    text: "Press Q is a research prototype and does not claim exhaustive coverage of queer representation in games.",
  },
  {
    title: "Constrained AI",
    text: "Quiu's responses are grounded in the available Press Q dataset, but mistakes may still occur and should be reviewed critically.",
  },
  {
    title: "Contextual categories",
    text: "Representation categories and identity labels are socially, culturally, and historically contextual. Controlled vocabulary improves comparison but cannot replace a source’s specific language.",
  },
  {
    title: "Critical use",
    text: "The project is designed to support discussion and inquiry, not produce definitive classifications of identity or value.",
  },
];

const limitations = [
  {
    title: "Selection and survival bias",
    text: "Press Q begins with cases that were discoverable through existing archives, scholarship, journalism, communities, playthroughs, and available online evidence. Obscure, regional, older, delisted, inaccessible, or poorly documented games are easier to miss.",
  },
  {
    title: "Version and platform change",
    text: "Dialogue, romance options, localization, censorship, patches, downloadable content, remasters, and platform restrictions can change what is present. A record applies only as far as its documented version supports it.",
  },
  {
    title: "Taxonomy and aggregation",
    text: "Any schema simplifies. Broad categories can obscure differences within identities; specific categories can fragment related experiences. Press Q therefore shows examples, notes, missing values, and overlap rather than treating categories as natural or permanent.",
  },
  {
    title: "Uneven evidence",
    text: "Official statements, game text, wikis, criticism, forum discussion, and videos offer different forms of support. Evidence confidence records this difference but cannot remove all curatorial judgment.",
  },
  {
    title: "Numbers without a universe",
    text: "Press Q does not know the complete population of every game ever released or every queer case within it. Corpus percentages therefore describe documented Press Q records, never the prevalence of LGBTQ+ content across the medium.",
  },
];

const aiSafeguards = [
  {
    title: "Dataset grounding",
    text: "Quiu is instructed to answer from the three Press Q datasets rather than general model memory. If a detail is absent, the appropriate answer is that it is not currently recorded.",
  },
  {
    title: "Unit separation",
    text: "Quiu must keep character identities, game-system possibilities, and queer readings separate. It must not convert a mechanic or interpretation into canonical character identity.",
  },
  {
    title: "Language and qualification",
    text: "Quiu should reply in the language of the latest question and preserve research status, confidence, counterevidence, version, and other material limitations.",
  },
  {
    title: "Human verification",
    text: "Grounding reduces unsupported claims but does not guarantee accuracy. Users should inspect source records before publishing, teaching, or making consequential claims from a generated answer.",
  },
];

const fairUsePoints = [
  "Purpose and character: the use should support criticism, comment, scholarship, teaching, or research and add analytical context rather than substitute for the original work.",
  "Nature of the work: the factual or creative nature and publication status of the source material remain relevant to the analysis.",
  "Amount and substantiality: use only what is reasonably necessary for the research purpose, including attention to whether the portion is qualitatively central.",
  "Market effect: consider whether the use substitutes for, harms, or usurps an existing or reasonably likely market for the original work.",
];

export default function EthicsPage() {
  return (
    <main className="pq-page min-h-screen bg-[#f7f7fb] text-[#12152b]">
      <PrismPageHero
        eyebrow="Critical framework"
        title="Ethics &"
        accent="Limitations"
        description="Press Q treats the Press Q dataset as interpretive material: useful, partial, situated, and always in need of care."
      />

      <section className="relative px-5 py-12 sm:px-8 md:px-14 md:py-16 lg:px-20">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_0%,rgba(217,70,239,0.12),transparent_30%),radial-gradient(circle_at_82%_20%,rgba(34,211,238,0.1),transparent_28%)]" />

        <div className="relative z-10 mx-auto grid max-w-[1500px] gap-6 md:grid-cols-2">
          {principles.map((principle) => (
            <section key={principle.title} className={PANEL}>
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-fuchsia-400 via-cyan-300 to-yellow-200" />
              <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-cyan-300 sm:text-xs sm:tracking-[0.34em]">
                Principle
              </p>
              <h2 className="mt-4 text-2xl font-black italic text-white sm:text-3xl">
                {principle.title}
              </h2>
              <p className="mt-5 text-base leading-relaxed text-slate-300 sm:text-lg">
                {principle.text}
              </p>
            </section>
          ))}
        </div>

        <section className={`${PANEL} relative z-10 mx-auto mt-8 max-w-[1500px]`}>
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-fuchsia-400 via-cyan-300 to-yellow-200" />
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-fuchsia-300 sm:text-xs sm:tracking-[0.34em]">
            Use with care
          </p>
          <h2 className="mt-4 text-2xl font-black italic text-white sm:text-3xl">
            The Press Q dataset can reveal patterns, but it cannot replace context.
          </h2>
          <p className="mt-5 max-w-4xl text-base leading-relaxed text-slate-300 sm:text-lg">
            Press Q should be read as a tool for guided exploration. The Press
            Q dataset helps organize evidence, but representation remains
            messy, lived, historical, and dependent on interpretation.
          </p>
        </section>

        <section className={`${PANEL} relative z-10 mx-auto mt-8 max-w-[1500px]`}>
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-fuchsia-400 via-cyan-300 to-yellow-200" />
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-cyan-300 sm:text-xs sm:tracking-[0.34em]">
            Known limitations
          </p>
          <h2 className="mt-4 max-w-4xl text-2xl font-black italic text-white sm:text-3xl">
            What can shape, omit, or distort the corpus
          </h2>
          <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {limitations.map((limitation) => (
              <article key={limitation.title} className="border border-white/10 bg-black/25 p-5">
                <h3 className="text-lg font-black text-white">{limitation.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  {limitation.text}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className={`${PANEL} relative z-10 mx-auto mt-8 max-w-[1500px]`}>
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-fuchsia-400 via-cyan-300 to-yellow-200" />
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-fuchsia-300 sm:text-xs sm:tracking-[0.34em]">
            Identity and interpretive care
          </p>
          <h2 className="mt-4 max-w-4xl text-2xl font-black italic text-white sm:text-3xl">
            The archive documents claims; it does not own anyone’s identity.
          </h2>
          <div className="mt-5 grid gap-5 text-base leading-relaxed text-slate-300 md:grid-cols-3">
            <p>
              Specific supported terms are preferred over broad assumptions.
              Trans men are men and trans women are women; trans-specific
              coding preserves a relevant dimension rather than constructing a
              separate, opposing gender.
            </p>
            <p>
              Press Q does not infer race, ethnicity, religion, disability,
              gender, sexuality, or creator identity from names, appearance,
              voice, mannerisms, or stereotypes. Unknown remains unknown.
            </p>
            <p>
              Queer readings can be culturally important even when contested
              or creator-refuted. Preserving them with counterevidence avoids
              both erasure and false presentation as canonical fact.
            </p>
          </div>
        </section>

        <section className={`${PANEL} relative z-10 mx-auto mt-8 max-w-[1500px]`}>
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-fuchsia-400 via-cyan-300 to-yellow-200" />
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-cyan-300 sm:text-xs sm:tracking-[0.34em]">
            Quiu and responsible AI use
          </p>
          <h2 className="mt-4 max-w-4xl text-2xl font-black italic text-white sm:text-3xl">
            A constrained research interface still requires human judgment.
          </h2>
          <div className="mt-7 grid gap-4 md:grid-cols-2">
            {aiSafeguards.map((safeguard) => (
              <article key={safeguard.title} className="border border-white/10 bg-black/25 p-5">
                <h3 className="text-lg font-black text-white">{safeguard.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  {safeguard.text}
                </p>
              </article>
            ))}
          </div>
          <p className="mt-6 max-w-5xl text-sm leading-6 text-slate-400">
            Quiu can still misunderstand a question, format a field poorly, or
            produce an answer whose emphasis is misleading. Its output should
            be treated as an assisted summary of the available records, not an
            independent authority, diagnosis, or substitute for reading the
            cited evidence.
          </p>
        </section>

        <section className={`${PANEL} relative z-10 mx-auto mt-8 max-w-[1500px]`}>
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-fuchsia-400 via-cyan-300 to-yellow-200" />
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-yellow-200 sm:text-xs sm:tracking-[0.34em]">
            Fair use statement
          </p>
          <h2 className="mt-4 text-2xl font-black italic text-white sm:text-3xl">
            Images and quoted material are treated as research context.
          </h2>
          <p className="mt-5 max-w-4xl text-base leading-relaxed text-slate-300 sm:text-lg">
            Press Q is a nonprofit educational and research prototype. That
            purpose is relevant but does not automatically make every use fair.
            Under 17 U.S.C. Section 107, fair use is a case-specific balancing
            analysis that considers all four factors below. Credit and citation
            are good scholarly practice, but attribution alone does not create
            legal permission or guarantee fair use.
          </p>

          <div className="mt-7 grid gap-4 md:grid-cols-2">
            {fairUsePoints.map((point) => (
              <div key={point} className="border border-white/10 bg-black/30 p-4">
                <p className="leading-relaxed text-slate-300">{point}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 max-w-5xl text-sm leading-6 text-slate-400">
            This project statement is a research practice, not legal advice.
            Image and quotation use should be reviewed individually; permission,
            public-domain material, open licenses, or removal may be more
            appropriate when the fair-use rationale is weak. Rights holders can
            request review of a specific asset and its source information.
          </p>
        </section>

        <div className="relative z-10 mx-auto mt-8 max-w-[1500px]">
          <ResearchReferences
            ids={[
              "lgbtq-archive",
              "glaad-terms",
              "data-feminism",
              "crenshaw-intersectionality",
              "nist-ai-rmf",
              "copyright-fair-use",
            ]}
            title="Ethical, terminological, and legal reference points"
          />
        </div>
      </section>
    </main>
  );
}
