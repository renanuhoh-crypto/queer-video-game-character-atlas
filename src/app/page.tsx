import Image from "next/image";
import Link from "next/link";
import localFont from "next/font/local";
import Quiu3DStage from "@/components/Quiu3DStage";
import {
  readCharacterRows,
  type CharacterRow,
} from "@/lib/characterDataset";
import { getIntersectionalityMarkers } from "@/lib/analyticsIntersectionality";
import styles from "./HomeSignalTheme.module.css";

const airstripFour = localFont({
  src: "./fonts/airstrip-four/airstrip.ttf",
  variable: "--font-airstrip-four",
  display: "swap",
  weight: "400",
  style: "normal",
  fallback: ["Arial Black", "Arial", "sans-serif"],
});

export const dynamic = "force-dynamic";

function normalize(value?: string | null) {
  return value?.trim().toLowerCase().replace(/\s+/g, "_") || "";
}

function formatLabel(value?: string | null) {
  if (!value) return "Unknown";

  return value
    .replace(/_/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function percent(count: number, total: number) {
  return total > 0 ? Math.round((count / total) * 100) : 0;
}

function splitValues(value?: string | null) {
  return (value || "")
    .split(";")
    .flatMap((item) => item.split(","))
    .map((item) => item.trim())
    .filter(Boolean);
}

function splitContributors(value?: string | null) {
  return (value || "")
    .split(/[;/]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function countBy(values: string[], limit = 4) {
  const map: Record<string, number> = {};

  values.forEach((value) => {
    const clean = value?.trim();
    const normalized = normalize(clean);

    if (
      !clean ||
      normalized === "none" ||
      normalized === "unknown" ||
      normalized === "not_available"
    ) {
      return;
    }

    const label = formatLabel(clean);
    map[label] = (map[label] || 0) + 1;
  });

  return Object.entries(map)
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
    .slice(0, limit);
}

function getAnalytics(characters: CharacterRow[]) {
  const total = characters.length;
  const games = new Set(
    characters
      .map((character) => normalize(character.game_title))
      .filter(Boolean),
  ).size;

  const playable = characters.filter(
    (character) => normalize(character.playable_status) === "playable",
  ).length;
  const playabilityMissing = characters.filter(
    (character) => normalize(character.playable_status) === "unknown",
  ).length;

  const trans = characters.filter((character) => {
    const values = [
      character.gender,
      character.sexuality,
      ...splitValues(character.identity_category),
    ].map(normalize);

    return values.some((value) => value.includes("trans"));
  }).length;

  const confirmed = characters.filter(
    (character) => normalize(character.queer_status) === "confirmed",
  ).length;

  const explicit = characters.filter((character) =>
    splitValues(character.identity_confirmation)
      .map(normalize)
      .includes("explicit_in_game"),
  ).length;

  const intersectionality = characters.map((character) =>
    getIntersectionalityMarkers({
      intersectionality_present: character.intersectionality_present,
      intersectionality_details: character.intersectionality_details,
    }),
  );
  const intersectional = intersectionality.filter((markers) =>
    markers.some(
      (marker) => marker !== "none_documented" && marker !== "not_recorded",
    ),
  ).length;
  const intersectionalityMissing = intersectionality.filter((markers) =>
    markers.includes("not_recorded"),
  ).length;

  const studios = countBy(
    characters.flatMap((character) => splitContributors(character.developer)),
  );

  const genres = countBy(
    characters.flatMap((character) => splitValues(character.genre)),
  );

  const years = characters
    .map((character) => Number(character.release_year))
    .filter((year) => Number.isFinite(year) && year > 0)
    .sort((a, b) => a - b);

  return {
    total,
    games,
    playable,
    playabilityMissing,
    playablePercent: percent(playable, total),
    trans,
    transPercent: percent(trans, total),
    confirmed,
    confirmedPercent: percent(confirmed, total),
    explicit,
    explicitPercent: percent(explicit, total),
    intersectional,
    intersectionalityMissing,
    intersectionalPercent: percent(intersectional, total),
    studios,
    genres,
    firstYear: years[0] || null,
    latestYear: years.at(-1) || null,
  };
}

const navigation = [
  { label: "Quiu World", href: "/quiu-world" },
  { label: "About", href: "/about" },
  { label: "Method", href: "/methodology" },
  { label: "Analytics", href: "/analytics" },
  { label: "Gallery", href: "/gallery" },
  { label: "Contribute", href: "/contribute" },
  { label: "Ethics", href: "/ethics" },
];

const archiveRoutes = [
  {
    number: "01",
    eyebrow: "Meet the cast",
    title: "Character gallery",
    description:
      "Browse characters as people, not just rows: identities, roles, evidence, games, and appearances stay connected.",
    href: "/gallery",
    action: "Open gallery",
    visual: "gallery",
  },
  {
    number: "02",
    eyebrow: "Read the patterns",
    title: "Visual analytics",
    description:
      "Move from individual stories to the wider picture across genres, studios, years, identities, and intersections.",
    href: "/analytics",
    action: "Explore the data",
    visual: "analytics",
  },
  {
    number: "03",
    eyebrow: "Question the archive",
    title: "Ask Quiu",
    description:
      "Use the research console to ask focused questions while keeping confirmed evidence separate from interpretation.",
    href: "/chat",
    action: "Start a query",
    visual: "chat",
  },
];

export default function Home() {
  const analytics = getAnalytics(readCharacterRows());
  const timeline =
    analytics.firstYear && analytics.latestYear
      ? `${analytics.firstYear}—${analytics.latestYear}`
      : "In review";

  const heroStats = [
    { label: "Characters", value: analytics.total.toLocaleString("en-US") },
    { label: "Games", value: analytics.games.toLocaleString("en-US") },
    { label: "Timeline", value: timeline },
  ];

  const signalCards = [
    {
      label: "Playable",
      value: `${analytics.playablePercent}%`,
      detail: `${analytics.playable} of ${analytics.total} entries · ${analytics.playabilityMissing} not yet recorded`,
    },
    {
      label: "Confirmed status",
      value: `${analytics.confirmedPercent}%`,
      detail: `${analytics.confirmed} of ${analytics.total} current entries`,
    },
    {
      label: "Explicit in-game",
      value: `${analytics.explicitPercent}%`,
      detail: `${analytics.explicit} of ${analytics.total} entries with direct confirmation`,
    },
    {
      label: "Trans representation",
      value: `${analytics.transPercent}%`,
      detail: `${analytics.trans} of ${analytics.total} current entries`,
    },
    {
      label: "Intersectional context",
      value: `${analytics.intersectionalPercent}%`,
      detail: `${analytics.intersectional} of ${analytics.total} entries · ${analytics.intersectionalityMissing} not yet recorded`,
    },
  ];

  return (
    <main className={`pressq-studio-home ${styles.home} ${airstripFour.variable}`}>
      <section className="pressq-studio-hero">
        <div className="pressq-studio-stars" aria-hidden="true" />
        <div className="pressq-studio-grid" aria-hidden="true" />
        <div className="pressq-studio-bolt pressq-studio-bolt--one" aria-hidden="true" />
        <div className="pressq-studio-bolt pressq-studio-bolt--two" aria-hidden="true" />

        <header className="pressq-studio-header">
          <div className="pressq-studio-nav-shell">
            <Link href="/" className="pressq-studio-brand" aria-label="Press Q home">
              <Image
                src="/press-q-icon.png"
                alt=""
                width={624}
                height={667}
                priority
              />
              <span>
                <strong>Press Q</strong>
                <small>Queer game archive</small>
              </span>
            </Link>

            <nav className="pressq-studio-desktop-nav" aria-label="Primary navigation">
              {navigation.map((item) => (
                <Link key={item.href} href={item.href}>
                  {item.label}
                </Link>
              ))}
            </nav>

            <Link href="/chat" className="pressq-studio-nav-cta">
              Ask Quiu <span aria-hidden="true">↗</span>
            </Link>
          </div>

          <nav className="pressq-studio-mobile-nav" aria-label="Mobile navigation">
            {navigation.map((item) => (
              <Link key={item.href} href={item.href}>
                {item.label}
              </Link>
            ))}
          </nav>
        </header>

        <div className="pressq-studio-hero-inner">
          <div className="pressq-studio-hero-copy">
            <p className="pressq-studio-kicker">
              <span aria-hidden="true" /> AI-assisted queer game archive
            </p>
            <h1>
              <span>Play through</span>
              <span className="pressq-studio-title-accent">queer game</span>
              <span>history.</span>
            </h1>
            <p className="pressq-studio-lede">
              An AI-assisted research archive tracing queer characters and
              representation across video game history.
            </p>

            <div className="pressq-studio-actions">
              <Link href="/gallery" className="pressq-studio-button pressq-studio-button--primary">
                Explore characters <span aria-hidden="true">→</span>
              </Link>
              <Link href="/analytics" className="pressq-studio-button pressq-studio-button--ghost">
                View analytics
              </Link>
            </div>

            <dl className="pressq-studio-hero-stats">
              {heroStats.map((stat) => (
                <div key={stat.label}>
                  <dt>{stat.label}</dt>
                  <dd>{stat.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="pressq-studio-hero-art">
            <div className={styles.modelIndex} aria-hidden="true">
              <span>Q-01 / GUIDE</span>
              <span>INTERACTIVE SIGNAL</span>
            </div>
            <div className={styles.modelFrame}>
              <Quiu3DStage />
            </div>
            <div className="pressq-studio-float-card pressq-studio-float-card--top">
              <span>Signal</span>
              <strong>Living dataset</strong>
            </div>
            <div className="pressq-studio-float-card pressq-studio-float-card--bottom">
              <span>Evidence mode</span>
              <strong>Context first</strong>
            </div>
            <div className={styles.modelTelemetry} aria-hidden="true">
              <span>LAT 43.65</span>
              <span>NODE ACTIVE</span>
              <span>REV 2026.09</span>
            </div>
          </div>
        </div>

        <a className="pressq-studio-scroll" href="#archive-routes">
          <span aria-hidden="true" /> Scroll to explore
        </a>
      </section>

      <section id="archive-routes" className="pressq-studio-routes" aria-labelledby="archive-routes-title">
        <div className="pressq-studio-section-heading">
          <p>Choose your route</p>
          <h2 id="archive-routes-title">Enter the archive</h2>
          <span>
            Start with a face, a pattern, or a question. Every path returns to
            the evidence.
          </span>
        </div>

        <div className="pressq-studio-route-grid">
          {archiveRoutes.map((route) => (
            <article className="pressq-studio-route-card" key={route.href}>
              <div className={`pressq-studio-route-visual is-${route.visual}`}>
                <span className="pressq-studio-route-number">{route.number}</span>
                {route.visual === "gallery" ? (
                  <Image
                    src="/quiu-flying-right.png"
                    alt=""
                    width={363}
                    height={545}
                    className="pressq-studio-route-character"
                  />
                ) : null}
                {route.visual === "analytics" ? (
                  <div className="pressq-studio-chart" aria-hidden="true">
                    <span style={{ height: "38%" }} />
                    <span style={{ height: "72%" }} />
                    <span style={{ height: "54%" }} />
                    <span style={{ height: "88%" }} />
                    <i />
                  </div>
                ) : null}
                {route.visual === "chat" ? (
                  <Image
                    src="/quiu-thinking.png"
                    alt=""
                    width={1332}
                    height={1181}
                    className="pressq-studio-route-character"
                  />
                ) : null}
              </div>
              <div className="pressq-studio-route-content">
                <p>{route.eyebrow}</p>
                <h3>{route.title}</h3>
                <span>{route.description}</span>
                <Link href={route.href}>
                  {route.action} <b aria-hidden="true">↗</b>
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="pressq-studio-record" aria-labelledby="record-title">
        <div className="pressq-studio-record-orbit" aria-hidden="true" />
        <div className="pressq-studio-record-inner">
          <div className="pressq-studio-record-copy">
            <p>Dataset snapshot</p>
            <h2 id="record-title">A track record with context.</h2>
            <span>
              Percentages describe the current research dataset, not the whole
              history of games. Every entry can be reviewed as evidence grows.
            </span>
            <Link href="/methodology">Read the methodology <b aria-hidden="true">↗</b></Link>
          </div>
          <dl className="pressq-studio-record-grid">
            {signalCards.map((card) => (
              <div key={card.label}>
                <dt>{card.label}</dt>
                <dd>{card.value}</dd>
                <dd className="pressq-studio-record-detail">{card.detail}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="pressq-studio-method" aria-labelledby="method-title">
        <div className="pressq-studio-method-art">
          <div className="pressq-studio-method-ring" aria-hidden="true" />
          <Image
            src="/press-q-icon.png"
            alt="Press Q controller emblem"
            width={624}
            height={667}
            className="pressq-studio-method-icon"
          />
          <span className="pressq-studio-method-tag">Evidence ≠ assumption</span>
        </div>
        <div className="pressq-studio-method-copy">
          <p>Built for careful research</p>
          <h2 id="method-title">Stories stay nuanced. Data stays traceable.</h2>
          <span>
            Press Q separates character identity, game context, sources, and
            interpretive notes so representation is not flattened into a single
            label.
          </span>
          <ul>
            <li><i aria-hidden="true">✓</i> Confirmed identity and interpretation remain distinct.</li>
            <li><i aria-hidden="true">✓</i> DLC, expansions, versions, and mods can be documented.</li>
            <li><i aria-hidden="true">✓</i> Intersectional markers keep their supporting detail.</li>
          </ul>
          <div className="pressq-studio-actions">
            <Link href="/about" className="pressq-studio-button pressq-studio-button--primary">
              About Press Q <span aria-hidden="true">→</span>
            </Link>
            <Link href="/contribute" className="pressq-studio-text-link">
              Contribute a character <span aria-hidden="true">↗</span>
            </Link>
          </div>
        </div>
      </section>

      <section className="pressq-studio-signals" aria-labelledby="signals-title">
        <div className="pressq-studio-section-heading is-light">
          <p>Archive signals</p>
          <h2 id="signals-title">See what is taking shape</h2>
          <span>Live counts from the documented entries in the Press Q dataset.</span>
        </div>

        <div className="pressq-studio-signal-grid">
          <RankingCard title="Studios represented" items={analytics.studios} />
          <RankingCard title="Genres represented" items={analytics.genres} />
          <article className="pressq-studio-query-card">
            <span className="pressq-studio-query-orbit" aria-hidden="true" />
            <p>Research console</p>
            <h3>Numbers are the start of the question.</h3>
            <span>
              Ask Quiu to surface characters and patterns, then follow the source
              trail before drawing a conclusion.
            </span>
            <Link href="/chat">Ask the archive <b aria-hidden="true">→</b></Link>
          </article>
        </div>
      </section>
    </main>
  );
}

function RankingCard({
  title,
  items,
}: {
  title: string;
  items: { label: string; count: number }[];
}) {
  const max = Math.max(...items.map((item) => item.count), 1);

  return (
    <article className="pressq-studio-ranking-card">
      <h3>{title}</h3>
      <div>
        {items.map((item, index) => (
          <div className="pressq-studio-ranking-row" key={item.label}>
            <span className="pressq-studio-ranking-index">0{index + 1}</span>
            <span className="pressq-studio-ranking-label">{item.label}</span>
            <span className="pressq-studio-ranking-track" aria-hidden="true">
              <i style={{ width: `${Math.max(12, (item.count / max) * 100)}%` }} />
            </span>
            <strong>{item.count}</strong>
          </div>
        ))}
      </div>
    </article>
  );
}
