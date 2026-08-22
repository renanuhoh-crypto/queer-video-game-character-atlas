import Image from "next/image";
import Link from "next/link";
import AnalyticsMenu from "@/components/AnalyticsMenu";

type AnalyticsPageHeroProps = {
  characterCount: number;
  systemCount: number;
  loading: boolean;
};

export default function AnalyticsPageHero({
  characterCount,
  systemCount,
  loading,
}: AnalyticsPageHeroProps) {
  return (
    <section className="analytics-arcade-hero">
      <div className="analytics-arcade-glow analytics-arcade-glow--pink" aria-hidden="true" />
      <div className="analytics-arcade-glow analytics-arcade-glow--cyan" aria-hidden="true" />
      <div className="analytics-arcade-stars" aria-hidden="true">
        <i /><i /><i /><i /><i /><i />
      </div>

      <header className="relative z-20 px-4 pt-4 sm:px-7 sm:pt-6 lg:px-10">
        <div className="analytics-arcade-nav mx-auto flex max-w-[1700px] items-center justify-between gap-4 px-4 py-3 sm:px-5">
          <Link href="/" aria-label="Press Q home" className="flex items-center gap-3">
            <Image
              src="/press-q-icon.png"
              alt=""
              width={624}
              height={667}
              className="h-10 w-auto sm:h-12"
              priority
            />
            <span className="text-sm font-black uppercase tracking-[0.22em] text-white sm:text-base">
              Press Q
            </span>
          </Link>

          <nav className="hidden items-center gap-5 text-[11px] font-black uppercase tracking-[0.14em] text-[#dbe2ff] md:flex xl:gap-8">
            <Link href="/about">About</Link>
            <Link href="/methodology">Methodology</Link>
            <AnalyticsMenu dark />
            <Link href="/contribute">Contribute</Link>
            <Link href="/ethics">Ethics</Link>
          </nav>

          <Link href="/chat" className="analytics-arcade-nav-button px-4 py-2.5 text-[10px] sm:px-6 sm:py-3 sm:text-xs">
            Ask Quiu
          </Link>
        </div>
      </header>

      <div className="relative z-10 mx-auto grid max-w-[1600px] items-center gap-10 px-5 pb-16 pt-10 sm:px-8 md:px-14 md:pb-20 md:pt-14 lg:grid-cols-[minmax(0,1fr)_minmax(360px,0.68fr)] lg:px-20">
        <div className="max-w-4xl">
          <p className="analytics-arcade-eyebrow">
            <span aria-hidden="true">✦</span>
            Press Q data arcade
          </p>

          <h1 className="analytics-arcade-title mt-6">
            Visual <span>analytics</span>
          </h1>

          <p className="mt-6 max-w-3xl text-base font-semibold leading-relaxed text-[#d7defd] sm:text-lg md:text-xl">
            Explore characters, queer systems, and research gaps through a
            living, transparent, exportable archive.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a href="#analytics-dashboard" className="analytics-arcade-button analytics-arcade-button--primary px-6 py-3.5 text-xs">
              Explore the data
            </a>
            <Link href="/methodology" className="analytics-arcade-button analytics-arcade-button--secondary px-6 py-3.5 text-xs">
              How it works
            </Link>
          </div>
        </div>

        <div className="analytics-arcade-console" aria-label="Press Q dataset summary">
          <div className="analytics-arcade-console-topline">
            <span>Archive signal</span>
            <span className="analytics-arcade-live"><i /> Live</span>
          </div>

          <div className="analytics-arcade-orbit" aria-hidden="true">
            <div className="analytics-arcade-orbit-ring analytics-arcade-orbit-ring--outer" />
            <div className="analytics-arcade-orbit-ring analytics-arcade-orbit-ring--inner" />
            <div className="analytics-arcade-quiu">
              <Image
                src="/press-q-icon.png"
                alt=""
                width={624}
                height={667}
                className="h-auto w-[72%]"
              />
            </div>
            <span className="analytics-arcade-orbit-dot analytics-arcade-orbit-dot--one" />
            <span className="analytics-arcade-orbit-dot analytics-arcade-orbit-dot--two" />
            <span className="analytics-arcade-orbit-dot analytics-arcade-orbit-dot--three" />
          </div>

          <div className="analytics-arcade-metrics">
            <div>
              <strong>{loading ? "—" : characterCount}</strong>
              <span>Characters</span>
            </div>
            <div>
              <strong>{loading ? "—" : systemCount}</strong>
              <span>Queer systems</span>
            </div>
            <div>
              <strong>∞</strong>
              <span>Questions</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
