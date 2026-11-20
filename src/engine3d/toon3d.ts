// Real 3D cartoon people: round head with sculpted face features, egg torso with a coat, stick legs with round
// shoes, thin arms with mitten hands, optional hat / hair / beard / glasses. Everything is posed per frame by
// pose() as a pure function of time, so any frame renders identically in any chunk.
import * as THREE from "three";

export type Expr = "smile" | "grin" | "neutral" | "smug" | "worried" | "shock" | "sad" | "talk";
export type Look = {
  skin?: string; coat: string; coatLong?: boolean; pants?: string; shoes?: string; glove?: string;
  hat?: "fedora" | "cap" | "straw" | "bowler" | "helmet" | "top" | "none"; hatCol?: string; band?: string;
  hair?: string; hairStyle?: "short" | "bun" | "long" | "bald"; beard?: string; moustache?: string; glasses?: boolean;
  scale?: number; girth?: number; buttons?: string; collar?: string; kid?: boolean; dress?: boolean;
};
export type Pose = {
  expr?: Expr; walk?: number; /** metres travelled (drives gait) */ yaw?: number; headYaw?: number; headTilt?: number;
  armL?: number; armR?: number; /** arm raise 0..1 (1 = up to shoulder level forward) */ wave?: number; point?: number;
  talk?: boolean; lean?: number; bounce?: number; sit?: boolean;
};

const mats = new Map<string, THREE.MeshStandardMaterial>();
export const mat = (col: string, rough = 0.78, extra: Partial<THREE.MeshStandardMaterialParameters> = {}) => {
  const k = col + rough + JSON.stringify(extra);
  let m = mats.get(k);
  if (!m) { m = new THREE.MeshStandardMaterial({ color: col, roughness: rough, metalness: 0, ...extra }); mats.set(k, m); }
  return m;
};
const G = {
  sph: new THREE.SphereGeometry(1, 40, 28),
  sphLo: new THREE.SphereGeometry(1, 20, 14),
  cyl: new THREE.CylinderGeometry(1, 1, 1, 16),
  cylHi: new THREE.CylinderGeometry(1, 1, 1, 40),
  smile: new THREE.TorusGeometry(1, 0.17, 10, 28, Math.PI * 0.8),
  flat: new THREE.TorusGeometry(1, 0.17, 10, 28, Math.PI * 0.35),
  brow: new THREE.CapsuleGeometry(0.22, 1, 4, 10),
};
const mesh = (g: THREE.BufferGeometry, m: THREE.Material, s: [number, number, number], p: [number, number, number] = [0, 0, 0]) => {
  const o = new THREE.Mesh(g, m); o.scale.set(...s); o.position.set(...p); o.castShadow = true; o.receiveShadow = true; return o;
};
/** point on a sphere of radius r: az around y (0 = +z front), el up */
const onS = (r: number, az: number, el: number) => new THREE.Vector3(r * Math.sin(az) * Math.cos(el), r * Math.sin(el), r * Math.cos(az) * Math.cos(el));

// egg profile torso (lathe), wider at the bottom
const eggGeo = (() => {
  const pts: THREE.Vector2[] = [];
  for (let i = 0; i <= 24; i++) {
    const a = -Math.PI / 2 + (Math.PI * i) / 24, y = Math.sin(a);
    const r = Math.cos(a) * (1 + 0.16 * -y);
    pts.push(new THREE.Vector2(Math.max(0.0001, r), y));
  }
  return new THREE.LatheGeometry(pts, 40);
})();
// coat skirt (long coats / dresses): flared truncated cone
const skirtGeo = new THREE.CylinderGeometry(0.8, 1, 1, 40, 1, true);

const hash = (n: number) => { const x = Math.sin(n * 127.1) * 43758.5453; return x - Math.floor(x); };

export class Person {
  root = new THREE.Group(); body = new THREE.Group(); head = new THREE.Group();
  legL = new THREE.Group(); legR = new THREE.Group(); armL = new THREE.Group(); armR = new THREE.Group();
  eyes: THREE.Mesh[] = []; brows: THREE.Mesh[] = []; mouths: Record<string, THREE.Object3D> = {};
  H: number; seed: number; L: Look;
  constructor(L: Look, seed = 1) {
    this.L = L; this.seed = seed;
    const s = L.scale ?? (L.kid ? 0.72 : 1), g = L.girth ?? 1;
    const skin = mat(L.skin ?? "#f1d3b6", 0.62), coat = mat(L.coat, 0.85), dark = mat("#1d1b1f", 0.4);
    const legLen = L.kid ? 0.3 : 0.38, torsoH = 0.56, torsoR = 0.25 * g;
    const hipY = legLen + 0.06, chestY = hipY + torsoH * 0.5, neckY = hipY + torsoH * 0.92, headR = L.kid ? 0.3 : 0.28;
    this.H = (neckY + headR * 1.75) * s;
    this.root.add(this.body); this.body.scale.setScalar(s);
    // legs: thin dark cylinder + round shoe
    for (const [leg, side] of [[this.legL, -1], [this.legR, 1]] as const) {
      leg.position.set(side * 0.09 * g, hipY, 0);
      leg.add(mesh(G.cyl, mat(L.pants ?? "#2a2730", 0.7), [0.028, legLen, 0.028], [0, -legLen / 2, 0]));
      leg.add(mesh(G.sph, mat(L.shoes ?? "#3a2a22", 0.45), [0.07, 0.05, 0.1], [0, -legLen - 0.01, 0.03]));
      this.body.add(leg);
    }
    // torso
    const torso = mesh(eggGeo, coat, [torsoR, torsoH / 2, torsoR * 0.9], [0, chestY, 0]);
    this.body.add(torso);
    if (L.coatLong || L.dress) this.body.add(mesh(skirtGeo, coat, [torsoR * 1.02, 0.3, torsoR * 0.95], [0, hipY - 0.08, 0]));
    // buttons + collar
    const bcol = mat(L.buttons ?? "#2a2124", 0.4);
    for (let i = 0; i < 3; i++) {
      const y = chestY + 0.12 - i * 0.12, p = onS(1, 0, 0);
      const yy = (y - chestY) / (torsoH / 2), r = torsoR * 0.9 * Math.sqrt(Math.max(0, 1 - yy * yy)) * (1 - 0.16 * yy);
      this.body.add(mesh(G.sphLo, bcol, [0.018, 0.018, 0.01], [p.x, y, r + 0.002]));
    }
    if (L.collar) {
      const c = mat(L.collar, 0.8);
      for (const side of [-1, 1]) { const m = mesh(G.sph, c, [0.09, 0.05, 0.03], [side * 0.08, neckY - 0.06, torsoR * 0.66]); m.rotation.z = side * 0.5; this.body.add(m); }
    }
    // arms: shoulder pivot, thin sleeve + mitten
    for (const [arm, side] of [[this.armL, -1], [this.armR, 1]] as const) {
      arm.position.set(side * torsoR * 0.92, chestY + 0.12, 0);
      arm.add(mesh(G.cyl, mat(L.coat, 0.85), [0.03, 0.34, 0.03], [0, -0.17, 0]));
      arm.add(mesh(G.sph, mat(L.glove ?? L.skin ?? "#f1d3b6", 0.6), [0.06, 0.065, 0.06], [0, -0.36, 0]));
      this.body.add(arm);
    }
    // head
    this.head.position.set(0, neckY + headR * 0.82, 0); this.body.add(this.head);
    this.head.add(mesh(G.sph, skin, [headR, headR * 0.96, headR * 0.94]));
    // ears
    for (const side of [-1, 1]) this.head.add(mesh(G.sphLo, skin, [0.035, 0.06, 0.03], [side * headR * 0.97, -0.01, 0]));
    // face: features sit on the head surface
    const R = headR * 0.94;
    const place = (o: THREE.Object3D, az: number, el: number, out = 0) => {
      const p = onS(R + out, az, el); o.position.copy(p);
      o.lookAt(p.clone().multiplyScalar(2)); return o;
    };
    for (const side of [-1, 1]) {
      const e = mesh(G.sph, dark, [0.03, 0.042, 0.012]); place(e, side * 0.3, 0.12, -0.004); this.head.add(e); this.eyes.push(e);
      const hl = mesh(G.sphLo, mat("#ffffff", 0.2, { emissive: "#ffffff", emissiveIntensity: 0.6 }), [0.009, 0.009, 0.004]); place(hl, side * 0.3 + 0.03, 0.17, 0.006);
      hl.castShadow = false; this.head.add(hl); e.userData.hl = hl;
      const bg = place(new THREE.Group(), side * 0.32, 0.36, 0); this.head.add(bg);
      const b = mesh(G.brow, mat(L.hair && L.hairStyle !== "bald" ? L.hair : "#3a2d2a", 0.6), [0.018, 0.04, 0.012]);
      b.rotation.z = Math.PI / 2; b.castShadow = false; bg.add(b); this.brows.push(b); b.userData.side = side;
    }
    // nose: small skin bump
    this.head.add(place(mesh(G.sphLo, mat(L.skin ?? "#f1d3b6", 0.55), [0.03, 0.026, 0.03]), 0, -0.04, 0.005));
    // mouths (one visible at a time)
    const mm = mat("#3a1f22", 0.5);
    const mk = (g: THREE.BufferGeometry, sc: [number, number, number], rotZ: number, el = -0.3) => {
      const o = new THREE.Group(); place(o, 0, el, 0.002);
      const m = mesh(g, mm, sc); m.rotation.z = rotZ; m.castShadow = false; o.add(m); this.head.add(o); return o;
    };
    this.mouths.smile = mk(G.smile, [0.06, 0.06, 0.06], Math.PI + Math.PI * 0.1);
    this.mouths.grin = (() => { const o = new THREE.Group(); place(o, 0, -0.3, 0); const m = mesh(G.sph, mm, [0.07, 0.045, 0.02]); m.position.y = -0.008; o.add(m); const t = mesh(G.sph, mat("#ffffff", 0.4), [0.055, 0.016, 0.012]); t.position.set(0, 0.012, 0.012); o.add(t); this.head.add(o); return o; })();
    this.mouths.neutral = mk(G.flat, [0.07, 0.07, 0.07], Math.PI * 1.325, -0.33);
    this.mouths.sad = mk(G.smile, [0.05, 0.05, 0.05], Math.PI * 0.1, -0.38);
    this.mouths.o = (() => { const o = new THREE.Group(); place(o, 0, -0.32, 0); o.add(mesh(G.sph, mm, [0.03, 0.04, 0.015])); this.head.add(o); return o; })();
    // hair / beard / moustache / glasses
    const hairM = mat(L.hair ?? "#3a2d2a", 0.85);
    if (L.hair && L.hairStyle !== "bald") {
      const cap = mesh(G.sph, hairM, [headR * 1.03, headR * 0.6, headR * 1.0], [0, headR * 0.5, -0.045]); this.head.add(cap);
      if (L.hairStyle === "bun") this.head.add(mesh(G.sph, hairM, [0.1, 0.1, 0.1], [0, headR * 0.75, -headR * 0.75]));
      if (L.hairStyle === "long") this.head.add(mesh(G.sph, hairM, [headR * 1.05, headR * 0.95, headR * 0.6], [0, -0.05, -headR * 0.45]));
    }
    if (L.beard) { const bd = mesh(G.sph, mat(L.beard, 0.9), [0.17, 0.1, 0.07]); place(bd, 0, -0.68, -0.05); this.head.add(bd); }
    if (L.moustache) { const mo = place(mesh(G.sph, mat(L.moustache, 0.85), [0.075, 0.025, 0.025]), 0, -0.17, 0.004); this.head.add(mo); }
    if (L.glasses) {
      const gm = mat("#1d1b1f", 0.3);
      for (const side of [-1, 1]) {
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.052, 0.008, 8, 24), gm); place(ring, side * 0.3, 0.1, 0.02); ring.castShadow = false; this.head.add(ring);
      }
    }
    // hats
    const hc = mat(L.hatCol ?? "#5a5560", 0.8), band = mat(L.band ?? "#2a2428", 0.6);
    const hatY = headR * 0.62;
    const tiltHat = (o: THREE.Object3D) => { o.rotation.x = -0.12; this.head.add(o); };
    switch (L.hat) {
      case "fedora": { const h = new THREE.Group(); h.position.y = hatY; h.add(mesh(G.cylHi, hc, [headR * 1.3, 0.02, headR * 1.3])); h.add(mesh(G.cylHi, hc, [headR * 0.82, 0.2, headR * 0.82], [0, 0.1, 0])); h.add(mesh(G.cylHi, band, [headR * 0.84, 0.045, headR * 0.84], [0, 0.035, 0])); const dent = mesh(G.sph, hc, [headR * 0.8, 0.05, headR * 0.7], [0, 0.2, 0]); h.add(dent); tiltHat(h); break; }
      case "bowler": { const h = new THREE.Group(); h.position.y = hatY; h.add(mesh(G.cylHi, hc, [headR * 1.3, 0.02, headR * 1.3])); h.add(mesh(G.sph, hc, [headR * 0.85, 0.22, headR * 0.85], [0, 0.02, 0])); h.add(mesh(G.cylHi, band, [headR * 0.86, 0.035, headR * 0.86], [0, 0.03, 0])); tiltHat(h); break; }
      case "top": { const h = new THREE.Group(); h.position.y = hatY; h.add(mesh(G.cylHi, hc, [headR * 1.35, 0.02, headR * 1.35])); h.add(mesh(G.cylHi, hc, [headR * 0.78, 0.4, headR * 0.78], [0, 0.2, 0])); h.add(mesh(G.cylHi, band, [headR * 0.8, 0.05, headR * 0.8], [0, 0.04, 0])); tiltHat(h); break; }
      case "cap": { const h = new THREE.Group(); h.position.y = hatY * 0.9; h.add(mesh(G.sph, hc, [headR * 1.02, 0.14, headR * 1.02], [0, 0.0, 0])); h.add(mesh(G.cylHi, hc, [headR * 0.7, 0.015, headR * 0.5], [0, -0.01, headR * 0.75])); tiltHat(h); break; }
      case "helmet": { const h = new THREE.Group(); h.position.y = hatY * 0.75; h.add(mesh(G.sph, hc, [headR * 1.08, 0.2, headR * 1.08])); h.add(mesh(G.cylHi, hc, [headR * 1.4, 0.015, headR * 1.4], [0, -0.01, 0])); this.head.add(h); break; }
      case "straw": { const h = new THREE.Group(); h.position.y = hatY; h.add(mesh(G.cylHi, hc, [headR * 1.35, 0.015, headR * 1.7])); h.add(mesh(G.cylHi, hc, [headR * 0.8, 0.14, headR * 0.8], [0, 0.07, 0])); h.add(mesh(G.cylHi, band, [headR * 0.82, 0.04, headR * 0.82], [0, 0.03, 0])); tiltHat(h); break; }
    }
    this.root.traverse((o) => { o.frustumCulled = false; });
  }
  /** pose at time t (seconds) */
  pose(t: number, p: Pose = {}) {
    const sd = this.seed, walk = p.walk;
    this.root.rotation.y = p.yaw ?? 0;
    const breath = Math.sin(t * 2.1 + sd) * 0.008;
    let bob = breath, swing = 0;
    if (walk !== undefined) {
      const ph = (walk / 0.55) * Math.PI;
      swing = Math.sin(ph);
      bob = Math.abs(Math.cos(ph)) * 0.035;
      this.legL.rotation.x = swing * 0.55; this.legR.rotation.x = -swing * 0.55;
    } else { this.legL.rotation.x = 0; this.legR.rotation.x = 0; }
    if (p.bounce) bob += Math.abs(Math.sin(t * 9)) * p.bounce;
    this.body.position.y = bob;
    this.body.rotation.x = p.lean ?? (walk !== undefined ? 0.06 : 0);
    // arms: rotation.x negative swings forward, z spreads out
    const al = p.armL ?? 0, ar = p.armR ?? 0;
    this.armL.rotation.set(-swing * 0.5 - al * 1.5, 0, -0.18 - (p.wave ? 0 : 0));
    this.armR.rotation.set(swing * 0.5 - ar * 1.5, 0, 0.18);
    if (p.wave) { this.armR.rotation.set(0, 0, 2.5 + Math.sin(t * 10) * 0.35 * p.wave); }
    if (p.point) { this.armR.rotation.set(-1.45 * p.point, 0, 0.1); }
    // head
    this.head.rotation.set((p.headTilt ?? 0) + Math.sin(t * 1.3 + sd) * 0.02, (p.headYaw ?? 0) + Math.sin(t * 0.7 + sd * 2) * 0.05, Math.sin(t * 0.9 + sd) * 0.03);
    if (p.talk) this.head.rotation.x += Math.sin(t * 13) * 0.025;
    // expression
    const e = p.expr ?? "smile";
    const blinkT = (t + hash(sd) * 4) % 3.7, blink = blinkT < 0.12 ? 0.15 : 1;
    let eyeY = 1, browRot = 0, browUp = 0;
    let mouth: string = { smile: "smile", grin: "grin", neutral: "neutral", smug: "smile", worried: "neutral", shock: "o", sad: "sad", talk: "grin" }[e];
    if (e === "smug") { eyeY = 0.45; browRot = 0.25; }
    if (e === "worried" || e === "sad") { browRot = -0.35; browUp = 0.012; }
    if (e === "shock") { eyeY = 1.3; browUp = 0.02; }
    if (e === "grin") eyeY = 0.85;
    if (p.talk) mouth = Math.floor(t * 7.5 + sd) % 3 === 0 ? "neutral" : Math.floor(t * 7.5 + sd) % 3 === 1 ? "o" : mouth === "sad" ? "sad" : "grin";
    for (const k in this.mouths) this.mouths[k].visible = k === mouth;
    for (const ey of this.eyes) { ey.scale.y = 0.038 * eyeY * blink; (ey.userData.hl as THREE.Object3D).visible = blink > 0.5 && eyeY > 0.6; }
    for (const b of this.brows) { const side = b.userData.side as number; b.rotation.z = Math.PI / 2 + side * browRot; b.position.y = browUp; }
  }
}
