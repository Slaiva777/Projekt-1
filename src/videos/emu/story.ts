// "Der Emu-Krieg": shots timed to videos/emu/voice/words.json (frames at 30 fps).
import { V3 } from "../../engine/core";
import { makeTimeline, ShotDef, Key, Dof, dolly, zoom, pushK, crane } from "../../engine/timeline";

export const FIELD: V3 = [0, 0, -24];      // the wheat field the emus raid
export const FARM: V3 = [44, 0, 52];       // farmhouse
export const MOUND: V3 = [-26, 0, -34];    // the sentinel's mound
export const FENCE_Z = -58;                // the emu fence (shot 10)
export const ROAD_Z = 0;                   // dirt road along x
/** the truck on the road / in the field */
export const truckAt = (id: number, t: number): { x: number; z: number; yaw: number; bump: number } => {
  if (id === 3) return { x: -70 + 9 * (t - 15.3), z: ROAD_Z, yaw: 0, bump: 0.3 };       // arriving
  if (id === 4) return { x: -16, z: ROAD_Z, yaw: 0, bump: 0 };                           // parked
  if (id === 6) return { x: -30 + 7.5 * (t - 29.6), z: -16 - 2.5 * Math.sin((t - 29.6) * 0.9), yaw: -0.25 * Math.cos((t - 29.6) * 0.9), bump: 1 }; // chasing
  if (id === 8) return { x: -16 - 6 * (t - 44.4), z: ROAD_Z, yaw: Math.PI, bump: 0.2 };   // leaving
  return { x: -900, z: 0, yaw: 0, bump: 0 };
};

export const SHOTS: ShotDef[] = [
  { id: 1, a: 0, b: 176, light: "day", sunAz: 70 },
  { id: 2, a: 176, b: 395, light: "day", sunAz: 80, fog: ["#c8d8e8", 120, 900] },
  { id: 3, a: 395, b: 534, light: "day", sunAz: 70 },
  { id: 4, a: 534, b: 674, light: "day", sunAz: 75 },
  { id: 5, a: 674, b: 888, light: "day", sunAz: 70 },
  { id: 6, a: 888, b: 1135, light: "day", sunAz: 80 },
  { id: 7, a: 1135, b: 1332, light: "day", sunAz: 70 },
  { id: 8, a: 1332, b: 1472, light: "golden" },
  { id: 9, a: 1472, b: 1699, light: "day", sunAz: 70 },
  { id: 10, a: 1699, b: 1807, light: "day", sunAz: 75 },
  { id: 11, a: 1807, b: 2025, light: "golden" },
];
const XFADE: Record<number, number> = { 3: 8, 5: 8, 8: 12, 9: 10, 10: 8, 11: 12 };

const F = (dx: number, dy: number, dz: number): V3 => [FIELD[0] + dx, dy, FIELD[2] + dz];
const S1a = (n: number) => dolly(F(2.6, 1.6, 9.5), F(0, 1.3, 3), pushK(n, 0, 0.0022), { fov: 44 });
const S1b = (n: number) => dolly(F(-0.6, 1.3, 5.6), F(-1.4, 1.35, 3.2), pushK(n, 123, 0.003, 0.007, 26), { fov: 40, roll: 0.04 });
const S2a = (n: number) => zoom([-60, 38, 60], [10, 0, -10], 50, pushK(n, 172, 0.0015));
const S2b = (n: number) => dolly(F(-4, 4.5, 20), F(0, 0.8, -6), pushK(n, 262, 0.0018), { fov: 50 });
const S2c = (n: number) => dolly(F(1.6, 1.0, 5.0), F(0.4, 0.9, 1.4), pushK(n, 322, 0.0025), { fov: 42, roll: -0.03 });
const S3a = (n: number) => dolly([FARM[0] - 3, 1.6, FARM[2] - 9], [FARM[0] - 1, 1.6, FARM[2] - 4.5], pushK(n, 391, 0.0022), { fov: 44 });
/** travels alongside the arriving truck */
const S3b = (n: number) => { const tr = truckAt(3, n / 30); return { pos: [tr.x + 8, 1.7, ROAD_Z + 7] as V3, look: [tr.x + 0.5, 1.5, ROAD_Z] as V3, fov: 46 }; };
const S4a = (n: number) => dolly([-12.5, 1.6, ROAD_Z + 7.5], [-14.5, 1.4, ROAD_Z + 3.2], pushK(n, 530, 0.0025), { fov: 44 });
const S4b = (n: number) => dolly([-15.0, 2.2, ROAD_Z + 7.4], [-15.0, 1.5, ROAD_Z + 1.5], pushK(n, 567, 0.0012, 0.005, 24), { fov: 44, roll: 0.03 });
const S5a = (n: number) => dolly([-12, 1.6, ROAD_Z + 6.6], [-14, 1.5, ROAD_Z + 3], pushK(n, 670, 0.0022), { fov: 42 });
const S5b = (n: number) => dolly(F(-2.0, 1.5, 9.0), F(0, 1.3, 2), pushK(n, 758, 0.002), { fov: 46 });
const S5c = (n: number) => dolly(F(-6, 9, 22), F(0, 0.5, 0), pushK(n, 823, 0.0018), { fov: 50, roll: 0.04 });
const S6a = (n: number) => { const tr = truckAt(6, n / 30); return dolly([tr.x - 8, 2.4, tr.z + 9], [tr.x + 2, 1.4, tr.z], pushK(n, 884, 0.0015), { fov: 48 }); };
const S6b = (n: number) => { const tr = truckAt(6, n / 30); return dolly([tr.x + 2.5, 1.2, tr.z + 4.5], [tr.x - 0.6, 1.9, tr.z], pushK(n, 1027, 0.002), { fov: 46, roll: -0.05 }); };
const S7a = (n: number) => { const x = -20 + 13.9 * (n / 30 - 37.8); return { pos: [x - 3, 1.2, FIELD[2] + 8] as V3, look: [x + 2, 1.2, FIELD[2]] as V3, fov: 46 }; };
const S7b = (n: number) => dolly([MOUND[0] + 5, 1.6, MOUND[2] + 8], [MOUND[0], 2.8, MOUND[2]], pushK(n, 1253, 0.0025, 0.006, 26), { fov: 44 });
const S8a = (n: number) => dolly([-6, 1.5, ROAD_Z + 8], [-16, 1.6, ROAD_Z], pushK(n, 1328, 0.0015), { fov: 46 });
const S8b = (n: number) => dolly([-2, 1.4, ROAD_Z + 5], [-5, 1.3, ROAD_Z + 1.2], pushK(n, 1413, 0.0025, 0.005, 24), { fov: 42, roll: 0.03 });
const S9a = (n: number) => dolly([FARM[0] + 1.6, 1.6, FARM[2] - 10.5], [FARM[0], 1.55, FARM[2] - 6.2], pushK(n, 1468, 0.0022), { fov: 42 });
const S9b = (n: number) => dolly([FARM[0] + 0.5, 1.6, FARM[2] - 8.6], [FARM[0], 1.65, FARM[2] - 6.4], pushK(n, 1622, 0.003, 0.006, 26), { fov: 40, roll: 0.03 });
const S10a = (n: number) => dolly([4, 1.6, FENCE_Z + 7], [0, 1.4, FENCE_Z], pushK(n, 1695, 0.0022), { fov: 46 });
const S11a = (n: number) => dolly(F(-14, 3.0, 14), F(4, 1.0, -6), pushK(n, 1803, 0.0018), { fov: 50 });
const S11b = (n: number) => dolly(F(0.8, 1.45, 4.4), F(0, 1.35, 2.2), pushK(n, 1916, 0.003, 0.008, 24), { fov: 38, roll: -0.04 });
const S11c = crane(S11b, 1975, 50, F(2, 4, 8), F(6, 14, 20), F(0, 1, -10), 54);

const CAMS: Record<number, Key[]> = {
  1: [{ f: 0, s: S1a }, { f: 123, cut: true, s: S1b }],
  2: [{ f: 172, s: S2a }, { f: 262, cut: true, s: S2b }, { f: 322, cut: true, s: S2c }],
  3: [{ f: 391, s: S3a }, { f: 457, cut: true, s: S3b }],
  4: [{ f: 530, s: S4a }, { f: 567, cut: true, s: S4b }],
  5: [{ f: 670, s: S5a }, { f: 758, cut: true, s: S5b }, { f: 823, cut: true, s: S5c }],
  6: [{ f: 884, s: S6a }, { f: 1027, cut: true, s: S6b }],
  7: [{ f: 1131, s: S7a }, { f: 1253, cut: true, s: S7b }],
  8: [{ f: 1328, s: S8a }, { f: 1413, cut: true, s: S8b }],
  9: [{ f: 1468, s: S9a }, { f: 1622, cut: true, s: S9b }],
  10: [{ f: 1695, s: S10a }],
  11: [{ f: 1803, s: S11a }, { f: 1916, cut: true, s: S11b }, { f: 1975, cut: true, s: S11c }],
};
const KICKS: [number, number][] = [[138, 0.5], [503, 0.7], [831, 0.6], [1062, 0.9], [1075, 0.6], [1092, 0.7], [1286, 0.5], [1664, 0.4]];
const DOF: Dof[] = [
  { f: 0, cInf: 10 }, { f: 123, cInf: 14 }, { f: 176, cInf: 0 }, { f: 262, cInf: 4 }, { f: 322, cInf: 12 }, { f: 395, cInf: 9 }, { f: 457, cInf: 5 },
  { f: 534, cInf: 10 }, { f: 567, cInf: 12 }, { f: 674, cInf: 11 }, { f: 758, cInf: 8 }, { f: 823, cInf: 0 }, { f: 888, cInf: 4 }, { f: 1027, cInf: 8 },
  { f: 1135, cInf: 6 }, { f: 1253, cInf: 10 }, { f: 1332, cInf: 6 }, { f: 1413, cInf: 12 }, { f: 1472, cInf: 11 }, { f: 1622, cInf: 13 },
  { f: 1699, cInf: 9 }, { f: 1807, cInf: 4 }, { f: 1916, cInf: 14 }, { f: 1975, dur: 50, cInf: 0 },
];
export const tl = makeTimeline({ TOTAL: 2025, FLASH_AT: 176, SHOTS, XFADE, CAMS, KICKS, DOF });
