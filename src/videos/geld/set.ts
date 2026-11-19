// The island set: beach, lagoon, village of thatched huts on stone platforms, palms, the row of stone money,
// the quarry, an outrigger canoe with a stone (dynamic), and the seabed with the sunken stone (dynamic).
import * as THREE from "three";
import { Batch, V, lam, quad, tri, boxGeo, prop, inTheWay } from "../../engine/build";
import { ctex, rng, rep, beam } from "../../engine/paint";
import { BuildCtx, quadUp, waterMesh, ub, noiseTex } from "../../engine/world";
import { NOINK } from "../../engine/ink";
import { FPS, smooth, clamp01 } from "../../engine/core";
import { UW, STONE_ROW_Z, BIG, QUARRY, HUT_FAMILY, canoeX, CANOE_Z } from "./story";

// ---------------- painted textures ----------------
const sandTex = () => noiseTex("sand", "#ecd6a2", ["#f6e6bd", "#d9bf86", "#e2c992", "#fff3d0"], 1400, 512, 6);
const wetTex = () => noiseTex("wetsand", "#c9ac78", ["#b89a68", "#d8bf8e", "#a98c5c"], 900, 512, 7);
const limeTex = () => noiseTex("limestone", "#cfc6b4", ["#bdb3a0", "#e2dacb", "#a89e8c", "#d8cfbf"], 700, 512, 18);
const rockTex = () => noiseTex("rock", "#9a958c", ["#86817a", "#b0aba2", "#7a756e", "#a7a299"], 900, 512, 16);
const seabedTex = () => noiseTex("seabed", "#d8c79a", ["#c7b688", "#e8dab0", "#b9a77a", "#9fb08a"], 1200, 512, 9);
const thatchTex = () => ctex("thatch", 512, 512, (g, r) => {
  g.fillStyle = "#b8904e"; g.fillRect(0, 0, 512, 512);
  for (let row = 0; row < 12; row++) {
    const y0 = row * 44;
    for (let i = 0; i < 160; i++) {
      const x = r() * 512, l = 30 + r() * 26;
      g.strokeStyle = ["#d6b06a", "#a07a3e", "#c49a58", "#8a6634", "#e2c07a"][Math.floor(r() * 5)]; g.lineWidth = 2 + r() * 2;
      g.beginPath(); g.moveTo(x, y0 + r() * 6); g.lineTo(x + (r() - 0.5) * 6, y0 + l); g.stroke();
    }
    g.fillStyle = "rgba(60,40,15,0.35)"; g.fillRect(0, y0 + 40, 512, 4);
  }
});
const bambooTex = () => ctex("bamboo", 512, 512, (g, r) => {
  for (let x = 0; x < 512; x += 32) {
    const c = ["#c9a66b", "#b8935a", "#d4b37a"][Math.floor(r() * 3)];
    g.fillStyle = c; g.fillRect(x, 0, 32, 512);
    g.fillStyle = "rgba(70,45,20,0.45)"; g.fillRect(x + 29, 0, 3, 512);
    g.fillStyle = "rgba(255,240,200,0.25)"; g.fillRect(x + 6, 0, 4, 512);
    for (let y = r() * 90; y < 512; y += 90 + r() * 30) { g.fillStyle = "rgba(70,45,20,0.5)"; g.fillRect(x, y, 32, 4); }
  }
});
const causticTex = () => ctex("caustic", 512, 512, (g, r) => {
  g.fillStyle = "#3aa8b8"; g.fillRect(0, 0, 512, 512);
  g.strokeStyle = "rgba(200,255,250,0.55)"; g.lineWidth = 5;
  for (let i = 0; i < 70; i++) { const x = r() * 512, y = r() * 512, rr = 20 + r() * 40; g.beginPath(); g.ellipse(x, y, rr, rr * 0.7, r() * 3, 0, 7); g.stroke(); }
});

// ---------------- pieces ----------------
/** a stone money disc: radius R, thickness th, hole 0.17 R; upright in its local XY plane (faces local +z), base at y = 0 */
const raiGeo = (R: number, th: number) => {
  const s = new THREE.Shape(); s.absarc(0, 0, R, 0, Math.PI * 2, false);
  const h = new THREE.Path(); h.absarc(0, 0, R * 0.17, 0, Math.PI * 2, true); s.holes.push(h);
  const g = new THREE.ExtrudeGeometry(s, { depth: th, bevelEnabled: true, bevelSize: R * 0.06, bevelThickness: th * 0.25, bevelSegments: 3, curveSegments: 40 });
  g.translate(0, R, -th / 2);
  const uv = g.attributes.uv as THREE.BufferAttribute;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / 2.5, uv.getY(i) / 2.5);
  return g;
};
const raiMat = () => lam("raiLime", () => ({ map: rep(limeTex(), 1, 1) }));
export const rai = (b: Batch, x: number, y: number, z: number, R: number, yaw = 0, lean = 0) =>
  b.add(raiGeo(R, R * 0.2), raiMat(), new THREE.Matrix4().compose(V(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(lean, yaw, 0, "YXZ")), V(1, 1, 1)));

const leafMat = (k: number) => lam("palmLeaf" + k, () => ({ color: ["#4f9a3c", "#5aa845", "#468c36"][k % 3], side: THREE.DoubleSide }));
const barkMat = () => lam("palmBark", () => ({ map: rep(ctex("palmBarkT", 128, 256, (g) => { g.fillStyle = "#9a7650"; g.fillRect(0, 0, 128, 256); for (let y = 0; y < 256; y += 22) { g.fillStyle = "#7a5a3a"; g.fillRect(0, y, 128, 6); } }), 1, 3) }));
const LEAF = (() => { // an arched, tapering frond with a midrib fold (smooth normals)
  const g = new THREE.PlaneGeometry(2, 0.7, 16, 4); const p = g.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i) + 1, y = p.getY(i), w = Math.sin(Math.PI * Math.min(1, x / 2 * 1.05)) * (1 - x / 2.4);
    p.setXYZ(i, x, -0.18 * x * x + Math.abs(y) * 0.35, y * w); }
  g.computeVertexNormals(); g.rotateX(0); return g; })();
/** coconut palm: curved trunk, 9 drooping fronds, coconuts */
export const palm = (b: Batch, x: number, z: number, h: number, lean: number, seed: number) => {
  if (inTheWay(x - 1.2, x + 1.2, 0, h + 1, z - 1.2, z + 1.2)) return;
  const r = rng(seed), dir = r() * Math.PI * 2, n = 7;
  let px = x, py = 0, pz = z;
  for (let k = 0; k < n; k++) {
    const u = (k + 1) / n, rad0 = 0.24 - 0.1 * (k / n), seg = h / n;
    const off = lean * h * (u * u - ((k / n) ** 2));
    const nx = px + Math.cos(dir) * off, nz = pz + Math.sin(dir) * off, ny = py + seg;
    const a = V(px, py, pz), c = V(nx, ny, nz), len = a.distanceTo(c);
    const g = new THREE.CylinderGeometry(rad0 * 0.9, rad0, len + 0.05, 10);
    b.add(g, barkMat(), new THREE.Matrix4().compose(a.clone().add(c).multiplyScalar(0.5), new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), c.clone().sub(a).normalize()), V(1, 1, 1)));
    px = nx; py = ny; pz = nz;
  }
  for (let k = 0; k < 11; k++) {
    const yaw = (k / 11) * Math.PI * 2 + r(), droop = 0.15 - r() * 0.3, L = h * (0.2 + r() * 0.05);
    b.add(LEAF, leafMat(k), new THREE.Matrix4().compose(V(px, py, pz), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, yaw, droop, "YZX")), V(L, L, L * 0.7)));
  }
  for (let k = 0; k < 3; k++) b.add(new THREE.SphereGeometry(0.17, 10, 8), lam("coconut", () => ({ color: "#6b4a2a" })), new THREE.Matrix4().makeTranslation(px + Math.cos(k * 2.1) * 0.28, py - 0.25, pz + Math.sin(k * 2.1) * 0.28));
};
/** a thatched hut on a stone platform: front faces local +z */
export const hut = (b: Batch, x: number, z: number, yaw: number, w = 5, d = 4) => {
  if (inTheWay(x - w / 2 - 1.5, x + w / 2 + 1.5, 0, 7, z - d / 2 - 1.5, z + d / 2 + 1.8)) return;
  const m = new THREE.Matrix4().makeRotationY(yaw).setPosition(x, 0, z);
  const plat = lam("platStone", () => ({ map: rep(rockTex(), 1, 1) }));
  const wall = lam("bamboo", () => ({ map: bambooTex() })), roof = lam("thatch", () => ({ map: thatchTex(), side: THREE.DoubleSide }));
  const hw = w / 2, hd = d / 2, P = 0.55, H = 2.3, RH = 3.6, o = 0.7;
  b.add(boxGeo(V(-hw - 1, 0, -hd - 1), V(hw + 1, P, hd + 1.4), 2), plat, m);
  b.add(quad(V(-hw, P, hd), V(hw, P, hd), V(hw, P + H, hd), V(-hw, P + H, hd), w / 2, H / 2), wall, m);
  b.add(quad(V(hw, P, -hd), V(-hw, P, -hd), V(-hw, P + H, -hd), V(hw, P + H, -hd), w / 2, H / 2), wall, m);
  b.add(quad(V(-hw, P, -hd), V(-hw, P, hd), V(-hw, P + H, hd), V(-hw, P + H, -hd), d / 2, H / 2), wall, m);
  b.add(quad(V(hw, P, hd), V(hw, P, -hd), V(hw, P + H, -hd), V(hw, P + H, hd), d / 2, H / 2), wall, m);
  b.add(quad(V(-0.55, P, hd + 0.02), V(0.55, P, hd + 0.02), V(0.55, P + 1.8, hd + 0.02), V(-0.55, P + 1.8, hd + 0.02)), lam("doorDark", () => ({ color: "#3a2a20" })), m);
  const top = P + H;
  b.add(quad(V(-hw - o, top - 0.5, hd + o), V(hw + o, top - 0.5, hd + o), V(hw + o, top + RH, 0), V(-hw - o, top + RH, 0), 2, 2), roof, m);
  b.add(quad(V(hw + o, top - 0.5, -hd - o), V(-hw - o, top - 0.5, -hd - o), V(-hw - o, top + RH, 0), V(hw + o, top + RH, 0), 2, 2), roof, m);
  for (const s of [-1, 1]) b.add(tri(V(s * hw, top, s < 0 ? -hd : hd), V(s * hw, top, s < 0 ? hd : -hd), V(s * hw, top + RH * 0.86, 0)), wall, m);
  // ridge pole sticking out at both gable ends
  b.add(boxGeo(V(-hw - o - 0.5, top + RH - 0.08, -0.08), V(hw + o + 0.5, top + RH + 0.08, 0.08)), lam("pole", () => ({ map: beam() })), m);
};
/** outrigger canoe (local x = bow direction), deck platform with a stone lying on it */
const canoeGroup = (withStone: boolean) => {
  const g = new THREE.Group(), cb = new Batch(), wood = lam("canoeWood", () => ({ color: "#8a5a34" })), dark = lam("canoeDark", () => ({ color: "#5a3a22" }));
  const hull = new THREE.Shape();
  hull.moveTo(-4.2, 0); hull.quadraticCurveTo(-3.6, -0.7, -2.4, -0.75); hull.lineTo(2.4, -0.75); hull.quadraticCurveTo(3.6, -0.7, 4.4, 0.25); hull.lineTo(-4.4, 0.25);
  const hg = new THREE.ExtrudeGeometry(hull, { depth: 0.9, bevelEnabled: false }); hg.translate(0, 0.45, -0.45);
  cb.add(hg, wood);
  cb.add(boxGeo(V(-3.6, 0.7, -0.38), V(3.6, 0.76, 0.38)), dark);
  for (const x of [-1.6, 0.4, 2.2]) cb.add(boxGeo(V(x - 0.08, 0.7, -3.2), V(x + 0.08, 0.84, 0.4)), dark);
  cb.add(boxGeo(V(-2.6, 0.25, -3.4), V(2.8, 0.55, -3.0)), wood); // outrigger float
  for (const x of [-1.6, 0.4, 2.2]) cb.add(boxGeo(V(x - 0.05, 0.5, -3.25), V(x + 0.05, 0.75, -3.15)), dark);
  cb.add(boxGeo(V(-1.9, 0.82, -2.6), V(2.5, 0.9, -0.35)), lam("deck", () => ({ map: rep(beam(), 1, 1) }))); // deck between hull and float
  cb.add(new THREE.CylinderGeometry(0.07, 0.07, 5.2, 8).translate(0, 2.6, 0), dark, new THREE.Matrix4().makeTranslation(0.9, 0.7, 0)); // mast
  const sail = new THREE.Shape(); sail.moveTo(0, 0); sail.lineTo(3.0, 0.6); sail.lineTo(0.2, 4.4); sail.lineTo(0, 0);
  const sg = new THREE.ShapeGeometry(sail); sg.translate(0.95, 1.3, 0.05);
  cb.add(sg, lam("sailCloth", () => ({ color: "#e8d6a8", side: THREE.DoubleSide })));
  cb.build(g);
  let stone: THREE.Mesh | null = null;
  if (withStone) {
    stone = new THREE.Mesh(raiGeo(1.15, 0.26), raiMat()); stone.castShadow = true; stone.receiveShadow = true;
    g.add(stone);
  }
  return { g, stone };
};

export const buildSet = (ctx: BuildCtx) => {
  const { root: R, b, kit } = ctx, r = rng(41);
  // ---- ground: grass inland, dry sand, wet sand, lagoon ----
  b.add(quadUp(-500, 500, 12, 500, 250, 244, 0), ctx.M.grass);
  b.add(quadUp(-500, 500, 2.6, 12, 200, 2, 0), lam("sandM", () => ({ map: rep(sandTex(), 1, 1) })));
  b.add(quadUp(-500, 500, -1.6, 2.6, 200, 1, -0.03), lam("wetM", () => ({ map: rep(wetTex(), 1, 1) })));
  R.add(waterMesh(-900, 900, -900, 0.6, -0.06, [0.15, 0.25]));
  // foam line along the shore
  const foam = new THREE.Mesh(quadUp(-500, 500, -1.0, -0.5, 1, 1, -0.045), new THREE.MeshBasicMaterial({ color: "#f2fbff", transparent: true, opacity: 0.55, depthWrite: false }));
  foam.layers.set(NOINK); R.add(foam);
  // ---- the row of stone money along the path behind the beach ----
  b.add(quadUp(-30, 30, STONE_ROW_Z - 1.6, STONE_ROW_Z + 1.4, 30, 1.5, 0.03), lam("pathStone", () => ({ map: rep(rockTex(), 1, 1) })));
  for (const [x, R0, lean] of [[-14, 0.9, 0.12], [-11, 1.2, 0.1], [-8.2, 0.7, 0.14], [2.6, 1.0, 0.1], [5.6, 1.4, 0.08], [8.8, 0.8, 0.12], [11.6, 1.1, 0.1], [14.6, 0.75, 0.14]] as const)
    rai(b, x, 0.03, STONE_ROW_Z - 0.8, R0, (r() - 0.5) * 0.25, -lean);
  rai(b, BIG[0], 0.03, BIG[2] - 0.6, 1.8, 0.06, -0.08); // the giant one (3.6 m)
  ub(b, lam("stoneProp", () => ({ map: rep(rockTex(), 1, 1) })), BIG[0] - 2.2, BIG[0] + 2.2, 0, 0.18, BIG[2] - 1.2, BIG[2]);
  // ---- village: huts on platforms around the green ----
  for (const [x, z, yaw, w] of [[-14, 30, 0.25, 5], [-4, 34, 0, 6], [HUT_FAMILY[0], HUT_FAMILY[2] - 2.5, -0.1, 5], [20, 33, -0.35, 5], [-24, 40, 0.4, 5], [28, 44, -0.5, 6], [-8, 50, 0.1, 6], [12, 52, -0.15, 5]] as const)
    hut(b, x, z, yaw, w, 4);
  // fire pit, baskets, a beached canoe, drying nets
  b.add(new THREE.CylinderGeometry(1.1, 1.2, 0.25, 16), lam("pitStone", () => ({ map: rep(rockTex(), 1, 1) })), new THREE.Matrix4().makeTranslation(-1, 0.12, 27));
  for (let k = 0; k < 6; k++) b.add(new THREE.CylinderGeometry(0.06, 0.06, 1.0, 6).rotateZ(Math.PI / 2), lam("pole", () => ({ map: beam() })), new THREE.Matrix4().compose(V(-1, 0.4, 27), new THREE.Quaternion().setFromEuler(new THREE.Euler(0.5, k, 0)), V(1, 1, 1)));
  for (const [x, z] of [[6, 24], [7, 24.6], [-9, 26]] as const) b.add(new THREE.CylinderGeometry(0.35, 0.28, 0.45, 14), lam("basket", () => ({ map: rep(bambooTex(), 1, 1) })), new THREE.Matrix4().makeTranslation(x, 0.22, z));
  // ---- palms: along the beach and in the village ----
  for (let i = 0; i < 46; i++) {
    const x = -120 + i * 5.4 + (r() - 0.5) * 3, z = i % 2 ? 6 + r() * 4 : 18 + r() * 30;
    if (Math.abs(x) < 3 && z < 30) continue;
    palm(b, x, z, 7 + r() * 4, 0.12 + r() * 0.25, i + 3);
  }
  for (let i = 0; i < 70; i++) { const x = (r() - 0.5) * 400, z = 60 + r() * 200; palm(b, x, z, 8 + r() * 5, 0.1 + r() * 0.2, i + 100); }
  for (let i = 0; i < 40; i++) prop(b, kit, ["plant_bushDetailed", "plant_bush", "tree_fat"][i % 3], (r() - 0.5) * 120, 0, 14 + r() * 60, 1.2 + r() * (i % 3 === 2 ? 5 : 1), r() * 6);
  // distant islands (the quarry island far out on the horizon in the aerial)
  const hill = new THREE.SphereGeometry(1, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2);
  for (const [x, z, sx, sy, sz] of [[-420, -380, 160, 40, 90], [380, -460, 200, 55, 110], [520, 150, 160, 60, 140], [-500, 260, 220, 70, 160]] as const)
    b.add(hill, lam("islandG", () => ({ color: "#5f9a4a" })), new THREE.Matrix4().compose(V(x, -2, z), new THREE.Quaternion(), V(sx, sy, sz)));
  // ---- the quarry: a limestone cliff with a half-carved disc, rubble, tools ----
  const rockM = lam("rockM", () => ({ map: rep(rockTex(), 1, 1) })), limeM = raiMat();
  for (const [dx, w, h, dz] of [[-8, 6, 7, 0], [-2, 7, 9, -0.6], [5, 6, 8, 0.2], [11, 6, 6, -0.4]] as const)
    b.add(boxGeo(V(QUARRY[0] + dx - w / 2, 0, QUARRY[2] - 4 + dz), V(QUARRY[0] + dx + w / 2, h, QUARRY[2] + dz), 3), limeM);
  b.add(raiGeo(1.3, 0.35), limeM, new THREE.Matrix4().makeTranslation(QUARRY[0] - 0.2, 0.3, QUARRY[2] + 0.12));
  for (let k = 0; k < 14; k++) b.add(new THREE.DodecahedronGeometry(0.2 + r() * 0.35, 0), rockM, new THREE.Matrix4().makeTranslation(QUARRY[0] + (r() - 0.5) * 12, 0.15, QUARRY[2] + 1 + r() * 4));
  rai(b, QUARRY[0] + 4.2, 0, QUARRY[2] + 2.4, 1.0, -0.4, -0.1);
  // ---- the seabed: sand, rocks, seaweed, coral, the light from above ----
  const [ux, uy, uz] = UW;
  b.add(quadUp(ux - 80, ux + 80, uz - 80, uz + 80, 40, 40, uy), lam("seabed", () => ({ map: rep(seabedTex(), 1, 1) })));
  for (let k = 0; k < 40; k++) b.add(new THREE.DodecahedronGeometry(0.4 + r() * 1.4, 1), lam("reefRock", () => ({ color: "#7d8a7a" })), new THREE.Matrix4().compose(V(ux + (r() - 0.5) * 50, uy, uz + (r() - 0.5) * 50), new THREE.Quaternion(), V(1, 0.6, 1)));
  for (let k = 0; k < 120; k++) {
    const x = ux + (r() - 0.5) * 40, z = uz + (r() - 0.5) * 40;
    if (Math.hypot(x - ux, z - uz) < 2.6) continue;
    const h = 0.8 + r() * 2.2, col = ["#3f8a4a", "#5aa45a", "#2f7a5a", "#c2645a", "#e08a6a", "#a85aa0"][k % 6];
    if (k % 6 < 3) b.add(new THREE.ConeGeometry(0.12, h, 5).translate(0, h / 2, 0), lam("weed" + col, () => ({ color: col })), new THREE.Matrix4().compose(V(x, uy, z), new THREE.Quaternion().setFromEuler(new THREE.Euler((r() - 0.5) * 0.4, 0, (r() - 0.5) * 0.4)), V(1, 1, 1)));
    else b.add(new THREE.SphereGeometry(0.35 + r() * 0.3, 10, 8), lam("coral" + col, () => ({ color: col })), new THREE.Matrix4().compose(V(x, uy + 0.15, z), new THREE.Quaternion(), V(1, 0.7 + r() * 0.6, 1)));
  }
  const surf = new THREE.Mesh(quadUp(ux - 120, ux + 120, uz - 120, uz + 120, 1, 1, uy + 13).rotateX(0), new THREE.MeshBasicMaterial({ map: rep(causticTex(), 12, 12), side: THREE.BackSide, color: "#bff6ff" }));
  surf.layers.set(NOINK); R.add(surf);

  // ---- dynamic: the canoe with its stone, the sunken stone ----
  const canoe = canoeGroup(true); canoe.g.traverse((o) => { o.castShadow = true; o.receiveShadow = true; }); R.add(canoe.g);
  const sunk = new THREE.Mesh(raiGeo(1.15, 0.26), raiMat()); sunk.castShadow = true; sunk.receiveShadow = true; R.add(sunk);
  const beached = canoeGroup(false); beached.g.position.set(-18, 0.0, 4.5); beached.g.rotation.y = 0.3; R.add(beached.g);
  return (id: number, t: number, f: number) => {
    const storm = id === 5, x = canoeX(t);
    canoe.g.visible = id === 4 || id === 5;
    const roll = storm ? 0.16 * Math.sin(t * 2.3) + 0.06 * Math.sin(t * 5.1) : 0.03 * Math.sin(t * 1.7);
    const pitch = storm ? 0.1 * Math.sin(t * 1.9 + 1) : 0.015 * Math.sin(t * 1.3);
    canoe.g.position.set(x, -0.2 + (storm ? 0.35 * Math.sin(t * 2.3 + 0.5) : 0.05 * Math.sin(t * 1.7)), CANOE_Z);
    canoe.g.rotation.set(roll, 0, pitch);
    if (canoe.stone) {
      // lying flat on the deck; in the storm it slides off the far side and is gone (frame 729 on)
      const tip = id === 5 ? clamp01((f - 726) / 12) : 0;
      canoe.stone.visible = !(id === 5 && f > 740) && id !== 6;
      canoe.stone.rotation.set(-Math.PI / 2 + tip * 1.2, 0, 0);
      canoe.stone.position.set(0.3, 0.9 + 0.14 - tip * 1.4, -1.45 + 1.15 - tip * 2.2);
    }
    // the sunken stone: resting half-buried and tilted; sinking in shot 6
    const rest = { y: UW[1] - 0.2, rx: -1.15, rz: 0.3 };
    if (id === 6) {
      const u = smooth((f - 743) / 34);
      sunk.position.set(UW[0], UW[1] + 9.5 * (1 - u) + rest.y - UW[1], UW[2]);
      sunk.rotation.set(rest.rx * u - 0.4 * (1 - u), t * 0.3, rest.rz * u);
    } else { sunk.position.set(UW[0], rest.y, UW[2]); sunk.rotation.set(rest.rx, 0.4, rest.rz); }
    void FPS;
  };
};
