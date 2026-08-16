import Link from "next/link";

export default function SiteBetaNotice() {
  return (
    <aside className="border-b border-[#6271ed] bg-[#4f5fe7] px-5 py-2.5 text-white sm:px-8 md:px-14 lg:px-20">
      <div className="mx-auto flex max-w-[1700px] flex-col gap-3 text-sm leading-relaxed sm:flex-row sm:items-center sm:justify-between">
        <p className="font-medium text-white/82">
          <span className="mr-2 font-mono text-[11px] font-black uppercase tracking-[0.22em] text-white sm:text-xs">
            Beta v1.0
          </span>
          Press Q is a research prototype. Current results are provisional and
          do not reflect the final archive because the Press Q dataset is still
          being populated and reviewed.
        </p>

        <Link
          href="/contribute"
          className="shrink-0 font-mono text-[11px] font-black uppercase tracking-[0.18em] text-white underline decoration-white/55 decoration-2 underline-offset-4 transition hover:decoration-white"
        >
          Contribute a character
        </Link>
      </div>
    </aside>
  );
}
