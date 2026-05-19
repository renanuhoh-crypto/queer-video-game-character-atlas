import Link from "next/link";
import PrismHeroScene from "@/components/PrismHeroScene";

type PrismPageHeroProps = {
  eyebrow: string;
  title: string;
  accent: string;
  description: string;
};

export default function PrismPageHero({
  eyebrow,
  title,
  accent,
  description,
}: PrismPageHeroProps) {
  return (
    <section className="relative overflow-hidden border-b border-white/10 bg-black">
      <div className="absolute inset-0 opacity-65">
        <PrismHeroScene />
      </div>

      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.96)_0%,rgba(0,0,0,0.76)_44%,rgba(0,0,0,0.38)_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(217,70,239,0.18),transparent_30%),radial-gradient(circle_at_74%_18%,rgba(34,211,238,0.12),transparent_30%)]" />

      <div className="relative z-10 mx-auto max-w-[1700px] px-8 pb-16 pt-10 md:px-14 lg:px-20">
        <Link
          href="/"
          className="font-mono text-xs uppercase tracking-[0.32em] text-cyan-300 transition hover:text-cyan-100"
        >
          Back to PRSM
        </Link>

        <div className="mt-14 max-w-5xl">
          <p className="font-mono text-xs uppercase tracking-[0.45em] text-fuchsia-300">
            {eyebrow}
          </p>

          <h1 className="mt-5 text-6xl font-black italic leading-none tracking-normal md:text-8xl">
            {title}{" "}
            <span className="bg-gradient-to-r from-fuchsia-300 via-cyan-200 to-yellow-100 bg-clip-text text-transparent">
              {accent}
            </span>
          </h1>

          <p className="mt-6 max-w-3xl text-xl leading-relaxed text-slate-200 md:text-2xl">
            {description}
          </p>
        </div>
      </div>

      <div className="prism-bar relative z-10 h-3 overflow-hidden border-y border-white/10 bg-black">
        <div className="prism-bar__glow" />
        <div className="prism-bar__spectrum" />
        <div className="prism-bar__shine" />
        <div className="prism-bar__core" />
      </div>
    </section>
  );
}
