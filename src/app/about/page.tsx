export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[#05010f] px-8 py-12 text-white md:px-16">
      
      <a href="/" className="text-cyan-300 hover:underline">
        ← Back to Atlas
      </a>

      <h1 className="mt-8 text-5xl font-black italic md:text-7xl">
        About{" "}
        <span className="bg-gradient-to-r from-fuchsia-400 to-cyan-300 bg-clip-text text-transparent">
          Atlas
        </span>
      </h1>

      <div className="mt-10 max-w-4xl space-y-8 text-lg leading-relaxed text-slate-300">

        <p>
          Queer Video Game Character Atlas is an AI-assisted digital humanities
          research platform focused on queer representation in video games.
        </p>

        <p>
          The project combines structured datasets, visual analytics, and
          natural language querying to explore identities, representation,
          intersectionality, and character design across games.
        </p>

        <p>
          Atlas was developed as a research and public scholarship initiative
          exploring computational approaches to queer game studies.
        </p>

      </div>

    </main>
  );
}