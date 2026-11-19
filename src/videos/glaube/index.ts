import { makeShort } from "../../engine/Short";
import { tl } from "./story";
import { buildSet } from "./set";
import { stage, life } from "./stage";
export const GLAUBE_FRAMES = tl.TOTAL;
export const GlaubeShort = makeShort({ tl, build: buildSet, stage, life });
