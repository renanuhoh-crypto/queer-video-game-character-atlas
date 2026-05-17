export default function EthicsPage() {
  return (
    <main className="min-h-screen bg-[#05010f] px-8 py-12 text-white md:px-16">

      <a href="/" className="text-cyan-300 hover:underline">
        ← Back to Atlas
      </a>

      <h1 className="mt-8 text-5xl font-black italic md:text-7xl">
        Ethics &{" "}
        <span className="bg-gradient-to-r from-fuchsia-400 to-cyan-300 bg-clip-text text-transparent">
          Limitations
        </span>
      </h1>

      <div className="mt-10 max-w-5xl space-y-8 text-lg leading-relaxed text-slate-300">

        <p>
          Atlas is a research prototype and does not claim to provide
          exhaustive coverage of queer representation in games.
        </p>

        <p>
          AI-generated responses are constrained by the available dataset,
          but inaccuracies may still occur.
        </p>

        <p>
          Representation categories and identity labels are socially,
          culturally, and historically contextual.
        </p>

        <p>
          The project aims to support critical discussion rather than
          produce definitive classifications.
        </p>

      </div>

    </main>
  );
}