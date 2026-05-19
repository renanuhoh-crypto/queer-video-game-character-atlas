import PrismPageHero from "@/components/PrismPageHero";

const PANEL =
  "relative overflow-hidden border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.075),rgba(255,255,255,0.025)_48%,rgba(34,211,238,0.055))] p-7 shadow-[0_24px_90px_rgba(0,0,0,0.35)] backdrop-blur-xl";

const principles = [
  {
    title: "Partial coverage",
    text: "PRSM is a research prototype and does not claim exhaustive coverage of queer representation in games.",
  },
  {
    title: "Constrained AI",
    text: "AI-generated responses are grounded in the available dataset, but mistakes may still occur and should be reviewed critically.",
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

export default function EthicsPage() {
  return (
    <main className="min-h-screen bg-[#020207] text-white">
      <PrismPageHero
        eyebrow="Critical framework"
        title="Ethics &"
        accent="Limitations"
        description="PRSM treats queer representation data as interpretive material: useful, partial, situated, and always in need of care."
      />

      <section className="relative px-8 py-16 md:px-14 lg:px-20">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_0%,rgba(217,70,239,0.12),transparent_30%),radial-gradient(circle_at_82%_20%,rgba(34,211,238,0.1),transparent_28%)]" />

        <div className="relative z-10 mx-auto grid max-w-[1500px] gap-6 md:grid-cols-2">
          {principles.map((principle) => (
            <section key={principle.title} className={PANEL}>
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-fuchsia-400 via-cyan-300 to-yellow-200" />
              <p className="font-mono text-xs uppercase tracking-[0.34em] text-cyan-300">
                Principle
              </p>
              <h2 className="mt-4 text-3xl font-black italic text-white">
                {principle.title}
              </h2>
              <p className="mt-5 text-lg leading-relaxed text-slate-300">
                {principle.text}
              </p>
            </section>
          ))}
        </div>

        <section className={`${PANEL} relative z-10 mx-auto mt-8 max-w-[1500px]`}>
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-fuchsia-400 via-cyan-300 to-yellow-200" />
          <p className="font-mono text-xs uppercase tracking-[0.34em] text-fuchsia-300">
            Use with care
          </p>
          <h2 className="mt-4 text-3xl font-black italic text-white">
            The dataset can reveal patterns, but it cannot replace context.
          </h2>
          <p className="mt-5 max-w-4xl text-lg leading-relaxed text-slate-300">
            PRSM should be read as a tool for guided exploration. Its categories
            help organize evidence, but representation remains messy, lived,
            historical, and dependent on interpretation.
          </p>
        </section>
      </section>
    </main>
  );
}
