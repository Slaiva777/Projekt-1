import { makeShort } from "../../engine/Short";
import { tl } from "./story";
import { buildSet } from "./set";
import { stage, life } from "./stage";
export const EMU_FRAMES = tl.TOTAL;
export const EmuShort = makeShort({ tl, build: buildSet, stage, life, bg: "#d8c890" });
