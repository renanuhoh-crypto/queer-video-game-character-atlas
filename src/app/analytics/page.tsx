import Link from "next/link";
import VisualAnalytics from "@/components/VisualAnalytics";
import characters from "@/data/characters.json";

export default function AnalyticsPage() {
  return (
    <main className="min-h-screen bg-[#05010f] text-white">
      <div className="mx-auto w-full max-w-[1400px] px-8 py-12">

        <Link
          href="/"
          className="mb-10 inline-block text-cyan-300 transition hover:text-cyan-200"
        >
          ← Back to Atlas
        </Link>

        <div className="mb-12">
          <h1 className="text-6xl font-black italic leading-none">
            <span className="text-white">Visual </span>

            <span className="bg-gradient-to-r from-fuchsia-400 via-purple-400 to-cyan-300 bg-clip-text text-transparent">
              Analytics
            </span>
          </h1>

          <p className="mt-4 max-w-4xl text-xl text-slate-300">
            Dataset overview, representation percentages, yearly distribution,
            and studio-level patterns.
          </p>
        </div>

        <VisualAnalytics characters={characters} />

      </div>
    </main>
  );
}