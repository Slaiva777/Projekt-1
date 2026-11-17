// Our cast as lit flat sprites in the 3D world. Each frame every character asks for a drawing (a key + a draw call);
// the pool keeps one canvas per distinct drawing, so soldiers marching in step share canvases (7 head shapes x 4
// outfits). Characters are yaw-only billboards shaded by cardShade() (scene tint, bright floor, side gradient toward
// the sun, painted crescent in the drawing); standing ones get a soft multiply contact blob. Effects are unlit cards.
// Cards, effects and blobs live on the NOINK layer so the world ink pass never outlines their quads.
import * as THREE from "three";
import {
  Pen, bodyFront, bodySide, townsfolk, KID, fxBurst, fxStars, fxShadow, fxContact, fxPuff,
  Outfit, Expr, FrontOpts, SideOpts, Prop, grenadier, VOIGT_CAPT, VOIGT_CIV, MAYOR, POLICE, KAISER,
} from "./toon";
import {
  FPS, D0, SHOTS, V3, smooth, clamp01, hookZ, followZ, paradeX, arrestZ, STALL, AMPEL, RATHAUS_Z, PODIUM, COUNTER,
} from "./story";
import { LIGHTS } from "./lights";
import { NOINK } from "./ink";
import { cardShade, blobMaterial, CARD_K } from "./cardshade";

// ---------------- canvas pool ----------------
type Entry = { cv: HTMLCanvasElement; tex: THREE.CanvasTexture; w: number; h: number };
export type Req = { key: string; w: number; h: number; k: number; draw: (p: Pen) => void; tex?: THREE.CanvasTexture };
const makeEntry = (w: number, h: number): Entry => {
  const cv = document.createElement("canvas");
  cv.width = w; cv.height = h;
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  return { cv, tex, w, h };
};
export class Pool {
  private live = new Map<string, Entry>();
  private free: Entry[] = [];
  private reqs: Req[] = [];
  req(key: string, w: number, h: number, k: number, draw: (p: Pen) => void) {
    const r: Req = { key: `${w}x${h}|${key}`, w, h, k, draw };
    this.reqs.push(r);
    return r;
  }
  flush() {
    const want = new Map<string, Req[]>();
    for (const r of this.reqs) { const l = want.get(r.key); if (l) l.push(r); else want.set(r.key, [r]); }
    for (const [key, e] of this.live) if (!want.has(key)) { this.live.delete(key); this.free.push(e); }
    for (const [key, rs] of want) {
      let e = this.live.get(key);
      if (!e) {
        const r = rs[0], i = this.free.findIndex((x) => x.w === r.w && x.h === r.h);
        e = i >= 0 ? this.free.splice(i, 1)[0] : makeEntry(r.w, r.h);
        const g = e.cv.getContext("2d")!;
        g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, e.w, e.h); g.setTransform(r.k, 0, 0, r.k, 0, 0);
        r.draw(new Pen(g));
        e.tex.needsUpdate = true;
        this.live.set(key, e);
      }
      for (const r of rs) r.tex = e.tex;
    }
    this.reqs = [];
  }
}

// ---------------- sprite meshes ----------------
const blank = (() => { const c = document.createElement("canvas"); c.width = c.height = 2; return new THREE.CanvasTexture(c); })();
export const SU = 0.00216; // metres per design unit: 1000 units = 2.16 m
export const SU_SWING = 2.3 / 1830; // swing canvas: rope of 1830 units = 2.3 m
const BODY = (() => { const g = new THREE.PlaneGeometry(600 * SU, 1000 * SU); g.translate(0, (975 - 500) * SU, 0); return g; })();
const CARD = new THREE.PlaneGeometry(1, 1);
/** world roots that hold actors (to find the scene's sun when world.ts does not pass it) */
const ROOTS = new Set<THREE.Object3D>();

/** lit flat character: cardShade() material, receives shadows (dims to the bright floor only), casts its silhouette
 *  when world.ts says so (golden). Drawn after the contact blobs (renderOrder 1). */
export class Actor {
  mesh: THREE.Mesh; mat: THREE.MeshLambertMaterial; dmat: THREE.MeshDepthMaterial; r: Req | null = null;
  constructor(parent: THREE.Object3D, geo: THREE.BufferGeometry = BODY) {
    this.mat = cardShade(new THREE.MeshLambertMaterial({ map: blank, alphaTest: 0.5, side: THREE.DoubleSide }));
    this.mat.alphaToCoverage = false; // A2C + MSAA left 1 px sky-depth seams on blurred far cards (POST)
    this.dmat = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: blank, alphaTest: 0.5, side: THREE.DoubleSide });
    this.mesh = new THREE.Mesh(geo, this.mat);
    this.mesh.customDepthMaterial = this.dmat;
    // rim width is in output pixels: tell the card shader the render height (1920 = 1080 x 1920 frame)
    this.mesh.onBeforeRender = (r) => { const rt = r.getRenderTarget(); CARD_K.uPx.value = (rt ? rt.height : r.domElement.height) / 1920; };
    this.mesh.castShadow = false; this.mesh.receiveShadow = true; this.mesh.visible = false;
    this.mesh.rotation.order = "YXZ"; this.mesh.renderOrder = 1; this.mesh.layers.set(NOINK);
    parent.add(this.mesh);
    ROOTS.add(parent);
  }
  bind() { const t = this.r?.tex; if (t) { this.mat.map = t; this.dmat.map = t; } }
}
/** unlit effect card: hard cut-out (ink drawings), soft see-through (dust, mist) or a multiply ground blob */
export class Fx {
  mesh: THREE.Mesh; mat: THREE.MeshBasicMaterial; soft: THREE.MeshBasicMaterial; blob: THREE.MeshBasicMaterial; r: Req | null = null;
  constructor(parent: THREE.Object3D) {
    this.mat = new THREE.MeshBasicMaterial({ map: blank, alphaTest: 0.5, side: THREE.DoubleSide });
    this.mat.alphaToCoverage = false; // A2C + MSAA left 1 px sky-depth seams on blurred far cards (POST)
    this.soft = new THREE.MeshBasicMaterial({ map: blank, transparent: true, depthWrite: false, side: THREE.DoubleSide });
    this.blob = blobMaterial(blank);
    this.mesh = new THREE.Mesh(CARD, this.mat);
    this.mesh.visible = false; this.mesh.layers.set(NOINK);
    parent.add(this.mesh);
  }
  use(soft: boolean) { this.mesh.material = soft ? this.soft : this.mat; }
  bind() {
    const t = this.r?.tex;
    if (!t) return;
    if (this.r!.key.includes("|blob|")) {
      // no mipmaps: at grazing views the mip chain averages the blob with its white surround and it fades out
      if (t.generateMipmaps) { t.generateMipmaps = false; t.minFilter = THREE.LinearFilter; t.needsUpdate = true; }
      this.blob.map = t; this.mesh.material = this.blob; this.mesh.renderOrder = 0.5;
    }
    else { this.mat.map = t; this.soft.map = t; this.mesh.renderOrder = 0; }
  }
}

// ---------------- placements ----------------
export type Place = {
  key: string; draw: (p: Pen) => void; x: number; y: number; z: number;
  scale?: number; mirror?: boolean; yaw?: number; geo?: "body" | "swing"; roll?: number; size?: [number, number, number];
};
export type FxPlace = { key: string; cw: number; ch: number; draw: (p: Pen) => void; x: number; y: number; z: number; w: number; h: number; flat?: boolean; rot?: number; soft?: boolean };
/** sun = world direction TOWARD the sun (optional: when absent the scene's shadow-casting light is used) */
export type CamInfo = { pos: THREE.Vector3; right: THREE.Vector3; sun?: THREE.Vector3 };

const hh = (i: number, s = 0) => { const v = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return v - Math.floor(v); };
const q = (v: number, n = 120) => Math.round(v * n) / n;
const SOLDIER = [0, 1, 2, 3].map((v) => grenadier(v));
const FOLK = [0, 1, 2, 3, 4, 5].map((v) => townsfolk(v));
const vOf = (i: number) => (i * 7 + (i >> 2)) % 4;
/** head-shape seed: 7 shapes, so marching soldiers in step still share canvases */
const seedOf = (i: number) => ((i * 5 + 3) % 7) + 1;
/** drawing resolution by distance: [canvas w, h, scale from the 600 x 1000 design]; sized for the 1440 x 2560 final */
const tier = (d: number): [number, number, number] =>
  d < 3.2 ? [1800, 3000, 3.0] : d < 6.5 ? [1080, 1800, 1.8] : d < 16 ? [480, 800, 0.8] : [240, 400, 0.4];

// ---------------- light ----------------
const SUN = new THREE.Vector3(0.5, 0.75, -0.4).normalize();
const tmp = new THREE.Vector3();
let LNAME: "day" | "golden" = "day";
const sunOf = (root: THREE.Object3D) => {
  let s: THREE.DirectionalLight | null = null;
  root.traverse((o) => { if (!s && o instanceof THREE.DirectionalLight && o.castShadow) s = o; });
  return s as THREE.DirectionalLight | null;
};
/** the sun of the world that is calling: the attached root whose sun target sits on this camera's view axis */
const findSun = (cam: CamInfo, out: THREE.Vector3) => {
  if (cam.sun) return out.copy(cam.sun).normalize();
  let best: THREE.DirectionalLight | null = null, err = Infinity;
  for (const r of ROOTS) {
    if (!r.parent) continue;
    const s = sunOf(r);
    if (!s) continue;
    const d = tmp.copy(s.target.position).sub(cam.pos), e = Math.abs(d.dot(cam.right)) / (d.length() || 1);
    if (e < err) { err = e; best = s; }
  }
  return best ? out.copy(best.position).sub(best.target.position).normalize() : out;
};
/** canvas angle the sun comes FROM on an upright card facing the camera, in 45-degree steps (small texture cache) */
const light2D = (cam: CamInfo, mirror: boolean) => {
  const sx = SUN.dot(cam.right) * (mirror ? -1 : 1), sy = -SUN.y;
  return Math.round(Math.atan2(sy, sx) / (Math.PI / 4)) * (Math.PI / 4);
};

/** front / side view and mirroring for someone at (x, z) walking along (dx, dz); fs = foreshortening of the walk */
const viewOf = (cam: CamInfo, x: number, z: number, dx: number, dz: number) => {
  const tx = cam.pos.x - x, tz = cam.pos.z - z, tl = Math.hypot(tx, tz) || 1;
  const c = (tx * dx + tz * dz) / tl;
  return { side: c < 0.57, mirror: dx * cam.right.x + dz * cam.right.z < 0, fs: Math.round(Math.sqrt(Math.max(0, 1 - c * c)) * 20) / 20 };
};

// ---------------- life: blinks and reaction timing ----------------
/** reference expression and action changes land 0-3 f before the word onset */
const LEAD = 2 / FPS;
/** eyelid 0 open .. 1 shut. Reference: gaps 0.5-2.3 s, 4-frame blink half / shut / shut / half, plus a blink across
 *  every expression swap (the shut frames hide the swap) */
const LID = [0.5, 1, 1, 0.5];

const lidAt = (t: number, i: number, swaps: number[] = []) => {
  const f = Math.round(t * FPS);
  for (const ts of swaps) { const k = f - Math.round((ts - LEAD) * FPS) + 1; if (k >= 0 && k < 4) return LID[k]; }
  let s = Math.round(-60 * hh(i, 9));
  for (let n = 0; s <= f && n < 400; n++) {
    const k = f - s;
    if (k >= 0 && k < 4) return LID[k];
    s += Math.round(15 + 54 * hh(i * 31 + n, 13)); // next blink 0.5-2.3 s later
  }
  return 0;
};
const fkey = (o: object) => JSON.stringify(o, (_k, v) => (typeof v === "number" ? q(v) : v));

type Who = { i: number; o: Outfit; okey: string };
/** one character drawing in the 600 x 1000 design space, sized by distance, lit from the scene's sun */
const person = (cam: CamInfo, who: Who, x: number, y: number, z: number, view: { side: boolean; mirror: boolean }, fo: FrontOpts, so: SideOpts, scale = 1): Place & { tierKey: string } => {
  const d = cam.pos.distanceTo(tmp.set(x, y + 1.2, z)) / scale;
  const [w, h, k] = tier(d);
  const mirror = view.side && view.mirror, light = light2D(cam, mirror), seed = seedOf(who.i);
  const f2: FrontOpts = { ...fo, light, seed }, s2: SideOpts = { ...so, light, seed };
  const key = view.side ? `S|${who.okey}|${fkey(s2)}` : `F|${who.okey}|${fkey(f2)}`;
  return {
    key, x, y, z, scale, mirror, tierKey: `${w}`,
    draw: (p) => (view.side ? bodySide(p, who.o, s2) : bodyFront(p, who.o, f2)),
    size: [w, h, k],
  };
};

/** ground shadow under a standing / sitting card (review rounds 2-4), multiply, blue-violet: a TIGHT contact pool right under
 *  the feet (~.5 on screen at the core) so nobody floats, plus by day (cards cast no real shadow) a lighter soft tail
 *  stretched AWAY from the sun, length ~1.6 m / tan(sun elevation), capped. Golden: world.ts casts real card shadows. */
const CONTACT: Record<"day" | "golden", [number, number, number]> = { day: [0.2, 0.21, 0.33], golden: [0.24, 0.2, 0.33] };
const TAIL: [number, number, number] = [0.42, 0.44, 0.62];
const toSrgb = (v: number) => { const c = clamp01(v); return c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055; };
const hexOf = (c: [number, number, number], k: number) => "#" + c.map((v) => Math.round(255 * toSrgb(1 - (1 - v) * k)).toString(16).padStart(2, "0")).join("");
const blob = (out: Stage, x: number, y: number, z: number, sc = 1, k = 1) => {
  const hl = Math.hypot(SUN.x, SUN.z) || 1, ox = -SUN.x / hl, oz = -SUN.z / hl, rot = Math.atan2(-ox, -oz);
  if (LNAME === "day") {
    const el = Math.asin(Math.min(0.99, Math.max(0.1, SUN.y)));
    const len = Math.min(2.4, Math.max(0.5, 1.6 / Math.tan(el))) * sc, h = len + 0.55 * sc, c = 0.3 * h; // feet at v = .2 of the card
    const tc = hexOf(TAIL, k);
    out.fx.push({ key: `blob|shadow|${tc}`, cw: 128, ch: 256, draw: (p) => fxShadow(p, tc), x: x + ox * c, y: y + 0.018, z: z + oz * c,
      w: 0.72 * sc, h, flat: true, rot });
  }
  const cc = hexOf(CONTACT[LNAME], k);
  out.fx.push({ key: `blob|contact|${cc}`, cw: 128, ch: 128, draw: (p) => fxContact(p, cc), x: x + ox * 0.03 * sc, y: y + 0.022, z: z + oz * 0.03 * sc,
    w: 0.52 * sc, h: 0.4 * sc, flat: true, rot });
};

// ---------------- Köpenick staging ----------------
export type Stage = { places: Place[]; fx: FxPlace[] };
const VC: Who = { i: 7, o: VOIGT_CAPT, okey: "vcapt" };
const VZ: Who = { i: 7, o: VOIGT_CIV, okey: "vciv" };
const sold = (i: number): Who => ({ i: i + 10, o: SOLDIER[vOf(i)], okey: `g${vOf(i)}` });
const folk = (i: number): Who => (i % 7 === 3 ? { i: i + 60, o: KID, okey: "kid" } : { i: i + 60, o: FOLK[i % 6], okey: `f${i % 6}` });
const isKid = (i: number) => i % 7 === 3;
const LEADF = 2; // frames a reaction lands before its word
const at = (t: number, f: number) => t * FPS >= f - LEADF;
const STEP = 1.6; // m per gait cycle (2 steps)

type Pose = { expr?: Expr; look?: number; prop?: Prop; tilt?: number; wave?: number; mode?: FrontOpts["mode"]; scale?: number };
/** someone walking from (x, z) along (dx, dz) at `speed` m/s (speed 0 = standing) */
const walker = (out: Stage, cam: CamInfo, t: number, who: Who, x: number, z: number, dx: number, dz: number, speed: number, p: Pose = {}, y = D0) => {
  const moving = speed > 0.05, phase = moving ? q(((t * speed) / STEP + hh(who.i, 5)) % 1, 120) : 0;
  const view = moving ? viewOf(cam, x, z, dx, dz) : { side: false, mirror: false, fs: 0 };
  const expr = p.expr ?? "neutral", blink = expr === "laugh" || expr === "grin" ? lidAt(t, who.i) * 0 : lidAt(t, who.i);
  const fo: FrontOpts = { phase, expr, mode: p.mode ?? (moving ? "march" : "stand"), look: p.look ?? 0, blink, lift: 45, prop: p.prop ?? null, tilt: p.tilt ?? 0, wave: p.wave };
  const so: SideOpts = { phase, expr, mode: moving ? "march" : "stand", blink, stomp: 0.8, stride: view.fs * (speed / 1.6) };
  const sc = p.scale ?? (who.o === KID ? 0.72 : 1);
  out.places.push(person(cam, who, x, y, z, view, fo, so, sc));
  blob(out, x, y, z, sc);
};
/** a squad of n soldiers in two files behind (or in front of) a point, all walking along (dx, dz) */
const squad = (out: Stage, cam: CamInfo, t: number, n: number, x0: number, z0: number, dx: number, dz: number, speed: number, p: (i: number) => Pose) => {
  for (let i = 0; i < n; i++) {
    const file = i % 2 ? 0.55 : -0.55, row = i >> 1;
    // files are across the walking direction, rows behind the leader point
    const x = x0 + -dz * file - dx * row * 1.3 + (hh(i, 1) - 0.5) * 0.06, z = z0 + dx * file - dz * row * 1.3 + (hh(i, 2) - 0.5) * 0.06;
    walker(out, cam, t, sold(i), x, z, dx, dz, speed, p(i));
  }
};
const coinFx = (p: Pen, u: number) => {
  for (let k = 0; k < 14; k++) {
    const a = (k / 14) * Math.PI * 2 + hh(k, 3), r = 60 + 200 * u * (0.6 + 0.4 * hh(k, 4)), x = 250 + Math.cos(a) * r, y = 250 + Math.sin(a) * r * 0.8 + 140 * u * u;
    const w = 26 * (0.4 + 0.6 * Math.abs(Math.cos(u * 9 + k)));
    p.ell(x, y, w, 26, k % 3 ? "#f2c94c" : "#e0a33a", 5);
  }
};
const uniformCard = (p: Pen) => {
  p.stroke([[150, 30], [150, 60]], 6, "#5a3b2a");
  p.stroke([[60, 80], [150, 55], [240, 80]], 8, "#5a3b2a");
  p.poly([[70, 85], [230, 85], [250, 330], [190, 340], [175, 160], [125, 160], [110, 340], [50, 330]], "#2c3f73", 6);
  p.poly([[110, 85], [190, 85], [185, 360], [115, 360]], "#2c3f73", 6);
  for (let i = 0; i < 6; i++) p.dot(150, 115 + i * 40, 7, "#e8c45a");
  p.poly([[112, 85], [188, 85], [180, 105], [120, 105]], "#c0353a", 4);
  p.poly([[60, 300], [100, 300], [100, 330], [60, 330]], "#c0353a", 4);
  p.poly([[200, 300], [240, 300], [240, 330], [200, 330]], "#c0353a", 4);
};
const sparkle = (out: Stage, t: number, f0: number, x: number, y: number, z: number, s = 1.6, col = "#fff3b0") => {
  const u = (t * FPS - f0) / 9;
  if (u >= 0 && u < 1) out.fx.push({ key: `burst${col}${q(u, 30)}`, cw: 500, ch: 500, draw: (p) => fxBurst(p, q(u, 30), col), x, y, z, w: s, h: s });
};

const crowd = (out: Stage, cam: CamInfo, t: number, spots: [number, number][], pose: (i: number) => Pose, base = 0) =>
  spots.forEach(([x, z], i) => walker(out, cam, t, folk(i + base), x, z, 0, 1, 0, pose(i)));

const shot1 = (out: Stage, cam: CamInfo, t: number) => {
  const z = hookZ(t), moving = t < 4.6, sp = moving ? 1.1 : 0;
  const raise = smooth((t * FPS - 148) / 5);
  walker(out, cam, t, VC, 0, z, 0, 1, sp, { expr: at(t, 135) ? "grin" : "stern", prop: at(t, 146) ? ["saber", q(raise, 20)] : null });
  squad(out, cam, t, 10, 0, z - 1.7, 0, 1, sp, (i) => ({ expr: i % 3 ? "stern" : "neutral" }));
  crowd(out, cam, t, [[-6.5, -40], [-7.6, -38.6], [6.4, -39.5], [7.8, -41], [-8.8, -42.4], [8.9, -37.8]],
    (i) => ({ expr: at(t, 150) ? (i % 2 ? "shock" : "nervous") : "neutral", look: i % 2 ? 1 : -1 }));
};
const shot2 = (out: Stage, cam: CamInfo, t: number, f: number) => {
  if (f < 262) {
    for (let i = 0; i < 14; i++) {
      const dir = i % 2 ? 1 : -1, x = (i % 4 < 2 ? -1 : 1) * (4.2 + hh(i) * 1.6), z = 20 + ((hh(i, 2) * 90 + dir * 1.1 * (t - 6)) % 90 + 90) % 90;
      walker(out, cam, t, folk(i), x, z, 0, dir, 1.1);
    }
    squad(out, cam, t, 4, 0.8, 30 + 1.4 * (t - 6), 0, 1, 1.4, () => ({ expr: "stern" }));
    return;
  }
  const bow = smooth((f - 268) / 10);
  walker(out, cam, t, sold(1), -0.6, 29.6 + 0.6 * (t - 8.7), 0, 1, 0.6, { expr: at(t, 304) ? "smile_closed" : "stern" });
  walker(out, cam, t, folk(0), -1.7, 31.8, 0, 1, 0, { expr: "nervous", tilt: -20 * bow, look: 1 });
  walker(out, cam, t, folk(1), 0.7, 32.4, 0, 1, 0, { expr: "nervous", tilt: 20 * bow, look: -1 });
  walker(out, cam, t, folk(4), 1.5, 30.0, 0, 1, 0, { expr: "smile", tilt: 14 * bow, look: -1 });
};
const shot3 = (out: Stage, cam: CamInfo, t: number, f: number) => {
  const [sx, , sz] = STALL;
  walker(out, cam, t, folk(5), sx - 0.7, sz - 0.9, 0, 1, 0, { expr: "smile", scale: 0.97 }); // the dealer behind the table
  if (f < 401) {
    walker(out, cam, t, VZ, sx + 1.6, sz + 0.4, 0, 1, 0, { expr: at(t, 373) ? "smile" : "neutral", look: -1 });
    out.fx.push({ key: "uniformCard", cw: 300, ch: 380, draw: uniformCard, x: sx + 0.9, y: 1.55, z: sz + 1.55, w: 0.86, h: 1.09 });
  } else {
    walker(out, cam, t, VC, sx + 1.8, sz + 0.5, 0, 1, 0, { expr: "grin", prop: "salute" });
    sparkle(out, t, 401, sx + 1.8, 1.4, sz + 0.6, 2.4);
  }
};
const shot4 = (out: Stage, cam: CamInfo, t: number, f: number) => {
  const front = Math.max(22.6, 30 - 1.4 * (t - 14.6)), stop = front <= 22.6, raise = smooth((f - 539) / 5);
  squad(out, cam, t, 10, 0, front, 0, -1, stop ? 0 : 1.4, (i) => ({ expr: at(t, 542) && i % 2 ? "shock" : "neutral" }));
  walker(out, cam, t, VC, 0.1, 20.4, 0, 1, 0, { expr: at(t, 528) ? "grin" : "stern", prop: f >= 537 ? ["saber", q(raise, 20)] : "point" });
};
const shot5 = (out: Stage, cam: CamInfo, t: number) => {
  const z = followZ(t);
  walker(out, cam, t, VC, -1.25, z + 0.4, 0, 1, 1.4, { expr: "smile_closed", prop: ["saber", 1] });
  squad(out, cam, t, 10, 0, z - 1.6, 0, 1, 1.4, (i) => ({ expr: i % 4 === 1 ? "smile" : "neutral" }));
};
const shot6 = (out: Stage, t: number, trainX: number, railZ: number) => {
  for (let n = 0; n < 6; n++) {
    const age = ((t * 1.4 + n / 6) % 1);
    out.fx.push({ key: `puff${q(age, 20)}`, cw: 300, ch: 300, draw: (p) => fxPuff(p, q(age, 20)), soft: true,
      x: trainX - 1.6 - age * 7, y: 4.4 + age * 2.4, z: railZ, w: 1.2 + age * 2.6, h: 1.2 + age * 2.6 });
  }
};
const shot7 = (out: Stage, cam: CamInfo, t: number, f: number) => {
  const R = RATHAUS_Z;
  if (f < 772) {
    const z = Math.max(R + 3, -35 - 1.4 * (t - 24.2));
    walker(out, cam, t, VC, 0, z, 0, -1, z > R + 3 ? 1.4 : 0, { expr: "stern" });
    squad(out, cam, t, 10, 0, z + 1.6, 0, -1, z > R + 3 ? 1.4 : 0, () => ({ expr: "neutral" }));
    return;
  }
  if (f < 826) {
    walker(out, cam, t, { i: 30, o: MAYOR, okey: "mayor" }, -0.2, R + 3.6, 0, 1, 0, { expr: "shock" });
    walker(out, cam, t, sold(0), -1.3, R + 3.4, 0, 1, 0, { expr: "stern" });
    walker(out, cam, t, sold(3), 0.9, R + 3.3, 0, 1, 0, { expr: "stern" });
    walker(out, cam, t, VC, 1.7, R + 4.2, 0, 1, 0, { expr: "stern", prop: "point", look: -1, mode: "stand" });
    return;
  }
  walker(out, cam, t, VC, 0.7, R + 4.0, 0, 1, 0, { expr: "grin", prop: "cashbox" });
  walker(out, cam, t, folk(8), 2.2, R + 2.6, 0, 1, 0, { expr: "nervous", look: -1 });
  walker(out, cam, t, { i: 30, o: MAYOR, okey: "mayor" }, -1.5, R + 2.2, 0, 1, 0, { expr: "pained" });
  sparkle(out, t, 829, 0.7, 1.15, R + 4.3, 1.1, "#ffe08a");
};
const shot8 = (out: Stage, cam: CamInfo, t: number, f: number) => {
  const R = RATHAUS_Z;
  walker(out, cam, t, VC, 0.6, R + 4.2, 0, 1, 0, f < 918 ? { expr: "smile", prop: "bag" } : { expr: "neutral", prop: "paper" });
  walker(out, cam, t, { i: 30, o: MAYOR, okey: "mayor" }, -1.6, R + 2.4, 0, 1, 0, { expr: "dazed" });
  const u = (f - 871) / 16;
  if (u >= 0 && u < 1) out.fx.push({ key: `coins${q(u, 30)}`, cw: 500, ch: 500, draw: (p) => coinFx(p, q(u, 30)), x: 0.6, y: 1.3, z: R + 4.4, w: 1.5, h: 1.5 });
  if (f >= 918) sparkle(out, t, 919, 0.6, 1.3, R + 4.4, 0.8, "#ffffff");
};
const shot9 = (out: Stage, cam: CamInfo, t: number, id: number) => {
  const x = paradeX(t, id), dir = id === 9 ? 1 : -1;
  walker(out, cam, t, VC, x, -40, dir, 0, 1.2, { expr: "smile_closed" });
  for (let i = 0; i < 7; i++) {
    const bx = -9 + i * 2.3 + (hh(i, 6) - 0.5) * 0.6, bz = -42.6 - (i % 2) * 0.7;
    const near = 1 - smooth((Math.abs(bx - x) - 1.2) / 2.2);
    walker(out, cam, t, folk(i + 10), bx, bz, 0, 1, 0, { expr: near > 0.5 ? "nervous" : "smile", tilt: (bx < x ? -1 : 1) * -22 * near * (isKid(i + 10) ? 0.5 : 1), look: bx < x ? 1 : -1 });
  }
};
const shot11 = (out: Stage, cam: CamInfo, t: number, f: number) => {
  const [ax, , az] = AMPEL;
  const wx = Math.min(ax - 1.4, -0.4 + 1.4 * (t - 38.5)), going = wx < ax - 1.4;
  walker(out, cam, t, folk(2), wx, az + 1.1, 1, 0, going ? 1.4 : 0, { expr: going ? "neutral" : at(t, 1270) ? "nervous" : "smile_closed" });
  const w2 = Math.min(ax - 2.3, -2.6 + 1.3 * (t - 38.5));
  walker(out, cam, t, folk(9), w2, az + 2.0, 1, 0, w2 < ax - 2.3 ? 1.3 : 0, { expr: "neutral" });
  if (f >= 1268) walker(out, cam, t, VC, ax + 0.75, az + 0.5, 0, 1, 0, { expr: "grin", look: -1, prop: "salute" });
};
const shot12 = (out: Stage, cam: CamInfo, t: number, f: number) => {
  if (f < 1397) {
    const z = arrestZ(t);
    walker(out, cam, t, VZ, 0, z, 0, 1, 1.0, { expr: at(t, 1382) ? "shock" : "nervous" });
    for (const s of [-1, 1]) walker(out, cam, t, { i: s > 0 ? 40 : 41, o: POLICE, okey: "pol" }, s * 1.0, z - 0.2, 0, 1, 1.0, { expr: "stern" });
    return;
  }
  if (f < 1441) {
    const spots: [number, number][] = [];
    for (let i = 0; i < 12; i++) spots.push([-5.5 + (i % 6) * 1.9 + (hh(i, 8) - 0.5) * 0.7, -35.6 - (i >> 1 & 2 ? 2.2 : 0) - (i >= 6 ? 2.3 : 0) + hh(i, 9) * 0.5]);
    crowd(out, cam, t, spots, (i) => ({ expr: i % 3 === 1 ? "grin" : "laugh", tilt: 6 * Math.sin(t * 9 + i), wave: i % 4 === 2 ? q(Math.sin(t * 8 + i), 20) : undefined }));
    return;
  }
  walker(out, cam, t, { i: 50, o: KAISER, okey: "kaiser" }, PODIUM[0], PODIUM[2], 0, 1, 0,
    { expr: at(t, 1458) ? "grin" : "laugh", tilt: at(t, 1458) ? 0 : 5 * Math.sin(t * 10), wave: at(t, 1458) ? q(Math.sin(t * 7), 20) : undefined }, PODIUM[1] + 1.0);
  for (const s of [-1, 1]) walker(out, cam, t, sold(s > 0 ? 5 : 6), PODIUM[0] + s * 2.4, PODIUM[2] + 0.4, 0, 1, 0, { expr: "stern" });
};
const shot13 = (out: Stage, cam: CamInfo, t: number, f: number) => {
  const [cx, , cz] = COUNTER;
  const p: Pose = f < 1587 ? { expr: "smile", look: -1 } : f < 1600 ? { expr: "nervous", look: -1 } : { expr: "dazed", prop: "shrug" };
  walker(out, cam, t, VC, cx + 0.95, cz + 1.1, 0, 1, 0, p);
  if (f >= 1640) squad(out, cam, t, 6, 4, -48, 0, 1, 0, () => ({ expr: "neutral" }));
};

/** everything with a face in shot `id` at time t */
export const stage = (id: number, t: number, cam: CamInfo, extra: { trainX: number; railZ: number }): Stage => {
  const out: Stage = { places: [], fx: [] };
  const s = SHOTS[id - 1], f = Math.round(t * FPS);
  LNAME = s.light;
  findSun(cam, SUN);
  if (id === 1) shot1(out, cam, t);
  if (id === 2) shot2(out, cam, t, f);
  if (id === 3) shot3(out, cam, t, f);
  if (id === 4) shot4(out, cam, t, f);
  if (id === 5) shot5(out, cam, t);
  if (id === 6) shot6(out, t, extra.trainX, extra.railZ);
  if (id === 7) shot7(out, cam, t, f);
  if (id === 8) shot8(out, cam, t, f);
  if (id === 9 || id === 10) shot9(out, cam, t, id);
  if (id === 11) shot11(out, cam, t, f);
  if (id === 12) shot12(out, cam, t, f);
  if (id === 13) shot13(out, cam, t, f);
  return out;
};
export { FPS, clamp01, fxStars };
