import PrismPageHero from "@/components/PrismPageHero";

const PANEL =
  "relative overflow-hidden border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.075),rgba(255,255,255,0.025)_48%,rgba(34,211,238,0.055))] p-7 shadow-[0_24px_90px_rgba(0,0,0,0.35)] backdrop-blur-xl";

const methods = [
  {
    label: "Structured data",
    text: "Character entries are organized by identity labels, game metadata, playability, narrative role, release information, and evidence fields.",
  },
  {
    label: "Queer game studies",
    text: "The project treats representation as cultural context, not just category counting, so the archive can support interpretation.",
  },
  {
    label: "AI-assisted querying",
    text: "Responses are constrained to registered dataset information to reduce unsupported claims and keep answers traceable.",
  },
  {
    label: "Visual analytics",
    text: "The interface surfaces patterns across identity categories, intersectionality, studios, years, and playable status.",
  },
];

export default function MethodologyPage() {
  return (
    <main className="min-h-screen bg-[#020207] text-white">
      <PrismPageHero
        eyebrow="Research protocol"
        title="Research"
        accent="Methodology"
        description="PRSM combines queer game studies, structured archive design, and constrained AI querying to make representation patterns legible without flattening them."
      />

      <section className="relative px-8 py-16 md:px-14 lg:px-20">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_0%,rgba(217,70,239,0.12),transparent_30%),radial-gradient(circle_at_82%_20%,rgba(34,211,238,0.1),transparent_28%)]" />

        <div className="relative z-10 mx-auto grid max-w-[1500px] gap-6 md:grid-cols-2">
          {methods.map((method) => (
            <section key={method.label} className={PANEL}>
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-fuchsia-400 via-cyan-300 to-yellow-200" />
              <p className="font-mono text-xs uppercase tracking-[0.34em] text-cyan-300">
                Method
              </p>
              <h2 className="mt-4 text-3xl font-black italic text-white">
                {method.label}
              </h2>
              <p className="mt-5 text-lg leading-relaxed text-slate-300">
                {method.text}
              </p>
            </section>
          ))}
        </div>

        <section className={`${PANEL} relative z-10 mx-auto mt-8 max-w-[1500px]`}>
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-fuchsia-400 via-cyan-300 to-yellow-200" />
          <p className="font-mono text-xs uppercase tracking-[0.34em] text-fuchsia-300">
            Data boundaries
          </p>
          <h2 className="mt-4 text-3xl font-black italic text-white">
            The archive is built for cautious interpretation.
          </h2>
          <p className="mt-5 max-w-4xl text-lg leading-relaxed text-slate-300">
            PRSM uses available fields rather than guessing missing identity
            information. When details are absent, the system should surface that
            absence instead of filling the gap with unsupported inference.
          </p>
        </section>
      </section>
    </main>
  );
}
