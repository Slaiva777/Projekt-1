// "Das Geld auf dem Meeresgrund": shots timed to videos/geld/voice/words.json (frames at 30 fps).
import { V3 } from "../../engine/core";
import { makeTimeline, ShotDef, Key, Dof, dolly, zoom, pushK, rolled, crane } from "../../engine/timeline";

export const UW: V3 = [-300, -12, -300];      // the sunken stone on the seabed (base point)
export const STONE_ROW_Z = 14;                // the row of stone money along the beach (faces +z)
export const BIG: V3 = [-5, 0, 15.2];          // the giant stone (3.6 m)
export const QUARRY: V3 = [250, 0, 50];       // the quarry on the other island
export const HUT_FAMILY: V3 = [10, 0, 30];    // the family's hut
export const BEACH: V3 = [24, 0, 4];          // the modern tourist with a phone
/** canoe position along the crossing (x), z fixed at -80 */
export const canoeX = (t: number) => 104 + 0.9 * (t - 15.5);
export const CANOE_Z = -80;

const UWSKY = ["#2f8fa0", "#3a9fb0", "#4fb3c0", "#6ac6cf", "#8fdbe0"];
const STORM = ["#5d6a78", "#56616f", "#4c5664", "#434c59", "#3a424e"];
const uw = { sky: UWSKY, fog: ["#1f7f95", 3, 34] as [string, number, number], sunK: 0.75 };
const storm = { sky: STORM, fog: ["#5f6b78", 14, 150] as [string, number, number], sunK: 0.28 };
const f = (n: number) => n;

export const SHOTS: ShotDef[] = [
  { id: 1, a: 0, b: 127, light: "day", ...uw },
  { id: 2, a: 127, b: 216, light: "day", sunAz: 70 },
  { id: 3, a: 216, b: 388, light: "day", sunAz: 80 },
  { id: 4, a: 388, b: 584, light: "day", sunAz: 60 },
  { id: 5, a: 584, b: 743, light: "day", ...storm },
  { id: 6, a: 743, b: 778, light: "day", ...uw },
  { id: 7, a: 778, b: 1004, light: "golden" },
  { id: 8, a: 1004, b: 1154, light: "golden" },
  { id: 9, a: 1154, b: 1350, light: "day", sunAz: 70 },
  { id: 10, a: 1350, b: 1520, light: "day", sunAz: 60 },
  { id: 11, a: 1520, b: 1750, light: "day", sunAz: 100 },
  { id: 12, a: 1750, b: 1965, light: "day", sunAz: 70 },
  { id: 13, a: 1965, b: 2140, light: "day", ...uw },
];
const XFADE: Record<number, number> = { 3: 8, 4: 10, 5: 10, 7: 10, 9: 10, 11: 10, 13: 12 };

// ---- framings ----
const U = (dx: number, dy: number, dz: number): V3 => [UW[0] + dx, UW[1] + dy, UW[2] + dz];
const S1a = (n: number) => dolly(U(4.5, 1.6, 7.5), U(0, 1.4, 0), pushK(n, 0, 0.0022), { fov: 46 });
const S2a = (n: number) => dolly([BIG[0] + 5.6, 1.6, BIG[2] + 8.5], [BIG[0] + 2.4, 1.5, BIG[2] + 2.2], pushK(n, 127, 0.0025), { fov: 42 });
const S3a = (n: number) => zoom([46, 34, -70], [0, 2, 26], 46, pushK(n, 212, 0.0018));
const S3b = (n: number) => dolly([9, 1.7, STONE_ROW_Z + 9.5], [1, 1.5, STONE_ROW_Z], pushK(n, 276, 0.0022), { fov: 44 });
const S3c = (n: number) => dolly([BIG[0] + 2.2, 0.7, BIG[2] + 6.2], [BIG[0] - 0.2, 2.6, BIG[2]], pushK(n, 325, 0.0025, 0.006, 26), { fov: 48, roll: 0.035 });
const S4a = (n: number) => dolly([QUARRY[0] + 3.5, 1.8, QUARRY[2] + 8.5], [QUARRY[0], 1.9, QUARRY[2] + 1.4], pushK(n, 384, 0.0022), { fov: 44 });
const S4b = (n: number) => zoom([150, 38, 10], [canoeX(n / 30), 0, CANOE_Z], 40, pushK(n, 462, 0.0015));
const S4c = (n: number) => { const x = canoeX(n / 30); return dolly([x + 5.5, 1.6, CANOE_Z + 7.5], [x, 1.0, CANOE_Z], pushK(n, 522, 0.002), { fov: 42 }); };
const S5a = (n: number) => { const x = canoeX(n / 30); return dolly([x + 9, 3.2, CANOE_Z + 12], [x, 1.4, CANOE_Z], pushK(n, 584, 0.0018), { fov: 44, roll: -0.04 }); };
const S5b = (n: number) => { const x = canoeX(n / 30); return dolly([x + 3.2, 2.0, CANOE_Z + 4.6], [x + 0.6, 1.4, CANOE_Z], pushK(n, 677, 0.0025, 0.006, 26), { fov: 40, roll: 0.04 }); };
const S5c = (n: number) => { const x = canoeX(n / 30); return dolly([x + 4.5, 1.2, CANOE_Z + 7], [x + 0.8, 0.6, CANOE_Z - 0.6], pushK(n, 727, 0.002), { fov: 44, roll: -0.05 }); };
const S6a = (n: number) => dolly(U(3.2, 4.0, 6.5), U(0, 3.4, 0), pushK(n, 739, 0.0015), { fov: 48 });
const VIL: V3 = [-2, 0, 24];
const S7a = (n: number) => dolly([VIL[0] + 4.5, 1.7, VIL[2] + 8.5], [VIL[0], 1.5, VIL[2] + 1], pushK(n, 774, 0.002), { fov: 44 });
const S7b = (n: number) => dolly([VIL[0] + 1.6, 1.6, VIL[2] + 5.4], [VIL[0] + 0.2, 1.6, VIL[2] + 1.4], pushK(n, 851, 0.0025, 0.006, 26), { fov: 40, roll: 0.04 });
const S7c = (n: number) => dolly([VIL[0] - 1.4, 1.5, VIL[2] + 5.2], [VIL[0] + 0.3, 1.5, VIL[2] + 1.4], pushK(n, 939, 0.0025), { fov: 40, roll: -0.03 });
const S8a = (n: number) => dolly([VIL[0] - 3.4, 1.6, VIL[2] + 4.4], [VIL[0] - 3.2, 1.55, VIL[2] - 1.6], pushK(n, 1004, 0.0025, 0.006, 24), { fov: 40 });
const S8b = (n: number) => dolly([VIL[0] + 3, 3.4, VIL[2] + 12], [VIL[0] - 1, 1.3, VIL[2] - 1], pushK(n, 1076, 0.002), { fov: 46, roll: 0.03 });
const S9a = (n: number) => dolly([3.0, 1.6, STONE_ROW_Z + 6.4], [-0.6, 1.4, STONE_ROW_Z + 1.6], pushK(n, 1154, 0.0022), { fov: 44 });
const S9b = (n: number) => dolly([-0.4, 1.7, STONE_ROW_Z + 4.0], [-1.6, 1.6, STONE_ROW_Z + 0.4], pushK(n, 1244, 0.002, 0.006, 24), { fov: 42 });
const S9c = (n: number) => dolly([6, 4.5, STONE_ROW_Z + 15], [0, 1.4, STONE_ROW_Z + 2], pushK(n, 1269, 0.002), { fov: 46, roll: -0.03 });
const S10a = (n: number) => dolly([HUT_FAMILY[0] + 2.8, 1.8, HUT_FAMILY[2] + 10.5], [HUT_FAMILY[0], 1.6, HUT_FAMILY[2] + 2.6], pushK(n, 1350, 0.0022), { fov: 46 });
const S10b = (n: number) => dolly([HUT_FAMILY[0] - 1.2, 1.5, HUT_FAMILY[2] + 5.2], [HUT_FAMILY[0] + 0.6, 1.5, HUT_FAMILY[2] + 2.4], pushK(n, 1413, 0.002, 0.005, 26), { fov: 40, roll: 0.03 });
const S11a = (n: number) => dolly([BEACH[0] + 2.0, 1.7, BEACH[2] + 4.8], [BEACH[0], 1.65, BEACH[2]], pushK(n, 1516, 0.0025), { fov: 40 });
const S11b = (n: number) => dolly([BEACH[0] + 0.5, 1.45, BEACH[2] + 2.0], [BEACH[0], 1.3, BEACH[2]], pushK(n, 1562, 0.0018, 0.006, 26), { fov: 38, roll: -0.03 });
const S11c = (n: number) => dolly([BEACH[0] + 3.2, 1.8, BEACH[2] + 6.5], [BEACH[0] + 1.0, 1.9, BEACH[2]], pushK(n, 1693, 0.002), { fov: 44 });
const S12a = (n: number) => dolly([BIG[0] + 4.5, 1.8, BIG[2] + 7.5], [BIG[0] + 1.2, 1.8, BIG[2] + 0.6], pushK(n, 1750, 0.0022), { fov: 44 });
const S12b = (n: number) => dolly([0, 2.8, 41], [0, 1.4, 30], pushK(n, 1864, 0.002, 0.005, 26), { fov: 46, roll: 0.03 });
const S13a = (n: number) => dolly(U(-5, 2.4, 8), U(0, 1.2, 0), pushK(n, 1961, 0.0025), { fov: 46 });
const S13b = crane(S13a, 2040, 100, U(-2, 5, 5), U(1, 8.5, 3.5), U(0, 0.6, 0), 52);

const CAMS: Record<number, Key[]> = {
  1: [{ f: 0, s: S1a }],
  2: [{ f: 127, s: S2a }],
  3: [{ f: 212, s: S3a }, { f: 276, cut: true, s: S3b }, { f: 325, cut: true, s: S3c }],
  4: [{ f: 384, s: S4a }, { f: 462, cut: true, s: S4b }, { f: 522, cut: true, s: S4c }],
  5: [{ f: 580, s: S5a }, { f: 677, cut: true, s: S5b }, { f: 727, cut: true, s: S5c }],
  6: [{ f: 739, s: S6a }],
  7: [{ f: 774, s: S7a }, { f: 851, cut: true, s: S7b }, { f: 939, cut: true, s: S7c }],
  8: [{ f: 1004, s: S8a }, { f: 1076, cut: true, s: S8b }],
  9: [{ f: 1150, s: S9a }, { f: 1244, cut: true, s: S9b }, { f: 1269, cut: true, s: S9c }],
  10: [{ f: 1346, s: S10a }, { f: 1413, cut: true, s: S10b }],
  11: [{ f: 1516, s: S11a }, { f: 1562, cut: true, s: S11b }, { f: 1693, cut: true, s: S11c }],
  12: [{ f: 1746, s: S12a }, { f: 1864, cut: true, s: S12b }],
  13: [{ f: 1961, s: S13a }, { f: 2040, cut: true, s: S13b }],
};
const KICKS: [number, number][] = [[f(735), 1.1], [f(853), 0.4], [f(1047), 0.4]];
const DOF: Dof[] = [
  { f: 0, cInf: 8 }, { f: 127, cInf: 12 }, { f: 216, cInf: 0 }, { f: 276, cInf: 9 }, { f: 325, cInf: 7 },
  { f: 388, cInf: 11 }, { f: 462, cInf: 0 }, { f: 522, cInf: 10 }, { f: 584, cInf: 4 }, { f: 677, cInf: 12 }, { f: 727, cInf: 6 },
  { f: 743, cInf: 6 }, { f: 778, cInf: 9 }, { f: 851, cInf: 13 }, { f: 939, cInf: 12 }, { f: 1004, cInf: 13 }, { f: 1076, cInf: 5 },
  { f: 1154, cInf: 10 }, { f: 1244, cInf: 13 }, { f: 1269, cInf: 5 }, { f: 1350, cInf: 10 }, { f: 1413, cInf: 12 },
  { f: 1520, cInf: 13 }, { f: 1562, cInf: 15 }, { f: 1693, cInf: 11 }, { f: 1750, cInf: 10 }, { f: 1864, cInf: 5 },
  { f: 1965, cInf: 7 }, { f: 2040, dur: 60, cInf: 3 },
];
export const tl = makeTimeline({ TOTAL: 2140, FLASH_AT: 216, SHOTS, XFADE, CAMS, KICKS, DOF, FLASHES: [598, 690] });
void rolled;
