import Link from "next/link";

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[#eeeeee] px-8 py-10 text-black">
      <div className="mx-auto max-w-5xl">
        <Link href="/" className="text-sm text-cyan-700 hover:underline">
          ← Back to Atlas
        </Link>

        <h1 className="mt-8 text-center text-4xl font-black">
          About the Atlas
        </h1>

        <section className="mt-12 grid gap-10 md:grid-cols-[1fr_340px]">
          <div>
            <h2 className="text-xl font-black">Description</h2>

            <div className="mt-2 space-y-5 text-base leading-relaxed">
              <p>
                Queer Video Game Character Atlas is an AI-assisted research
                platform for exploring queer representation in video games. It
                brings together structured character data, visual analytics, and
                natural language querying to support research, teaching, and
                public scholarship.
              </p>

              <p>
                The project focuses on queer video game characters, including
                information about identity, playability, narrative role,
                intersectionality, developer, release year, and evidence sources.
                Rather than treating AI as a replacement for research, Atlas uses
                AI as an interface for querying a controlled dataset.
              </p>

              <p>
                Atlas is designed as a living digital humanities prototype. Its
                goal is to make patterns of representation easier to identify
                while keeping the underlying data structured, reviewable, and
                open to critique.
              </p>
            </div>
          </div>

          <aside className="rounded-sm bg-[#d8ebcf] p-6 text-sm">
            <h2 className="mb-5 text-lg font-black">Quick Facts</h2>

            <div className="space-y-5">
              <div>
                <p className="font-black">Name</p>
                <p>Queer Video Game Character Atlas</p>
              </div>

              <div>
                <p className="font-black">Project type</p>
                <p>AI-assisted digital humanities research platform</p>
              </div>

              <div>
                <p className="font-black">Focus</p>
                <p>Queer video game characters and representation</p>
              </div>

              <div>
                <p className="font-black">Dataset mode</p>
                <p>Prototype v1.0</p>
              </div>

              <div>
                <p className="font-black">Methods</p>
                <p>Structured dataset, visual analytics, AI-assisted querying</p>
              </div>

              <div>
                <p className="font-black">Status</p>
                <p>Living research prototype</p>
              </div>
            </div>
          </aside>
        </section>

        <hr className="my-12 border-black/30" />

        <section>
          <h2 className="text-center text-2xl font-black">Project Goals</h2>

          <div className="mt-8 grid gap-6 md:grid-cols-3">
            <div className="rounded-sm bg-white p-8 text-center">
              <h3 className="font-black">Representation</h3>
              <p className="mt-6 text-5xl">◉</p>
              <p className="mt-6 leading-relaxed">
                To make queer video game characters more visible through
                structured, searchable data.
              </p>
            </div>

            <div className="rounded-sm bg-white p-8 text-center">
              <h3 className="font-black">Research</h3>
              <p className="mt-6 text-5xl">▦</p>
              <p className="mt-6 leading-relaxed">
                To support analysis of identity, playability, narrative role,
                intersectionality, and representation quality.
              </p>
            </div>

            <div className="rounded-sm bg-white p-8 text-center">
              <h3 className="font-black">Access</h3>
              <p className="mt-6 text-5xl">⌕</p>
              <p className="mt-6 leading-relaxed">
                To create a public-facing interface where users can ask
                questions about queer game characters in natural language.
              </p>
            </div>
          </div>
        </section>

        <hr className="my-12 border-black/30" />

        <section>
          <h2 className="text-center text-2xl font-black">
            Research Framework
          </h2>

          <div className="mt-8 space-y-5 text-base leading-relaxed">
            <p>
              Atlas is informed by queer game studies, representation studies,
              and digital humanities approaches to data visualization and
              cultural analysis. The project treats characters as units of
              analysis while also recognizing that identity categories are
              complex, contextual, and sometimes incomplete.
            </p>

            <p>
              The dataset includes structured fields such as character name,
              game title, release year, developer, gender, sexuality, identity
              category, playability, narrative role, confirmation type,
              intersectionality, and evidence source.
            </p>

            <p>
              The AI component is designed to answer questions using only the
              structured dataset. This allows Atlas to operate as a guided
              research interface rather than an unrestricted chatbot.
            </p>
          </div>
        </section>

        <hr className="my-12 border-black/30" />

        <section>
          <h2 className="text-center text-2xl font-black">Current Scope</h2>

          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <div className="rounded-sm bg-white p-8 text-center">
              <h3 className="font-black">Included</h3>
              <p className="mt-5 leading-relaxed">
                Queer video game characters, identity categories, game metadata,
                playability, narrative role, evidence sources, and visual
                analytics.
              </p>
            </div>

            <div className="rounded-sm bg-white p-8 text-center">
              <h3 className="font-black">In development</h3>
              <p className="mt-5 leading-relaxed">
                Expanded datasets, stronger source attribution, richer
                intersectionality fields, advanced filters, and more detailed
                character comparison tools.
              </p>
            </div>
          </div>
        </section>

        <hr className="my-12 border-black/30" />

        <section>
          <h2 className="text-center text-2xl font-black">History</h2>

          <div className="mt-8 space-y-5 text-base leading-relaxed">
            <p>
              The Queer Video Game Character Atlas began as a prototype for
              exploring how AI can support structured research on queer
              representation in games. The initial version tested whether a
              controlled dataset could be queried through a conversational
              interface without allowing the system to freely invent unsupported
              information.
            </p>

            <p>
              Early development focused on a small seed dataset containing
              selected queer game characters. This allowed the project to test
              data structure, visual analytics, natural language questions, and
              anti-hallucination safeguards before expanding to a larger archive.
            </p>

            <p>
              The long-term goal is to develop Atlas into a public scholarship
              and research infrastructure project that can support game studies,
              queer media studies, teaching, and data-driven analysis of
              representation.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}