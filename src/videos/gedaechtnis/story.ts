// "Der Mann, der alles vergaß": shots timed to videos/gedaechtnis/voice/words.json (frames at 30 fps).
import { V3 } from "../../engine/core";
import { makeTimeline, ShotDef, Key, Dof, dolly, zoom, pushK, crane } from "../../engine/timeline";

/** room centres (each 9 x 9 m, open to the sun, ceiling that casts no shadow); front walls at z = +4.5 face the park */
export const WARD: V3 = [-20, 0, 0];
export const OR: V3 = [0, 0, 0];
export const LAB: V3 = [20, 0, 0];
export const TABLE: V3 = [LAB[0], 0, -0.3];      // the lab table (top at 0.76)
export const BOARD: V3 = [LAB[0] - 1.5, 0, -4.4]; // chalkboard on the lab's back wall
export const BENCH: V3 = [8, 0, 16];             // park bench
export const bikeX = (t: number) => -14 + 3.2 * (t - 62.7);

export const SHOTS: ShotDef[] = [
  { id: 1, a: 0, b: 158, light: "day", sunAz: 120 },
  { id: 2, a: 158, b: 231, light: "day", sunAz: 60 },
  { id: 3, a: 231, b: 382, light: "day", sunAz: 120 },
  { id: 4, a: 382, b: 477, light: "day", sunAz: 120 },
  { id: 5, a: 477, b: 552, light: "day", sunAz: 120 },
  { id: 6, a: 552, b: 760, light: "day", sunAz: 120 },
  { id: 7, a: 760, b: 957, light: "day", sunAz: 120 },
  { id: 8, a: 957, b: 1135, light: "day", sunAz: 120 },
  { id: 9, a: 1135, b: 1366, light: "day", sunAz: 120 },
  { id: 10, a: 1366, b: 1518, light: "day", sunAz: 120 },
  { id: 11, a: 1518, b: 1673, light: "day", sunAz: 120 },
  { id: 12, a: 1673, b: 1882, light: "day", sunAz: 120 },
  { id: 13, a: 1882, b: 2075, light: "day", sunAz: 70 },
  { id: 14, a: 2075, b: 2310, light: "golden" },
];
const XFADE: Record<number, number> = { 2: 0, 3: 8, 4: 8, 5: 8, 6: 8, 7: 8, 8: 8, 13: 10, 14: 12 };

const L = (dx: number, dy: number, dz: number): V3 => [LAB[0] + dx, dy, LAB[2] + dz];
const W = (dx: number, dy: number, dz: number): V3 => [WARD[0] + dx, dy, WARD[2] + dz];
const O = (dx: number, dy: number, dz: number): V3 => [OR[0] + dx, dy, OR[2] + dz];
const S1a = (n: number) => dolly(L(1.4, 1.55, 4.0), L(0.4, 1.2, -0.8), pushK(n, 0, 0.0022), { fov: 46 });
const S1b = (n: number) => dolly(L(0.9, 1.5, 2.6), L(0.5, 1.3, -0.4), pushK(n, 117, 0.003, 0.006, 24), { fov: 42, roll: 0.035 });
const S2a = (n: number) => zoom([WARD[0] + 5, 1.7, 17], [WARD[0] + 1, 2.2, 4.5], 50, pushK(n, 154, 0.002));
const S3a = (n: number) => dolly(W(1.2, 1.35, 3.4), W(0, 1.0, -1.0), pushK(n, 227, 0.0022), { fov: 44, roll: -0.03 });
const S3b = (n: number) => dolly(W(-0.9, 1.6, 4.0), W(-1.0, 1.5, 0.6), pushK(n, 312, 0.0025, 0.006, 26), { fov: 42 });
const S4a = (n: number) => dolly(O(2.2, 2.2, 4.0), O(0, 1.3, -0.6), pushK(n, 378, 0.002), { fov: 48 });
const S4b = (n: number) => dolly(O(0.3, 1.9, 2.4), O(0, 1.9, 0.4), pushK(n, 428, 0.003, 0.006, 26), { fov: 40 });
const S5a = (n: number) => dolly(W(0.8, 1.35, 3.0), W(0, 1.1, -1.0), pushK(n, 473, 0.0025), { fov: 42, roll: 0.03 });
const S6a = (n: number) => dolly(L(1.0, 1.5, 3.4), L(0, 1.15, -0.8), pushK(n, 548, 0.002), { fov: 44 });
const S6b = (n: number) => dolly(L(0.2, 1.35, 1.9), L(0, 1.25, -0.8), pushK(n, 657, 0.0022), { fov: 40 });
const S7a = (n: number) => dolly(L(-1.2, 1.6, 3.8), L(-2.6, 1.3, -0.6), pushK(n, 756, 0.002), { fov: 46 });
const S7b = (n: number) => dolly(L(1.3, 1.55, 2.8), L(0.7, 1.35, -0.4), pushK(n, 865, 0.003), { fov: 42, roll: 0.04 });
const S7c = (n: number) => dolly(L(-0.4, 1.55, 2.9), L(0.6, 1.35, -0.4), pushK(n, 899, 0.003), { fov: 42, roll: -0.04 });
const S7d = (n: number) => dolly(L(1.0, 1.5, 2.4), L(0.6, 1.35, -0.4), pushK(n, 929, 0.003), { fov: 40, roll: 0.03 });
const S8a = (n: number) => dolly(L(1.6, 1.7, 3.0), L(0, 1.0, -0.5), pushK(n, 953, 0.002), { fov: 44 });
const S8b = (n: number) => dolly(L(0.0, 1.75, 1.2), L(0, 0.95, -0.2), pushK(n, 1054, 0.0025, 0.006, 26), { fov: 40 });
const S8c = (n: number) => dolly(L(1.1, 1.4, 1.6), L(0.1, 1.15, -0.7), pushK(n, 1100, 0.0025), { fov: 40 });
const S9 = (n: number, f0: number, r: number) => dolly(L(0.1, 1.7, 1.4), L(0, 0.95, -0.15), pushK(n, f0, 0.0022, 0.005, 20), { fov: 40, roll: r });
const S10a = (n: number) => dolly(L(0.5, 1.45, 2.4), L(0, 1.25, -0.8), pushK(n, 1362, 0.0022), { fov: 40 });
const S10b = (n: number) => dolly(L(-0.2, 1.4, 1.7), L(0, 1.3, -0.8), pushK(n, 1421, 0.0025, 0.006, 26), { fov: 38, roll: -0.04 });
const S11a = (n: number) => dolly(L(0.9, 1.5, 2.6), L(0, 1.4, -0.4), pushK(n, 1514, 0.0022), { fov: 42 });
const S11b = (n: number) => dolly(L(-0.6, 1.4, 2.3), L(0, 1.2, -0.8), pushK(n, 1593, 0.0025, 0.005, 24), { fov: 40, roll: 0.03 });
const S12a = (n: number) => dolly(L(-1.2, 1.7, 2.8), [BOARD[0] - 0.6, 1.8, BOARD[2]], pushK(n, 1669, 0.002), { fov: 46 });
const S12b = (n: number) => dolly([BOARD[0] - 0.7, 1.9, BOARD[2] + 2.6], [BOARD[0] - 0.8, 2.0, BOARD[2]], pushK(n, 1765, 0.0025, 0.006, 24), { fov: 40 });
const S12c = (n: number) => dolly([BOARD[0] + 0.7, 1.9, BOARD[2] + 2.6], [BOARD[0] + 0.8, 2.0, BOARD[2]], pushK(n, 1822, 0.0025, 0.006, 24), { fov: 40 });
const S13a = (n: number) => { const x = bikeX(n / 30); return dolly([x + 3.5, 1.6, 21.5], [x + 0.4, 1.2, 14.2], pushK(n, 1878, 0.0015), { fov: 44 }); };
const S13b = (n: number) => { const x = bikeX(n / 30); return dolly([x + 1.2, 0.7, 17.0], [x + 0.2, 0.6, 14.2], pushK(n, 2014, 0.002), { fov: 42, roll: -0.04 }); };
const S14a = (n: number) => dolly([BENCH[0] + 1.6, 1.4, BENCH[2] + 5.2], [BENCH[0], 1.1, BENCH[2]], pushK(n, 2071, 0.0022), { fov: 42 });
const S14b = crane(S14a, 2200, 110, [BENCH[0] + 5, 6, BENCH[2] + 10], [BENCH[0] + 8, 14, BENCH[2] + 22], [BENCH[0] - 4, 2, 2], 50);

const CAMS: Record<number, Key[]> = {
  1: [{ f: 0, s: S1a }, { f: 117, cut: true, s: S1b }],
  2: [{ f: 154, s: S2a }],
  3: [{ f: 227, s: S3a }, { f: 312, cut: true, s: S3b }],
  4: [{ f: 378, s: S4a }, { f: 428, cut: true, s: S4b }],
  5: [{ f: 473, s: S5a }],
  6: [{ f: 548, s: S6a }, { f: 657, cut: true, s: S6b }],
  7: [{ f: 756, s: S7a }, { f: 865, cut: true, s: S7b }, { f: 899, cut: true, s: S7c }, { f: 929, cut: true, s: S7d }],
  8: [{ f: 953, s: S8a }, { f: 1054, cut: true, s: S8b }, { f: 1100, cut: true, s: S8c }],
  9: [{ f: 1131, s: (n) => S9(n, 1131, 0.03) }, { f: 1213, cut: true, s: (n) => S9(n, 1213, -0.03) }, { f: 1281, cut: true, s: (n) => S9(n, 1281, 0.04) }],
  10: [{ f: 1362, s: S10a }, { f: 1421, cut: true, s: S10b }],
  11: [{ f: 1514, s: S11a }, { f: 1593, cut: true, s: S11b }],
  12: [{ f: 1669, s: S12a }, { f: 1765, cut: true, s: S12b }, { f: 1822, cut: true, s: S12c }],
  13: [{ f: 1878, s: S13a }, { f: 2014, cut: true, s: S13b }],
  14: [{ f: 2071, s: S14a }, { f: 2200, cut: true, s: S14b }],
};
const KICKS: [number, number][] = [[119, 0.5], [287, 0.6], [668, 0.4], [698, 0.4], [727, 0.4], [1187, 0.5], [1423, 0.4]];
const DOF: Dof[] = [
  { f: 0, cInf: 9 }, { f: 117, cInf: 13 }, { f: 158, cInf: 0 }, { f: 231, cInf: 10 }, { f: 312, cInf: 12 }, { f: 382, cInf: 6 },
  { f: 428, cInf: 14 }, { f: 477, cInf: 10 }, { f: 552, cInf: 9 }, { f: 657, cInf: 13 }, { f: 760, cInf: 7 }, { f: 865, cInf: 12 },
  { f: 957, cInf: 9 }, { f: 1054, cInf: 14 }, { f: 1100, cInf: 12 }, { f: 1135, cInf: 14 }, { f: 1366, cInf: 10 }, { f: 1421, cInf: 14 },
  { f: 1518, cInf: 11 }, { f: 1593, cInf: 12 }, { f: 1673, cInf: 7 }, { f: 1765, cInf: 11 }, { f: 1882, cInf: 6 }, { f: 2014, cInf: 12 },
  { f: 2075, cInf: 10 }, { f: 2200, dur: 60, cInf: 0 },
];
export const tl = makeTimeline({ TOTAL: 2310, FLASH_AT: 158, SHOTS, XFADE, CAMS, KICKS, DOF });
