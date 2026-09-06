import type { Metadata } from "next";
import CharacterGallery from "@/components/CharacterGallery";
import PrismPageHero from "@/components/PrismPageHero";

export const metadata: Metadata = {
  title: "Character Gallery",
  description:
    "Browse documented queer video game character records in the Press Q archive.",
};

export default function GalleryPage() {
  return (
    <main className="pq-page min-h-screen bg-[#f7f7fb] text-[#12152b]">
      <PrismPageHero
        eyebrow="Character archive"
        title="Character"
        accent="gallery"
        description="Browse the people, creatures, heroes, rivals, and companions currently documented by Press Q. Each card represents one character in one game record."
      />
      <CharacterGallery />
    </main>
  );
}
