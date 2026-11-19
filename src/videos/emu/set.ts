// Western Australia 1932: golden wheat (painted ground + 3D wheat clumps near the action), red dirt roads, a farm
// with a water-pump windmill and tank, gum trees, fences, the sentinel's mound, and the army truck (dynamic).
import * as THREE from "three";
import { Batch, V, lam, house, prop, quad } from "../../engine/build";
import { ctex, rng, rep, beam } from "../../engine/paint";
import { BuildCtx, quadUp, ub, noiseTex } from "../../engine/world";
import { NOINK } from "../../engine/ink";
import { FIELD, FARM, MOUND, FENCE_Z, ROAD_Z, truckAt } from "./story";

const wheatTex = () => ctex("wheatGround", 512, 512, (g, r) => {
  g.fillStyle = "#d9b45a"; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 2600; i++) { const x = r() * 512, y = r() * 512; g.strokeStyle = ["#e8c870", "#c49a42", "#f2d88a", "#b8903c"][Math.floor(r() * 4)]; g.lineWidth = 2; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (r() - 0.5) * 4, y - 6 - r() * 8); g.stroke(); }
  for (let y = 0; y < 512; y += 32) { g.fillStyle = "rgba(120,80,30,0.12)"; g.fillRect(0, y, 512, 5); }
});
const stubbleTex = () => noiseTex("stubble", "#c9a65e", ["#b8924a", "#d8b86e", "#a88a48"], 1600, 512, 5);
const dirtTex = () => noiseTex("redDirt", "#b8683e", ["#a85a34", "#c87a4c", "#9a5030", "#d08a5a"], 1600, 512, 6);
const tinTex = () => ctex("corrugated", 256, 256, (g) => { for (let x = 0; x < 256; x += 16) { const gr = g.createLinearGradient(x, 0, x + 16, 0); gr.addColorStop(0, "#8a9098"); gr.addColorStop(0.5, "#c8ccd2"); gr.addColorStop(1, "#7a8088"); g.fillStyle = gr; g.fillRect(x, 0, 16, 256); } });
/** a wheat tuft: three crossed cards with painted stalks + ears (no ink: they live on the NOINK layer) */
const WHEAT = (() => {
  const parts = [0, 1, 2].map((k) => new THREE.PlaneGeometry(0.7, 1.0).translate(0, 0.5, 0).rotateY((k * Math.PI) / 3));
  const g = new THREE.BufferGeometry(), pos: number[] = [], nor: number[] = [], uv: number[] = [];
  for (const p of parts) { const q = p.toNonIndexed(); pos.push(...(q.attributes.position.array as Float32Array)); uv.push(...(q.attributes.uv.array as Float32Array)); for (let i = 0; i < q.attributes.position.count; i++) nor.push(0, 1, 0); }
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  return g;
})();
const tuftTex = () => ctex("wheatTuft", 256, 384, (g, r) => {
  g.clearRect(0, 0, 256, 384);
  for (let k = 0; k < 26; k++) {
    const x0 = 128 + (r() - 0.5) * 60, x1 = x0 + (r() - 0.5) * 140, top = 30 + r() * 80;
    g.strokeStyle = ["#d9b45a", "#c49a42", "#e8c870"][k % 3]; g.lineWidth = 4; g.beginPath(); g.moveTo(x0, 384); g.quadraticCurveTo(x0, 200, x1, top + 34); g.stroke();
    g.fillStyle = ["#f0d47a", "#e2bf5e", "#f6dc8c"][k % 3]; g.beginPath(); g.ellipse(x1, top + 14, 7, 22, (x1 - x0) * 0.004, 0, 7); g.fill();
    g.strokeStyle = "rgba(90,60,20,0.6)"; g.lineWidth = 1.5; g.stroke();
  }
});
const wheatM = () => lam("wheatTuftM", () => ({ map: tuftTex(), alphaTest: 0.5, side: THREE.DoubleSide }));

export const buildSet = (ctx: BuildCtx) => {
  const { root: R, b, kit } = ctx, r = rng(7);
  // ---- ground: wheat, stubble, roads ----
  b.add(quadUp(-600, 600, -600, 600, 300, 300, -0.02), lam("stubbleM", () => ({ map: rep(stubbleTex(), 1, 1) })));
  b.add(quadUp(-160, 160, -140, -3.2, 80, 34, 0.0), lam("wheatG", () => ({ map: rep(wheatTex(), 1, 1) })));
  b.add(quadUp(-160, 30, 3.2, 120, 48, 29, 0.0), lam("wheatG", () => ({ map: rep(wheatTex(), 1, 1) })));
  b.add(quadUp(-400, 400, ROAD_Z - 3.2, ROAD_Z + 3.2, 100, 1.6, 0.012), lam("dirtM", () => ({ map: rep(dirtTex(), 1, 1) })));
  b.add(quadUp(FARM[0] - 3, FARM[0] + 3, ROAD_Z + 3.2, FARM[2] - 5, 1.5, 12, 0.012), lam("dirtM", () => ({ map: rep(dirtTex(), 1, 1) })));
  b.add(quadUp(FARM[0] - 14, FARM[0] + 14, FARM[2] - 8, FARM[2] + 10, 7, 4.5, 0.011), lam("dirtM", () => ({ map: rep(dirtTex(), 1, 1) })));
  // ---- 3D wheat clumps where the camera looks (field + road edges), heads on top ----
  const wb = new Batch();
  const clump = (x: number, z: number, h: number) => wb.add(WHEAT, wheatM(), new THREE.Matrix4().compose(V(x, 0, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, r() * 6, 0)), V(1, h, 1)));
  for (let i = 0; i < 3400; i++) {
    const x = FIELD[0] + (r() - 0.5) * 70, z = FIELD[2] + (r() - 0.5) * 40;
    if (z > -3.6) continue;
    if (Math.hypot(x - FIELD[0], z - FIELD[2] - 3) < 4.5) continue; // the clearing where the hero emus stand
    clump(x, z, 0.75 + r() * 0.35);
  }
  for (let i = 0; i < 700; i++) { const x = -40 + r() * 60, z = 3.6 + r() * 14; clump(x, z, 0.75 + r() * 0.3); }
  const wg = new THREE.Group(); wb.build(wg, false); wg.traverse((o) => { o.layers.set(NOINK); o.receiveShadow = false; }); R.add(wg);
  // ---- the farm: house, barn, windmill, water tank, fences ----
  house(b, FARM[0], FARM[2], Math.PI, 10, 8, 4.2, 1);
  house(b, FARM[0] + 14, FARM[2] + 4, Math.PI, 9, 10, 5.5, 2);
  const tin = lam("tin", () => ({ map: rep(tinTex(), 1, 1) }));
  b.add(new THREE.CylinderGeometry(1.8, 1.8, 2.6, 24).translate(0, 1.3 + 2.2, 0), tin, new THREE.Matrix4().makeTranslation(FARM[0] - 9, 0, FARM[2] - 2));
  for (const s of [-1, 1]) for (const t of [-1, 1]) ub(b, lam("standW", () => ({ map: beam() })), FARM[0] - 9 + s * 1.3 - 0.1, FARM[0] - 9 + s * 1.3 + 0.1, 0, 2.2, FARM[2] - 2 + t * 1.3 - 0.1, FARM[2] - 2 + t * 1.3 + 0.1);
  const wx = FARM[0] - 15, wz = FARM[2] - 4, steel = lam("millSteel", () => ({ color: "#6a6f78" }));
  for (const [dx, dz] of [[-1.4, -1.4], [1.4, -1.4], [-1.4, 1.4], [1.4, 1.4]]) {
    const a = V(wx + dx, 0, wz + dz), c = V(wx + dx * 0.2, 11, wz + dz * 0.2);
    b.add(new THREE.CylinderGeometry(0.07, 0.07, a.distanceTo(c), 6), steel, new THREE.Matrix4().compose(a.clone().add(c).multiplyScalar(0.5), new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), c.clone().sub(a).normalize()), V(1, 1, 1)));
  }
  for (let y = 2; y < 11; y += 2.2) { const w = 1.4 * (1 - y / 13.5); ub(b, steel, wx - w, wx + w, y, y + 0.08, wz - w, wz + w); }
  const fan = new THREE.Group(), fb = new Batch(), blade = lam("blade", () => ({ color: "#d8dce2", side: THREE.DoubleSide }));
  for (let k = 0; k < 14; k++) { const a = (k / 14) * Math.PI * 2; fb.add(new THREE.PlaneGeometry(0.45, 1.9).translate(0, 1.25, 0).rotateZ(a), blade); }
  fb.add(new THREE.CylinderGeometry(0.2, 0.2, 0.4, 10).rotateX(Math.PI / 2), steel);
  fb.build(fan); fan.position.set(wx, 11.6, wz - 0.3); R.add(fan);
  ub(b, steel, wx - 0.05, wx + 0.05, 11.4, 11.8, wz, wz + 2.2);
  b.add(quad(V(wx, 11.2, wz + 2.2), V(wx, 11.2, wz + 3.4), V(wx, 12.2, wz + 3.4), V(wx, 12.2, wz + 2.2)), blade);
  for (let x = -60; x < 60; x += 3) { ub(b, lam("post", () => ({ map: beam() })), x - 0.07, x + 0.07, 0, 1.2, ROAD_Z + 3.6, ROAD_Z + 3.74); }
  for (const y of [0.45, 0.85, 1.1]) ub(b, lam("wire", () => ({ color: "#5a5a5a" })), -60, 60, y, y + 0.02, ROAD_Z + 3.66, ROAD_Z + 3.68);
  // the emu fence (shot 10): tall posts and netting
  for (let x = -40; x < 40; x += 2.5) ub(b, lam("post", () => ({ map: beam() })), x - 0.08, x + 0.08, 0, 2.2, FENCE_Z - 0.08, FENCE_Z + 0.08);
  const net = ctex("netting", 256, 256, (g) => { g.clearRect(0, 0, 256, 256); g.strokeStyle = "#4a4a4a"; g.lineWidth = 3; for (let k = -256; k < 512; k += 24) { g.beginPath(); g.moveTo(k, 0); g.lineTo(k + 256, 256); g.moveTo(k + 256, 0); g.lineTo(k, 256); g.stroke(); } });
  b.add(quad(V(-40, 0, FENCE_Z), V(40, 0, FENCE_Z), V(40, 2.0, FENCE_Z), V(-40, 2.0, FENCE_Z), 40, 1), lam("netM", () => ({ map: rep(net, 1, 1), transparent: false, alphaTest: 0.5, side: THREE.DoubleSide })));
  // ---- the sentinel's mound (a termite mound) ----
  b.add(new THREE.ConeGeometry(2.4, 3.2, 10).translate(0, 1.6, 0), lam("mound", () => ({ map: rep(dirtTex(), 1, 1) })), new THREE.Matrix4().makeTranslation(MOUND[0], 0, MOUND[2]));
  // ---- gum trees, scrub, distant hills ----
  for (let i = 0; i < 60; i++) { const a = r() * Math.PI * 2, d = 70 + r() * 220; prop(b, kit, ["tree-high-round", "tree", "tree_default"][i % 3], Math.cos(a) * d, 0, Math.sin(a) * d, 10 + r() * 8, r() * 6); }
  for (const [x, z] of [[FARM[0] + 8, FARM[2] + 14], [FARM[0] - 22, FARM[2] + 8], [-30, 20], [26, -60], [-58, -40]] as const) prop(b, kit, "tree-high-round", x, 0, z, 13, x);
  const hill = new THREE.SphereGeometry(1, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2);
  for (const [x, z, sx, sy, sz] of [[-380, -300, 220, 36, 120], [300, -420, 240, 44, 140], [500, 180, 180, 30, 140], [-480, 260, 220, 40, 160]] as const)
    b.add(hill, lam("hillAu", () => ({ color: "#a8925a" })), new THREE.Matrix4().compose(V(x, -2, z), new THREE.Quaternion(), V(sx, sy, sz)));
  // ---- the army truck (1930s): cab, bonnet, mudguards, flatbed with a mounted gun and ammo crates ----
  const truck = new THREE.Group(), tb = new Batch(), body = lam("armyGreen", () => ({ color: "#5d6a3a" })), dark = lam("truckDark", () => ({ color: "#2b2f2a" })), tyre = lam("tyreT", () => ({ color: "#26232a" }));
  ub(tb, body, 0.8, 2.6, 0.9, 2.3, -0.9, 0.9);                         // cab
  ub(tb, lam("glass", () => ({ color: "#a8cbe0" })), 2.61, 2.63, 1.6, 2.1, -0.75, 0.75);
  ub(tb, body, 2.6, 4.2, 0.9, 1.7, -0.7, 0.7);                         // bonnet
  ub(tb, dark, 4.2, 4.3, 0.9, 1.6, -0.6, 0.6);                         // grille
  for (const s of [-1, 1]) ub(tb, body, 2.4, 4.3, 0.75, 0.85, s * 0.75 - 0.25, s * 0.75 + 0.25);
  ub(tb, lam("bedWood", () => ({ map: beam() })), -3.2, 0.8, 0.9, 1.05, -1.1, 1.1);
  for (const s of [-1, 1]) ub(tb, lam("bedWood", () => ({ map: beam() })), -3.2, 0.8, 1.05, 1.5, s * 1.1 - 0.05, s * 1.1 + 0.05);
  ub(tb, dark, -3.2, 3.8, 0.6, 0.9, -0.5, 0.5);
  const wheel = new THREE.CylinderGeometry(0.5, 0.5, 0.28, 16); wheel.rotateX(Math.PI / 2);
  for (const x of [-2.2, 3.1]) for (const s of [-1, 1]) tb.add(wheel, tyre, new THREE.Matrix4().makeTranslation(x, 0.5, s * 0.95));
  for (let k = 0; k < 4; k++) ub(tb, lam("crate", () => ({ color: "#6a5a3a" })), -3.0 + k * 0.55, -2.5 + k * 0.55, 1.05, 1.45, 0.3, 0.9);
  ub(tb, dark, -1.0, -0.9, 1.05, 1.9, -0.05, 0.05);                    // gun post
  tb.add(new THREE.CylinderGeometry(0.06, 0.08, 1.6, 10).rotateZ(Math.PI / 2), dark, new THREE.Matrix4().makeTranslation(-0.3, 2.0, 0)); // barrel
  tb.add(new THREE.CylinderGeometry(0.25, 0.25, 0.08, 16), dark, new THREE.Matrix4().makeTranslation(-0.8, 2.15, 0));                     // drum magazine
  tb.build(truck); truck.traverse((o) => { o.castShadow = true; }); R.add(truck);
  return (id: number, t: number) => {
    fan.rotation.z = t * 2.2;
    const tr = truckAt(id, t);
    truck.visible = tr.x > -800;
    const bump = tr.bump * (0.12 * Math.abs(Math.sin(t * 7.3)) + 0.08 * Math.sin(t * 11.1));
    truck.position.set(tr.x, bump, tr.z); truck.rotation.set(tr.bump * 0.05 * Math.sin(t * 9), tr.yaw, tr.bump * 0.06 * Math.sin(t * 6.3));
  };
};
