// Style test for the full-3D look: the first 13 seconds of "Das Geld auf dem Meeresgrund".
import * as THREE from "three";
import { makeShort3, Built, Def3, push, Mood, V3, Cam, lerp, sm } from "../../engine3d/Short3D";
import { Person, Look } from "../../engine3d/toon3d";
import { palm, hut, stoneWheel, rock, water, seaweed, fish, bush, island, ground, rng } from "../../engine3d/props";
import words from "../../../videos/geld/voice/words.json";

const DAY: Mood = { sky: ["#3f8fd0", "#cfe6f0"], fog: ["#cfe4ec", 40, 260], sun: [0.55, 0.75, 0.6], sunCol: "#ffe6c4", sunK: 3.4, hemi: ["#bcd8f2", "#b89a6a", 0.95], shadowR: 12, exposure: 1.05 };
const AERIAL: Mood = { ...DAY, fog: ["#cfe4ec", 60, 420], shadowR: 40 };
const SEA: Mood = { sky: ["#1f7f95", "#0f4f63"], fog: ["#1d7a8c", 1, 20], sun: [0.2, 1, 0.3], sunCol: "#bff4ff", sunK: 2.0, hemi: ["#7fdbe6", "#1d4f5a", 1.4], shadowR: 8, exposure: 1.1 };

const islander = (o: Partial<Look>): Look => ({ skin: "#b07850", coat: "#e07a3a", pants: "#5a3a2a", shoes: "#4a3022", hair: "#231a16", hairStyle: "short", glove: "#b07850", ...o });
const CAST = {
  traderA: islander({ coat: "#3a8a9a", hat: "straw", hatCol: "#d8bd7a", band: "#8a3a2a", moustache: "#231a16", collar: "#f2e6cc" }),
  traderB: islander({ coat: "#e0a03a", skin: "#8f5a38", glove: "#8f5a38", beard: "#2a1f1a", girth: 1.15 }),
  elder: islander({ coat: "#c2453f", skin: "#8f5a38", glove: "#8f5a38", hair: "#e8e4dc", beard: "#e8e4dc", hairStyle: "short" }),
  woman: islander({ coat: "#d65a7a", dress: true, hairStyle: "bun", skin: "#c08a60", glove: "#c08a60" }),
  kid: islander({ coat: "#f2c24a", kid: true, skin: "#b07850" }),
  fisher: islander({ coat: "#5a8f3a", hat: "cap", hatCol: "#e8dcc0" }),
  man3: islander({ coat: "#7a5aa8", skin: "#c99067", glove: "#c99067", moustache: "#2a1f1a" }),
  woman2: islander({ coat: "#3a6ab0", dress: true, hairStyle: "long", skin: "#8f5a38", glove: "#8f5a38" }),
};

const SEA_O: V3 = [1000, 0, 0];

const build = (): Record<string, Built> => {
  // ---------------- village on the beach ----------------
  const v = new THREE.Group(), r = rng(7);
  v.add(ground(160, 80, "#e8d3a2", ["#d9c08a", "#f2e2bc", "#cfb27a"], "sand", 30));
  v.children[0].position.z = 26;
  const grass = ground(70, 30, "#7fae4f", ["#6a9a40", "#93c25e", "#5f8f3a"], "grass", 14, 0.01); grass.position.z = 24; v.add(grass);
  const sea = water(500, 300, "#3fb0c2", 90); sea.position.set(0, -0.12, -150); v.add(sea);
  const sways: ((t: number) => void)[] = [];
  const P = (o: THREE.Object3D, x: number, z: number, ry = 0) => { o.position.set(x, 0, z); o.rotation.y += ry; v.add(o); if (o.userData.sway) sways.push(o.userData.sway); return o; };
  // huts
  [[-11, 17], [-5, 19], [1, 17.5], [7, 19.5], [13, 17], [-16, 21], [18, 21]].forEach(([x, z], i) => P(hut(3 + r(), 2.6 + r() * 0.5, i + 3, ["#c9a46a", "#bf9a5e", "#d4b07a"][i % 3]), x, z));
  // palms
  for (let i = 0; i < 26; i++) { const x = -26 + i * 2.1 + r() * 1.5, z = i % 3 === 0 ? -9 + r() * 2 : 11.5 + r() * 13; if (z < 0 && x > -10 && x < 12) continue; P(palm(4.5 + r() * 2.5, (r() - 0.5) * 0.3, i + 11), x, z, r() * 6); }
  for (let i = 0; i < 18; i++) P(bush(0.6 + r() * 0.5, i + 40), -24 + r() * 48, 12 + r() * 12);
  for (let i = 0; i < 10; i++) { const o = rock(0.25 + r() * 0.4, i + 70); o.position.set(-20 + r() * 40, 0.05, -9 + r() * 4); v.add(o); }
  // stone money row (faces +z) and the giant stone
  const ROW: [number, number][] = [[-8, 0.75], [-6.2, 1.1], [-4.1, 0.6], [-2.6, 1.3], [-0.2, 0.9], [2.1, 1.45], [4.4, 0.7], [6.0, 1.15]];
  ROW.forEach(([x, R], i) => P(stoneWheel(R, i + 21, (r() - 0.5) * 0.06), x, 8.4 + r() * 0.3, (r() - 0.5) * 0.25));
  P(stoneWheel(1.9, 99), 10.4, 9.0, -0.2);
  // distant islands
  [[-90, -220, 60, 14], [120, -260, 80, 18], [30, -320, 50, 10]].forEach(([x, z, w, h], i) => { const o = island(w, h, i + 5); o.position.set(x, -0.5, z); v.add(o); });
  // people
  const ppl: { p: Person; f: (t: number) => void }[] = [];
  const add = (L: Look, seed: number, f: (p: Person, t: number) => void) => { const p = new Person(L, seed); v.add(p.root); ppl.push({ p, f: (t) => f(p, t) }); };
  // traders (shot 3)
  add(CAST.traderA, 1, (p, t) => { p.root.position.set(1.6, 0, 3.7); p.pose(t, { yaw: 2.3, expr: "talk", talk: t > 4.4 && t < 6.6, point: t > 4.3 ? sm((t - 4.3) / 0.3) : 0, headYaw: t > 4.3 && t < 5.2 ? 0.7 : 0 }); });
  add(CAST.traderB, 2, (p, t) => { p.root.position.set(2.6, 0, 3.7); p.pose(t, { yaw: -2.3, expr: t > 5.6 ? "grin" : "smile", headTilt: t > 5.6 ? Math.sin(t * 8) * 0.08 : 0 }); });
  // walkers across the path (x direction)
  const walkers: [Look, number, number, number, number][] = [[CAST.woman, 5.6, -14, 0.9, 3], [CAST.kid, 5.3, -11, 1.25, 4], [CAST.fisher, 6.4, 14, -0.85, 5], [CAST.man3, 7.2, 18, -0.95, 6], [CAST.woman2, 6.9, -20, 0.8, 7], [CAST.elder, 5.9, -4, 0.55, 8]];
  walkers.forEach(([L, z, x0, sp, sd]) => add(L, sd, (p, t) => { const d = sp * t; p.root.position.set(x0 + d, 0, z); p.pose(t, { yaw: sp > 0 ? Math.PI / 2 : -Math.PI / 2, walk: Math.abs(d), expr: "smile" }); }));
  add(CAST.man3, 12, (p, t) => { const d = 0.9 * (t - 6.5); p.root.position.set(-3.4, 0, 13 - d); p.pose(t, { yaw: Math.PI, walk: d, expr: "smile" }); });
  add(CAST.kid, 13, (p, t) => { const d = 1.5 * (t - 6.5); p.root.position.set(-2.2, 0, 14 - d); p.pose(t, { yaw: Math.PI - 0.1, walk: d, expr: "grin", bounce: 0.02 }); });
  add(CAST.woman2, 14, (p, t) => { p.root.position.set(-1.3, 0, 7.3); p.pose(t, { yaw: Math.PI - 0.4, expr: "smile", armL: 0.5 }); });
  add(CAST.fisher, 15, (p, t) => { p.root.position.set(-4.6, 0, 7.0); p.pose(t, { yaw: Math.PI + 0.5, expr: "talk", talk: true }); });
  // chatting group by the huts
  add(CAST.elder, 9, (p, t) => { p.root.position.set(-6.5, 0, 12.5); p.pose(t, { yaw: 0.6, expr: "talk", talk: Math.sin(t * 0.8) > 0 }); });
  add(CAST.traderB, 10, (p, t) => { p.root.position.set(-5.4, 0, 12.8); p.pose(t, { yaw: -0.9, expr: "grin" }); });
  // the small man next to the giant stone (shot 6)
  add(CAST.fisher, 11, (p, t) => { p.root.position.set(9.5, 0, 7.0); p.pose(t, { yaw: Math.PI - 0.35, expr: t > 11.3 ? "shock" : "smile", headTilt: -0.4 * sm((t - 11.1) / 0.4), headYaw: 0 }); });
  const village: Built = { root: v, mood: DAY, center: [0, 0, 0], update: (_f, t) => { sways.forEach((s) => s(t)); (sea.userData.wave as (t: number) => void)(t); ppl.forEach((q) => q.f(t)); } };

  // ---------------- sea floor ----------------
  const s = new THREE.Group(); s.position.set(...SEA_O);
  s.add(ground(120, 120, "#d8c99a", ["#c2b07c", "#e8dcb4", "#b8a674"], "seabed", 20));
  const sw: ((t: number) => void)[] = [];
  const big = stoneWheel(1.3, 55, 0); big.position.set(0, 0.25, 0.4); big.rotation.set(-1.25, 0.5, 0); s.add(big);
  const r2 = rng(3);
  for (let i = 0; i < 34; i++) { const o = seaweed(0.8 + r2() * 1.6, i); const a = r2() * 6.28, d = 2.2 + r2() * 9; const x = Math.cos(a) * d, z = Math.sin(a) * d - 1; if (x > 0.5 && z > 1) continue; o.position.set(x, 0, z); s.add(o); sw.push(o.userData.sway); }
  for (let i = 0; i < 22; i++) { const o = rock(0.2 + r2() * 0.7, i + 300, i % 2 ? "#6f7a72" : "#8a8a7a"); const a = r2() * 6.28, d = 2 + r2() * 10; o.position.set(Math.cos(a) * d, 0, Math.sin(a) * d - 2); s.add(o); }
  const fishes = Array.from({ length: 14 }, (_, i) => { const o = fish(["#f2a03a", "#e05a5a", "#f2d24a", "#5ac2e0"][i % 4], 0.8 + (i % 3) * 0.3); s.add(o); return o; });
  // light shafts
  const ray = new THREE.MeshBasicMaterial({ color: "#d8fbff", transparent: true, opacity: 0.08, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false });
  const shafts = Array.from({ length: 7 }, (_, i) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(0.9 + (i % 3) * 0.5, 16), ray); m.position.set(-5 + i * 1.8, 7, -3 - (i % 2) * 2); m.rotation.z = 0.25; s.add(m); return m; });
  const bubbles = Array.from({ length: 24 }, (_, i) => { const m = new THREE.Mesh(new THREE.SphereGeometry(0.03 + (i % 4) * 0.012, 10, 8), new THREE.MeshStandardMaterial({ color: "#e8ffff", transparent: true, opacity: 0.55, roughness: 0.1 })); s.add(m); return m; });
  const seaB: Built = {
    root: s, mood: SEA, center: SEA_O, update: (_f, t) => {
      sw.forEach((f) => f(t));
      fishes.forEach((o, i) => { const a = t * (0.25 + (i % 4) * 0.06) + i * 0.9, R = 2.6 + (i % 5) * 0.9; o.position.set(Math.cos(a) * R, 0.6 + (i % 4) * 0.45 + Math.sin(t * 2 + i) * 0.1, Math.sin(a) * R * 0.6 - 1); o.rotation.y = -a - Math.PI / 2 * (1); (o.userData.tail as THREE.Object3D).rotation.y = Math.sin(t * 12 + i) * 0.5; });
      shafts.forEach((m, i) => { (m.material as THREE.MeshBasicMaterial).opacity = 0.06 + 0.04 * Math.sin(t * 0.8 + i * 1.3); });
      bubbles.forEach((b, i) => { const y = ((t * 0.5 + i * 0.37) % 6); b.position.set(-1.2 + (i % 6) * 0.5 + Math.sin(t * 3 + i) * 0.05, y, -0.5 + (i % 3) * 0.4); });
    },
  };
  return { village, sea: seaB };
};

const S = (x: number, y: number, z: number): V3 => [SEA_O[0] + x, SEA_O[1] + y, SEA_O[2] + z];
const def: Def3 = {
  build,
  total: 400,
  words: (words as { words: { w: string; s: number; e: number }[] }).words.filter((w) => w.s < 13.3),
  shots: [
    { a: 0, b: 64, set: "village", cam: (f) => { const u = f / 64; return { pos: [lerp(-34, -26, u), lerp(30, 24, u), lerp(-58, -48, u)], look: [0, 0, 12], fov: 36 }; } },
    { a: 64, b: 124, set: "sea", whip: 1, cam: push(S(4.2, 2.0, 5.2), S(0, 0.5, 0), S(3.2, 1.6, 4.0), S(0, 0.5, 0), 64, 124, 42) },
    { a: 124, b: 216, set: "village", whip: -1, cam: push([2.1, 1.3, -0.9], [2.1, 1.05, 3.7], [2.1, 1.25, -0.2], [2.1, 1.05, 3.7], 124, 216, 40) },
    { a: 216, b: 268, set: "village", whip: 1, cam: push([-7, 1.4, -3.5], [-2, 1.6, 12], [-5.5, 1.4, -3.2], [-0.5, 1.6, 12], 216, 268, 44) },
    { a: 268, b: 325, set: "village", whip: 1, cam: (f) => { const u = (f - 268) / 57; return { pos: [lerp(-7, 1.5, u), 1.25, 2.2], look: [lerp(-6.2, 2.3, u), 1.1, 8.4], fov: 42 }; } },
    { a: 325, b: 400, set: "village", whip: -1, cam: push([9.3, 0.45, 2.9], [10.0, 1.75, 9.0], [9.35, 0.45, 3.5], [10.0, 1.9, 9.0], 325, 400, 46) },
  ],
};
export const STYLE_FRAMES = def.total;
export const StyleTest = makeShort3(def);
