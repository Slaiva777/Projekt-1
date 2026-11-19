import { makeShort } from "../../engine/Short";
import { tl } from "./story";
import { buildSet } from "./set";
import { stage, life } from "./stage";
export const GEDAECHTNIS_FRAMES = tl.TOTAL;
export const GedaechtnisShort = makeShort({ tl, build: buildSet, stage, life });
