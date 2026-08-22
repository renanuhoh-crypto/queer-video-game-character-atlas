import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from "react";
import Link from "next/link";

type GalaxyButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  compact?: boolean;
};

const orbitingStars = Array.from({ length: 20 }, (_, index) => ({
  duration: 7 + ((index * 7) % 13),
  delay: 1 + ((index * 3) % 10),
  alpha: 0.42 + ((index * 11) % 45) / 100,
  size: 2 + ((index * 5) % 5),
  distance: 42 + ((index * 29) % 154),
}));

const staticStars = Array.from({ length: 4 }, (_, index) => ({
  duration: 7 + index * 4,
  delay: 2 + index * 2,
  alpha: 0.7 + index * 0.06,
  size: 2 + index,
  distance: 45 + index * 28,
}));

function starStyle(star: (typeof orbitingStars)[number]) {
  return {
    "--duration": star.duration,
    "--delay": star.delay,
    "--alpha": star.alpha,
    "--size": star.size,
    "--distance": star.distance,
  } as CSSProperties;
}

export default function GalaxyButton({
  children,
  compact = false,
  className = "",
  ...props
}: GalaxyButtonProps) {
  return (
    <button
      className={`pq-galaxy-button ${compact ? "pq-galaxy-button--compact" : ""} ${className}`}
      {...props}
    >
      <GalaxyVisuals>{children}</GalaxyVisuals>
    </button>
  );
}

export function GalaxyLink({
  href,
  children,
  className = "",
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link href={href} className={`pq-galaxy-button ${className}`}>
      <GalaxyVisuals>{children}</GalaxyVisuals>
    </Link>
  );
}

function GalaxyVisuals({ children }: { children: ReactNode }) {
  return (
    <>
      <span className="pq-galaxy-spark" aria-hidden="true" />
      <span className="pq-galaxy-backdrop" aria-hidden="true" />
      <span className="pq-galaxy-static" aria-hidden="true">
        {staticStars.map((star, index) => (
          <span
            className="pq-galaxy-star pq-galaxy-star--static"
            style={starStyle(star)}
            key={index}
          />
        ))}
      </span>
      <span className="pq-galaxy" aria-hidden="true">
        <span className="pq-galaxy-ring">
          {orbitingStars.map((star, index) => (
            <span
              className="pq-galaxy-star"
              style={starStyle(star)}
              key={index}
            />
          ))}
        </span>
      </span>
      <span className="pq-galaxy-label">{children}</span>
    </>
  );
}
