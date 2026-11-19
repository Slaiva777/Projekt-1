// Shot timeline, camera grammar and lens table shared by every short (from the bridge/Köpenick shorts):
// smootherstep glides, creeping push-ins on every hold, cuts on big jumps, 7-frame flip kicks, thin-lens DOF per beat.
import { FPS, V3, clamp01 } from "./core";

export type Light = "day" | "golden";
export type ShotDef = { id: number; a: number; b: number; light: Light; sunAz?: number; sunEl?: number;
  /** per-shot sky (5 colours, horizon -> top) and fog [colour, near, far] overrides (storm, underwater) */
  sky?: string[]; fog?: [string, number, number]; sunK?: number };
export type Cam = { pos: V3; look: V3; fov: number; roll: number };
export type Shot = Partial<Cam> & { pos: V3; look: V3 };
export type Key = { f: number; dur?: number; cut?: boolean; s: (f: number) => Shot };
export type Dof = { f: number; dur?: number; cInf: number; focus?: (f: number) => V3 };

export const glide = (u: number) => { const x = clamp01(u); return x * x * x * (x * (6 * x - 15) + 10); };
const mix = (a: Cam, b: Cam, k: number): Cam => ({
  pos: a.pos.map((v, i) => v + (b.pos[i] - v) * k) as V3, look: a.look.map((v, i) => v + (b.look[i] - v) * k) as V3,
  fov: a.fov + (b.fov - a.fov) * k, roll: a.roll + (b.roll - a.roll) * k,
});
const full = (c: Shot): Cam => ({ fov: 40, roll: 0, ...c });
/** push-in factor since f0 (subject grows ~rate per frame); `punch` raises it for the first n frames */
export const pushK = (f: number, f0: number, rate: number, punch = 0, n = 35) => {
  const x = Math.max(0, f - f0);
  let s = rate * x;
  if (punch > rate) for (let i = 0; i < Math.min(x, n); i++) s += (punch - rate) * Math.max(0, Math.min(1, (i + 0.5) / 8, (n - i - 0.5) / 8));
  return Math.exp(-s);
};
export const dolly = (pos: V3, look: V3, k: number, rest: Partial<Cam> = {}): Shot =>
  ({ pos: [look[0] + (pos[0] - look[0]) * k, look[1] + (pos[1] - look[1]) * k, look[2] + (pos[2] - look[2]) * k], look, ...rest });
export const zoom = (pos: V3, look: V3, fov: number, k: number, rest: Partial<Cam> = {}): Shot =>
  ({ pos, look, fov: (360 / Math.PI) * Math.atan(Math.tan((fov * Math.PI) / 360) * k), ...rest });
export const rolled = (s: (f: number) => Shot, roll: number) => (f: number): Shot => ({ ...s(f), roll });
/** a crane/curve move from shot a (evaluated at f0) through control point C to (B, look L) over dur frames */
export const crane = (a: (f: number) => Shot, f0: number, dur: number, C: V3, B: V3, L: V3, fov = 46) => (f: number): Shot => {
  const s0 = full(a(f0)), s = glide((f - f0) / dur), r = 1 - s;
  return { pos: [0, 1, 2].map((i) => r * r * s0.pos[i] + 2 * s * r * C[i] + s * s * B[i]) as V3,
    look: [0, 1, 2].map((i) => s0.look[i] + (L[i] - s0.look[i]) * s) as V3, fov: s0.fov + (fov - s0.fov) * s, roll: s0.roll * r };
};

export type Timeline = {
  TOTAL: number; FLASH_AT: number; SHOTS: ShotDef[]; XFADE: Record<number, number>;
  CAMS: Record<number, Key[]>; KICKS: [number, number][]; DOF: Dof[]; FLASHES?: number[];
};
export const makeTimeline = (T: Timeline) => {
  const shotAt = (f: number) => T.SHOTS.find((s) => f >= s.a && f < s.b) ?? T.SHOTS[T.SHOTS.length - 1];
  const layersAt = (f: number): { id: number; alpha: number }[] => {
    for (const s of T.SHOTS) {
      const x = T.XFADE[s.id];
      if (x && f >= s.a - x / 2 && f < s.a + x / 2) return [{ id: s.id - 1, alpha: 1 }, { id: s.id, alpha: (f - (s.a - x / 2) + 1) / (x + 1) }];
    }
    return [{ id: shotAt(f).id, alpha: 1 }];
  };
  const run = (keys: Key[], f: number) => {
    let cur = full(keys[0].s(f));
    for (let i = 1; i < keys.length; i++) {
      const k = keys[i];
      if (f < k.f) break;
      cur = k.cut ? full(k.s(f)) : mix(cur, full(k.s(f)), glide((f - k.f) / (k.dur ?? 24)));
    }
    return cur;
  };
  const kickAt = (t: number) => {
    let a = 0;
    for (const [f0, g] of T.KICKS) {
      const n = Math.floor((t - f0 / FPS) * FPS + 1e-6);
      if (n >= 0 && n < 7) a += g * (n % 2 ? -1 : 1) * (1 - n / 7) ** 1.5;
    }
    return a;
  };
  const camAt = (id: number, f: number): Cam => {
    const c = run(T.CAMS[id], f), a = kickAt(f / FPS);
    if (!a) return c;
    const d: V3 = [c.look[0] - c.pos[0], c.look[1] - c.pos[1], c.look[2] - c.pos[2]];
    const L = Math.hypot(...d), h = Math.hypot(d[0], d[2]) || 1;
    const m = (3 / 640) * Math.tan((c.fov * Math.PI) / 360) * L * a;
    return { ...c, look: [c.look[0] - (d[2] / h) * m, c.look[1] + 0.6 * m, c.look[2] + (d[0] / h) * m], roll: c.roll + a * 0.004 };
  };
  const dofAt = (f: number) => {
    let i = 0; while (i + 1 < T.DOF.length && f >= T.DOF[i + 1].f) i++;
    const d = T.DOF[i], p = T.DOF[Math.max(0, i - 1)];
    const k = d.dur ? Math.min(1, (f - d.f) / d.dur) : 1;
    return { cInf: p.cInf + (d.cInf - p.cInf) * k, focus: d.focus };
  };
  return { ...T, shotAt, layersAt, camAt, dofAt, kickAt };
};
export type TL = ReturnType<typeof makeTimeline>;
