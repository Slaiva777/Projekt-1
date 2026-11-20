// "Der Kran, der 300 Jahre wartete": shots timed to videos/glaube/voice/words.json (frames at 30 fps).
// The cathedral is built at half scale (towers 78 m): west front with the two towers at x = -32 (facade faces -x).
import { V3 } from "../../engine/core";
import { makeTimeline, ShotDef, Key, Dof, dolly, zoom, pushK, crane } from "../../engine/timeline";

export const TOWER_X = -32;            // tower centres (x), z = +-11 (south tower at +11)
export const SOUTH: V3 = [TOWER_X, 0, 11];
export const STUMP_H = 29.5;           // the unfinished south tower (59 m real)
/** where the masons work: on the square in front of the south tower's west face (x = -39.5) */
export const WORK: V3 = [TOWER_X - 13, 0, 14];
export const SQUARE: V3 = [-56, 0, 0]; // the square in front of the west front
export const ATTIC: V3 = [160, 0, 0];
export const PARIS: V3 = [180, 0, 0];
/** cathedral state per shot: "dream" (1248 founding), "medieval" (stump + crane), "rising" (1842-1880), "done" */
export type Dom = "found" | "medieval" | "rising" | "done";

export const SHOTS: (ShotDef & { dom: Dom })[] = [
  { id: 1, a: 0, b: 232, light: "day", sunAz: 70, dom: "found" },
  { id: 2, a: 232, b: 416, light: "day", sunAz: 80, dom: "found", fog: ["#b8d0ec", 140, 900] },
  { id: 3, a: 416, b: 645, light: "day", sunAz: 70, dom: "medieval" },
  { id: 4, a: 645, b: 825, light: "golden", dom: "medieval" },
  { id: 5, a: 825, b: 970, light: "day", sunAz: 60, dom: "medieval" },
  { id: 6, a: 970, b: 1034, light: "golden", dom: "medieval" },
  { id: 7, a: 1034, b: 1218, light: "day", sunAz: 70, dom: "medieval" },
  { id: 8, a: 1218, b: 1431, light: "day", sunAz: 120, dom: "medieval" },
  { id: 9, a: 1431, b: 1547, light: "day", sunAz: 120, dom: "medieval" },
  { id: 10, a: 1547, b: 1748, light: "day", sunAz: 60, dom: "rising" },
  { id: 11, a: 1748, b: 2023, light: "day", sunAz: 75, dom: "done", fog: ["#b8d0ec", 140, 900] },
  { id: 12, a: 2023, b: 2220, light: "golden", dom: "done" },
];
const XFADE: Record<number, number> = { 3: 8, 4: 10, 5: 10, 6: 14, 7: 12, 8: 10, 9: 8, 10: 10, 11: 10, 12: 12 };
export const domAt = (id: number) => SHOTS[id - 1].dom;
/** building progress in shot 10 (0 = stump .. 1 = spires done) */
export const riseU = (f: number) => Math.max(0, Math.min(1, (f - 1560) / 170));

const S1a = (n: number) => dolly([WORK[0] - 6, 1.6, WORK[2] + 4], [WORK[0] + 1, 1.6, WORK[2] - 1], pushK(n, 0, 0.002), { fov: 46 });
const S1b = (n: number) => dolly([WORK[0] - 9, 0.8, WORK[2] + 6], [WORK[0] + 8, 20, WORK[2] - 10], pushK(n, 88, 0.0022, 0.005, 26), { fov: 58, roll: 0.03 });
const S1c = (n: number) => dolly([WORK[0] - 3.2, 1.0, WORK[2] + 4.4], [WORK[0] - 1.2, 1.2, WORK[2] + 2.4], pushK(n, 166, 0.003), { fov: 42 });
const S2a = zoom([-95, 48, 85], [0, 6, 0], 46, 1);
const S2 = (n: number) => zoom(S2a.pos, S2a.look, 46, pushK(n, 228, 0.0018));
const S2b = (n: number) => dolly([30, 1.6, 38], [30, 14, 8], pushK(n, 336, 0.0018), { fov: 52, roll: -0.03 });
const S3a = (n: number) => dolly([WORK[0] - 7, 1.8, WORK[2] + 6], [WORK[0] + 1, 2.6, WORK[2] - 1], pushK(n, 412, 0.002), { fov: 48 });
const S3b = (n: number) => dolly([WORK[0] - 3.6, 1.5, WORK[2] + 4.2], [WORK[0] + 0.4, 1.4, WORK[2] + 0.4], pushK(n, 525, 0.0025), { fov: 42 });
const S3c = (n: number) => dolly([WORK[0] - 3.2, 1.5, WORK[2] + 4.6], [WORK[0] + 0.4, 1.3, WORK[2] + 0.4], pushK(n, 586, 0.0025), { fov: 42, roll: 0.03 });
const S4a = (n: number) => dolly([WORK[0] - 5, 1.6, WORK[2] + 5], [WORK[0] + 0.5, 1.5, WORK[2] + 0.5], pushK(n, 641, 0.002), { fov: 44 });
const S4b = (n: number) => dolly([SOUTH[0] - 50, 4, SOUTH[2] + 48], [SOUTH[0], 20, SOUTH[2]], pushK(n, 720, 0.0015), { fov: 48 });
const S5a = (n: number) => dolly([SOUTH[0] - 22, 1.6, SOUTH[2] + 14], [SOUTH[0], 24, SOUTH[2]], pushK(n, 821, 0.0018), { fov: 52 });
const S5b = (n: number) => dolly([SOUTH[0] - 9, STUMP_H + 6, SOUTH[2] + 12], [SOUTH[0], STUMP_H + 4, SOUTH[2]], pushK(n, 880, 0.002, 0.005, 26), { fov: 44 });
const S6a = (n: number) => dolly([SOUTH[0] - 30, 12, SOUTH[2] + 30], [SOUTH[0], STUMP_H, SOUTH[2]], pushK(n, 966, 0.0012), { fov: 44 });
const S7a = (n: number) => dolly([SQUARE[0] - 6, 1.7, SQUARE[2] + 14], [SQUARE[0] + 2, 3, SQUARE[2] + 9], pushK(n, 1030, 0.002), { fov: 46 });
const S7b = (n: number) => dolly([SQUARE[0] - 3, 1.0, SQUARE[2] + 13], [SOUTH[0], STUMP_H, SOUTH[2]], pushK(n, 1120, 0.0018, 0.004, 26), { fov: 56, roll: 0.03 });
const S8a = (n: number) => dolly([ATTIC[0] + 1.2, 1.5, ATTIC[2] + 3.4], [ATTIC[0], 1.0, ATTIC[2] - 0.8], pushK(n, 1214, 0.0022), { fov: 44 });
const S8b = (n: number) => dolly([ATTIC[0] + 0.2, 1.5, ATTIC[2] + 1.8], [ATTIC[0], 1.5, ATTIC[2] - 0.4], pushK(n, 1338, 0.0025, 0.006, 26), { fov: 40, roll: -0.03 });
const S9a = (n: number) => dolly([PARIS[0] + 1.2, 1.5, PARIS[2] + 3.2], [PARIS[0], 1.2, PARIS[2] - 0.8], pushK(n, 1427, 0.0022), { fov: 44 });
const S9b = (n: number) => dolly([PARIS[0] + 0.1, 1.6, PARIS[2] + 1.8], [PARIS[0], 1.6, PARIS[2] - 0.2], pushK(n, 1505, 0.0025, 0.006, 22), { fov: 40 });
const S10a = (n: number) => dolly([SOUTH[0] - 46, 6, SOUTH[2] + 40], [SOUTH[0], 30, SOUTH[2] - 8], pushK(n, 1543, 0.0012), { fov: 52 });
const S10b = (n: number) => dolly([WORK[0] - 8, 2.0, WORK[2] + 7], [WORK[0] + 2, 4.0, WORK[2] - 2], pushK(n, 1645, 0.002), { fov: 50, roll: 0.03 });
const S11a = (n: number) => zoom([-150, 45, 70], [TOWER_X, 34, 0], 44, pushK(n, 1744, 0.0012));
const S11b = (n: number) => dolly([SQUARE[0] - 8, 1.7, SQUARE[2] + 6], [SQUARE[0] + 2, 2.2, SQUARE[2] + 1], pushK(n, 1830, 0.002), { fov: 46 });
const S11c = (n: number) => dolly([TOWER_X - 48, 1.2, 12], [TOWER_X, 52, 0], pushK(n, 1915, 0.0015, 0.004, 26), { fov: 58, roll: -0.04 });
const S12a = (n: number) => dolly([SQUARE[0] + 6, 1.4, SQUARE[2] + 9], [SQUARE[0] + 9, 1.3, SQUARE[2] + 7.2], pushK(n, 2019, 0.0022), { fov: 42 });
const S12b = crane(S12a, 2110, 110, [SQUARE[0] - 20, 12, SQUARE[2] + 40], [SQUARE[0] - 80, 45, SQUARE[2] + 90], [TOWER_X, 38, 0], 50);

const CAMS: Record<number, Key[]> = {
  1: [{ f: 0, s: S1a }, { f: 88, cut: true, s: S1b }, { f: 166, cut: true, s: S1c }],
  2: [{ f: 228, s: S2 }, { f: 336, cut: true, s: S2b }],
  3: [{ f: 412, s: S3a }, { f: 525, cut: true, s: S3b }, { f: 586, cut: true, s: S3c }],
  4: [{ f: 641, s: S4a }, { f: 720, cut: true, s: S4b }],
  5: [{ f: 821, s: S5a }, { f: 880, cut: true, s: S5b }],
  6: [{ f: 966, s: S6a }],
  7: [{ f: 1030, s: S7a }, { f: 1120, cut: true, s: S7b }],
  8: [{ f: 1214, s: S8a }, { f: 1338, cut: true, s: S8b }],
  9: [{ f: 1427, s: S9a }, { f: 1505, cut: true, s: S9b }],
  10: [{ f: 1543, s: S10a }, { f: 1645, cut: true, s: S10b }],
  11: [{ f: 1744, s: S11a }, { f: 1830, cut: true, s: S11b }, { f: 1915, cut: true, s: S11c }],
  12: [{ f: 2019, s: S12a }, { f: 2110, cut: true, s: S12b }],
};
const KICKS: [number, number][] = [[484, 0.3], [499, 0.3], [689, 0.4], [1340, 0.5], [1517, 0.6], [1805, 0.5]];
const DOF: Dof[] = [
  { f: 0, cInf: 9 }, { f: 88, cInf: 4 }, { f: 166, cInf: 12 }, { f: 232, cInf: 0 }, { f: 416, cInf: 9 }, { f: 525, cInf: 12 },
  { f: 645, cInf: 10 }, { f: 720, cInf: 0 }, { f: 880, cInf: 4 }, { f: 970, cInf: 0 }, { f: 1034, cInf: 8 }, { f: 1120, cInf: 0 },
  { f: 1218, cInf: 10 }, { f: 1338, cInf: 13 }, { f: 1431, cInf: 10 }, { f: 1505, cInf: 13 }, { f: 1547, cInf: 0 }, { f: 1645, cInf: 7 },
  { f: 1748, cInf: 0 }, { f: 1830, cInf: 9 }, { f: 1915, cInf: 0 }, { f: 2023, cInf: 11 }, { f: 2110, dur: 60, cInf: 0 },
];
export const tl = makeTimeline({ TOTAL: 2220, FLASH_AT: 232, SHOTS, XFADE, CAMS, KICKS, DOF });
