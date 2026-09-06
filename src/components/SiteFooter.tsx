import Image from "next/image";
import Link from "next/link";

const mainLinks = [
  { label: "About", href: "/about" },
  { label: "Methodology", href: "/methodology" },
  { label: "Analytics", href: "/analytics" },
  { label: "Gallery", href: "/gallery" },
  { label: "Rainbow Road", href: "/rainbowroad" },
  { label: "Chat", href: "/chat" },
  { label: "Contribute", href: "/contribute" },
  { label: "Ethics", href: "/ethics" },
];

const supportLinks = [
  { label: "Press Q Dataset Signal", href: "/" },
  { label: "Research Console", href: "/chat" },
  { label: "Visual Analytics", href: "/analytics" },
  { label: "Character Gallery", href: "/gallery" },
  { label: "Rainbow Road", href: "/rainbowroad" },
  { label: "Contribute Characters", href: "/contribute" },
  { label: "Press Q Archive", href: "/" },
];

const socialLinks = ["X (Twitter)", "Instagram", "LinkedIn"];

export default function SiteFooter() {
  return (
    <footer className="site-signal-footer px-5 py-12 text-white sm:px-8 md:px-14 md:py-16 lg:px-20">
      <div className="mx-auto max-w-[1700px]">
        <p className="site-signal-footer-index" aria-hidden="true">09 / End of transmission</p>
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

          <nav aria-label="Footer navigation" className="flex flex-wrap gap-x-5 gap-y-3 text-sm font-bold sm:gap-x-8 md:justify-center">
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

          <div aria-label="Social profiles coming soon" className="flex flex-wrap gap-x-5 gap-y-3 text-sm font-bold sm:gap-x-8 md:justify-end">
            {socialLinks.map((label) => (
              <span
                key={label}
                title={`${label} profile coming soon`}
                className="text-white/45"
              >
                {label}
              </span>
            ))}
          </div>
        </div>

        <div className="pq-spectrum-rule my-8 sm:my-10" />

        <div className="grid gap-8 text-sm md:grid-cols-[1fr_auto] md:items-center">
          <nav aria-label="Research links" className="flex flex-wrap gap-x-5 gap-y-3 sm:gap-x-8">
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
