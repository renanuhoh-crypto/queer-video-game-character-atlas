import Link from "next/link";

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[#05010f] px-8 py-10 text-white">
      <div className="mx-auto max-w-6xl">
        <Link href="/" className="text-sm text-cyan-300 hover:underline">
          ← Back to PRSM
        </Link>

        <h1 className="mt-8 text-center text-5xl font-black italic">
          About{" "}
          <span className="bg-gradient-to-r from-fuchsia-400 via-violet-400 to-cyan-300 bg-clip-text text-transparent">
            PRSM
          </span>
        </h1>

        <section className="mt-12 grid gap-10 md:grid-cols-[1fr_340px]">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8">
            <h2 className="text-xl font-black text-cyan-300">Description</h2>

            <div className="mt-4 space-y-5 text-base leading-relaxed text-slate-300">
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
                PRSM is designed as a living digital humanities prototype: a
                searchable archive interface that makes patterns of queer game
                representation easier to explore while keeping the data
                grounded, structured, and reviewable.
              </p>
            </div>
          </div>

          <aside className="rounded-3xl border border-cyan-300/20 bg-cyan-300/10 p-6 text-sm">
            <h2 className="mb-5 text-lg font-black text-cyan-300">
              Quick Facts
            </h2>

            <div className="space-y-5 text-slate-200">
              <div>
                <p className="font-black text-white">Name</p>
                <p>PRSM</p>
              </div>

              <div>
                <p className="font-black text-white">Project type</p>
                <p>AI-assisted queer game archive</p>
              </div>

              <div>
                <p className="font-black text-white">Focus</p>
                <p>Queer video game characters</p>
              </div>

              <div>
                <p className="font-black text-white">Status</p>
                <p>Prototype v1.0</p>
              </div>
            </div>
          </aside>
        </section>

        <hr className="my-12 border-white/10" />

        <section>
          <h2 className="text-center text-3xl font-black italic">
            Project <span className="text-fuchsia-300">Goals</span>
          </h2>

          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {[
              [
                "Representation",
                "Make queer video game characters more visible through structured, searchable data.",
              ],
              [
                "Research",
                "Support analysis of identity, playability, narrative role, intersectionality, and representation quality.",
              ],
              [
                "Access",
                "Create a public-facing interface where users can ask questions about queer game characters naturally.",
              ],
            ].map(([title, text]) => (
              <div
                key={title}
                className="rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-center"
              >
                <h3 className="font-black text-white">{title}</h3>
                <div className="mx-auto mt-6 h-12 w-12 rounded-full bg-gradient-to-r from-fuchsia-400 to-cyan-300" />
                <p className="mt-6 leading-relaxed text-slate-300">{text}</p>
              </div>
            ))}
          </div>
        </section>

        <hr className="my-12 border-white/10" />

        <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-8">
          <h2 className="text-center text-3xl font-black italic">
            Research Framework
          </h2>

          <div className="mt-8 space-y-5 text-base leading-relaxed text-slate-300">
            <p>
              PRSM is informed by queer game studies, representation studies,
              and digital humanities approaches to data visualization and
              cultural analysis.
            </p>

            <p>
              The dataset includes fields such as character name, game title,
              release year, developer, gender, sexuality, identity category,
              playability, narrative role, confirmation type,
              intersectionality, and evidence source.
            </p>

            <p>
              The AI component answers using only the structured dataset,
              allowing PRSM to work as a guided research interface rather than
              an unrestricted chatbot.
            </p>
          </div>
        </section>

        <hr className="my-12 border-white/10" />

        <section>
          <h2 className="text-center text-3xl font-black italic">
            Current <span className="text-cyan-300">Scope</span>
          </h2>

          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8">
              <h3 className="font-black text-fuchsia-300">Included</h3>
              <p className="mt-5 leading-relaxed text-slate-300">
                Queer video game characters, identity categories, game metadata,
                playability, narrative role, evidence sources, and visual
                analytics.
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8">
              <h3 className="font-black text-cyan-300">In development</h3>
              <p className="mt-5 leading-relaxed text-slate-300">
                Expanded datasets, richer source attribution, advanced filters,
                stronger intersectionality fields, and character comparison
                tools.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}