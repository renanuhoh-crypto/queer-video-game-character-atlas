import Link from "next/link";

const mainLinks = [
  { label: "About", href: "/about" },
  { label: "Methodology", href: "/methodology" },
  { label: "Analytics", href: "/analytics" },
  { label: "Chat", href: "/chat" },
  { label: "Ethics", href: "/ethics" },
];

const supportLinks = [
  { label: "Dataset Signal", href: "/" },
  { label: "Research Console", href: "/chat" },
  { label: "Visual Analytics", href: "/analytics" },
  { label: "PRSM Archive", href: "/" },
];

const socialLinks = ["X (Twitter)", "Instagram", "LinkedIn"];

export default function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-[#f4f4f2] px-5 py-12 text-[#111118] sm:px-8 md:px-14 md:py-16 lg:px-20">
      <div className="mx-auto max-w-[1700px]">
        <div className="grid gap-8 md:grid-cols-[1fr_auto_1fr] md:items-center">
          <Link
            href="/"
            className="text-sm font-black tracking-[0.28em] transition hover:text-fuchsia-600 sm:tracking-[0.35em]"
          >
            PRSM
          </Link>

          <nav className="flex flex-wrap gap-x-5 gap-y-3 text-sm font-bold sm:gap-x-8 md:justify-center">
            {mainLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="transition hover:text-fuchsia-600"
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
                className="transition hover:text-cyan-700"
              >
                {label}
              </a>
            ))}
          </nav>
        </div>

        <div className="my-8 h-px bg-black/10 sm:my-10" />

        <div className="grid gap-8 text-sm md:grid-cols-[1fr_auto] md:items-center">
          <nav className="flex flex-wrap gap-x-5 gap-y-3 sm:gap-x-8">
            {supportLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="transition hover:text-fuchsia-600"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <p className="text-black/60">PRSM 2026</p>
        </div>
      </div>
    </footer>
  );
}
