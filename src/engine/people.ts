// A crowd generator: varied extras per era (hair, hats, beards, glasses, skin, builds, dresses), deterministic by index.
import { Outfit, SKINS } from "./toon";
import { Who } from "./core";

const H = (i: number, s: number) => { const v = Math.sin(i * 91.7 + s * 47.3) * 43758.5453; return v - Math.floor(v); };
const pick = <T,>(a: T[], i: number, s: number) => a[Math.floor(H(i, s) * a.length) % a.length];
export const SKIN_ALL = [...SKINS, "#e0ac7e", "#a8704a", "#8a5a3a", "#f7d7bd"];
const HAIR = ["#2b211c", "#5a3b2a", "#8a5a34", "#c99a5a", "#e2c27a", "#9a948c", "#d9d4cc", "#a2452c"];

export type Era = "1850" | "1900" | "1950" | "pacific" | "1930au" | "medieval" | "1880";
const COATS: Record<Era, string[]> = {
  "1850": ["#3f4f6f", "#5a3b2a", "#2f4a3a", "#6b2f35", "#4a4552", "#7a6a50"],
  "1880": ["#3f4f6f", "#5a3b2a", "#2f4a3a", "#6b2f35", "#4a4552", "#7a6a50", "#2e2a36"],
  "1900": ["#3f6fb5", "#8c3b4a", "#5d7a3a", "#b5653f", "#2f5f6a", "#7b5ac9", "#4a4552"],
  "1950": ["#5b7fa8", "#c2734a", "#6f8f5a", "#b0a07a", "#8a6a9a", "#3f5a7a", "#d8b45a"],
  pacific: ["#e07a3a", "#3a9a8a", "#d8b45a", "#c2453f", "#5a8fc2", "#f2e2c2", "#7a9a3a"],
  "1930au": ["#b0a07a", "#7a6a50", "#5d7a3a", "#8a5a34", "#c2b49a", "#4a5a6a"],
  medieval: ["#7a5a3e", "#5d6a3a", "#8c4a3a", "#4a5a7a", "#9a8a6a", "#6a4a5a"],
};
const DRESS: Record<Era, string[]> = {
  "1850": ["#6d7aa8", "#a8584a", "#5a7a5a", "#8a6a9a", "#c2a25a"], "1880": ["#6d7aa8", "#a8584a", "#5a7a5a", "#8a6a9a", "#c2a25a"],
  "1900": ["#d9a441", "#c25a7a", "#5a8fc2", "#7aa86a", "#e08a5a"], "1950": ["#e05a5a", "#5aa8c2", "#f2c24a", "#8ac25a", "#c27ad8", "#f29ab0"],
  pacific: ["#e05a3a", "#3ac2b0", "#f2c24a", "#c24a8a", "#5a8f3a"], "1930au": ["#c2a27a", "#8aa0b0", "#b07a6a", "#9ab07a"],
  medieval: ["#8c4a3a", "#5a6a8a", "#9a8a5a", "#6a7a4a"],
};

/** an extra: i = index (deterministic), kidEvery = every n-th is a child, elderEvery = every n-th is elderly */
export const civilian = (era: Era, i: number, kidEvery = 6, elderEvery = 7): Outfit => {
  const skin = era === "pacific" ? pick(["#c99067", "#a8704a", "#8a5a3a", "#e0ac7e"], i, 1) : era === "1930au" ? pick(SKIN_ALL, i, 1) : pick(SKIN_ALL.slice(0, 6), i, 1);
  const kid = i % kidEvery === kidEvery - 1, elder = !kid && i % elderEvery === 3;
  const female = H(i, 2) < 0.5;
  const hairCol = elder ? pick(["#d9d4cc", "#9a948c", "#c8c2b8"], i, 3) : pick(HAIR, i, 3);
  const coat = pick(COATS[era], i, 4), pants = pick(["#3b3f52", "#4a4038", "#2f3540", "#5a5248"], i, 5);
  const o: Outfit = { jacket: coat, pants, boots: pick(["#3b2a20", "#2a2228", "#5a3b2a"], i, 6), skin, hair: hairCol, build: kid ? "kid" : H(i, 7) < 0.25 ? "stout" : "adult" };
  if (era === "pacific") { o.boots = skin; o.pants = pick(["#3a6a8a", "#8a5a3a", "#5a3a2a"], i, 8); }
  if (female) {
    o.dress = pick(DRESS[era], i, 9);
    o.hat = pick(era === "1950" ? ["pony", "long", "bun", "hair"] : era === "pacific" ? ["long", "bun", "long"] : era === "medieval" ? ["scarf", "bun"] : ["bun", "bonnet", "long", "scarf", "pony"], i, 10) as Outfit["hat"];
    if (o.hat === "scarf") o.hatCol = pick(["#c25a5a", "#5a7ac2", "#e8d8b0", "#7a9a5a"], i, 11);
    if (era === "1850" || era === "1880" || era === "1900") o.apron = H(i, 12) < 0.3 ? "#f3ecd8" : undefined;
  } else {
    const hats: Record<Era, (string | null)[]> = {
      "1850": ["tophat", "cap", "hair", "bowler", "bald"], "1880": ["tophat", "cap", "hair", "bowler", "bald"], "1900": ["bowler", "cap", "hair", "tophat", "straw", "bald"],
      "1950": ["hair", "hair", "bald", "bowler", "hair"], pacific: ["hair", "hair", "bald", "hair"], "1930au": ["slouch", "straw", "hair", "cap", "bald"], medieval: ["hair", "cap", "bald", "hair"],
    };
    o.hat = pick(hats[era], i, 13) as Outfit["hat"];
    if (o.hat === "cap") o.cap = pick(["#4b4a52", "#5a3b2a", "#2f4a5a", "#7a6a50"], i, 14);
    if (!kid && H(i, 15) < 0.3) o.beard = hairCol;
    else if (!kid && H(i, 16) < 0.35) o.moustache = hairCol;
  }
  if (!kid && H(i, 17) < (era === "1950" ? 0.35 : 0.15)) o.glasses = true;
  if (kid) { o.build = "kid"; o.dress = female ? o.dress : undefined; }
  return o;
};
export const crowdWho = (era: Era, i: number, base = 300, kidEvery = 6): Who => ({ i: i + base, o: civilian(era, i, kidEvery), okey: `c${era}${i}` });
/** elderly props: give every elder a cane */
export const isElder = (i: number, elderEvery = 7, kidEvery = 6) => !(i % kidEvery === kidEvery - 1) && i % elderEvery === 3;
