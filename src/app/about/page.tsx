import PrismPageHero from "@/components/PrismPageHero";

const PANEL =
  "relative overflow-hidden border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.075),rgba(255,255,255,0.025)_48%,rgba(34,211,238,0.055))] p-7 shadow-[0_24px_90px_rgba(0,0,0,0.35)] backdrop-blur-xl";

const goals = [
  {
    title: "Representation",
    text: "Make queer video game characters more visible through structured, searchable data.",
  },
  {
    title: "Research",
    text: "Support analysis of identity, playability, narrative role, intersectionality, and representation quality.",
  },
  {
    title: "Access",
    text: "Create a public-facing interface where users can ask questions about queer game characters naturally.",
  },
];

const quickFacts = [
  ["Name", "PRSM"],
  ["Project type", "AI-assisted queer game archive"],
  ["Focus", "Queer video game characters"],
  ["Status", "Prototype v1.0"],
];

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[#020207] text-white">
      <PrismPageHero
        eyebrow="Archive identity"
        title="About"
        accent="PRSM"
        description="PRSM is a digital humanities prototype for reading queer game representation through structured data, visual analytics, and AI-assisted querying."
      />

      <section className="relative px-8 py-16 md:px-14 lg:px-20">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_0%,rgba(217,70,239,0.12),transparent_30%),radial-gradient(circle_at_88%_14%,rgba(34,211,238,0.1),transparent_28%)]" />

        <div className="relative z-10 mx-auto grid max-w-[1500px] gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <section className={PANEL}>
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-fuchsia-400 via-cyan-300 to-yellow-200" />
            <p className="font-mono text-xs uppercase tracking-[0.34em] text-cyan-300">
              Description
            </p>

            <div className="mt-6 space-y-5 text-lg leading-relaxed text-slate-300">
              <p>
                PRSM is an AI-assisted research platform for exploring queer
                representation in video games.
              </p>

              <p>
                The project combines structured character data, visual
                analytics, and natural language querying to examine identity,
                playability, narrative role, intersectionality, developers,
                release years, and evidence sources.
              </p>

              <p>
                PRSM is designed as a living archive interface: a way to make
                patterns of queer game representation easier to explore while
                keeping the data grounded, structured, and reviewable.
              </p>
            </div>
          </section>

          <aside className={PANEL}>
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-fuchsia-400 via-cyan-300 to-yellow-200" />
            <p className="font-mono text-xs uppercase tracking-[0.34em] text-fuchsia-300">
              Quick facts
            </p>

            <div className="mt-7 space-y-6">
              {quickFacts.map(([label, value]) => (
                <div key={label}>
                  <p className="font-mono text-xs uppercase tracking-[0.24em] text-slate-500">
                    {label}
                  </p>
                  <p className="mt-2 text-lg font-black text-white">{value}</p>
                </div>
              ))}
            </div>
          </aside>
        </div>

        <div className="relative z-10 mx-auto mt-8 grid max-w-[1500px] gap-6 md:grid-cols-3">
          {goals.map((goal) => (
            <section key={goal.title} className={PANEL}>
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-fuchsia-400 via-cyan-300 to-yellow-200" />
              <p className="font-mono text-xs uppercase tracking-[0.34em] text-cyan-300">
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
          <p className="font-mono text-xs uppercase tracking-[0.34em] text-yellow-200">
            Research framework
          </p>
          <h2 className="mt-4 text-3xl font-black italic text-white">
            A guided archive, not an unrestricted chatbot.
          </h2>

          <div className="mt-6 grid gap-6 text-base leading-relaxed text-slate-300 md:grid-cols-3">
            <p>
              PRSM is informed by queer game studies, representation studies,
              and digital humanities approaches to data visualization.
            </p>
            <p>
              The dataset includes fields such as character name, game title,
              release year, developer, gender, sexuality, identity category,
              playability, narrative role, intersectionality, and evidence.
            </p>
            <p>
              The AI component answers using only the structured dataset,
              allowing PRSM to work as a focused research interface.
            </p>
          </div>
        </section>
      </section>
    </main>
  );
}
