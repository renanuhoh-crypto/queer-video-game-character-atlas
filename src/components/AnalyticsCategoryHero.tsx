import Image from "next/image";
import Link from "next/link";
import AnalyticsMenu from "@/components/AnalyticsMenu";
import AnalyticsCategorySelector from "@/components/AnalyticsCategorySelector";
import type { AnalyticsCategory } from "@/lib/analyticsCategories";

export default function AnalyticsCategoryHero({
  category,
}: {
  category: AnalyticsCategory;
}) {
  return (
    <section className="analytics-category-hero">
      <div className="analytics-arcade-glow analytics-arcade-glow--pink" aria-hidden="true" />
      <div className="analytics-arcade-glow analytics-arcade-glow--cyan" aria-hidden="true" />

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

      <div className="relative z-10 mx-auto grid max-w-[1500px] items-end gap-8 px-5 pb-14 pt-10 sm:px-8 md:px-14 md:pb-16 md:pt-14 lg:grid-cols-[minmax(0,1fr)_minmax(300px,0.45fr)] lg:px-20">
        <div>
          <Link href="/analytics" className="analytics-category-back">
            ← Analytics overview
          </Link>
          <p className="analytics-arcade-eyebrow mt-6">
            <span aria-hidden="true">✦</span>
            {category.group} · {category.eyebrow}
          </p>
          <h1 className="mt-5 max-w-5xl text-4xl font-black leading-[0.95] tracking-[-0.045em] text-white sm:text-5xl md:text-7xl">
            {category.title}
          </h1>
          <p className="mt-5 max-w-3xl text-base font-semibold leading-7 text-[#d7defd] sm:text-lg">
            {category.summary}
          </p>
        </div>

        <AnalyticsCategorySelector current={category.slug} />
      </div>
    </section>
  );
}
