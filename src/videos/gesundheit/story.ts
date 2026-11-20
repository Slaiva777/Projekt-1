// "Der Arzt, der Hände wusch": shots timed to videos/gesundheit/voice/words.json (frames at 30 fps).
import { V3 } from "../../engine/core";
import { makeTimeline, ShotDef, Key, Dof, dolly, zoom, pushK, crane } from "../../engine/timeline";

// rooms (centres; front walls face the courtyard at +z)
export const WARD_DOC: V3 = [-48, 0, 0];   // 14 x 8, the doctors' clinic
export const WARD_MID: V3 = [-30, 0, 0];   // 14 x 8, the midwives' clinic
export const DISSECT: V3 = [-14, 0, 0];    // 8 x 8, the dissection room
export const OFFICE: V3 = [0, 0, 0];       // 7 x 7, Semmelweis' study
export const SCILAB: V3 = [14, 0, 0];      // 7 x 7, a later lab with a microscope
export const BATH: V3 = [30, 0, 0];        // 6 x 6, a modern bathroom
export const BASIN: V3 = [WARD_DOC[0] + 5.2, 0, WARD_DOC[2] - 2.6]; // the chlorine basin in the doctors' ward
export const GATE: V3 = [0, 0, 44];        // gate from the courtyard to the street
export const STREET_Z = 54;

export const SHOTS: ShotDef[] = [
  { id: 1, a: 0, b: 240, light: "day", sunAz: 120 },
  { id: 2, a: 240, b: 445, light: "day", sunAz: 70 },
  { id: 3, a: 445, b: 675, light: "day", sunAz: 120 },
  { id: 4, a: 675, b: 865, light: "day", sunAz: 80 },
  { id: 5, a: 865, b: 1140, light: "day", sunAz: 120 },
  { id: 6, a: 1140, b: 1350, light: "day", sunAz: 90 },
  { id: 7, a: 1350, b: 1515, light: "day", sunAz: 120 },
  { id: 8, a: 1515, b: 1675, light: "day", sunAz: 120 },
  { id: 9, a: 1675, b: 1885, light: "day", sunAz: 120 },
  { id: 10, a: 1885, b: 2075, light: "golden" },
  { id: 11, a: 2075, b: 2360, light: "day", sunAz: 120 },
];
const XFADE: Record<number, number> = { 3: 8, 4: 8, 5: 8, 6: 8, 8: 8, 10: 10, 11: 10 };

const R = (c: V3, dx: number, dy: number, dz: number): V3 => [c[0] + dx, dy, c[2] + dz];
const S1a = (n: number) => dolly(R(BASIN, -1.6, 1.6, 4.4), R(BASIN, -0.3, 1.3, 0.3), pushK(n, 0, 0.0022), { fov: 44 });
const S1b = (n: number) => dolly(R(BASIN, -3.4, 1.7, 5.2), R(BASIN, -1.6, 1.4, 0.6), pushK(n, 152, 0.002, 0.005, 26), { fov: 46, roll: -0.03 });
const S2a = (n: number) => zoom([30, 30, 110], [-10, 4, 20], 48, pushK(n, 236, 0.0016));
const S2b = (n: number) => dolly([-34, 1.8, 22], [-38, 2.6, 4.25], pushK(n, 322, 0.002), { fov: 48 });
const S3a = (n: number) => dolly(R(WARD_MID, 1.0, 1.6, 3.4), R(WARD_MID, -1.0, 1.1, -1.8), pushK(n, 441, 0.002), { fov: 48 });
const S3b = (n: number) => dolly(R(WARD_DOC, -1.0, 1.6, 3.4), R(WARD_DOC, 0.6, 1.1, -1.8), pushK(n, 518, 0.002), { fov: 48 });
const S3c = (n: number) => dolly(R(WARD_DOC, -0.4, 1.7, 2.6), R(WARD_DOC, -0.4, 1.9, 0), pushK(n, 575, 0.0025, 0.006, 26), { fov: 42 });
const S4a = (n: number) => dolly([-21, 1.6, 15.5], [-22, 1.4, 10.5], pushK(n, 671, 0.0022), { fov: 44 });
const S4b = (n: number) => dolly([4.5, 1.6, STREET_Z + 6.5], [2, 1.0, STREET_Z + 0.6], pushK(n, 729, 0.002), { fov: 46, roll: 0.03 });
const S5a = (n: number) => dolly(R(OFFICE, 0.6, 1.6, 3.0), R(OFFICE, 0, 1.4, -0.6), pushK(n, 861, 0.0022), { fov: 42 });
const S5b = (n: number) => dolly(R(DISSECT, 1.4, 1.6, 3.0), R(DISSECT, 0.3, 1.3, -0.4), pushK(n, 949, 0.0022, 0.005, 26), { fov: 44 });
const S5c = (n: number) => dolly(R(DISSECT, 1.8, 1.7, 3.4), R(DISSECT, -0.2, 1.1, 0), pushK(n, 1032, 0.002), { fov: 54, roll: -0.03 });
const S5d = (n: number) => dolly(R(WARD_DOC, -3.8, 1.5, 1.6), R(WARD_DOC, -4.6, 1.2, -1.6), pushK(n, 1071, 0.0022), { fov: 42 });
const S6a = (n: number) => dolly(R(OFFICE, 0.4, 1.6, 2.2), R(OFFICE, 0, 1.6, -0.4), pushK(n, 1141, 0.003, 0.007, 26), { fov: 40, roll: 0.04 });
const S6b = (n: number) => dolly([-16, 1.7, 15], [-20, 1.4, 8], pushK(n, 1189, 0.002), { fov: 46 });
/** the doctors walking from the dissection room to the wards (shot 6): x of doctor k at time t, z lane */
export const docWalkX = (k: number, t: number) => -15 - (((t - 39.6) * 1.2 + k * 1.3) % 30);
export const docWalkZ = (k: number) => 7.6 + (k % 2) * 0.8;
/** tracks doctor 1 from the side, framing the germs on his hands */
const S6c = (n: number) => { const x = docWalkX(1, n / 30), z = docWalkZ(1);
  return { pos: [x - 0.2, 1.45, z + 2.6] as V3, look: [x + 0.2, 1.05, z] as V3, fov: 42 }; };
const S7a = (n: number) => dolly(R(BASIN, -2.6, 1.7, 4.6), R(BASIN, -1.0, 1.4, 0.4), pushK(n, 1346, 0.0022), { fov: 46 });
const S7b = (n: number) => dolly(R(BASIN, -0.6, 1.5, 2.2), R(BASIN, 0, 1.1, 0.1), pushK(n, 1430, 0.0025, 0.006, 26), { fov: 40, roll: -0.03 });
const S8a = (n: number) => dolly(R(WARD_DOC, 0.5, 1.8, 3.2), R(WARD_DOC, 0.5, 2.0, 0.6), pushK(n, 1511, 0.0022), { fov: 44 });
const S8b = (n: number) => dolly(R(WARD_DOC, 1.4, 1.6, 3.4), R(WARD_DOC, -0.6, 1.1, -1.8), pushK(n, 1612, 0.002), { fov: 48, roll: 0.03 });
const S9a = (n: number) => dolly([-8, 1.7, 18], [-9.5, 1.5, 12], pushK(n, 1671, 0.0022), { fov: 46 });
const S9b = (n: number) => dolly([-9.2, 1.6, 15.2], [-9.6, 1.6, 12.2], pushK(n, 1843, 0.003, 0.008, 22), { fov: 40, roll: -0.05 });
const S10a = (n: number) => dolly([GATE[0] + 1.8, 1.6, GATE[2] + 3.2], [GATE[0], 1.6, GATE[2] - 2], pushK(n, 1881, 0.0018), { fov: 46 });
const S10b = (n: number) => dolly(R(SCILAB, 1.0, 1.6, 2.6), R(SCILAB, 0, 1.3, -0.6), pushK(n, 1961, 0.0025, 0.005, 26), { fov: 42 });
const S11a = (n: number) => dolly(R(BATH, 0.6, 1.4, 2.0), R(BATH, 0, 1.0, -1.6), pushK(n, 2071, 0.0022), { fov: 44 });
const S11b = (n: number) => dolly(R(BATH, 0.2, 1.3, 0.8), R(BATH, 0, 1.0, -1.6), pushK(n, 2208, 0.0025, 0.005, 26), { fov: 40, roll: 0.03 });
const S11c = crane(S11b, 2290, 70, R(BATH, 0.6, 2.2, 2.4), R(BATH, 0.8, 2.8, 2.8), R(BATH, 0, 1.0, -1.6), 50);

const CAMS: Record<number, Key[]> = {
  1: [{ f: 0, s: S1a }, { f: 152, cut: true, s: S1b }],
  2: [{ f: 236, s: S2a }, { f: 322, cut: true, s: S2b }],
  3: [{ f: 441, s: S3a }, { f: 518, cut: true, s: S3b }, { f: 575, cut: true, s: S3c }],
  4: [{ f: 671, s: S4a }, { f: 729, cut: true, s: S4b }],
  5: [{ f: 861, s: S5a }, { f: 949, cut: true, s: S5b }, { f: 1032, cut: true, s: S5c }, { f: 1071, cut: true, s: S5d }],
  6: [{ f: 1141, s: S6a }, { f: 1189, cut: true, s: S6b }, { f: 1273, cut: true, s: S6c }],
  7: [{ f: 1346, s: S7a }, { f: 1430, cut: true, s: S7b }],
  8: [{ f: 1511, s: S8a }, { f: 1612, cut: true, s: S8b }],
  9: [{ f: 1671, s: S9a }, { f: 1843, cut: true, s: S9b }],
  10: [{ f: 1881, s: S10a }, { f: 1961, cut: true, s: S10b }],
  11: [{ f: 2071, s: S11a }, { f: 2208, cut: true, s: S11b }, { f: 2290, cut: true, s: S11c }],
};
const KICKS: [number, number][] = [[186, 0.4], [1015, 0.4], [1170, 0.5], [1368, 0.5], [1551, 0.6], [1845, 0.9]];
const DOF: Dof[] = [
  { f: 0, cInf: 11 }, { f: 152, cInf: 9 }, { f: 240, cInf: 0 }, { f: 322, cInf: 4 }, { f: 445, cInf: 9 }, { f: 575, cInf: 13 },
  { f: 675, cInf: 10 }, { f: 729, cInf: 8 }, { f: 865, cInf: 12 }, { f: 949, cInf: 10 }, { f: 1071, cInf: 11 }, { f: 1140, cInf: 13 },
  { f: 1189, cInf: 6 }, { f: 1273, cInf: 13 }, { f: 1350, cInf: 10 }, { f: 1430, cInf: 13 }, { f: 1515, cInf: 13 }, { f: 1612, cInf: 9 },
  { f: 1675, cInf: 9 }, { f: 1843, cInf: 13 }, { f: 1885, cInf: 6 }, { f: 1961, cInf: 12 }, { f: 2075, cInf: 10 }, { f: 2208, cInf: 13 },
];
export const tl = makeTimeline({ TOTAL: 2360, FLASH_AT: 240, SHOTS, XFADE, CAMS, KICKS, DOF });
