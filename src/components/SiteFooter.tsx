import Image from "next/image";
import Link from "next/link";

const mainLinks = [
  { label: "About", href: "/about" },
  { label: "Methodology", href: "/methodology" },
  { label: "Analytics", href: "/analytics" },
  { label: "Chat", href: "/chat" },
  { label: "Contribute", href: "/contribute" },
  { label: "Ethics", href: "/ethics" },
];

const supportLinks = [
  { label: "Press Q Dataset Signal", href: "/" },
  { label: "Research Console", href: "/chat" },
  { label: "Visual Analytics", href: "/analytics" },
  { label: "Contribute Characters", href: "/contribute" },
  { label: "Press Q Archive", href: "/" },
];

const socialLinks = ["X (Twitter)", "Instagram", "LinkedIn"];

export default function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-[#161c4e] px-5 py-12 text-white sm:px-8 md:px-14 md:py-16 lg:px-20">
      <div className="mx-auto max-w-[1700px]">
        <div className="grid gap-8 md:grid-cols-[1fr_auto_1fr] md:items-center">
          <Link
            href="/"
            aria-label="Press Q home"
            className="flex w-fit items-center gap-3 transition hover:-translate-y-1"
          >
            <Image
              src="/press-q-icon.png"
              alt=""
              width={624}
              height={667}
              className="h-14 w-auto"
            />
            <span className="text-lg font-black uppercase tracking-[0.2em]">Press Q</span>
          </Link>

          <nav className="flex flex-wrap gap-x-5 gap-y-3 text-sm font-bold sm:gap-x-8 md:justify-center">
            {mainLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="transition hover:text-[#ff7ca4]"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <nav className="flex flex-wrap gap-x-5 gap-y-3 text-sm font-bold sm:gap-x-8 md:justify-end">
            {socialLinks.map((label) => (
              <a
                key={label}
                href="#"
                className="transition hover:text-[#ff7ca4]"
              >
                {label}
              </a>
            ))}
          </nav>
        </div>

        <div className="pq-spectrum-rule my-8 sm:my-10" />

        <div className="grid gap-8 text-sm md:grid-cols-[1fr_auto] md:items-center">
          <nav className="flex flex-wrap gap-x-5 gap-y-3 sm:gap-x-8">
            {supportLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="transition hover:text-[#ff7ca4]"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <p className="text-white/55">Press Q 2026</p>
        </div>
      </div>
    </footer>
  );
}
