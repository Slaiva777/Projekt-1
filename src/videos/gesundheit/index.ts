import { makeShort } from "../../engine/Short";
import { tl } from "./story";
import { buildSet } from "./set";
import { stage, life } from "./stage";
export const GESUNDHEIT_FRAMES = tl.TOTAL;
export const GesundheitShort = makeShort({ tl, build: buildSet, stage, life });
