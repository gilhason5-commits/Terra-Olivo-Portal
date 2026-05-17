export type Intensity = "Delicate" | "Medium" | "Intense";

export type Prize =
  | "Grand Prestige Gold"
  | "Prestige Gold"
  | "Prestige Silver"
  | "Best in Class";

/** Rank used for sorting — lower number is a higher honour. */
export const PRIZE_RANK: Record<Prize, number> = {
  "Grand Prestige Gold": 0,
  "Best in Class": 1,
  "Prestige Gold": 2,
  "Prestige Silver": 3,
};

/** A single win: one olive oil taking one prize in one competition edition. */
export interface Award {
  year: number;
  prize: Prize;
  /** Competition category, e.g. an intensity class or a special category. */
  category?: string;
  /** Panel score out of 100. */
  score?: number;
  /** Path or URL to the award certificate image (placeholder for now). */
  certificateImage?: string;
}

export interface OliveOil {
  slug: string;
  name: string;
  producerSlug: string;
  country: string;
  region: string;
  varieties: string[];
  intensity: Intensity;
  harvestYear?: number;
  /** Free acidity expressed as %. */
  acidity?: number;
  description: string;
  tastingNotes: string[];
  /** Path or URL to the olive oil photo (placeholder for now). */
  image?: string;
  /** Every prize this oil has won, across all editions. */
  awards: Award[];
}

export interface Producer {
  slug: string;
  name: string;
  country: string;
  region: string;
  founded?: number;
  description: string;
  website?: string;
  /** Path or URL to the producer photo (placeholder for now). */
  image?: string;
}
