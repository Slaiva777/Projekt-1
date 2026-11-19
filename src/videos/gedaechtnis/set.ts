// The 1950s clinic: ward, operating room and lab side by side (open-roofed rooms with painted walls), the park in
// front with paths, benches, lamps and trees, and a bicycle on the path (dynamic, shot 13).
import * as THREE from "three";
import { Batch, V, lam, boxGeo, prop, house } from "../../engine/build";
import { ctex, rng, rep, beam } from "../../engine/paint";
import { BuildCtx, quadUp, ub, noiseTex } from "../../engine/world";
import { room, RoomStyle } from "../../engine/interior";
import { NOINK } from "../../engine/ink";
import { WARD, OR, LAB, TABLE, BOARD, BENCH, bikeX } from "./story";

const WOOD = () => lam("woodF", () => ({ map: rep(beam(), 1, 1) }));
const METAL = () => lam("metalF", () => ({ color: "#c9cdd2" }));
const table = (b: Batch, x: number, z: number, w: number, d: number, h = 0.76, mat = WOOD()) => {
  ub(b, mat, x - w / 2, x + w / 2, h - 0.06, h, z - d / 2, z + d / 2);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) ub(b, mat, x + sx * (w / 2 - 0.08) - 0.03, x + sx * (w / 2 - 0.08) + 0.03, 0, h - 0.06, z + sz * (d / 2 - 0.08) - 0.03, z + sz * (d / 2 - 0.08) + 0.03);
};
const chair = (b: Batch, x: number, z: number, back: number) => {
  const m = WOOD();
  ub(b, m, x - 0.22, x + 0.22, 0.44, 0.48, z - 0.22, z + 0.22);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) ub(b, m, x + sx * 0.18 - 0.02, x + sx * 0.18 + 0.02, 0, 0.44, z + sz * 0.18 - 0.02, z + sz * 0.18 + 0.02);
  ub(b, m, x - 0.22, x + 0.22, 0.48, 0.95, z + back * 0.2 - 0.02, z + back * 0.2 + 0.02);
};
const shelf = (b: Batch, x: number, z: number, w: number, r: () => number) => {
  ub(b, WOOD(), x - w / 2, x + w / 2, 0, 2.0, z - 0.18, z + 0.02);
  for (let k = 0; k < 4; k++) for (let i = 0; i < w / 0.06 - 2; i++) {
    if (r() < 0.15) continue;
    const bx = x - w / 2 + 0.05 + i * 0.06, bh = 0.28 + r() * 0.12, col = ["#8c3b4a", "#3f5a7a", "#5d7a3a", "#c2a25a", "#6a4a3a", "#2f5f6a"][Math.floor(r() * 6)];
    ub(b, lam("book" + col, () => ({ color: col })), bx, bx + 0.05, 0.1 + k * 0.48, 0.1 + k * 0.48 + bh, z - 0.16, z + 0.04);
  }
};
const chalkTex = () => ctex("chalkboard", 1024, 512, (g) => {
  g.fillStyle = "#2f4a3a"; g.fillRect(0, 0, 1024, 512);
  for (let i = 0; i < 400; i++) { g.fillStyle = "rgba(255,255,255,0.03)"; g.fillRect(Math.random() * 1024, Math.random() * 512, 30, 8); }
  g.strokeStyle = "#8a5a34"; g.lineWidth = 26; g.strokeRect(0, 0, 1024, 512);
  g.strokeStyle = "rgba(245,245,235,0.9)"; g.lineWidth = 7; g.lineCap = "round"; g.lineJoin = "round";
  // left: a film strip of memories (pictures)
  g.strokeRect(90, 140, 330, 230);
  for (let k = 0; k < 3; k++) { g.strokeRect(110 + k * 105, 175, 85, 85); }
  g.beginPath(); g.arc(152, 205, 14, 0, 7); g.moveTo(130, 250); g.lineTo(150, 225); g.lineTo(175, 250); g.stroke();
  g.beginPath(); g.arc(262, 210, 22, 0, 7); g.stroke(); g.beginPath(); g.arc(367, 205, 10, 0, 7); g.moveTo(345, 255); g.lineTo(390, 255); g.stroke();
  for (let k = 0; k < 8; k++) { g.strokeRect(100 + k * 40, 150, 14, 10); g.strokeRect(100 + k * 40, 340, 14, 10); }
  // right: a bicycle (skill)
  g.beginPath(); g.arc(640, 300, 70, 0, 7); g.stroke(); g.beginPath(); g.arc(860, 300, 70, 0, 7); g.stroke();
  g.beginPath(); g.moveTo(640, 300); g.lineTo(720, 190); g.lineTo(820, 190); g.lineTo(860, 300); g.moveTo(720, 190); g.lineTo(750, 300); g.lineTo(640, 300); g.moveTo(750, 300); g.lineTo(820, 190); g.moveTo(700, 175); g.lineTo(745, 175); g.moveTo(820, 190); g.lineTo(810, 160); g.lineTo(840, 150); g.stroke();
  // the divider
  g.setLineDash([20, 18]); g.beginPath(); g.moveTo(512, 80); g.lineTo(512, 440); g.stroke(); g.setLineDash([]);
});
const brainPoster = () => ctex("brainPoster", 400, 500, (g) => {
  g.fillStyle = "#f3ecd8"; g.fillRect(0, 0, 400, 500); g.strokeStyle = "#241726"; g.lineWidth = 8; g.strokeRect(4, 4, 392, 492);
  g.fillStyle = "#f2a6b0"; g.beginPath(); g.ellipse(200, 230, 150, 115, 0, 0, 7); g.fill(); g.stroke();
  g.lineWidth = 5; for (let k = 0; k < 6; k++) { g.beginPath(); g.arc(110 + k * 36, 200 + (k % 2) * 40, 30, 0.3, 2.6); g.stroke(); }
  g.fillStyle = "#c86a7a"; g.beginPath(); g.ellipse(230, 290, 40, 18, 0.3, 0, 7); g.fill();
});
const lampHead = () => { const g = new THREE.SphereGeometry(0.9, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2); g.scale(1, 0.45, 1); g.rotateX(Math.PI); return g; };

export const buildSet = (ctx: BuildCtx) => {
  const { root: R, b, kit } = ctx, r = rng(77), ceil = new Batch();
  const styles: Record<string, RoomStyle> = {
    ward: { lower: "#9cbfa8", upper: "#f2ead8", rail: "#7a8f80", floor: "planks", floorA: "#b98a5a", floorB: "#a87a4c", outer: "#e3d2b8", windows: 2, frames: true },
    or: { lower: "#bfe0d8", upper: "#e8f2ee", rail: "#8ab0a8", floor: "tiles", floorA: "#dfe8e4", floorB: "#c8d6d0", outer: "#e3d2b8", windows: 2, tiledWalls: true },
    lab: { lower: "#7f9ab5", upper: "#efe6d2", rail: "#5a6f86", floor: "planks", floorA: "#c49a62", floorB: "#b3884f", outer: "#e3d2b8", windows: 2, frames: true },
  };
  room(b, ceil, "ward", WARD[0], WARD[2], 9, 9, 3.6, styles.ward, [{ wall: "left", at: 6.5 }]);
  room(b, ceil, "or", OR[0], OR[2], 9, 9, 3.6, styles.or, [{ wall: "right", at: 2.5 }]);
  room(b, ceil, "lab", LAB[0], LAB[2], 9, 9, 3.6, styles.lab, [{ wall: "left", at: 6.4 }]);
  // ---- ward: two beds, side table, a vase of flowers, a hanging lamp ----
  for (const dx of [-0.2, 2.6]) {
    const x = WARD[0] + dx, z = WARD[2] - 2.6;
    ub(b, METAL(), x - 0.5, x + 0.5, 0, 0.5, z - 1.0, z + 1.0);
    ub(b, lam("sheet", () => ({ color: "#f6f4ee" })), x - 0.52, x + 0.52, 0.5, 0.62, z - 1.02, z + 1.02);
    ub(b, lam("blanket", () => ({ color: "#8fb0c8" })), x - 0.54, x + 0.54, 0.55, 0.66, z - 0.2, z + 1.04);
    ub(b, METAL(), x - 0.52, x + 0.52, 0, 1.15, z - 1.06, z - 0.98);
  }
  table(b, WARD[0] + 1.2, WARD[2] - 3.4, 0.5, 0.5, 0.65);
  b.add(new THREE.CylinderGeometry(0.07, 0.09, 0.22, 10).translate(0, 0.11, 0), lam("vase", () => ({ color: "#3f6fb5" })), new THREE.Matrix4().makeTranslation(WARD[0] + 1.2, 0.65, WARD[2] - 3.4));
  for (let k = 0; k < 5; k++) b.add(new THREE.SphereGeometry(0.05, 8, 6), lam("flower" + k, () => ({ color: ["#e2453c", "#f2c24a", "#f29ab0"][k % 3] })), new THREE.Matrix4().makeTranslation(WARD[0] + 1.2 + Math.cos(k) * 0.06, 0.95 + (k % 2) * 0.04, WARD[2] - 3.4 + Math.sin(k) * 0.06));
  chair(b, WARD[0] - 2.4, WARD[2] - 0.8, 1);
  // ---- operating room: table with a covered patient, the big lamp, instrument carts ----
  ub(b, METAL(), OR[0] - 0.5, OR[0] + 0.5, 0, 0.9, OR[2] - 1.4, OR[2] + 0.4);
  ub(b, lam("orSheet", () => ({ color: "#a8d0c0" })), OR[0] - 0.56, OR[0] + 0.56, 0.9, 1.08, OR[2] - 1.45, OR[2] + 0.45);
  b.add(new THREE.SphereGeometry(0.22, 14, 10), lam("orSheet", () => ({ color: "#a8d0c0" })), new THREE.Matrix4().makeTranslation(OR[0], 1.12, OR[2] + 0.25));
  b.add(new THREE.CylinderGeometry(0.03, 0.03, 1.4, 8).translate(0, 0.7, 0), METAL(), new THREE.Matrix4().makeTranslation(OR[0], 2.2, OR[2] - 0.4));
  b.add(lampHead(), METAL(), new THREE.Matrix4().makeTranslation(OR[0], 2.3, OR[2] - 0.4));
  for (let k = 0; k < 6; k++) {
    const bulb = new THREE.Mesh(new THREE.CircleGeometry(0.16, 16), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.4, 2.35, 2.1) }));
    bulb.rotation.x = Math.PI / 2; bulb.position.set(OR[0] + Math.cos(k) * 0.45, 1.88, OR[2] - 0.4 + Math.sin(k) * 0.45); bulb.layers.set(NOINK); R.add(bulb);
  }
  for (const [x, z] of [[OR[0] + 2.2, OR[2] - 1.0], [OR[0] - 2.4, OR[2] - 2.2]] as const) { table(b, x, z, 0.8, 0.5, 0.9, METAL()); for (let k = 0; k < 4; k++) ub(b, METAL(), x - 0.3 + k * 0.15, x - 0.22 + k * 0.15, 0.9, 0.93, z - 0.12, z + 0.12); }
  b.add(new THREE.PlaneGeometry(1.1, 1.4), lam("brainPoster", () => ({ map: brainPoster() })), new THREE.Matrix4().makeTranslation(OR[0] + 2.6, 2.0, OR[2] - 4.45));
  // ---- lab: the table with the mirror apparatus, chairs, chalkboard, shelves, cabinets ----
  table(b, TABLE[0], TABLE[2], 1.6, 0.9);
  chair(b, TABLE[0], TABLE[2] - 0.75, -1);
  chair(b, TABLE[0] + 1.3, TABLE[2] + 0.2, 1);
  ub(b, lam("mirrorFrame", () => ({ color: "#5a3b2a" })), TABLE[0] - 0.78, TABLE[0] - 0.74, 0.76, 1.08, TABLE[2] - 0.35, TABLE[2] + 0.05);
  b.add(new THREE.PlaneGeometry(0.56, 0.4), new THREE.MeshBasicMaterial({ map: ctex("mirrorGlass", 128, 96, (g) => { const gr = g.createLinearGradient(0, 0, 128, 96); gr.addColorStop(0, "#e8f6ff"); gr.addColorStop(0.5, "#a8cbe0"); gr.addColorStop(1, "#d8ecfa"); g.fillStyle = gr; g.fillRect(0, 0, 128, 96); g.fillStyle = "rgba(255,255,255,0.7)"; g.fillRect(20, 0, 14, 96); g.fillRect(44, 0, 6, 96); }) }), new THREE.Matrix4().makeTranslation(TABLE[0] - 0.73, 0.93, TABLE[2] - 0.15).multiply(new THREE.Matrix4().makeRotationY(Math.PI / 2)).multiply(new THREE.Matrix4().makeScale(0.7, 0.7, 1)));
  if (0) ub(b, lam("screenBoard", () => ({ color: "#d8c8a8" })), TABLE[0] - 0.3, TABLE[0] + 0.3, 0.93, 0.95, TABLE[2] - 0.4, TABLE[2] - 0.05); // the screen that hides the hand
  ub(b, lam("paperW", () => ({ color: "#fbf8ee" })), TABLE[0] - 0.2, TABLE[0] + 0.2, 0.765, 0.77, TABLE[2] - 0.2, TABLE[2] + 0.15);
  b.add(new THREE.PlaneGeometry(3.2, 1.6), lam("chalk", () => ({ map: chalkTex() })), new THREE.Matrix4().makeTranslation(BOARD[0], 2.0, BOARD[2] + 0.04));
  ub(b, WOOD(), BOARD[0] - 1.7, BOARD[0] + 1.7, 1.12, 1.18, BOARD[2], BOARD[2] + 0.12);
  shelf(b, LAB[0] + 3.0, LAB[2] - 4.3, 2.0, r);
  for (let k = 0; k < 3; k++) ub(b, lam("cabinet", () => ({ color: "#8a9aa8" })), LAB[0] + 4.1, LAB[0] + 4.45, 0, 1.3, LAB[2] - 2 + k * 0.6, LAB[2] - 1.45 + k * 0.6);
  table(b, LAB[0] - 3.4, LAB[2] - 1.5, 1.0, 1.8);
  b.add(new THREE.CylinderGeometry(0.1, 0.16, 0.05, 12), METAL(), new THREE.Matrix4().makeTranslation(LAB[0] - 3.4, 0.79, LAB[2] - 2.0));
  b.add(new THREE.CylinderGeometry(0.02, 0.02, 0.45, 6).translate(0, 0.22, 0), METAL(), new THREE.Matrix4().makeTranslation(LAB[0] - 3.4, 0.8, LAB[2] - 2.0));
  b.add(new THREE.ConeGeometry(0.16, 0.18, 14, 1, true), lam("lampShade", () => ({ color: "#3f6f5a", side: THREE.DoubleSide })), new THREE.Matrix4().makeTranslation(LAB[0] - 3.3, 1.25, LAB[2] - 2.0));
  for (let k = 0; k < 5; k++) ub(b, lam("paperW", () => ({ color: "#fbf8ee" })), LAB[0] - 3.8 + k * 0.12, LAB[0] - 3.5 + k * 0.12, 0.77, 0.775 + k * 0.004, LAB[2] - 1.2, LAB[2] - 0.8);
  // ---- the park in front ----
  b.add(quadUp(-400, 400, 5, 400, 200, 197.5, 0), ctx.M.grass);
  b.add(quadUp(-400, 400, -400, 5, 200, 202.5, -0.01), ctx.M.grass);
  const pathM = lam("gravel", () => ({ map: rep(noiseTex("gravel", "#d8ccb4", ["#c8bca4", "#e6dcc8", "#b8ac94"], 2400, 512, 3), 1, 1) }));
  b.add(quadUp(-60, 60, 12.8, 15.6, 30, 1.4, 0.02), pathM);
  b.add(quadUp(-30, 30, 4.75, 7.5, 15, 1.4, 0.02), pathM);
  for (const x of [-20, 0, 20]) b.add(quadUp(x - 1.2, x + 1.2, 7.5, 12.8, 1.2, 2.6, 0.021), pathM);
  for (const x of [BENCH[0], -12, 26]) {
    ub(b, WOOD(), x - 1.0, x + 1.0, 0.42, 0.47, BENCH[2] - 0.2, BENCH[2] + 0.2);
    ub(b, WOOD(), x - 1.0, x + 1.0, 0.5, 0.9, BENCH[2] - 0.24, BENCH[2] - 0.2);
    for (const s of [-1, 1]) ub(b, lam("benchIron", () => ({ color: "#2b2f2a" })), x + s * 0.85 - 0.03, x + s * 0.85 + 0.03, 0, 0.46, BENCH[2] - 0.2, BENCH[2] + 0.2);
  }
  for (let x = -40; x <= 40; x += 10) {
    b.add(new THREE.CylinderGeometry(0.05, 0.07, 3.2, 8).translate(0, 1.6, 0), lam("lampPost", () => ({ color: "#2b2f2a" })), new THREE.Matrix4().makeTranslation(x + 3, 0, 12.3));
    b.add(new THREE.SphereGeometry(0.2, 12, 8), lam("lampGlobe", () => ({ color: "#fff6dc" })), new THREE.Matrix4().makeTranslation(x + 3, 3.3, 12.3));
  }
  const trees = ["tree_oak", "tree_default", "tree_detailed", "tree_fat", "tree-high-round"];
  for (let i = 0; i < 26; i++) prop(b, kit, trees[i % 5], -60 + i * 4.8 + (r() - 0.5) * 2, 0, 18.5 + r() * 12, 7 + r() * 4, r() * 6);
  for (let i = 0; i < 18; i++) prop(b, kit, "plant_bushDetailed", -30 + i * 3.4, 0, 5.6 + (i % 2) * 0.4, 1.0 + r() * 0.3, r() * 6);
  for (let i = 0; i < 40; i++) prop(b, kit, trees[i % 5], (r() - 0.5) * 300, 0, 40 + r() * 140, 9 + r() * 5, r() * 6);
  for (const [x, w] of [[-40, 14], [40, 14], [-58, 12], [58, 12]] as const) house(b, x, 0, 0, w, 10, 9.8, Math.floor(r() * 8));
  ceil.build(R, false);
  // ---- dynamic: a bicycle on the path (shot 13) ----
  const bike = new THREE.Group(), bb = new Batch(), frame = lam("bikeRed", () => ({ color: "#c2453f" })), tyre = lam("tyre", () => ({ color: "#26232a" }));
  for (const x of [-0.55, 0.55]) bb.add(new THREE.TorusGeometry(0.33, 0.035, 8, 28), tyre, new THREE.Matrix4().makeTranslation(x, 0.35, 0));
  const tube = (a: THREE.Vector3, c: THREE.Vector3) => bb.add(new THREE.CylinderGeometry(0.025, 0.025, a.distanceTo(c), 8), frame, new THREE.Matrix4().compose(a.clone().add(c).multiplyScalar(0.5), new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), c.clone().sub(a).normalize()), V(1, 1, 1)));
  const rear = V(-0.55, 0.35, 0), front = V(0.55, 0.35, 0), seat = V(-0.2, 0.85, 0), head = V(0.42, 0.9, 0), crank = V(0, 0.32, 0);
  tube(rear, seat); tube(seat, head); tube(head, front); tube(seat, crank); tube(crank, head); tube(rear, crank);
  ub(bb, lam("saddle", () => ({ color: "#3a2a20" })), -0.32, -0.1, 0.88, 0.94, -0.06, 0.06);
  ub(bb, lam("handle", () => ({ color: "#2b2f2a" })), 0.38, 0.46, 0.95, 0.99, -0.25, 0.25);
  bb.build(bike);
  bike.position.set(0, 0.02, 14.2); R.add(bike);
  void boxGeo;
  return (id: number, t: number) => { bike.visible = id === 13; bike.position.x = bikeX(t); };
};
