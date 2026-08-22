"use client";

import Image from "next/image";
import { useRef } from "react";
import type { PointerEvent } from "react";

export default function HolographicCharacterCard({
  name,
  game,
  image,
  imageCredit,
  imageSourceUrl,
  evidence,
}: {
  name: string;
  game: string;
  image: string;
  imageCredit?: string;
  imageSourceUrl?: string;
  evidence?: string;
}) {
  const cardRef = useRef<HTMLElement>(null);

  function updateCard(event: PointerEvent<HTMLElement>) {
    const card = cardRef.current;
    if (!card || event.pointerType === "touch") return;
    const rect = card.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    const rotateY = (x - 50) / 7;
    const rotateX = (50 - y) / 8;
    card.style.setProperty("--pointer-x", `${x}%`);
    card.style.setProperty("--pointer-y", `${y}%`);
    card.style.setProperty("--rotate-x", `${rotateX}deg`);
    card.style.setProperty("--rotate-y", `${rotateY}deg`);
  }

  function resetCard() {
    const card = cardRef.current;
    if (!card) return;
    card.style.setProperty("--pointer-x", "50%");
    card.style.setProperty("--pointer-y", "50%");
    card.style.setProperty("--rotate-x", "0deg");
    card.style.setProperty("--rotate-y", "0deg");
  }

  return (
    <article
      ref={cardRef}
      onPointerMove={updateCard}
      onPointerLeave={resetCard}
      className="pq-holo-character-card"
    >
      <div className="pq-holo-card-shine" aria-hidden="true" />
      <div className="pq-holo-card-glare" aria-hidden="true" />

      <div className="pq-holo-character-image">
        <Image
          src={image}
          alt={`${name} from ${game}`}
          fill
          unoptimized
          sizes="(max-width: 768px) 92vw, 360px"
          className="object-cover"
        />
        <div className="pq-holo-image-scan" aria-hidden="true" />
      </div>

      <div className="pq-holo-character-copy relative z-[3] space-y-3 p-4">
        <div>
          <p className="font-mono text-[10px] font-black uppercase tracking-[0.2em] text-[#83e9f5]">
            Press Q · evidence card
          </p>
          <h3 className="mt-2 text-xl font-black italic text-white">{name}</h3>
          <p className="text-sm font-semibold text-slate-300">{game}</p>
        </div>

        {imageCredit ? (
          <p className="text-[13px] leading-relaxed text-slate-400">
            Image credit: <span className="text-slate-200">{imageCredit}</span>
          </p>
        ) : null}

        {evidence ? (
          <p className="line-clamp-4 text-[13px] leading-relaxed text-slate-400">
            Evidence: <span className="text-slate-200">{evidence}</span>
          </p>
        ) : null}

        {imageSourceUrl ? (
          <a
            href={imageSourceUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex rounded-full border border-[#83e9f5]/30 px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-[#83e9f5] transition hover:bg-[#83e9f5]/10"
          >
            View image source
          </a>
        ) : null}
      </div>
    </article>
  );
}
