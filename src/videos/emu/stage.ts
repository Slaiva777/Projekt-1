// Characters, emus and effects for "Der Emu-Krieg" (our own designs).
import { Pen, Outfit, Expr, emu, fxBurst, fxPuff } from "../../engine/toon";
import { Stage, CamInfo, walker, Who, Pose, hh, q, sparkle, fxAnim, tier, light2D, blob, FPS, V3 } from "../../engine/core";
import { Life } from "../../engine/world";
import { crowdWho } from "../../engine/people";
import { FIELD, FARM, MOUND, FENCE_Z, ROAD_Z, truckAt } from "./story";

const KHAKI = (o: Partial<Outfit>): Outfit => ({ jacket: "#8a7a50", pants: "#6a5a3a", boots: "#3b2a20", hat: "slouch", hatCol: "#7a6a48", skin: "#f2cfb0", ...o });
const MAJOR: Who = { i: 1, o: KHAKI({ jacket: "#7a6a48", moustache: "#8a5a34", build: "stout", belt: "#5a3b2a" }), okey: "major" };
const SOLD: Who[] = [{ i: 2, o: KHAKI({ moustache: "#2b211c" }), okey: "s1" }, { i: 3, o: KHAKI({ skin: "#e0ac7e", hair: "#2b211c" }), okey: "s2" }];
const FARMER: Who = { i: 4, o: { jacket: "#5a7a9a", pants: "#3f5a7a", boots: "#3b2a20", hat: "straw", beard: "#8a5a34", skin: "#f2c09a" }, okey: "farmer" };
const WIFE: Who = { i: 5, o: { jacket: "#c2a27a", dress: "#9ab07a", pants: "#3b3f52", boots: "#3b2a20", hat: "bun", hair: "#c99a5a", apron: "#f3ecd8", skin: "#f5c9a0" }, okey: "wife" };
const FKID: Who = { i: 6, o: { jacket: "#c2453f", pants: "#3f5a7a", boots: "#3b2a20", hat: "straw", build: "kid", skin: "#f5c9a0" }, okey: "fkid" };
const REPORTER = (i: number): Who => ({ i: 7 + i, o: { jacket: ["#4a4552", "#6a5a4a", "#3f4f6f"][i], pants: "#3b3f52", boots: "#241726", hat: (["bowler", "straw", "cap"] as const)[i], cap: "#4b4a52", glasses: i === 1, moustache: i === 0 ? "#2b211c" : undefined }, okey: `rep${i}` });
const at = (f: number, g: number) => f >= g - 2;

/** an emu card: (x, z) on the ground, moving along (dx, dz) at speed (0 = standing / pecking) */
const emuAt = (out: Stage, cam: CamInfo, t: number, i: number, x: number, z: number, dx: number, dz: number, speed: number, mood: "calm" | "alarm" | "smug", peck = -1, y = 0, scale = 1) => {
  const d = cam.pos.distanceTo({ x, y: y + 1.1, z } as never) / scale, [w, h, k] = tier(d);
  const run = speed > 0.1 ? Math.min(1, speed / 9) : 0, phase = q(((t * (speed > 0.1 ? 1.2 + speed * 0.18 : 0)) + hh(i, 3)) % 1, 24);
  const pk = peck >= 0 ? peck : speed > 0.1 ? 0 : q(Math.max(0, Math.sin(t * 2.2 + hh(i, 4) * 6)) ** 3, 6);
  const mirror = (dx || 1) * cam.right.x + dz * cam.right.z < 0;
  const light = light2D(cam, mirror);
  out.places.push({ key: `emu|${phase}|${q(run, 6)}|${pk}|${mood}|${q(light, 4)}|${(i % 5) + 1}`, x, y, z, scale, mirror, size: [w, h, k], draw: (p) => emu(p, phase, run, pk, mood, light, (i % 5) + 1) });
  blob(out, x, y, z, scale * 1.2);
};
/** the herd: n emus around (cx, cz) within radius; mode graze / scatter (from t0) / run (along +x) / smug */
const herd = (out: Stage, cam: CamInfo, t: number, n: number, cx: number, cz: number, rad: number, mode: "graze" | "scatter" | "run" | "smug", t0 = 0, base = 100) => {
  for (let k = 0; k < n; k++) {
    const a = hh(k + base, 1) * Math.PI * 2, r0 = Math.sqrt(hh(k + base, 2)) * rad;
    let x = cx + Math.cos(a) * r0, z = cz + Math.sin(a) * r0, dx = Math.cos(a), dz = Math.sin(a), sp = 0;
    if (mode === "graze") { x += Math.sin(t * 0.3 + k) * 0.6; sp = 0; }
    if (mode === "scatter" && t > t0) { sp = 8 + 4 * hh(k, 5); const s = sp * (t - t0) * Math.min(1, (t - t0) * 2); x += dx * s; z += dz * s; }
    if (mode === "run") { dx = 1; dz = 0.15 * Math.sin(k); sp = 13.9; x += 13.9 * (t - 37.8) + (hh(k, 6) - 0.5) * 6; }
    emuAt(out, cam, t, k + base, x, z, dx, dz, sp, mode === "smug" ? "smug" : sp > 0 ? "alarm" : "calm", mode === "smug" ? 0 : -1);
  }
};
const kmh = (p: Pen) => { p.poly([[10, 10], [390, 10], [390, 190], [10, 190]], "#f3ecd8", 8); p.g.fillStyle = "#241726"; p.g.font = "bold 110px sans-serif"; p.g.textAlign = "center"; p.g.fillText("50 km/h", 200, 140); };
const speedLines = (p: Pen) => { for (let k = 0; k < 7; k++) p.stroke([[10, 20 + k * 26], [180 - (k % 3) * 40, 20 + k * 26]], 6, "rgba(255,255,255,0.85)"); };
const bang = (p: Pen) => { p.g.fillStyle = "#d8322e"; p.g.font = "bold 200px sans-serif"; p.g.textAlign = "center"; p.g.fillText("!", 100, 190); };
const medal = (p: Pen) => { p.poly([[70, 0], [130, 0], [120, 110], [80, 110]], "#3f6fb5", 5); p.poly([[100, 0], [130, 0], [120, 110], [100, 110]], "#d8322e", 0); p.ell(100, 160, 60, 60, "#f2c94c", 7); p.ell(100, 160, 38, 38, null, 5); };
const mapCard = (p: Pen) => { p.poly([[10, 10], [390, 10], [390, 290], [10, 290]], "#e9dcb8", 7); p.stroke([[40, 250], [140, 160], [220, 200], [350, 60]], 6, "#8a5a34"); p.stroke([[300, 80], [350, 60], [330, 110]], 6, "#d8322e"); for (let k = 0; k < 6; k++) p.ell(80 + k * 45, 100 + (k % 2) * 30, 9, 9, "#5a3b2a", 3); };

export const stage = (id: number, t: number, f: number, cam: CamInfo, out: Stage) => {
  const W = (who: Who, x: number, z: number, p: Pose = {}, y = 0) => walker(out, cam, t, who, x, z, 0, 1, 0, p, y);
  const card = (key: string, draw: (p: Pen) => void, x: number, y: number, z: number, w: number, h: number, cw = 400, ch = 400, soft = false) => out.fx.push({ key, cw, ch, draw, x, y, z, w, h, soft });
  const [fx0, , fz0] = FIELD;
  const onTruck = (who: Who, dx: number, dz: number, p: Pose) => { const tr = truckAt(id, t), c = Math.cos(tr.yaw), s = Math.sin(tr.yaw); walker(out, cam, t, who, tr.x + dx * c + dz * s, tr.z - dx * s + dz * c, 0, 1, 0, { mode: "sit", noBlob: true, ...p }, 1.0 + tr.bump * 0.1 * Math.abs(Math.sin(t * 7.3))); };
  if (id === 1) {
    emuAt(out, cam, t, 1, fx0 - 1.4, fz0 + 3.2, -1, 0, 0, "smug", 0);
    emuAt(out, cam, t, 2, fx0 + 0.6, fz0 + 2.4, 1, 0, 0, "smug", 0);
    emuAt(out, cam, t, 3, fx0 + 2.0, fz0 + 3.5, -1, 0, 0, at(f, 125) ? "smug" : "calm");
    W(MAJOR, fx0 + 3.6, fz0 + 6.2, { expr: "dazed", look: -1 }); W(SOLD[0], fx0 + 4.5, fz0 + 6.8, { expr: "pained", look: -1 }); W(SOLD[1], fx0 + 2.7, fz0 + 7.0, { expr: "nervous", look: -1 });
    herd(out, cam, t, 14, fx0, fz0 - 9, 8, "graze", 0, 300);
  }
  if (id === 2) {
    if (f < 262) herd(out, cam, t, 90, fx0, fz0 - 4, 40, "graze", 0, 400);
    else if (f < 322) herd(out, cam, t, 40, fx0, fz0 - 3, 12, "graze", 0, 500);
    else { herd(out, cam, t, 8, fx0 + 0.5, fz0 - 0.5, 3, "graze", 0, 600); for (let k = 0; k < 6; k++) { const u = ((t * 1.3 + k / 6) % 1); card(`grain${q(u, 8)}`, (p) => fxPuff(p, q(u, 8)), fx0 + 0.4 + Math.cos(k) * 0.8, 0.9 + u * 0.6, fz0 + 1.2, 0.4, 0.4, 300, 300, true); } }
  }
  if (id === 3) {
    if (f < 457) {
      W(FARMER, FARM[0] - 1.2, FARM[2] - 5.0, { expr: at(f, 429) ? "shock" : "stern", prop: at(f, 424) ? "arms_up" : null });
      W(WIFE, FARM[0] + 0.2, FARM[2] - 5.4, { expr: "nervous", look: -1 }); W(FKID, FARM[0] - 0.4, FARM[2] - 4.0, { expr: "nervous" });
      herd(out, cam, t, 6, FARM[0] - 6, FARM[2] - 14, 4, "graze", 0, 700);
    } else { onTruck(MAJOR, 0.2, 0.5, { expr: "grin", prop: "salute" }); onTruck(SOLD[0], -1.6, -0.4, { expr: "smile" }); onTruck(SOLD[1], -2.6, 0.4, { expr: "grin" }); }
  }
  if (id === 4) {
    W(MAJOR, -13.2, ROAD_Z + 3.0, { expr: "grin", prop: "salute" }); W(SOLD[0], -14.4, ROAD_Z + 3.2, { expr: "stern", prop: "salute" }); W(SOLD[1], -15.6, ROAD_Z + 3.0, { expr: "smile_closed", prop: "salute" });
    sparkle(out, t, 572, -16.2, 2.0, ROAD_Z + 0.3, 1.2); sparkle(out, t, 612, -18.6, 1.3, ROAD_Z + 0.8, 1.2);
  }
  if (id === 5) {
    if (f < 758) { W(MAJOR, -13.6, ROAD_Z + 3.0, { expr: at(f, 724) ? "grin" : "smile", prop: "paper" }); W(SOLD[0], -15.0, ROAD_Z + 3.3, { expr: "smile", look: 1 }); card("map", mapCard, -13.6, 1.62, ROAD_Z + 3.5, 0.55, 0.42); }
    else herd(out, cam, t, 26, fx0, fz0 + 1, 6, f < 823 ? "smug" : "scatter", 831 / FPS, 800);
  }
  if (id === 6) {
    const tr = truckAt(6, t);
    onTruck(SOLD[0], -0.9, 0.3, { expr: at(f, 1062) ? "shock" : "stern" }); onTruck(MAJOR, 1.6, 0.4, { expr: at(f, 1104) ? "nervous" : "stern" });
    for (let k = 0; k < 14; k++) {
      const x = tr.x + 9 + k * 1.8 + 2.5 * Math.sin(t * 0.7 + k), z = tr.z + (hh(k, 9) - 0.5) * 14 + Math.sin(t * 1.3 + k) * 2;
      emuAt(out, cam, t, 900 + k, x, z, 1, Math.cos(t + k) * 0.3, 8, "alarm");
      if (((t * 3 + k * 0.37) % 1) < 0.25) card(`miss${k % 3}${q((t * 3 + k * 0.37) % 1 * 4, 4)}`, (p) => fxPuff(p, q(((t * 3 + k * 0.37) % 1) * 4, 4)), x - 1.5 + hh(k, 2), 0.3, z + 1, 0.8, 0.8, 300, 300, true);
    }
    if (Math.floor(t * 9) % 2 === 0) card(`flash${q(t % 1, 4)}`, (p) => fxBurst(p, 0.3, "#fff0a0", 8, 30, 120), tr.x + 0.6 * Math.cos(tr.yaw), 2.0, tr.z - 0.6 * Math.sin(tr.yaw), 0.6, 0.6, 300, 300);
  }
  if (id === 7) {
    if (f < 1253) {
      herd(out, cam, t, 10, -20, fz0, 4, "run", 0, 1000);
      const x = -20 + 13.9 * (t - 37.8);
      for (let k = 0; k < 3; k++) card("speed", speedLines, x - 2.5 - k * 1.2, 1.2 + k * 0.3, fz0 + 1.2 - k, 1.0, 1.0, 200, 200);
      if (at(f, 1165)) card("kmh", kmh, x + 1.5, 2.6, fz0 + 0.5, 1.4, 0.7, 400, 200);
    } else {
      emuAt(out, cam, t, 50, MOUND[0], MOUND[2] + 0.6, -1, 0, 0, at(f, 1286) ? "alarm" : "calm", at(f, 1286) ? 0 : q(Math.max(0, Math.sin(t * 3)), 4) * 0.3, 2.35);
      if (at(f, 1286)) card("bang", bang, MOUND[0] + 0.6, 5.8, MOUND[2] + 0.6, 0.6, 0.66, 200, 220);
      herd(out, cam, t, 12, MOUND[0] - 2, MOUND[2] - 8, 6, at(f, 1290) ? "scatter" : "graze", 1292 / FPS, 1100);
    }
  }
  if (id === 8) {
    if (f < 1413) { onTruck(MAJOR, 0.2, 0.5, { expr: "pained" }); onTruck(SOLD[0], -1.6, -0.4, { expr: "nervous" }); onTruck(SOLD[1], -2.6, 0.4, { expr: "dazed" }); }
    else for (let k = 0; k < 5; k++) emuAt(out, cam, t, 1200 + k, -5.6 + k * 1.1, ROAD_Z + 0.4 - (k % 2) * 1.2, -1, 0, 0, "smug", 0);
  }
  if (id === 9) {
    W(MAJOR, FARM[0], FARM[2] - 6.2, { expr: at(f, 1622) ? "grin" : "stern", prop: at(f, 1560) && !at(f, 1622) ? "point" : null });
    for (let k = 0; k < 3; k++) W(REPORTER(k), FARM[0] - 2.2 + k * 1.1 + (k === 2 ? 2.6 : 0), FARM[2] - 7.6 + (k % 2) * 0.4, { expr: "smile", prop: "book", look: k === 2 ? -1 : 1 });
    for (const fl of [1500, 1600, 1660]) fxAnim(out, t, `pflash${fl}`, fl, 6, (p, u) => fxBurst(p, u, "#ffffff", 10, 40, 220), FARM[0] + 2.0, 1.8, FARM[2] - 7.2, 1.0, 1.0);
    emuAt(out, cam, t, 60, FARM[0] + 1.6, FARM[2] - 4.6, -1, 0, 0, "smug", 0);
  }
  if (id === 10) {
    const kk = q(((t * 1.5) % 1) < 0.7 ? 0 : 1, 4);
    W(FARMER, -1.2, FENCE_Z + 1.4, { expr: "grin", prop: ["hammer", kk] }); W(crowdWho("1930au", 3), 1.0, FENCE_Z + 1.6, { expr: "smile", look: -1 });
    W(FKID, 2.2, FENCE_Z + 2.2, { expr: "laugh" });
    herd(out, cam, t, 8, 0, FENCE_Z - 4.5, 3.5, "graze", 0, 1300);
    sparkle(out, t, 1769, 0, 1.5, FENCE_Z + 0.4, 1.6);
  }
  if (id === 11) {
    if (f < 1916) herd(out, cam, t, 30, fx0 + 2, fz0 - 6, 14, "graze", 0, 1400);
    else { emuAt(out, cam, t, 7, fx0, fz0 + 2.2, 1, 0, 0, "smug", 0); card("medal", medal, fx0 + 0.32, 1.12, fz0 + 2.4, 0.22, 0.28, 200, 240); sparkle(out, t, 1930, fx0 + 0.2, 1.5, fz0 + 2.5, 1.2); herd(out, cam, t, 12, fx0, fz0 - 6, 8, "graze", 0, 1500); }
  }
};

export const life = (id: number): Life => {
  if (id === 3) return { groups: [{ x: FARM[0] + 8, z: FARM[2] - 6, n: 2, era: "1930au", base: 100 }], birds: 5, birdY: 16, smoke: [[FARM[0] + 2, 7.8, FARM[2] + 1]] };
  if (id === 9) return { groups: [{ x: FARM[0] - 6, z: FARM[2] - 8, n: 3, era: "1930au", base: 110 }], birds: 4, smoke: [[FARM[0] + 2, 7.8, FARM[2] + 1]] };
  if (id === 10) return { walk: [{ x0: -20, x1: 20, z0: FENCE_Z + 5, z1: FENCE_Z + 8, axis: "x", n: 4, era: "1930au", base: 120 }], birds: 5 };
  if (id === 2 || id === 5 || id === 11) return { birds: 8, birdY: 20 };
  return { birds: 4, birdY: 16 };
};
