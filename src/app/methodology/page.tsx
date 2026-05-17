export default function MethodologyPage() {
  return (
    <main className="min-h-screen bg-[#05010f] px-8 py-12 text-white md:px-16">

      <a href="/" className="text-cyan-300 hover:underline">
        ← Back to Atlas
      </a>

      <h1 className="mt-8 text-5xl font-black italic md:text-7xl">
        Research{" "}
        <span className="bg-gradient-to-r from-fuchsia-400 to-cyan-300 bg-clip-text text-transparent">
          Methodology
        </span>
      </h1>

      <div className="mt-10 max-w-5xl space-y-8 text-lg leading-relaxed text-slate-300">

        <p>
          Atlas uses a structured dataset of queer video game characters
          combined with AI-assisted querying and visual analytics.
        </p>

        <p>
          The project draws from approaches in digital humanities,
          multimodal analysis, queer game studies, and representation studies.
        </p>

        <p>
          Character data includes identity labels, playability,
          protagonist status, intersectionality indicators, studios,
          and release information.
        </p>

        <p>
          AI responses are constrained to dataset information to reduce
          hallucinations and unsupported claims.
        </p>

      </div>

    </main>
  );
}