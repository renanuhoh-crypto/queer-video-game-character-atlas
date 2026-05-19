import Link from "next/link";

export default function SiteBetaNotice() {
  return (
    <aside className="border-b border-white/10 bg-[#05010f] px-5 py-3 text-white sm:px-8 md:px-14 lg:px-20">
      <div className="mx-auto flex max-w-[1700px] flex-col gap-3 text-sm leading-relaxed sm:flex-row sm:items-center sm:justify-between">
        <p className="text-slate-300">
          <span className="mr-2 font-mono text-[11px] font-black uppercase tracking-[0.22em] text-fuchsia-300 sm:text-xs">
            Beta v1.0
          </span>
          PRSM is a research prototype. Current results are provisional and do
          not reflect the final archive because the dataset is still being
          populated and reviewed.
        </p>

        <Link
          href="/contribute"
          className="shrink-0 font-mono text-[11px] font-black uppercase tracking-[0.18em] text-cyan-300 transition hover:text-cyan-100"
        >
          Contribute a character
        </Link>
      </div>
    </aside>
  );
}
