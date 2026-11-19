// Cologne: the Gothic cathedral (half scale) in three states — founding (choir walls + scaffolds), medieval
// (choir done, low nave, south-tower stump with the wooden crane), rising/done (both towers with openwork spires) —
// the medieval town on the square, the Rhine, an attic (1814) and a Paris shop (1816).
import * as THREE from "three";
import { Batch, V, lam, quad, tri, boxGeo, house, prop, roofMat } from "../../engine/build";
import { ctex, rng, rep, beam, cobbleHD } from "../../engine/paint";
import { BuildCtx, quadUp, ub, noiseTex, waterMesh } from "../../engine/world";
import { room, RoomStyle } from "../../engine/interior";
import { FPS } from "../../engine/core";
import { TOWER_X, SOUTH, STUMP_H, SQUARE, ATTIC, PARIS, domAt, riseU } from "./story";

// ---------------- painted stone ----------------
const STONE = "#8f897c", STONE_D = "#6f6a60";
const archPath = (g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) => {
  const r = w * 0.9; g.beginPath(); g.moveTo(x, y + h); g.lineTo(x, y + w * 0.6);
  g.arc(x + r, y + w * 0.6, r, Math.PI, Math.PI + Math.acos((r - w / 2) / r) * 1.0, false);
  g.lineTo(x + w / 2, y); g.arc(x + w - r, y + w * 0.6, r, -Math.acos((r - w / 2) / r), 0, false);
  g.lineTo(x + w, y + h); g.closePath();
};
const sootStone = (g: CanvasRenderingContext2D, W: number, H: number, r: () => number) => {
  g.fillStyle = STONE; g.fillRect(0, 0, W, H);
  for (let y = 0; y < H; y += 18) for (let x = (y / 18) % 2 ? -20 : 0; x < W; x += 40) { g.fillStyle = `rgba(${r() < 0.5 ? "255,250,235" : "40,35,30"},${0.04 + r() * 0.06})`; g.fillRect(x + 1, y + 1, 38, 16); }
  g.strokeStyle = "rgba(40,35,30,0.18)"; g.lineWidth = 1.5; for (let y = 0; y < H; y += 18) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
  for (let i = 0; i < W / 25; i++) { const x = r() * W, gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, "rgba(30,28,26,0.0)"); gr.addColorStop(1, "rgba(30,28,26,0.22)"); g.fillStyle = gr; g.fillRect(x, 0, 8 + r() * 30, H); }
};
/** wall with nWin tall stained-glass lancet windows */
const glassWall = (key: string, wm: number, hm: number, nWin: number, glass = true) => ctex("gw" + key, Math.min(2048, Math.round(wm * 24)), Math.min(2048, Math.round(hm * 24)), (g, r) => {
  const W = g.canvas.width, H = g.canvas.height; sootStone(g, W, H, r);
  for (let i = 0; i < nWin; i++) {
    const cx = ((i + 0.5) / nWin) * W, ww = Math.min(W / nWin * 0.55, 80), wh = H * 0.62, y0 = H * 0.18;
    archPath(g, cx - ww / 2 - 6, y0 - 6, ww + 12, wh + 10); g.fillStyle = STONE_D; g.fill();
    archPath(g, cx - ww / 2, y0, ww, wh);
    if (glass) {
      g.save(); g.clip();
      const cols = ["#2f5fb0", "#c23a3a", "#e8b43a", "#3a8a5a", "#7a3ab0"];
      for (let y = y0; y < y0 + wh; y += 14) for (let x = cx - ww / 2; x < cx + ww / 2; x += 14) { g.fillStyle = cols[Math.floor(r() * cols.length)]; g.fillRect(x, y, 14, 14); }
      g.strokeStyle = "rgba(20,15,20,0.8)"; g.lineWidth = 2; for (let y = y0; y < y0 + wh; y += 14) { g.beginPath(); g.moveTo(cx - ww / 2, y); g.lineTo(cx + ww / 2, y); g.stroke(); }
      g.restore();
    } else { g.fillStyle = "#2a2622"; g.fill(); }
    g.strokeStyle = "#3a352e"; g.lineWidth = 5; archPath(g, cx - ww / 2, y0, ww, wh); g.stroke();
    g.beginPath(); g.moveTo(cx, y0 + ww * 0.3); g.lineTo(cx, y0 + wh); g.stroke();
  }
});
/** tower face: stacked blind arcades and a tall window per stage */
const towerFace = (key: string, wm: number, hm: number, stages: number) => ctex("tf" + key, Math.round(wm * 24), Math.min(2048, Math.round(hm * 24)), (g, r) => {
  const W = g.canvas.width, H = g.canvas.height; sootStone(g, W, H, r);
  for (let s = 0; s < stages; s++) {
    const y0 = (s / stages) * H, sh = H / stages;
    g.fillStyle = "rgba(240,235,220,0.18)"; g.fillRect(0, y0 + sh - 10, W, 8);
    for (let k = 0; k < 4; k++) { const ww = W / 4 * 0.6, x = (k + 0.2) * W / 4; archPath(g, x, y0 + sh * 0.15, ww, sh * 0.75); g.fillStyle = k === 1 || k === 2 ? "#2a2622" : STONE_D; g.fill(); g.strokeStyle = "#3a352e"; g.lineWidth = 4; g.stroke(); }
  }
});
const spireTex = () => ctex("spireT", 256, 1024, (g, r) => {
  sootStone(g, 256, 1024, r);
  for (let y = 40; y < 1024; y += 70) for (let x = 30; x < 256; x += 64) { g.fillStyle = "#1e1b18"; g.beginPath(); g.arc(x, y, 14, 0, 7); g.fill(); g.beginPath(); g.arc(x + 16, y + 14, 8, 0, 7); g.arc(x - 16, y + 14, 8, 0, 7); g.fill(); }
});
const planTex = (half: 0 | 1 | 2) => ctex("plan" + half, 400, 600, (g) => {
  g.fillStyle = "#e9dcb8"; g.fillRect(0, 0, 400, 600);
  g.strokeStyle = "#5a3b2a"; g.lineWidth = 4;
  const tower = (cx: number) => { g.strokeRect(cx - 50, 300, 100, 260); g.strokeRect(cx - 42, 200, 84, 100); g.beginPath(); g.moveTo(cx - 40, 200); g.lineTo(cx, 40); g.lineTo(cx + 40, 200); g.stroke(); for (let k = 0; k < 6; k++) { g.beginPath(); g.moveTo(cx - 30 + k * 12, 520); g.lineTo(cx - 30 + k * 12, 330); g.stroke(); } };
  if (half !== 2) tower(110); if (half !== 1) tower(290);
  if (half === 0 || half === 1) { g.strokeRect(160, 380, half === 0 ? 80 : 40, 180); }
  if (half === 2) { g.strokeRect(160, 380, 40, 180); }
  g.strokeStyle = "rgba(90,60,40,0.4)"; g.lineWidth = 2; for (let k = 0; k < 8; k++) { g.beginPath(); g.moveTo(10, 580 - k * 8); g.lineTo(390, 580 - k * 8); g.stroke(); }
});

// ---------------- cathedral pieces ----------------
const stoneM = () => lam("domStone", () => ({ map: rep(ctex("domStoneT", 512, 512, (g, r) => sootStone(g, 512, 512, r)), 1, 1) }));
const slate = () => roofMat("#8f97a8");
const walls = (b: Batch, key: string, x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, nx: number, nz: number, glass = true) => {
  const L = lam("gwL" + key, () => ({ map: glassWall(key + "L", x1 - x0, y1 - y0, nx, glass) })), S = lam("gwS" + key, () => ({ map: glassWall(key + "S", z1 - z0, y1 - y0, nz, glass) }));
  b.add(quad(V(x0, y0, z1), V(x1, y0, z1), V(x1, y1, z1), V(x0, y1, z1)), L);
  b.add(quad(V(x1, y0, z0), V(x0, y0, z0), V(x0, y1, z0), V(x1, y1, z0)), L);
  b.add(quad(V(x0, y0, z0), V(x0, y0, z1), V(x0, y1, z1), V(x0, y1, z0)), S);
  b.add(quad(V(x1, y0, z1), V(x1, y0, z0), V(x1, y1, z0), V(x1, y1, z1)), S);
};
/** steep gable roof along x over z0..z1 from height y with ridge rise h */
const roofX = (b: Batch, x0: number, x1: number, z0: number, z1: number, y: number, h: number, gableMat = stoneM()) => {
  const zc = (z0 + z1) / 2, o = 0.4, ru = (x1 - x0) / 4, rv = Math.hypot(h, (z1 - z0) / 2) / 4;
  b.add(quad(V(x0, y, z1 + o), V(x1, y, z1 + o), V(x1, y + h, zc), V(x0, y + h, zc), ru, rv), slate());
  b.add(quad(V(x1, y, z0 - o), V(x0, y, z0 - o), V(x0, y + h, zc), V(x1, y + h, zc), ru, rv), slate());
  b.add(tri(V(x0, y, z0), V(x0, y, z1), V(x0, y + h, zc)), gableMat);
  b.add(tri(V(x1, y, z1), V(x1, y, z0), V(x1, y + h, zc)), gableMat);
};
/** steep gable roof along z over x0..x1 */
const roofZ = (b: Batch, x0: number, x1: number, z0: number, z1: number, y: number, h: number) => {
  const xc = (x0 + x1) / 2, o = 0.4, ru = (z1 - z0) / 4, rv = Math.hypot(h, (x1 - x0) / 2) / 4;
  b.add(quad(V(x0 - o, y, z0), V(x0 - o, y, z1), V(xc, y + h, z1), V(xc, y + h, z0), ru, rv), slate());
  b.add(quad(V(x1 + o, y, z1), V(x1 + o, y, z0), V(xc, y + h, z0), V(xc, y + h, z1), ru, rv), slate());
  b.add(tri(V(x1, y, z0), V(x0, y, z0), V(xc, y + h, z0)), stoneM());
  b.add(tri(V(x0, y, z1), V(x1, y, z1), V(xc, y + h, z1)), stoneM());
};
const pinnacle = (b: Batch, x: number, y: number, z: number, h = 4) => {
  ub(b, stoneM(), x - 0.45, x + 0.45, y, y + h * 0.35, z - 0.45, z + 0.45);
  const c = new THREE.ConeGeometry(0.5, h * 0.65, 4); c.rotateY(Math.PI / 4); c.translate(0, h * 0.35 + h * 0.325, 0);
  b.add(c, stoneM(), new THREE.Matrix4().makeTranslation(x, y, z));
};
const beamBetween = (b: Batch, a: THREE.Vector3, c: THREE.Vector3, w: number, d: number, mat: THREE.Material) => {
  const g = new THREE.BoxGeometry(w, a.distanceTo(c), d);
  b.add(g, mat, new THREE.Matrix4().compose(a.clone().add(c).multiplyScalar(0.5), new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), c.clone().sub(a).normalize()), V(1, 1, 1)));
};
/** choir (always complete): x 20..38 + apse; nave/transept height depends on `full` */
const body = (b: Batch, full: boolean, founding = false) => {
  const H = 22, A = 12;
  // choir
  const choirTop = founding ? 9 : H;
  walls(b, "choir" + choirTop, 20, 38, 0, choirTop, -5.5, 5.5, 4, 2, !founding);
  walls(b, "choirA" + choirTop, 20, 38, 0, Math.min(A, choirTop), -11, -5.5, 4, 1, !founding); walls(b, "choirB" + choirTop, 20, 38, 0, Math.min(A, choirTop), 5.5, 11, 4, 1, !founding);
  const apse = new THREE.CylinderGeometry(5.5, 5.5, choirTop, 12, 1, true, 0, Math.PI); apse.translate(0, choirTop / 2, 0);
  b.add(apse, stoneM(), new THREE.Matrix4().makeTranslation(38, 0, 0));
  const amb = new THREE.CylinderGeometry(11, 11, Math.min(A, choirTop), 16, 1, true, 0, Math.PI); amb.translate(0, Math.min(A, choirTop) / 2, 0);
  b.add(amb, stoneM(), new THREE.Matrix4().makeTranslation(38, 0, 0));
  if (!founding) {
    roofX(b, 20, 38, -5.5, 5.5, H, 10);
    const ac = new THREE.ConeGeometry(5.9, 10, 12, 1, true, 0, Math.PI); ac.translate(0, H + 5, 0); b.add(ac, slate(), new THREE.Matrix4().makeTranslation(38, 0, 0));
    for (const s of [-1, 1]) b.add(quad(V(20, A, s * 11), V(38, A, s * 11), V(38, A + 2.5, s * 5.5), V(20, A + 2.5, s * 5.5)).scale(1, 1, 1), slate());
    for (let x = 22; x <= 37; x += 3.7) for (const s of [-1, 1]) {
      pinnacle(b, x, A, s * 10.6, 6); beamBetween(b, V(x, A + 3.2, s * 10.4), V(x, H - 2, s * 5.8), 0.5, 0.7, stoneM());
    }
  } else for (let k = 0; k < 40; k++) { const x = 20 + (k % 10) * 2, s = k < 20 ? -1 : 1; ub(b, lam("scaff", () => ({ map: beam() })), x - 0.06, x + 0.06, 0, 12, s * 12 - 0.06, s * 12 + 0.06); }
  // nave + transept (not yet begun in 1248)
  if (founding) return;
  const nh = full ? H : 12;
  walls(b, "nave" + nh, -24.5, 8, 0, nh, -5.5, 5.5, 6, 2, true);
  walls(b, "aisleA", -24.5, 8, 0, A, -11, -5.5, 6, 1, true); walls(b, "aisleB", -24.5, 8, 0, A, 5.5, 11, 6, 1, true);
  walls(b, "trans" + nh, 8, 20, 0, nh, -20, 20, 2, 6, true);
  if (full) {
    roofX(b, -24.5, 20, -5.5, 5.5, H, 10);
    roofZ(b, 8, 20, -20, 20, H, 10);
    for (const s of [-1, 1]) b.add(quad(V(-24.5, A, s * 11), V(8, A, s * 11), V(8, A + 2.5, s * 5.5), V(-24.5, A + 2.5, s * 5.5)), slate());
    for (let x = -22; x <= 6; x += 4) for (const s of [-1, 1]) { pinnacle(b, x, A, s * 10.6, 6); beamBetween(b, V(x, A + 3.2, s * 10.4), V(x, H - 2, s * 5.8), 0.5, 0.7, stoneM()); }
    // crossing turret
    const ft = new THREE.ConeGeometry(1.6, 14, 8); ft.translate(0, H + 10 + 7, 0); b.add(ft, slate(), new THREE.Matrix4().makeTranslation(14, 0, 0));
  } else {
    ub(b, lam("provRoof", () => ({ color: "#6a5a4a" })), -24.5, 20, nh, nh + 0.6, -11.2, 11.2); // the provisional low roof
  }
};
/** one west tower; parts: 0 = base (to 30), 1 = second stage (30-48), 2 = octagon (48-60), 3 = spire (60-78) */
const towerParts = (x: number, z: number, upTo: number, stumpH = 30) => {
  const parts = [0, 1, 2, 3].map(() => new Batch());
  const W = 7.5, f = towerFace("t" + x + z + stumpH, 2 * W, stumpH, Math.round(stumpH / 10));
  const tm = lam("tower" + z + stumpH, () => ({ map: f }));
  const sq = (bb: Batch, w: number, y0: number, y1: number, m: THREE.Material) => {
    bb.add(quad(V(x - w, y0, z + w), V(x + w, y0, z + w), V(x + w, y1, z + w), V(x - w, y1, z + w)), m);
    bb.add(quad(V(x + w, y0, z - w), V(x - w, y0, z - w), V(x - w, y1, z - w), V(x + w, y1, z - w)), m);
    bb.add(quad(V(x - w, y0, z - w), V(x - w, y0, z + w), V(x - w, y1, z + w), V(x - w, y1, z - w)), m);
    bb.add(quad(V(x + w, y0, z + w), V(x + w, y0, z - w), V(x + w, y1, z - w), V(x + w, y1, z + w)), m);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) ub(bb, stoneM(), x + sx * w - 0.8, x + sx * w + 0.8, y0, y1, z + sz * w - 0.8, z + sz * w + 0.8);
  };
  sq(parts[0], W, 0, stumpH, tm);
  ub(parts[0], stoneM(), x - W - 0.3, x + W + 0.3, stumpH, stumpH + 0.6, z - W - 0.3, z + W + 0.3);
  if (upTo >= 1) { sq(parts[1], W - 1, 30, 48, lam("tower2", () => ({ map: towerFace("t2", 13, 18, 2) }))); for (const sx of [-1, 1]) for (const sz of [-1, 1]) pinnacle(parts[1], x + sx * (W - 0.4), 30.6, z + sz * (W - 0.4), 8); }
  if (upTo >= 2) { const o = new THREE.CylinderGeometry(5.6, 6.2, 12, 8, 1, true); o.rotateY(Math.PI / 8); o.translate(0, 54, 0); parts[2].add(o, lam("tower3", () => ({ map: rep(towerFace("t3", 8, 12, 1), 4, 1) })), new THREE.Matrix4().makeTranslation(x, 0, z)); for (let k = 0; k < 8; k++) pinnacle(parts[2], x + Math.cos((k / 8) * Math.PI * 2) * 6, 48, z + Math.sin((k / 8) * Math.PI * 2) * 6, 5); }
  if (upTo >= 3) {
    const sp = new THREE.ConeGeometry(5.6, 19, 8, 1, true); sp.rotateY(Math.PI / 8); sp.translate(0, 60 + 9.5, 0);
    parts[3].add(sp, lam("spire", () => ({ map: rep(spireTex(), 4, 1), side: THREE.DoubleSide })), new THREE.Matrix4().makeTranslation(x, 0, z));
    for (let k = 0; k < 8; k++) for (let j = 1; j < 9; j++) { const u = j / 9, a = (k / 8) * Math.PI * 2 + Math.PI / 8; parts[3].add(new THREE.SphereGeometry(0.28 * (1 - u * 0.6), 6, 5), stoneM(), new THREE.Matrix4().makeTranslation(x + Math.cos(a) * 5.6 * (1 - u), 60 + 19 * u, z + Math.sin(a) * 5.6 * (1 - u))); }
    ub(parts[3], stoneM(), x - 0.15, x + 0.15, 78.5, 81.5, z - 0.15, z + 0.15); ub(parts[3], stoneM(), x - 0.9, x + 0.9, 80, 80.3, z - 0.15, z + 0.15); ub(parts[3], stoneM(), x - 0.15, x + 0.15, 80, 80.3, z - 0.9, z + 0.9);
  }
  return parts;
};
/** the west front between the towers: portal, great window, gable */
const westFront = (b: Batch, x: number, full: boolean) => {
  const h = full ? 34 : 12;
  b.add(quad(V(x - 3.5, 0, -3.5), V(x - 3.5, 0, 3.5), V(x - 3.5, h, 3.5), V(x - 3.5, h, -3.5)), lam("westF" + h, () => ({ map: glassWall("westF" + h, 7, h, 1, full) })));
  ub(b, lam("portal", () => ({ color: "#2a2622" })), x - 3.6, x - 3.5, 0, 6, -1.6, 1.6);
  if (full) b.add(tri(V(x - 3.5, 34, 3.5), V(x - 3.5, 34, -3.5), V(x - 3.5, 40, 0)), stoneM());
};
/** medieval treadwheel crane on the stump (jib toward -x, the square) */
const craneParts = (b: Batch, x: number, y: number, z: number) => {
  const wood = lam("craneWood", () => ({ map: rep(beam(), 1, 1) })), dark = lam("craneDark", () => ({ color: "#4a3426" }));
  ub(b, wood, x - 2.4, x + 2.4, y, y + 0.4, z - 2.4, z + 2.4);
  ub(b, wood, x - 1.8, x + 1.8, y + 0.4, y + 4.6, z - 1.8, z + 1.8);
  b.add(new THREE.ConeGeometry(2.8, 2.6, 4).rotateY(Math.PI / 4).translate(0, 1.3, 0), dark, new THREE.Matrix4().makeTranslation(x, y + 4.6, z));
  beamBetween(b, V(x - 1.0, y + 3.5, z), V(x - 9.5, y + 9.5, z), 0.45, 0.45, wood);
  beamBetween(b, V(x - 1.4, y + 1.0, z), V(x - 6.0, y + 6.2, z), 0.3, 0.3, wood);
  const wheel = new THREE.TorusGeometry(1.6, 0.18, 8, 24); b.add(wheel, dark, new THREE.Matrix4().makeTranslation(x, y + 2.4, z + 1.85));
};
const scaffold = (b: Batch, x0: number, x1: number, z0: number, z1: number, y0: number, y1: number) => {
  const m = lam("scaff", () => ({ map: beam() }));
  for (let y = y0; y < y1; y += 2.4) for (const [a, c] of [[V(x0, y, z0), V(x1, y, z0)], [V(x0, y, z1), V(x1, y, z1)], [V(x0, y, z0), V(x0, y, z1)], [V(x1, y, z0), V(x1, y, z1)]] as const) beamBetween(b, a, c, 0.1, 0.1, m);
  for (let x = x0; x <= x1 + 0.01; x += (x1 - x0) / 4) for (const z of [z0, z1]) ub(b, m, x - 0.06, x + 0.06, y0, y1, z - 0.06, z + 0.06);
  for (let z = z0; z <= z1 + 0.01; z += (z1 - z0) / 4) for (const x of [x0, x1]) ub(b, m, x - 0.06, x + 0.06, y0, y1, z - 0.06, z + 0.06);
};

export const buildSet = (ctx: BuildCtx) => {
  const { root: R, b, kit } = ctx, r = rng(13), ceil = new Batch();
  // ---- ground, square, river ----
  b.add(quadUp(-500, 500, -500, 500, 250, 250, -0.02), ctx.M.grass);
  b.add(quadUp(-90, 45, -26, 26, 60, 23, 0.0), lam("cobbleK", () => ({ map: cobbleHD() })));
  R.add(waterMesh(70, 400, -500, 500, -0.6, [0, 0.4]));
  b.add(quadUp(60, 70, -500, 500, 5, 250, 0.0), lam("quayK", () => ({ map: rep(noiseTex("quayK", "#b8ac94", ["#a89c84", "#c8bca4"], 900, 512, 8), 1, 1) })));
  // ---- town: houses around the square and along lanes ----
  for (let z = -60; z <= 60; z += 9) for (const x of [-96, -112]) house(b, x, z, Math.PI / 2, 8, 8, [8.4, 9.8, 11.2][Math.floor(r() * 3)], 3 + (Math.floor(r() * 3) * 2) % 8);
  for (let x = -88; x <= 50; x += 8.6) for (const s of [-1, 1]) if (x < -40 || x > 44) house(b, x, s * 34, s > 0 ? Math.PI : 0, 8, 8, [8.4, 9.8, 11.2][Math.floor(r() * 3)], Math.floor(r() * 8));
  for (let x = -40; x <= 44; x += 8.6) for (const s of [-1, 1]) house(b, x, s * 40, s > 0 ? Math.PI : 0, 8, 8, [8.4, 9.8][Math.floor(r() * 2)], Math.floor(r() * 8));
  for (let i = 0; i < 80; i++) { const x = -200 + r() * 260, z = (r() < 0.5 ? -1 : 1) * (50 + r() * 140); house(b, x, z, Math.floor(r() * 4) * Math.PI / 2, 8, 8, [7, 8.4, 9.8][Math.floor(r() * 3)], Math.floor(r() * 8)); }
  for (let i = 0; i < 40; i++) prop(b, kit, ["tree_oak", "tree_default", "tree_cone"][i % 3], -300 + r() * 600, 0, (r() < 0.5 ? -1 : 1) * (200 + r() * 200), 10 + r() * 5, r() * 6);
  for (const [x, z] of [[-70, 18], [-80, -18], [-62, -20], [50, 22]] as const) prop(b, kit, "tree_oak", x, 0, z, 9, x);
  // market stalls + a well on the square
  for (let k = 0; k < 4; k++) { const x = -78 + k * 7, z = -14; ub(b, lam("stallW", () => ({ map: beam() })), x - 1.4, x + 1.4, 0, 0.9, z - 0.7, z + 0.7); b.add(quad(V(x + 1.6, 2.4, z + 1.0), V(x - 1.6, 2.4, z + 1.0), V(x - 1.6, 2.0, z - 1.0), V(x + 1.6, 2.0, z - 1.0)), lam("awn" + k, () => ({ color: ["#b8483a", "#3f6fb5", "#d8a441", "#5d7a3a"][k], side: THREE.DoubleSide }))); }
  // ---- interiors: attic (1814) and a Paris shop (1816) ----
  const att: RoomStyle = { lower: "#6a4a32", upper: "#8a6a4a", rail: "#4a3020", floor: "planks", floorA: "#7a5a3a", floorB: "#6a4c30", outer: "#c8a878", windows: 1 };
  const par: RoomStyle = { lower: "#5a3a4a", upper: "#e8d8c0", rail: "#3a2430", floor: "planks", floorA: "#8a5a34", floorB: "#7a4f2e", outer: "#e8dcc0", windows: 1, frames: true };
  room(b, ceil, "attic", ATTIC[0], ATTIC[2], 7, 7, 3.0, att);
  room(b, ceil, "paris", PARIS[0], PARIS[2], 7, 7, 3.4, par);
  for (let k = 0; k < 5; k++) beamBetween(b, V(ATTIC[0] - 3.5, 1.2, ATTIC[2] - 3 + k * 1.5), V(ATTIC[0] + 3.5, 2.9, ATTIC[2] - 3 + k * 1.5), 0.2, 0.2, lam("atticBeam", () => ({ map: beam() })));
  for (const [x, z, w] of [[-2, -2.6, 1.2], [1.5, -2.8, 1.0], [2.6, -1, 0.9], [-2.6, 0.4, 0.8]] as const) ub(b, lam("chest", () => ({ color: "#6a4a32" })), ATTIC[0] + x - w / 2, ATTIC[0] + x + w / 2, 0, 0.6, ATTIC[2] + z - 0.35, ATTIC[2] + z + 0.35);
  ub(b, lam("chestLid", () => ({ color: "#4a3426" })), ATTIC[0] - 0.6, ATTIC[0] + 0.6, 0, 0.55, ATTIC[2] - 1.2, ATTIC[2] - 0.5);
  for (let k = 0; k < 3; k++) for (let i = 0; i < 18; i++) ub(b, lam("bookP" + (i % 4), () => ({ color: ["#8c3b4a", "#3f5a7a", "#5d7a3a", "#c2a25a"][i % 4] })), PARIS[0] - 2.2 + i * 0.12, PARIS[0] - 2.12 + i * 0.12, 0.6 + k * 0.6, 0.95 + k * 0.6, PARIS[2] - 3.3, PARIS[2] - 3.05);
  ub(b, lam("shopCounter", () => ({ map: beam() })), PARIS[0] - 1.2, PARIS[0] + 1.2, 0, 0.95, PARIS[2] - 1.3, PARIS[2] - 0.7);
  ceil.build(R, false);
  // ---- the cathedral in its states (separate groups, toggled per shot) ----
  const mk = (fill: (bb: Batch) => void) => { const g = new THREE.Group(), bb = new Batch(); fill(bb); bb.build(g); R.add(g); return g; };
  const found = mk((bb) => { body(bb, false, true); scaffold(bb, 19, 39, -12, 12, 0, 10); });
  const medieval = mk((bb) => { body(bb, false); westFront(bb, TOWER_X - 7.5, false); craneParts(bb, SOUTH[0], STUMP_H + 0.6, SOUTH[2]); });
  const done = mk((bb) => { body(bb, true); westFront(bb, TOWER_X - 7.5, true); });
  const towers = (z: number, stump: number) => towerParts(TOWER_X, z, 3, stump).map((p) => { const g = new THREE.Group(); p.build(g); R.add(g); return g; });
  const tS = towers(11, 30), tN = towers(-11, 30);
  const stumpS = (() => { const g = new THREE.Group(); towerParts(TOWER_X, 11, 0, STUMP_H)[0].build(g); R.add(g); return g; })();
  const stumpN = (() => { const g = new THREE.Group(); towerParts(TOWER_X, -11, 0, 8)[0].build(g); R.add(g); return g; })();
  const scaf = (() => { const g = new THREE.Group(), bb = new Batch(); scaffold(bb, TOWER_X - 8.4, TOWER_X + 8.4, -19.4, 19.4, 0, 14); bb.build(g); R.add(g); return g; })();
  // dynamic: the crane rope + a block being lifted (shot 3), the plan halves on the attic table / shop counter
  const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1, 6).translate(0, -0.5, 0), lam("rope", () => ({ color: "#c9a66b" })));
  const block = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.7, 0.7), stoneM()); block.castShadow = true;
  R.add(rope, block);
  const planA = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.9), new THREE.MeshBasicMaterial({ map: planTex(1) })); planA.rotation.x = -Math.PI / 2; planA.position.set(ATTIC[0], 0.57, ATTIC[2] - 0.85); R.add(planA);
  void boxGeo; void FPS;
  return (id: number, t: number, f: number) => {
    const d = domAt(id), u = riseU(f);
    found.visible = d === "found"; medieval.visible = d === "medieval" || d === "rising"; done.visible = d === "done";
    stumpS.visible = d === "medieval" || d === "rising"; stumpN.visible = d === "medieval" || d === "rising";
    tS.forEach((g, k) => { g.visible = d === "done" || (d === "rising" && u > k * 0.25 + 0.05); });
    tN.forEach((g, k) => { g.visible = d === "done" || (d === "rising" && u > k * 0.25 + 0.12); });
    scaf.visible = d === "rising"; scaf.position.y = d === "rising" ? 16 + 48 * u : 0;
    medieval.children.forEach(() => void 0);
    const lift = id === 3 ? ((t * 0.25) % 1) : 0.85, ropeL = 0.5 + (1 - lift) * (STUMP_H + 9);
    rope.visible = block.visible = d === "medieval";
    rope.position.set(SOUTH[0] - 9.5, STUMP_H + 10.1, SOUTH[2]); rope.scale.set(1, ropeL, 1);
    block.position.set(SOUTH[0] - 9.5, STUMP_H + 10.1 - ropeL - 0.35, SOUTH[2]); block.rotation.y = Math.sin(t) * 0.2;
    planA.visible = id === 8;
  };
};
export const planHalf = planTex;
