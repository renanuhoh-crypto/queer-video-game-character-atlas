import Image from "next/image";
import Link from "next/link";
import AnalyticsMenu from "@/components/AnalyticsMenu";
import Quiu3DStage from "@/components/Quiu3DStage";

type PrismPageHeroProps = {
  eyebrow: string;
  title: string;
  accent: string;
  description: string;
  hideIntro?: boolean;
};

export default function PrismPageHero({
  eyebrow,
  title,
  accent,
  description,
  hideIntro = false,
}: PrismPageHeroProps) {
  return (
    <section className={`pq-page-hero relative ${hideIntro ? "overflow-visible" : "overflow-hidden"}`}>
      <div className="pq-system-hero-grid" aria-hidden="true" />
      <div className="pq-system-hero-glow pq-system-hero-glow--cyan" aria-hidden="true" />
      <div className="pq-system-hero-glow pq-system-hero-glow--pink" aria-hidden="true" />

      <header className="relative z-20 px-4 pt-4 sm:px-7 sm:pt-6 lg:px-10">
        <div className="pq-topbar mx-auto flex max-w-[1500px] items-center justify-between gap-4 px-4 py-2.5 sm:px-5">
          <Link href="/" aria-label="Press Q home" className="flex items-center gap-3">
            <Image
              src="/press-q-icon.png"
              alt=""
              width={624}
              height={667}
              loading="eager"
              className="h-9 w-auto sm:h-10"
            />
            <span className="text-sm font-black uppercase tracking-[0.22em] sm:text-base">
              Press Q
            </span>
          </Link>

          <nav className="hidden items-center gap-5 text-[11px] font-black uppercase tracking-[0.14em] xl:flex xl:gap-7">
            <Link href="/about">About</Link>
            <Link href="/methodology">Methodology</Link>
            <AnalyticsMenu dark />
            <Link href="/gallery">Gallery</Link>
            <Link href="/quiu-world">Quiu World</Link>
            <Link href="/contribute">Contribute</Link>
            <Link href="/ethics">Ethics</Link>
          </nav>

          <Link href="/chat" className="pq-primary-button px-4 py-2.5 text-[10px] sm:px-6 sm:py-3 sm:text-xs">
            Ask Quiu
          </Link>
        </div>

        <nav className="pq-system-mobile-nav mx-auto max-w-[1500px] xl:hidden" aria-label="Primary navigation">
          <Link href="/about">About</Link>
          <Link href="/methodology">Methodology</Link>
          <Link href="/analytics">Analytics</Link>
          <Link href="/gallery">Gallery</Link>
          <Link href="/quiu-world">Quiu World</Link>
          <Link href="/contribute">Contribute</Link>
          <Link href="/ethics">Ethics</Link>
        </nav>
      </header>

      <div className="pq-spectrum-rule mx-auto mt-3 max-w-[1500px]" />

      {!hideIntro ? (
        <div className="pq-system-hero-layout relative z-10 mx-auto grid max-w-[1440px] items-center gap-9 px-5 py-9 sm:px-8 md:px-12 md:py-14 lg:grid-cols-[minmax(0,1fr)_minmax(360px,0.68fr)] lg:px-16">
          <div className="pq-system-hero-copy max-w-5xl">
            <div className="pq-system-hero-kicker" aria-hidden="true">
              <span>00 / Press Q archive</span>
              <span>Research interface</span>
            </div>

            <p className="pq-eyebrow">{eyebrow}</p>

            <h1 className="pq-system-hero-title mt-4 break-words font-black uppercase">
              {title}{" "}
              <span>{accent}</span>
            </h1>

            <p className="pq-system-hero-description mt-5 max-w-2xl text-sm font-medium leading-relaxed sm:text-base md:text-lg">
              {description}
            </p>

            <div className="pq-system-hero-readout" aria-hidden="true">
              <span><i /> Live archive</span>
              <span>Three evidence layers</span>
              <span>Human review</span>
            </div>
          </div>

          <div className="pq-system-hero-model relative mx-auto w-full max-w-[540px]">
            <Quiu3DStage />
          </div>
        </div>
      ) : null}
    </section>
  );
}
