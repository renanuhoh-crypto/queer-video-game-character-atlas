import Image from "next/image";
import Link from "next/link";

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
    <section className="pq-page-hero relative overflow-hidden border-b border-[#dfe3f3]">
      <header className="relative z-20 px-4 pt-4 sm:px-7 sm:pt-6 lg:px-10">
        <div className="pq-topbar mx-auto flex max-w-[1700px] items-center justify-between gap-4 px-4 py-3 sm:px-5">
          <Link href="/" aria-label="Press Q home" className="flex items-center gap-3">
            <Image
              src="/press-q-icon.png"
              alt=""
              width={624}
              height={667}
              className="h-10 w-auto sm:h-12"
            />
            <span className="text-sm font-black uppercase tracking-[0.22em] sm:text-base">
              Press Q
            </span>
          </Link>

          <nav className="hidden items-center gap-5 text-[11px] font-black uppercase tracking-[0.14em] text-[#3b405f] md:flex xl:gap-8">
            <Link href="/about">About</Link>
            <Link href="/methodology">Methodology</Link>
            <Link href="/analytics">Analytics</Link>
            <Link href="/contribute">Contribute</Link>
            <Link href="/ethics">Ethics</Link>
          </nav>

          <Link href="/chat" className="pq-primary-button px-4 py-2.5 text-[10px] sm:px-6 sm:py-3 sm:text-xs">
            Ask Quiu
          </Link>
        </div>
      </header>

      <div className="pq-spectrum-rule mx-auto mt-4 max-w-[1700px]" />

      {!hideIntro ? (
        <div className="relative z-10 mx-auto grid max-w-[1600px] items-center gap-10 px-5 py-12 sm:px-8 md:px-14 md:py-16 lg:grid-cols-[1fr_0.38fr] lg:px-20">
          <div className="max-w-5xl">
            <p className="pq-eyebrow">
              {eyebrow}
            </p>

            <h1 className="mt-5 break-words text-5xl font-black uppercase leading-[0.88] tracking-[-0.055em] text-[#12152b] sm:text-6xl md:text-8xl">
              {title}{" "}
              <span className="text-[#4f5fe7]">
                {accent}
              </span>
            </h1>

            <p className="mt-5 max-w-3xl text-base font-medium leading-relaxed text-[#5d6480] sm:text-lg md:mt-6 md:text-xl">
              {description}
            </p>
          </div>

          <div className="pq-page-emblem relative mx-auto hidden aspect-square w-full max-w-[240px] items-center justify-center lg:flex" aria-hidden="true">
            <Image
              src="/press-q-icon.png"
              alt=""
              width={624}
              height={667}
              className="h-auto w-[72%] opacity-90"
            />
          </div>
        </div>
      ) : null}
    </section>
  );
}
