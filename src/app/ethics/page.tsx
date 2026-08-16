import type { Metadata } from "next";
import PrismPageHero from "@/components/PrismPageHero";

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
    text: "Representation categories and identity labels are socially, culturally, and historically contextual.",
  },
  {
    title: "Critical use",
    text: "The project is designed to support discussion and inquiry, not produce definitive classifications of identity or value.",
  },
];

const fairUsePoints = [
  "Press Q may reference copyrighted screenshots, character images, or source material only for nonprofit educational and research purposes.",
  "Images should be credited and cited with their original source whenever possible.",
  "Copyrighted material should be used in a limited, contextual way that supports analysis rather than decoration or redistribution.",
  "Anyone reusing copyrighted material from Press Q beyond fair use should seek permission from the copyright owner.",
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
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-yellow-200 sm:text-xs sm:tracking-[0.34em]">
            Fair use statement
          </p>
          <h2 className="mt-4 text-2xl font-black italic text-white sm:text-3xl">
            Images and quoted material are treated as research context.
          </h2>
          <p className="mt-5 max-w-4xl text-base leading-relaxed text-slate-300 sm:text-lg">
            Press Q is a nonprofit educational and research prototype. When
            the archive uses copyrighted material, it should do so under a fair
            use rationale consistent with 17 U.S.C. Section 107: with credit,
            citation, limited scope, and clear research purpose.
          </p>

          <div className="mt-7 grid gap-4 md:grid-cols-2">
            {fairUsePoints.map((point) => (
              <div key={point} className="border border-white/10 bg-black/30 p-4">
                <p className="leading-relaxed text-slate-300">{point}</p>
              </div>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
