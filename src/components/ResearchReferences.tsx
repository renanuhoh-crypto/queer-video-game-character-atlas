import {
  getResearchReferences,
  type ResearchReferenceId,
} from "@/lib/researchReferences";

export default function ResearchReferences({
  ids,
  theme = "dark",
  title = "Research references",
}: {
  ids: ResearchReferenceId[];
  theme?: "dark" | "light";
  title?: string;
}) {
  const references = getResearchReferences(ids);
  const light = theme === "light";

  return (
    <section
      className={
        light
          ? "rounded-[1.75rem] border border-[#dfe3f3] bg-white p-5 shadow-[0_18px_50px_rgba(34,42,95,0.08)] sm:p-7"
          : "pq-panel relative overflow-hidden p-5 sm:p-7"
      }
    >
      {!light ? (
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-fuchsia-400 via-cyan-300 to-yellow-200" />
      ) : null}
      <p
        className={`font-mono text-[10px] font-black uppercase tracking-[0.22em] sm:text-xs sm:tracking-[0.3em] ${
          light ? "text-[#4f5fe7]" : "text-cyan-300"
        }`}
      >
        Sources and framework
      </p>
      <h2
        className={`mt-3 text-2xl font-black ${
          light ? "text-[#15183a]" : "italic text-white"
        }`}
      >
        {title}
      </h2>
      <p
        className={`mt-3 max-w-4xl text-sm leading-6 ${
          light ? "text-[#5f688e]" : "text-slate-300"
        }`}
      >
        These sources inform the project’s definitions and safeguards. They do
        not make Press Q exhaustive, peer reviewed, or free from curatorial
        judgment.
      </p>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {references.map((reference) => (
          <article
            key={reference.id}
            className={
              light
                ? "rounded-2xl border border-[#dfe3f3] bg-[#f7f8ff] p-4"
                : "border border-white/10 bg-black/25 p-4"
            }
          >
            <a
              href={reference.url}
              target="_blank"
              rel="noreferrer"
              className={`font-black underline decoration-2 underline-offset-4 transition ${
                light
                  ? "text-[#3447dc] decoration-[#b8c0ff] hover:decoration-[#3447dc]"
                  : "text-white decoration-cyan-300/45 hover:decoration-cyan-300"
              }`}
            >
              {reference.shortTitle} ↗
            </a>
            <p
              className={`mt-2 text-sm leading-6 ${
                light ? "text-[#4f587d]" : "text-slate-300"
              }`}
            >
              {reference.citation}
            </p>
            <p
              className={`mt-2 text-xs leading-5 ${
                light ? "text-[#747c9c]" : "text-slate-400"
              }`}
            >
              {reference.relevance}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
