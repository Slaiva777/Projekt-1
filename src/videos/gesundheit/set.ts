// Vienna 1847: the hospital wings (two wards, the dissection room, Semmelweis' study, a later lab), a modern bathroom,
// the courtyard with trees and benches, the gate and the street outside.
import * as THREE from "three";
import { Batch, V, lam, house, prop, boxGeo } from "../../engine/build";
import { rng, rep, beam, cobbleHD, stoneHD, ctex } from "../../engine/paint";
import { BuildCtx, quadUp, ub, noiseTex } from "../../engine/world";
import { room, RoomStyle } from "../../engine/interior";
import { NOINK } from "../../engine/ink";
import { WARD_DOC, WARD_MID, DISSECT, OFFICE, SCILAB, BATH, BASIN, GATE, STREET_Z } from "./story";

const WOOD = () => lam("woodF", () => ({ map: rep(beam(), 1, 1) }));
const IRON = () => lam("ironBed", () => ({ color: "#4a4f58" }));
const table = (b: Batch, x: number, z: number, w: number, d: number, h = 0.78, mat = WOOD()) => {
  ub(b, mat, x - w / 2, x + w / 2, h - 0.06, h, z - d / 2, z + d / 2);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) ub(b, mat, x + sx * (w / 2 - 0.08) - 0.03, x + sx * (w / 2 - 0.08) + 0.03, 0, h - 0.06, z + sz * (d / 2 - 0.08) - 0.03, z + sz * (d / 2 - 0.08) + 0.03);
};
/** iron bed with linen along -z (head against the back wall) */
const bed = (b: Batch, x: number, z: number, blanket: string) => {
  ub(b, IRON(), x - 0.48, x + 0.48, 0.35, 0.45, z - 0.95, z + 0.95);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) ub(b, IRON(), x + sx * 0.45 - 0.025, x + sx * 0.45 + 0.025, 0, 0.45, z + sz * 0.92 - 0.025, z + sz * 0.92 + 0.025);
  ub(b, IRON(), x - 0.48, x + 0.48, 0, 1.1, z - 0.98, z - 0.94);
  ub(b, lam("linen", () => ({ color: "#f6f2e6" })), x - 0.46, x + 0.46, 0.45, 0.58, z - 0.93, z + 0.93);
  ub(b, lam("blanket" + blanket, () => ({ color: blanket })), x - 0.48, x + 0.48, 0.5, 0.62, z - 0.2, z + 0.95);
  ub(b, lam("pillow", () => ({ color: "#ffffff" })), x - 0.3, x + 0.3, 0.58, 0.68, z - 0.9, z - 0.55);
};
const germTex = () => ctex("germPoster", 400, 300, (g) => {
  g.fillStyle = "#f3ecd8"; g.fillRect(0, 0, 400, 300); g.strokeStyle = "#241726"; g.lineWidth = 6; g.strokeRect(3, 3, 394, 294);
  for (let k = 0; k < 6; k++) { g.fillStyle = ["#7ac25a", "#5aa8c2", "#c27ad8"][k % 3]; g.beginPath(); g.ellipse(60 + k * 55, 150 + Math.sin(k) * 50, 26, 18, k, 0, 7); g.fill(); g.stroke(); }
});

export const buildSet = (ctx: BuildCtx) => {
  const { root: R, b, kit } = ctx, r = rng(91), ceil = new Batch();
  const S: Record<string, RoomStyle> = {
    doc: { lower: "#7f8f86", upper: "#d8d2c0", rail: "#5a6a62", floor: "planks", floorA: "#9a7a58", floorB: "#8a6c4c", outer: "#e2c49a", windows: 3 },
    mid: { lower: "#c9a86a", upper: "#f6eed8", rail: "#a07a3e", floor: "planks", floorA: "#c49a62", floorB: "#b3884f", outer: "#e2c49a", windows: 3, frames: true },
    dis: { lower: "#8a8f94", upper: "#bfc2bd", rail: "#5a5f64", floor: "stone", floorA: "#a8a49a", floorB: "#9a968c", outer: "#d8c4a0", windows: 1 },
    off: { lower: "#6a4a3a", upper: "#e8dcc0", rail: "#4a3428", floor: "planks", floorA: "#8a5a34", floorB: "#7a4f2e", outer: "#e2c49a", windows: 1, frames: true },
    sci: { lower: "#5a7a6a", upper: "#e6e0cc", rail: "#3f5a4a", floor: "planks", floorA: "#b3884f", floorB: "#a07a46", outer: "#e2c49a", windows: 1, frames: true },
    bath: { lower: "#9fd0e0", upper: "#eef6f8", rail: "#6aa8c0", floor: "tiles", floorA: "#e8eef2", floorB: "#c8d8e2", outer: "#f2ece0", windows: 1, tiledWalls: true },
  };
  room(b, ceil, "doc", WARD_DOC[0], WARD_DOC[2], 14, 8, 4.0, S.doc, [{ wall: "right", at: 6.5 }]);
  room(b, ceil, "mid", WARD_MID[0], WARD_MID[2], 14, 8, 4.0, S.mid, [{ wall: "left", at: 6.5 }]);
  room(b, ceil, "dis", DISSECT[0], DISSECT[2], 8, 8, 4.0, S.dis, [{ wall: "front", at: 6.5 }]);
  room(b, ceil, "off", OFFICE[0], OFFICE[2], 7, 7, 3.6, S.off);
  room(b, ceil, "sci", SCILAB[0], SCILAB[2], 7, 7, 3.6, S.sci);
  room(b, ceil, "bath", BATH[0], BATH[2], 6, 6, 3.0, S.bath);
  // ---- wards: rows of beds ----
  for (let k = 0; k < 6; k++) bed(b, WARD_DOC[0] - 5.6 + k * 1.9, WARD_DOC[2] - 2.9, "#8a9aa8");
  for (let k = 0; k < 6; k++) bed(b, WARD_MID[0] - 5.6 + k * 1.9, WARD_MID[2] - 2.9, ["#e8b4a0", "#b4d0a0", "#f2d890"][k % 3]);
  for (let k = 0; k < 3; k++) {
    const x = WARD_MID[0] - 4.6 + k * 3.8;
    b.add(new THREE.CylinderGeometry(0.08, 0.1, 0.25, 10).translate(0, 0.12, 0), lam("vaseM", () => ({ color: "#3f6fb5" })), new THREE.Matrix4().makeTranslation(x, 0.62, WARD_MID[2] - 3.7));
    for (let f = 0; f < 4; f++) b.add(new THREE.SphereGeometry(0.06, 8, 6), lam("flw" + f, () => ({ color: ["#e2453c", "#f2c24a", "#f29ab0", "#ffffff"][f] })), new THREE.Matrix4().makeTranslation(x + Math.cos(f * 1.6) * 0.07, 0.93, WARD_MID[2] - 3.7 + Math.sin(f * 1.6) * 0.07));
    table(b, x, WARD_MID[2] - 3.7, 0.4, 0.4, 0.62);
  }
  // cradles in the midwives' ward
  for (let k = 0; k < 3; k++) { const x = WARD_MID[0] - 4.6 + k * 3.8 + 0.95; ub(b, WOOD(), x - 0.3, x + 0.3, 0.2, 0.55, WARD_MID[2] - 1.4, WARD_MID[2] - 0.9); }
  // ---- the chlorine basin: stand, bowl, bottle, towel ----
  table(b, BASIN[0], BASIN[2], 0.8, 0.6, 0.85);
  b.add(new THREE.CylinderGeometry(0.34, 0.22, 0.2, 20, 1, true), lam("bowl", () => ({ color: "#e8eef2", side: THREE.DoubleSide })), new THREE.Matrix4().makeTranslation(BASIN[0], 0.95, BASIN[2]));
  const water = new THREE.Mesh(new THREE.CircleGeometry(0.31, 20), new THREE.MeshBasicMaterial({ color: "#bfe8e0" })); water.rotation.x = -Math.PI / 2; water.position.set(BASIN[0], 1.02, BASIN[2]); water.layers.set(NOINK); R.add(water);
  b.add(new THREE.CylinderGeometry(0.07, 0.08, 0.32, 12).translate(0, 0.16, 0), lam("bottleG", () => ({ color: "#5a9a7a" })), new THREE.Matrix4().makeTranslation(BASIN[0] + 0.3, 0.85, BASIN[2] - 0.15));
  ub(b, lam("towel", () => ({ color: "#f6f2e6" })), BASIN[0] - 0.42, BASIN[0] - 0.38, 0.45, 0.85, BASIN[2] - 0.2, BASIN[2] + 0.2);
  // ---- dissection room: a slab with a sheet (no more), jars, a lamp ----
  ub(b, lam("slab", () => ({ map: rep(stoneHD("slabS"), 1, 1) })), DISSECT[0] - 0.55, DISSECT[0] + 0.55, 0, 0.85, DISSECT[2] - 1.6, DISSECT[2] + 0.4);
  ub(b, lam("sheetD", () => ({ color: "#e8e6dc" })), DISSECT[0] - 0.5, DISSECT[0] + 0.5, 0.85, 1.05, DISSECT[2] - 1.5, DISSECT[2] + 0.3);
  for (let k = 0; k < 8; k++) b.add(new THREE.CylinderGeometry(0.09, 0.09, 0.25, 10).translate(0, 0.12, 0), lam("jar", () => ({ color: "#c8d8b0" })), new THREE.Matrix4().makeTranslation(DISSECT[0] - 3 + k * 0.32, 1.4, DISSECT[2] - 3.8));
  ub(b, WOOD(), DISSECT[0] - 3.3, DISSECT[0] - 0.6, 1.36, 1.4, DISSECT[2] - 3.95, DISSECT[2] - 3.6);
  table(b, DISSECT[0] + 2.4, DISSECT[2] - 2.6, 1.2, 0.6, 0.9);
  // ---- Semmelweis' study: desk, books, chair, a candle ----
  table(b, OFFICE[0], OFFICE[2] - 1.4, 1.6, 0.8);
  for (let k = 0; k < 6; k++) ub(b, lam("bookO" + k, () => ({ color: ["#8c3b4a", "#3f5a7a", "#5d7a3a"][k % 3] })), OFFICE[0] - 0.6 + k * 0.08, OFFICE[0] - 0.53 + k * 0.08, 0.78, 1.05, OFFICE[2] - 1.7, OFFICE[2] - 1.5);
  for (let k = 0; k < 4; k++) ub(b, lam("paperO", () => ({ color: "#fbf8ee" })), OFFICE[0] + 0.1 + k * 0.05, OFFICE[0] + 0.4 + k * 0.05, 0.78, 0.782 + k * 0.003, OFFICE[2] - 1.5, OFFICE[2] - 1.2);
  for (let k = 0; k < 2; k++) ub(b, WOOD(), OFFICE[0] - 3.3, OFFICE[0] - 3.0, 0, 2.2, OFFICE[2] - 3 + k * 2.4, OFFICE[2] - 1.2 + k * 2.4);
  // ---- the later lab: microscope, flasks, a germ poster ----
  table(b, SCILAB[0], SCILAB[2] - 1.2, 1.6, 0.8);
  ub(b, lam("brass", () => ({ color: "#c9a24e" })), SCILAB[0] - 0.1, SCILAB[0] + 0.1, 0.78, 0.82, SCILAB[2] - 1.35, SCILAB[2] - 1.05);
  b.add(new THREE.CylinderGeometry(0.035, 0.045, 0.42, 10).translate(0, 0.21, 0), lam("brass", () => ({ color: "#c9a24e" })), new THREE.Matrix4().compose(V(SCILAB[0], 0.82, SCILAB[2] - 1.2), new THREE.Quaternion().setFromEuler(new THREE.Euler(0.25, 0, 0)), V(1, 1, 1)));
  for (let k = 0; k < 4; k++) b.add(new THREE.ConeGeometry(0.08, 0.2, 12).translate(0, 0.1, 0), lam("flask" + k, () => ({ color: ["#9fd0e0", "#d8b0e0", "#b0e0a0", "#f2d890"][k] })), new THREE.Matrix4().makeTranslation(SCILAB[0] + 0.3 + k * 0.12, 0.78, SCILAB[2] - 1.3));
  b.add(new THREE.PlaneGeometry(1.2, 0.9), lam("germPoster", () => ({ map: germTex() })), new THREE.Matrix4().makeTranslation(SCILAB[0] + 1.4, 2.1, SCILAB[2] - 3.45));
  // ---- the modern bathroom: sink, mirror, soap, towel ----
  ub(b, lam("sinkW", () => ({ color: "#f6f8fa" })), BATH[0] - 0.45, BATH[0] + 0.45, 0.75, 0.9, BATH[2] - 2.95, BATH[2] - 2.45);
  ub(b, lam("sinkW", () => ({ color: "#f6f8fa" })), BATH[0] - 0.12, BATH[0] + 0.12, 0, 0.75, BATH[2] - 2.95, BATH[2] - 2.7);
  ub(b, lam("chrome", () => ({ color: "#c9cdd2" })), BATH[0] - 0.03, BATH[0] + 0.03, 0.9, 1.12, BATH[2] - 2.92, BATH[2] - 2.86);
  ub(b, lam("chrome", () => ({ color: "#c9cdd2" })), BATH[0] - 0.03, BATH[0] + 0.03, 1.08, 1.12, BATH[2] - 2.92, BATH[2] - 2.72);
  b.add(new THREE.PlaneGeometry(0.8, 0.9), new THREE.MeshBasicMaterial({ color: "#cfe6f0" }), new THREE.Matrix4().makeTranslation(BATH[0], 1.65, BATH[2] - 2.98));
  ub(b, lam("soap", () => ({ color: "#f29ab0" })), BATH[0] + 0.25, BATH[0] + 0.38, 0.9, 1.08, BATH[2] - 2.9, BATH[2] - 2.78);
  ub(b, lam("towelB", () => ({ color: "#5aa8c2" })), BATH[0] + 1.0, BATH[0] + 1.5, 0.8, 1.4, BATH[2] - 2.97, BATH[2] - 2.92);
  // ---- courtyard: gravel, paths, trees, benches, a well; enclosing houses + the gate; the street outside ----
  b.add(quadUp(-400, 400, -400, 4.3, 200, 202, -0.01), ctx.M.grass);
  b.add(quadUp(-62, 40, 4.3, 42, 51, 19, 0.0), ctx.M.grass);
  const gravel = lam("gravelV", () => ({ map: rep(noiseTex("gravelV", "#d8ccb4", ["#c8bca4", "#e6dcc8", "#b8ac94"], 2400, 512, 3), 1, 1) }));
  b.add(quadUp(-62, 40, 5.0, 9.5, 51, 2.2, 0.02), gravel);
  b.add(quadUp(-2.5, 2.5, 9.5, 44, 2.5, 17, 0.02), gravel);
  for (let k = 0; k < 9; k++) prop(b, kit, ["tree_oak", "tree_default", "tree_detailed"][k % 3], -56 + k * 11 + (r() - 0.5) * 2, 0, 20 + (k % 2) * 9, 7.5 + r() * 2, r() * 6);
  for (const x of [-44, -26, -8, 10, 28]) { ub(b, WOOD(), x - 0.9, x + 0.9, 0.42, 0.47, 11.0, 11.4); ub(b, WOOD(), x - 0.9, x + 0.9, 0.5, 0.88, 11.4, 11.46); for (const s of [-1, 1]) ub(b, IRON(), x + s * 0.8 - 0.03, x + s * 0.8 + 0.03, 0, 0.45, 11.0, 11.4); }
  b.add(new THREE.CylinderGeometry(0.9, 0.95, 0.8, 20), lam("well", () => ({ map: rep(stoneHD("wellS"), 1, 1) })), new THREE.Matrix4().makeTranslation(-16, 0.4, 26));
  for (const s of [-1, 1]) b.add(boxGeo(V(-16 + s * 0.8 - 0.06, 0.8, 25.94), V(-16 + s * 0.8 + 0.06, 2.4, 26.06)), WOOD());
  ub(b, WOOD(), -17, -15, 2.35, 2.45, 25.9, 26.1);
  for (let x = -58; x < 38; x += 8.4) if (Math.abs(x + 4.2) > 6.5) house(b, x + 4.2, GATE[2] + 4, Math.PI, 8, 8, x % 3 ? 11.2 : 9.8, Math.floor(r() * 8));
  for (const s of [-1, 1]) ub(b, lam("gatePier", () => ({ map: rep(stoneHD("pierS"), 1, 1) })), GATE[0] + s * 2.3 - 0.5, GATE[0] + s * 2.3 + 0.5, 0, 4.6, GATE[2] - 0.5, GATE[2] + 0.5);
  ub(b, lam("gatePier", () => ({ map: rep(stoneHD("pierS"), 1, 1) })), GATE[0] - 2.8, GATE[0] + 2.8, 4.6, 5.6, GATE[2] - 0.55, GATE[2] + 0.55);
  b.add(quadUp(-80, 80, STREET_Z - 1.5, STREET_Z + 5, 40, 3, 0.02), lam("cobbleV", () => ({ map: cobbleHD() })));
  for (let x = -60; x < 60; x += 8.4) house(b, x, STREET_Z + 9, Math.PI, 8, 8, [8.4, 9.8, 11.2][Math.floor(r() * 3)], Math.floor(r() * 8));
  for (let k = 0; k < 30; k++) prop(b, kit, ["tree_oak", "tree_cone", "tree_default"][k % 3], (r() - 0.5) * 400, 0, -60 - r() * 200, 10 + r() * 5, r() * 6);
  for (let k = 0; k < 30; k++) prop(b, kit, ["tree_oak", "tree_cone", "tree_default"][k % 3], (r() - 0.5) * 400, 0, 90 + r() * 200, 10 + r() * 5, r() * 6);
  ceil.build(R, false);
};
