// Timeline of "Der Hauptmann von Köpenick": shots timed to the voice words (koepenick/voice/words.json, frames at 30 fps),
// camera grammar from the bridge short (smootherstep glides, creeping push-ins on every hold, cuts on big jumps,
// 7-frame flip kicks on impacts, 4-5 deg rolls on emphasis beats).
export const FPS = 30;
export const TOTAL = 1700;
export const D0 = 0; // ground height (m)
export type V3 = [number, number, number];

export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (x: number) => { const u = clamp01(x); return u * u * (3 - 2 * u); };
export const easeOut = (u: number) => 1 - (1 - clamp01(u)) ** 4;

// ---------------- places (world.ts builds them, cast.ts stages people there) ----------------
export const RATHAUS_Z = -62;            // town hall facade (faces +z), door at x = 0
export const PODIUM: V3 = [15, 0, -44];   // the Kaiser's podium in the square
export const STALL: V3 = [-6.2, 0, 58];   // the junk dealer's stall (faces +x)
export const AMPEL: V3 = [5.6, 0, 92];    // traffic light on the corner (faces +z)
export const RAIL_Z = 162;               // railway line along x behind the town
export const COUNTER: V3 = [-8.5, 0, RATHAUS_Z]; // closed counter window on the town hall
export const trainX = (t: number) => -95 + 21 * (t - 21.6); // locomotive front, crossing the field during shot 6

// ---------------- shots ----------------
export type Light = "day" | "golden";
export type ShotDef = { id: number; a: number; b: number; light: Light; sunAz?: number; sunEl?: number };
export const SHOTS: ShotDef[] = [
  { id: 1, a: 0, b: 178, light: "day", sunAz: 60 },      // hook: the captain and his men in front of the town hall
  { id: 2, a: 178, b: 328, light: "day", sunAz: 110 },   // Berlin 1906: street; people make way for a soldier
  { id: 3, a: 328, b: 438, light: "day", sunAz: 70 },    // the junk dealer's stall, the uniform
  { id: 4, a: 438, b: 570, light: "day", sunAz: 70 },    // he stops a squad: "Mir nach!"
  { id: 5, a: 570, b: 658, light: "day", sunAz: 80 },    // they follow without a question
  { id: 6, a: 658, b: 726, light: "day", sunAz: 40 },    // the train to Köpenick
  { id: 7, a: 726, b: 870, light: "day", sunAz: 60 },    // into the town hall: the mayor arrested, the cash box
  { id: 8, a: 870, b: 968, light: "day", sunAz: 60 },    // 4002 Mark, with a receipt
  { id: 9, a: 968, b: 1062, light: "day", sunAz: 70 },   // nobody asks who he is
  { id: 10, a: 1062, b: 1155, light: "day", sunAz: 70 }, // nobody asks what he wants
  { id: 11, a: 1155, b: 1338, light: "day", sunAz: 75 }, // the red traffic light
  { id: 12, a: 1338, b: 1492, light: "day", sunAz: 65 }, // caught; the world laughs; the Kaiser pardons him
  { id: 13, a: 1492, b: TOTAL, light: "golden" },        // he only wanted a passport
];
/** crossfades (frames) at place/time changes; a white 4-frame flash after the hook */
export const XFADE: Record<number, number> = { 3: 8, 6: 8, 7: 8, 11: 8, 12: 8, 13: 10 };
export const FLASH_AT = 178;

export const shotAt = (f: number) => SHOTS.find((s) => f >= s.a && f < s.b) ?? SHOTS[SHOTS.length - 1];
export const layersAt = (f: number): { id: number; alpha: number }[] => {
  for (const s of SHOTS) {
    const x = XFADE[s.id];
    if (x && f >= s.a - x / 2 && f < s.a + x / 2) return [{ id: s.id - 1, alpha: 1 }, { id: s.id, alpha: (f - (s.a - x / 2) + 1) / (x + 1) }];
  }
  return [{ id: shotAt(f).id, alpha: 1 }];
};

// ---------------- camera ----------------
export type Cam = { pos: V3; look: V3; fov: number; roll: number };
type Shot = Partial<Cam> & { pos: V3; look: V3 };
type Key = { f: number; dur?: number; cut?: boolean; s: (f: number) => Shot };
export const glide = (u: number) => { const x = clamp01(u); return x * x * x * (x * (6 * x - 15) + 10); };
const mix = (a: Cam, b: Cam, k: number): Cam => ({
  pos: a.pos.map((v, i) => v + (b.pos[i] - v) * k) as V3, look: a.look.map((v, i) => v + (b.look[i] - v) * k) as V3,
  fov: a.fov + (b.fov - a.fov) * k, roll: a.roll + (b.roll - a.roll) * k,
});
const full = (c: Shot): Cam => ({ fov: 40, roll: 0, ...c });
const run = (keys: Key[], f: number) => {
  let cur = full(keys[0].s(f));
  for (let i = 1; i < keys.length; i++) {
    const k = keys[i];
    if (f < k.f) break;
    cur = k.cut ? full(k.s(f)) : mix(cur, full(k.s(f)), glide((f - k.f) / (k.dur ?? 24)));
  }
  return cur;
};
const T = (f: number) => f / FPS;
/** push-in factor since f0 (subject grows ~rate per frame); `punch` raises it for the first n frames */
const pushK = (f: number, f0: number, rate: number, punch = 0, n = 35) => {
  const x = Math.max(0, f - f0);
  let s = rate * x;
  if (punch > rate) for (let i = 0; i < Math.min(x, n); i++) s += (punch - rate) * Math.max(0, Math.min(1, (i + 0.5) / 8, (n - i - 0.5) / 8));
  return Math.exp(-s);
};
const dolly = (pos: V3, look: V3, k: number, rest: Partial<Cam> = {}): Shot =>
  ({ pos: [look[0] + (pos[0] - look[0]) * k, look[1] + (pos[1] - look[1]) * k, look[2] + (pos[2] - look[2]) * k], look, ...rest });
const zoom = (pos: V3, look: V3, fov: number, k: number, rest: Partial<Cam> = {}): Shot =>
  ({ pos, look, fov: (360 / Math.PI) * Math.atan(Math.tan((fov * Math.PI) / 360) * k), ...rest });
const rolled = (s: (f: number) => Shot, roll: number) => (f: number): Shot => ({ ...s(f), roll });

// ---- story motion shared with cast.ts ----
/** the captain's column in shot 1: walks out of the town hall toward the lens */
export const hookZ = (t: number) => RATHAUS_Z + 14 + 1.1 * Math.min(t, 4.6);
/** shot 5: the column marching down the street toward +z */
export const followZ = (t: number) => 18 + 1.4 * (t - 19.0);
/** shots 9/10: the captain walking across the square (x) past the bowing townsfolk */
export const paradeX = (t: number, id: number) => (id === 9 ? -7 + 1.2 * (t - 32.3) : 7 - 1.2 * (t - 35.4));
/** shot 12: the police lead him away along the street */
export const arrestZ = (t: number) => 26 + 1.0 * (t - 44.6);

// ---- framings ----
// shot 1: low wide on the column in front of the town hall -> closer MS of the captain -> punch "Rathaus erobert"
const S1a = (f: number) => { const z = hookZ(T(f)); return dolly([4.2, 1.3, z + 10], [0, 4.2, z - 9], pushK(f, 0, 0.002), { fov: 50 }); };
const S1b = (f: number) => { const z = hookZ(T(f)); return dolly([1.0, 1.55, z + 4.6], [0, 1.65, z], pushK(f, 70, 0.0025), { fov: 38, roll: -0.03 }); };
const S1c = (f: number) => { const z = hookZ(T(f)); return dolly([-1.6, 0.7, z + 5.2], [0, 2.4, z - 3], pushK(f, 132, 0.003, 0.007, 30), { fov: 44, roll: 0.045 }); };
// shot 2: aerial over the street -> MS: the townsfolk bow to a soldier
const S2a = (f: number) => zoom([0, 21, 116], [0, 3, 40], 44, pushK(f, 172, 0.002));
const S2b = (f: number) => dolly([1.0, 1.7, 38.6], [-0.4, 1.3, 30.8], pushK(f, 262, 0.0025), { fov: 46 });
// shot 3: the stall (side of the street, facing +x): MS on the shabby shoemaker -> the new captain (punch)
const S3a = (f: number) => dolly([STALL[0] + 6.0, 1.7, STALL[2] + 3.4], [STALL[0] + 1.6, 1.45, STALL[2] + 0.4], pushK(f, 322, 0.0022), { fov: 40 });
const S3b = (f: number) => dolly([STALL[0] + 5.0, 1.45, STALL[2] + 1.6], [STALL[0] + 1.8, 1.55, STALL[2] + 0.5], pushK(f, 401, 0.002, 0.006, 30), { fov: 38, roll: 0.04 });
// shot 4: the squad marches along the street (side view), the captain steps out -> "Mir nach!" low angle
const S4a = (f: number) => dolly([13.5, 2.0, 22.4], [0, 1.4, 22.4], pushK(f, 438, 0.002), { fov: 50 });
const S4b = (f: number) => dolly([2.6, 0.8, 17.6], [0.1, 2.0, 21.0], pushK(f, 538, 0.003, 0.007, 26), { fov: 46, roll: -0.04 });
// shot 5: the column toward the lens -> close on the blank faces "Ohne eine einzige Frage"
const S5a = (f: number) => { const z = followZ(T(f)); return dolly([1.4, 1.75, z + 7.5], [0, 1.6, z], pushK(f, 570, 0.0025), { fov: 42 }); };
const S5b = (f: number) => { const z = followZ(T(f)); return dolly([0.7, 1.75, z + 1.4], [0.2, 1.65, z - 2.2], pushK(f, 606, 0.002), { fov: 38, roll: 0.03 }); };
// shot 6: side view of the train crossing the field (lens follows the locomotive a little)
const S6a = (f: number) => { const x = trainX(T(f)); return { pos: [x - 10 + 0.15 * (f - 658), 2.6, RAIL_Z - 19] as V3, look: [x - 4, 2.4, RAIL_Z] as V3, fov: 42 }; };
// shot 7: wide of the town hall as the squad marches in -> the mayor led out -> the cash box (punch)
const S7a = (f: number) => zoom([2.5, 2.2, -24], [0, 5, RATHAUS_Z], 50, pushK(f, 722, 0.0018));
const S7b = (f: number) => dolly([2.4, 1.6, RATHAUS_Z + 9.5], [-0.2, 1.5, RATHAUS_Z + 3.6], pushK(f, 772, 0.0022), { fov: 40 });
const S7c = (f: number) => dolly([1.6, 1.55, RATHAUS_Z + 7.4], [0.7, 1.5, RATHAUS_Z + 4.0], pushK(f, 826, 0.002, 0.006, 28), { fov: 38, roll: -0.04 });
// shot 8: CU of the captain with the money -> the receipt
const S8a = (f: number) => dolly([0.4, 1.85, RATHAUS_Z + 7.7], [0.6, 1.62, RATHAUS_Z + 4.2], pushK(f, 870, 0.0025, 0.006, 26), { fov: 36 });
const S8b = (f: number) => dolly([-0.6, 1.7, RATHAUS_Z + 7.0], [0.6, 1.5, RATHAUS_Z + 4.2], pushK(f, 918, 0.0022), { fov: 36, roll: 0.04 });
// shots 9/10: the townsfolk bow as he passes (same framing grammar, mirrored), then the punch on the uniform
const S9a = (f: number) => { const x = paradeX(T(f), 9); return dolly([x + 2.5, 1.5, -33], [x + 0.8, 1.5, -40], pushK(f, 968, 0.002), { fov: 42 }); };
const S9b = (f: number) => { const x = paradeX(T(f), 9); return dolly([x + 0.8, 1.45, -36.6], [x, 1.35, -40], pushK(f, 1016, 0.002, 0.007, 26), { fov: 36, roll: 0.045 }); };
const S10a = (f: number) => { const x = paradeX(T(f), 10); return dolly([x - 2.5, 1.5, -33], [x - 0.8, 1.5, -40], pushK(f, 1062, 0.002), { fov: 42 }); };
const S10b = (f: number) => { const x = paradeX(T(f), 10); return dolly([x - 0.8, 1.45, -36.6], [x, 1.35, -40], pushK(f, 1108, 0.002, 0.007, 26), { fov: 36, roll: -0.045 }); };
// shot 11: the red light, a walker stops -> reveal: the captain put it up
const S11a = (f: number) => dolly([AMPEL[0] - 2.2, 2.6, AMPEL[2] + 7.5], [AMPEL[0] - 0.6, 2.5, AMPEL[2]], pushK(f, 1151, 0.002), { fov: 40 });
const S11b = (f: number) => dolly([AMPEL[0] - 3.4, 1.4, AMPEL[2] + 5.4], [AMPEL[0] - 2.0, 1.4, AMPEL[2] - 0.2], pushK(f, 1226, 0.0022), { fov: 40 });
const S11c = (f: number) => dolly([AMPEL[0] - 1.0, 1.9, AMPEL[2] + 8.4], [AMPEL[0] - 0.6, 1.7, AMPEL[2] + 0.6], pushK(f, 1268, 0.002, 0.006, 26), { fov: 46, roll: 0.04 });
// shot 12: arrested (police at his sides) -> the crowd laughs -> the Kaiser on his podium
const S12a = (f: number) => { const z = arrestZ(T(f)); return dolly([1.6, 1.6, z + 5.8], [0, 1.5, z], pushK(f, 1334, 0.0022), { fov: 40 }); };
const S12b = (f: number) => dolly([-2, 2.4, -27], [-1, 1.5, -36], pushK(f, 1397, 0.002), { fov: 44, roll: -0.03 });
const S12c = (f: number) => dolly([PODIUM[0] - 1.8, 2.1, PODIUM[2] + 6.5], [PODIUM[0], 2.5, PODIUM[2]], pushK(f, 1441, 0.0025, 0.006, 26), { fov: 38 });
// shot 13 (golden): the captain at the closed counter -> the passport sign -> the shrug -> crane out over the town hall
const S13a = (f: number) => dolly([COUNTER[0] + 2.4, 1.7, COUNTER[2] + 6.4], [COUNTER[0] + 0.4, 1.7, COUNTER[2] + 0.6], pushK(f, 1486, 0.0018), { fov: 40 });
const S13b = (f: number) => dolly([COUNTER[0] + 0.9, 1.95, COUNTER[2] + 2.7], [COUNTER[0] + 0.2, 1.95, COUNTER[2]], pushK(f, 1574, 0.0025, 0.006, 22), { fov: 38 });
const S13c = (f: number) => dolly([COUNTER[0] + 2.6, 1.65, COUNTER[2] + 5.6], [COUNTER[0] + 0.7, 1.6, COUNTER[2] + 1.0], pushK(f, 1588, 0.0015), { fov: 40, roll: -0.03 });
const CRANE: V3[] = [[2, 10, -36], [10, 22, -10], [0, 9, RATHAUS_Z]];
const S13d = (f: number): Shot => {
  const a = S13c(1640), s = glide((f - 1640) / 60), r = 1 - s, [C, B, L] = CRANE;
  return { pos: [0, 1, 2].map((i) => r * r * a.pos[i] + 2 * s * r * C[i] + s * s * B[i]) as V3,
    look: [0, 1, 2].map((i) => a.look[i] + (L[i] - a.look[i]) * s) as V3, fov: 40 + 6 * s, roll: -0.03 * r };
};

const CAMS: Record<number, Key[]> = {
  1: [{ f: 0, s: S1a }, { f: 70, cut: true, s: S1b }, { f: 132, cut: true, s: S1c }],
  2: [{ f: 172, s: S2a }, { f: 262, cut: true, s: S2b }, { f: 300, dur: 20, s: rolled(S2b, 0.04) }],
  3: [{ f: 322, s: S3a }, { f: 401, cut: true, s: S3b }],
  4: [{ f: 438, s: S4a }, { f: 538, cut: true, s: S4b }],
  5: [{ f: 570, s: S5a }, { f: 606, cut: true, s: S5b }],
  6: [{ f: 652, s: S6a }],
  7: [{ f: 722, s: S7a }, { f: 772, cut: true, s: S7b }, { f: 826, cut: true, s: S7c }],
  8: [{ f: 870, s: S8a }, { f: 918, cut: true, s: S8b }],
  9: [{ f: 962, s: S9a }, { f: 1016, cut: true, s: S9b }],
  10: [{ f: 1062, s: S10a }, { f: 1108, cut: true, s: S10b }],
  11: [{ f: 1151, s: S11a }, { f: 1226, cut: true, s: S11b }, { f: 1268, cut: true, s: S11c }],
  12: [{ f: 1334, s: S12a }, { f: 1397, cut: true, s: S12b }, { f: 1441, cut: true, s: S12c }],
  13: [{ f: 1486, s: S13a }, { f: 1574, cut: true, s: S13b }, { f: 1588, cut: true, s: S13c }, { f: 1640, cut: true, s: S13d }],
};

// impact kicks: "erobert" (sabre up), "Mir nach!", the cash box, "geschnappt"
const KICKS: [number, number][] = [[150 / FPS, 0.8], [542 / FPS, 1.0], [829 / FPS, 0.6], [873 / FPS, 0.5], [1382 / FPS, 0.9]];
export const kickAt = (t: number) => {
  let a = 0;
  for (const [t0, g] of KICKS) {
    const n = Math.floor((t - t0) * FPS + 1e-6);
    if (n >= 0 && n < 7) a += g * (n % 2 ? -1 : 1) * (1 - n / 7) ** 1.5;
  }
  return a;
};
export const camAt = (id: number, f: number): Cam => {
  const c = run(CAMS[id], f), a = kickAt(T(f));
  if (!a) return c;
  const d: V3 = [c.look[0] - c.pos[0], c.look[1] - c.pos[1], c.look[2] - c.pos[2]];
  const L = Math.hypot(...d), h = Math.hypot(d[0], d[2]) || 1;
  const m = (3 / 640) * Math.tan((c.fov * Math.PI) / 360) * L * a;
  return { ...c, look: [c.look[0] - (d[2] / h) * m, c.look[1] + 0.6 * m, c.look[2] + (d[0] / h) * m], roll: c.roll + a * 0.004 };
};

// ---------------- lens ----------------
export type Dof = { f: number; dur?: number; cInf: number; focus?: (f: number) => V3 };
export const DOF: Dof[] = [
  { f: 0, cInf: 8, focus: (f) => [0, 1.6, hookZ(T(f))] },
  { f: 70, cInf: 14, focus: (f) => [0, 1.65, hookZ(T(f))] },
  { f: 132, cInf: 9, focus: (f) => [0, 1.7, hookZ(T(f))] },
  { f: 178, cInf: 0 },
  { f: 262, cInf: 12 },
  { f: 328, cInf: 12 },
  { f: 438, cInf: 0 },
  { f: 538, cInf: 10 },
  { f: 570, cInf: 10, focus: (f) => [0, 1.6, followZ(T(f))] },
  { f: 606, cInf: 14, focus: (f) => [0, 1.65, followZ(T(f)) - 2.2] },
  { f: 658, cInf: 0 },
  { f: 772, cInf: 12 },
  { f: 870, cInf: 14 },
  { f: 968, cInf: 10, focus: (f) => [paradeX(T(f), 9), 1.55, -40] },
  { f: 1016, cInf: 14, focus: (f) => [paradeX(T(f), 9), 1.6, -40] },
  { f: 1062, cInf: 10, focus: (f) => [paradeX(T(f), 10), 1.55, -40] },
  { f: 1108, cInf: 14, focus: (f) => [paradeX(T(f), 10), 1.6, -40] },
  { f: 1155, cInf: 9 },
  { f: 1226, cInf: 12 },
  { f: 1268, cInf: 9 },
  { f: 1338, cInf: 12, focus: (f) => [0, 1.6, arrestZ(T(f))] },
  { f: 1397, cInf: 6 },
  { f: 1441, cInf: 12, focus: () => [PODIUM[0], 2.6, PODIUM[2]] },
  { f: 1492, cInf: 9 },
  { f: 1574, cInf: 12 },
  { f: 1640, dur: 40, cInf: 0 },
];
export const dofAt = (f: number) => {
  let i = 0; while (i + 1 < DOF.length && f >= DOF[i + 1].f) i++;
  const d = DOF[i], p = DOF[Math.max(0, i - 1)];
  const k = d.dur ? Math.min(1, (f - d.f) / d.dur) : 1;
  return { cInf: p.cInf + (d.cInf - p.cInf) * k, focus: d.focus };
};
export const keyEnd = (id: number, f: number) => {
  let e = 0;
  for (const k of CAMS[id]) if (f >= k.f) e = k.f + (k.cut ? 0 : k.dur ?? 24);
  return Math.max(f, e);
};
