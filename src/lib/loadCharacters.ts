import fs from "fs";
import path from "path";
import csv from "csv-parser";

export type Character = {
  character_name: string;
  game_title: string;
  release_year?: number;
  developer: string;
  identity_label: string[];
  identity_category: string[];
  playable: boolean;
  description: string;
  total_score?: number;
  intersectionality_details?: string;
};

export async function loadCharacters(): Promise<Character[]> {
  const results: Character[] = [];

  const filePath = path.join(
    process.cwd(),
    "src/data/atlas_seed_dataset.csv"
  );

  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (data) => {
        results.push({
          character_name: data.character_name,
          game_title: data.game_title,
          release_year: Number(data.release_year),
          developer: data.developer,

          identity_label: data.identity_label
            ?.split(";")
            .map((v: string) => v.trim()) || [],

          identity_category: data.identity_category
            ?.split(";")
            .map((v: string) => v.trim()) || [],

          playable:
            data.playable_status === "playable",

          description:
            data.notes || "",

          total_score: Number(data.total_score),

          intersectionality_details:
            data.intersectionality_details || "",
        });
      })
      .on("end", () => {
        resolve(results);
      })
      .on("error", reject);
  });
}