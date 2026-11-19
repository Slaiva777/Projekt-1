import { makeShort } from "../../engine/Short";
import { tl } from "./story";
import { buildSet } from "./set";
import { stage, life } from "./stage";
export const GELD_FRAMES = tl.TOTAL;
export const GeldShort = makeShort({ tl, build: buildSet, stage, life, bg: "#8fd0e0" });
