// Köpenick 1906 as one three.js scene: sky, a cobbled main street with gabled houses, the town-hall square with the
// red-brick Rathaus and its tower, the junk dealer's stall, a traffic light (the analogy), the Kaiser's podium, a
// railway line with a little train, and the cast. update(id, f, camera) poses everything for shot `id` at frame f.
import * as THREE from "three";
import { Batch, boxGeo, V, lam, Kit, Ray, house, prop, quad, tri, setSight, roofMat } from "./build";
import { rep, ctex, cobbleHD, grassHD, cloudHD, facadeHD, stoneHD, beam, brick, rng } from "./paint";
import { Pen, fxSign } from "./toon";
import { LIGHTS, LOOK, LightPreset } from "./lights";
import { TONE, CHAR, untone, twoTone } from "./shade";
import { NOINK } from "./ink";
import { Pool, Actor, Fx, stage } from "./cast";
import { FPS, SHOTS, camAt, V3, ShotDef, RATHAUS_Z, PODIUM, STALL, AMPEL, RAIL_Z, COUNTER, trainX } from "./story";

void fxSign;
/** no external model kit: every prop here is built procedurally (trees via build.ts' cartoon vegetation) */
export const loadKit = () => Promise.resolve({} as Kit);

const discTex = () => ctex("sunDisc", 128, 128, (g) => {
  const gr = g.createRadialGradient(64, 64, 58, 64, 64, 64); gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
});
const haloTex = () => ctex("sunHalo", 256, 256, (g) => {
  const im = g.createImageData(256, 256);
  for (let y = 0; y < 256; y++) for (let x = 0; x < 256; x++) {
    const u = Math.hypot(x - 127.5, y - 127.5) / 128;
    const a = (0.55 * Math.exp(-((u / 0.25) ** 2)) + 0.35 * Math.exp(-((u / 0.6) ** 2))) * (1 - Math.min(1, Math.max(0, (u - 0.8) / 0.2)));
    const i = (y * 256 + x) * 4; im.data[i] = im.data[i + 1] = im.data[i + 2] = 255; im.data[i + 3] = Math.round(255 * Math.min(1, a));
  }
  g.putImageData(im, 0, 0);
});

/** every lens position of the film looking at its subject (houses / trees in the way are left out) */
const sightLines = (): Ray[] => {
  const out: Ray[] = [];
  for (const s of SHOTS) for (let f = s.a - 8; f < s.b + 8; f += 2) {
    const c = camAt(s.id, Math.max(0, f)), o = V(...c.pos), look = V(...c.look);
    const fw = look.clone().sub(o), len = fw.length();
    fw.normalize();
    const rt = fw.clone().cross(V(0, 1, 0)).normalize(), up = rt.clone().cross(fw);
    const ty = Math.tan((c.fov * Math.PI) / 360), tx = ty * (9 / 16);
    for (const [sx, sy] of [[0, 0], [-0.6, 0], [0.6, 0], [0, 0.6], [0, -0.4]])
      out.push({ o, d: fw.clone().addScaledVector(rt, sx * tx).addScaledVector(up, sy * ty), len, core: sx === 0 && sy === 0 });
  }
  return out;
};

const quadUp = (x0: number, x1: number, z0: number, z1: number, u: number, v: number, y = 0) => {
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute([x0, y, z1, x1, y, z1, x1, y, z0, x0, y, z1, x1, y, z0, x0, y, z0], 3));
  g.setAttribute("normal", new THREE.Float32BufferAttribute([0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0], 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute([0, 0, u, 0, u, v, 0, 0, u, v, 0, v], 2));
  return g;
};

// ---------------- painted pieces ----------------
const awningTex = () => ctex("awning", 512, 256, (g) => {
  for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? "#f3ead2" : "#b8483a"; g.fillRect(i * 64, 0, 64, 256); }
  g.fillStyle = "rgba(0,0,0,0.12)"; g.fillRect(0, 220, 512, 36);
});
/** black-white-red horizontal tricolour of the Kaiserreich */
const flagTex = () => ctex("flagReich", 240, 160, (g) => {
  g.fillStyle = "#1d1c22"; g.fillRect(0, 0, 240, 54); g.fillStyle = "#f4f0e6"; g.fillRect(0, 54, 240, 53); g.fillStyle = "#c8323a"; g.fillRect(0, 107, 240, 53);
});
const clockTex = () => ctex("clockK", 256, 256, (g) => {
  g.fillStyle = "#f7f1e1"; g.strokeStyle = "#221f2e"; g.lineWidth = 12;
  g.beginPath(); g.arc(128, 128, 112, 0, 7); g.fill(); g.stroke();
  g.lineCap = "round";
  for (let i = 0; i < 12; i++) { const a = (i * Math.PI) / 6; g.lineWidth = 8; g.beginPath(); g.moveTo(128 + 80 * Math.cos(a), 128 + 80 * Math.sin(a)); g.lineTo(128 + 96 * Math.cos(a), 128 + 96 * Math.sin(a)); g.stroke(); }
  g.lineWidth = 12; g.beginPath(); g.moveTo(128, 128); g.lineTo(128, 60); g.stroke();
  g.lineWidth = 9; g.beginPath(); g.moveTo(128, 128); g.lineTo(80, 150); g.stroke();
});
/** the passport pictogram on the closed counter, crossed out (no words in the film) */
const passSign = () => ctex("passSign", 512, 512, (g) => {
  g.fillStyle = "#f3ecd8"; g.fillRect(0, 0, 512, 512);
  g.strokeStyle = "#2a1f2c"; g.lineWidth = 18; g.strokeRect(9, 9, 494, 494);
  g.fillStyle = "#7a2c32"; g.strokeStyle = "#2a1f2c"; g.lineWidth = 12;
  g.beginPath(); g.roundRect(150, 110, 212, 292, 18); g.fill(); g.stroke();
  g.fillStyle = "#e8c45a"; g.beginPath(); g.arc(256, 220, 52, 0, 7); g.fill();
  g.fillStyle = "#7a2c32"; g.beginPath(); g.moveTo(256, 180); g.lineTo(290, 240); g.lineTo(222, 240); g.closePath(); g.fill();
  g.fillStyle = "#e8c45a"; g.fillRect(200, 310, 112, 16); g.fillRect(200, 340, 80, 16);
  g.strokeStyle = "#d8322e"; g.lineWidth = 46; g.lineCap = "round";
  g.beginPath(); g.moveTo(90, 90); g.lineTo(422, 422); g.stroke();
  g.beginPath(); g.arc(256, 256, 200, 0, 7); g.stroke();
});
const shutterTex = () => ctex("shutter", 256, 256, (g) => {
  g.fillStyle = "#6e7f5a"; g.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 256; y += 21) { g.fillStyle = "rgba(20,30,10,0.45)"; g.fillRect(0, y, 256, 4); g.fillStyle = "rgba(255,255,230,0.12)"; g.fillRect(0, y + 4, 256, 3); }
});
const carTex = (key: string, col: string) => ctex("car" + key, 512, 160, (g) => {
  g.fillStyle = col; g.fillRect(0, 0, 512, 160);
  g.fillStyle = "#e8c45a"; g.fillRect(0, 128, 512, 8);
  for (let i = 0; i < 5; i++) {
    g.fillStyle = "#f6e7b8"; g.fillRect(28 + i * 96, 30, 64, 56);
    g.strokeStyle = "#2a1f2c"; g.lineWidth = 6; g.strokeRect(28 + i * 96, 30, 64, 56);
  }
});
const railTex = () => ctex("rails", 256, 256, (g) => {
  g.fillStyle = "#9b8f80"; g.fillRect(0, 0, 256, 256);
  const r = rng(5);
  for (let i = 0; i < 400; i++) { g.fillStyle = r() < 0.5 ? "#857a6d" : "#b0a597"; g.fillRect(r() * 256, r() * 256, 4, 4); }
  for (let y = 0; y < 256; y += 32) { g.fillStyle = "#6b4a33"; g.fillRect(0, y, 256, 14); }
});

type Mats = Record<string, THREE.Material>;

export class World {
  root = new THREE.Group();
  private pool = new Pool();
  private actors: Actor[] = [];
  private fxs: Fx[] = [];
  private hemi: THREE.HemisphereLight; private sun: THREE.DirectionalLight;
  private sky: THREE.Mesh; private skyMat: THREE.ShaderMaterial;
  private fog = new THREE.Fog("#bccbec", 25, 420);
  private sunDisc: THREE.Sprite; private sunHalo: THREE.Sprite;
  private sunCache = new Map<number, THREE.Vector3>();
  private cloudMaps: Record<"day" | "golden", THREE.Texture[]>;
  private clouds: THREE.Mesh[] = [];
  private train = new THREE.Group();
  private flags: THREE.Mesh[] = [];
  private lamps: THREE.MeshBasicMaterial[] = [];
  private frustum = new THREE.Frustum();
  private m4 = new THREE.Matrix4(); private v = new THREE.Vector3(); private sph = new THREE.Sphere();

  constructor(kit: Kit) {
    const R = this.root, M: Mats = {};
    // ---- sky + light (as the bridge short) ----
    this.skyMat = new THREE.ShaderMaterial({
      uniforms: { c0: { value: new THREE.Color() }, c1: { value: new THREE.Color() }, c2: { value: new THREE.Color() },
        c3: { value: new THREE.Color() }, c4: { value: new THREE.Color() }, e: { value: new THREE.Vector4() } },
      vertexShader: "varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
      fragmentShader: `uniform vec3 c0, c1, c2, c3, c4; uniform vec4 e; varying vec3 vP;
        void main(){ float el = asin(clamp(normalize(vP).y, -1.0, 1.0));
          vec3 c = mix(c0, c1, smoothstep(0.0, e.x, el));
          c = mix(c, c2, smoothstep(e.x, e.y, el));
          c = mix(c, c3, smoothstep(e.y, e.z, el));
          c = mix(c, c4, smoothstep(e.z, e.w, el));
          gl_FragColor = vec4(c, 1.0); }`,
      side: THREE.BackSide, depthWrite: false, fog: false,
    });
    this.sky = new THREE.Mesh(new THREE.SphereGeometry(1100, 48, 24), this.skyMat);
    this.sky.renderOrder = -1; this.sky.frustumCulled = false; this.sky.layers.set(NOINK);
    R.add(this.sky);
    this.sunDisc = new THREE.Sprite(new THREE.SpriteMaterial({ map: discTex(), color: new THREE.Color(6.0, 4.4, 2.4), fog: false, depthWrite: false }));
    this.sunHalo = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloTex(), color: new THREE.Color(1, 1, 1), fog: false, depthWrite: false, depthTest: true,
      transparent: true, blending: THREE.AdditiveBlending }));
    this.sunDisc.renderOrder = -0.5; this.sunHalo.renderOrder = 5;
    for (const m of [this.sunDisc, this.sunHalo]) { m.frustumCulled = false; m.layers.set(NOINK); R.add(m); }
    this.hemi = new THREE.HemisphereLight("#cfe6ff", "#6c5c8c", 1.1);
    this.sun = new THREE.DirectionalLight("#fff0d6", 2.6);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    R.add(this.hemi, this.sun, this.sun.target);
    this.cloudMaps = { day: [0, 1, 2, 3].map((k) => cloudHD(k, LOOK.day.cloud)), golden: [0, 1, 2, 3].map((k) => cloudHD(k, LOOK.golden.cloud)) };
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2 + 0.3, d = 620 + (i % 3) * 60;
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: this.cloudMaps.day[i % 4], color: new THREE.Color(1.1, 1.1, 1.1), transparent: true, depthWrite: false, fog: false }));
      const w = 130 + (i % 4) * 30;
      m.position.set(Math.cos(a) * d, 120 + (i % 4) * 38, Math.sin(a) * d); m.scale.set(w, w / 2, 1);
      m.layers.set(NOINK);
      this.clouds.push(m); R.add(m);
    }

    // ---- ground ----
    setSight(sightLines());
    const b = new Batch();
    M.grass = lam("grassHD", () => ({ map: grassHD() }));
    M.cobble = lam("cobbleHD", () => ({ map: cobbleHD() }));
    M.walk = lam("walkHD", () => ({ map: stoneHD("walkHD", ["#d9cdb9", "#cfc2ad", "#e2d7c5", "#c6b8a2"], "#a99a86") }));
    M.wood = lam("wood", () => ({ map: beam() }));
    M.iron = twoTone(new THREE.MeshPhongMaterial({ color: "#3d414c", specular: "#8a8a8a", shininess: 60 }), 0.15);
    M.green = lam("ironGreen", () => ({ color: "#3f5a46" }));
    M.dark = lam("darkBox", () => ({ color: "#2b2f2a" }));
    b.add(quadUp(-900, 900, -900, 900, 450, 450, -0.02), M.grass);
    b.add(quadUp(-7.5, 7.5, -30, 130, 4, 40, 0.0), M.cobble);              // main street
    b.add(quadUp(-32, 32, -66, -28, 16, 9.5, 0.0), M.cobble);              // town-hall square
    for (const s of [-1, 1]) b.add(boxGeo(V(s < 0 ? -9.5 : 7.5, -0.02, -28), V(s < 0 ? -7.5 : 9.5, 0.12, 130), 2), M.walk); // pavements
    b.add(boxGeo(V(-7.5, -0.02, 128), V(7.5, 0.01, 158), 2), M.walk);      // path out to the railway

    // ---- houses along the main street (fronts on |x| = 9.5) ----
    const r = rng(23);
    const pick = <T,>(a: T[]) => a[Math.floor(r() * a.length) % a.length];
    for (const sx of [-1, 1]) {
      let z = -26;
      while (z < 126) {
        const w = pick([7, 8, 9]), h = pick([8.4, 9.8, 11.2]);
        const skip = sx > 0 && z > 84 && z < 98; // side street at the traffic light
        if (!skip) house(b, sx * (9.5 + 4), z + w / 2, sx < 0 ? Math.PI / 2 : -Math.PI / 2, w, 8, h, Math.floor(r() * 8));
        z += w + (r() < 0.2 ? 1.5 : 0.2);
      }
    }
    // around the square: west and east rows, fronts facing the square
    for (const sx of [-1, 1]) {
      let z = -76;
      while (z < -30) {
        const w = pick([7, 8, 9]), h = pick([9.8, 11.2]);
        house(b, sx * (32 + 4), z + w / 2, sx < 0 ? Math.PI / 2 : -Math.PI / 2, w, 8, h, Math.floor(r() * 8));
        z += w + 0.2;
      }
      // corner houses between the square and the street
      for (let x = 9.5; x < 30; x += 8.4) house(b, sx * (x + 4), -24, Math.PI, 8, 8, pick([9.8, 11.2]), Math.floor(r() * 8));
    }
    // back rows behind the street houses (roofscape for the aerial)
    for (const sx of [-1, 1]) for (let z = -18; z < 120; z += 9 + r() * 3) if (r() > 0.25) house(b, sx * (28 + r() * 4), z, sx < 0 ? Math.PI / 2 : -Math.PI / 2, pick([7, 9]), 8, pick([7, 8.4, 9.8]), Math.floor(r() * 8));

    // ---- the Rathaus: red brick, 32 m wide, central tower with clock and spire ----
    const RZ = RATHAUS_Z, RW = 16, RH = 14, RD = 16;
    const front = lam("rathausF", () => ({ map: facadeHD("rathausF", 2 * RW, RH, { wall: "#b5543c", shutter: "#3b3f52", brick: true, door: true }) }));
    const side = lam("rathausS", () => ({ map: facadeHD("rathausS", RD, RH, { wall: "#b5543c", shutter: "#3b3f52", brick: true }) }));
    const trim = lam("trimStoneR", () => ({ color: "#efe3c8" }));
    b.add(quad(V(-RW, 0, RZ), V(RW, 0, RZ), V(RW, RH, RZ), V(-RW, RH, RZ)), front);
    b.add(quad(V(RW, 0, RZ - RD), V(-RW, 0, RZ - RD), V(-RW, RH, RZ - RD), V(RW, RH, RZ - RD)), side);
    b.add(quad(V(-RW, 0, RZ - RD), V(-RW, 0, RZ), V(-RW, RH, RZ), V(-RW, RH, RZ - RD)), side);
    b.add(quad(V(RW, 0, RZ), V(RW, 0, RZ - RD), V(RW, RH, RZ - RD), V(RW, RH, RZ)), side);
    const slate = roofMat("#8f97a8");
    b.add(quad(V(-RW - 0.4, RH - 0.2, RZ + 0.4), V(RW + 0.4, RH - 0.2, RZ + 0.4), V(RW + 0.4, RH + 6, RZ - RD / 2), V(-RW - 0.4, RH + 6, RZ - RD / 2), 8, 2), slate);
    b.add(quad(V(RW + 0.4, RH - 0.2, RZ - RD - 0.4), V(-RW - 0.4, RH - 0.2, RZ - RD - 0.4), V(-RW - 0.4, RH + 6, RZ - RD / 2), V(RW + 0.4, RH + 6, RZ - RD / 2), 8, 2), slate);
    for (const s of [-1, 1]) b.add(tri(V(s * RW, RH, s < 0 ? RZ - RD : RZ), V(s * RW, RH, s < 0 ? RZ : RZ - RD), V(s * RW, RH + 6, RZ - RD / 2)), side);
    // stepped gables over the two wings of the facade
    for (const gx of [-10, 10]) for (let k = 0; k < 4; k++) {
      const hw = 3.4 - k * 0.85;
      b.add(boxGeo(V(gx - hw, RH + k * 1.4, RZ - 0.5), V(gx + hw, RH + (k + 1) * 1.4, RZ + 0.25), 3), lam("brickG", () => ({ map: rep(brick(), 1, 1) })));
      b.add(boxGeo(V(gx - hw - 0.1, RH + (k + 1) * 1.4, RZ - 0.6), V(gx + hw + 0.1, RH + (k + 1) * 1.4 + 0.18, RZ + 0.35)), trim);
    }
    ub(b, trim, -RW - 0.2, RW + 0.2, RH - 0.5, RH - 0.15, RZ, RZ + 0.3);       // cornice
    ub(b, trim, -RW - 0.1, RW + 0.1, 0, 0.6, RZ, RZ + 0.25);                   // plinth
    ub(b, lam("stepR", () => ({ map: stoneHD("copeHD") })), -3, 3, 0, 0.32, RZ, RZ + 1.6); // entrance steps
    // tower (front centre), clock, spire, flag
    const TW = 3.2, TH = 30;
    b.add(boxGeo(V(-TW, 0, RZ - 2 * TW + 0.4), V(TW, TH, RZ + 0.4), 3), lam("towerBrick", () => ({ map: rep(brick(), 1, 1) })));
    ub(b, trim, -TW - 0.25, TW + 0.25, TH, TH + 0.5, RZ - 2 * TW + 0.15, RZ + 0.65);
    const spire = new THREE.ConeGeometry(TW * 1.25, 11, 4, 1); spire.rotateY(Math.PI / 4);
    b.add(spire, slate, new THREE.Matrix4().makeTranslation(0, TH + 0.5 + 5.5, RZ - TW + 0.4));
    b.add(quad(V(-1.6, TH - 5.2, RZ + 0.42), V(1.6, TH - 5.2, RZ + 0.42), V(1.6, TH - 2, RZ + 0.42), V(-1.6, TH - 2, RZ + 0.42)), lam("clockK", () => ({ map: clockTex(), alphaTest: 0.5 })));
    b.add(boxGeo(V(-0.06, TH + 11, RZ - TW + 0.34), V(0.06, TH + 15.5, RZ - TW + 0.46)), M.wood);
    // the closed counter window (shot 13): a stone frame, a green shutter and the crossed-out passport sign
    const [cx, , cz] = COUNTER;
    ub(b, trim, cx - 1.1, cx + 1.1, 0.9, 2.5, cz, cz + 0.12);
    b.add(quad(V(cx - 0.9, 1.0, cz + 0.13), V(cx + 0.9, 1.0, cz + 0.13), V(cx + 0.9, 2.4, cz + 0.13), V(cx - 0.9, 2.4, cz + 0.13)), lam("shutter", () => ({ map: shutterTex() })));
    ub(b, trim, cx - 1.25, cx + 1.25, 0.88, 1.0, cz, cz + 0.45); // sill / counter board
    { const sign = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.9), new THREE.MeshBasicMaterial({ map: passSign(), color: 0xe6e6e6 }));
      sign.position.set(cx, 1.75, cz + 0.15); sign.layers.set(NOINK); R.add(sign); }
    // ---- the junk dealer's stall (faces +x) ----
    const [sx0, , sz0] = STALL;
    b.add(boxGeo(V(sx0 - 0.5, 0, sz0 - 1.4), V(sx0 + 0.5, 0.9, sz0 + 1.4), 1), M.wood);
    for (const [px, pz] of [[-0.5, -1.4], [-0.5, 1.4], [0.6, -1.4], [0.6, 1.4]] as const) b.add(boxGeo(V(sx0 + px - 0.05, 0, sz0 + pz - 0.05), V(sx0 + px + 0.05, 2.5 - (px > 0 ? 0.3 : 0), sz0 + pz + 0.05)), M.wood);
    b.add(quad(V(sx0 + 1.0, 2.15, sz0 + 1.6), V(sx0 + 1.0, 2.15, sz0 - 1.6), V(sx0 - 0.6, 2.6, sz0 - 1.6), V(sx0 - 0.6, 2.6, sz0 + 1.6)), lam("awning", () => ({ map: awningTex(), side: THREE.DoubleSide })));
    b.add(boxGeo(V(sx0 - 0.25, 0.9, sz0 - 1.1), V(sx0 + 0.25, 1.25, sz0 - 0.5)), lam("crate", () => ({ color: "#a8724a" })));
    b.add(boxGeo(V(sx0 - 0.3, 0.9, sz0 - 0.2), V(sx0 + 0.1, 1.05, sz0 + 0.3)), lam("cloth", () => ({ color: "#6d7a9a" })));
    b.add(new THREE.CylinderGeometry(0.1, 0.12, 0.45, 10).translate(0, 0.225, 0), lam("pot", () => ({ color: "#b8684a" })), new THREE.Matrix4().makeTranslation(sx0, 0.9, sz0 + 0.8));
    b.add(boxGeo(V(sx0 + 0.3, 2.0, sz0 + 1.25), V(sx0 + 0.4, 2.05, sz0 + 1.35)), M.wood);
    // ---- traffic light on the corner (faces +z): the analogy ----
    const [ax, , az] = AMPEL;
    b.add(new THREE.CylinderGeometry(0.08, 0.1, 3.6, 12).translate(0, 1.8, 0), M.green, new THREE.Matrix4().makeTranslation(ax, 0, az));
    b.add(boxGeo(V(ax - 0.3, 2.1, az - 0.22), V(ax + 0.3, 3.85, az + 0.2)), M.dark);
    for (const [k, col, on] of [[0, "#ff3b2e", true], [1, "#ffc23a", false], [2, "#3ad06a", false]] as const) {
      const mat = new THREE.MeshBasicMaterial({ color: on ? new THREE.Color(2.6, 0.12, 0.06) : new THREE.Color(col).multiplyScalar(0.18) });
      const lamp = new THREE.Mesh(new THREE.CircleGeometry(0.19, 24), mat);
      lamp.position.set(ax, 3.5 - k * 0.55, az + 0.205); lamp.layers.set(NOINK); R.add(lamp);
      this.lamps.push(mat);
      b.add(boxGeo(V(ax - 0.24, 3.66 - k * 0.55, az + 0.2), V(ax + 0.24, 3.71 - k * 0.55, az + 0.42)), M.dark); // visor
    }
    // ---- the Kaiser's podium with flags ----
    const [px0, , pz0] = PODIUM;
    b.add(boxGeo(V(px0 - 2.2, 0, pz0 - 1.4), V(px0 + 2.2, 1.0, pz0 + 1.4), 1), lam("podium", () => ({ color: "#8c3b3a" })));
    ub(b, lam("podGold", () => ({ color: "#c9a24e" })), px0 - 2.25, px0 + 2.25, 0.85, 1.0, pz0 - 1.45, pz0 + 1.45);
    b.add(quadUp(px0 - 0.6, px0 + 0.6, pz0 + 1.4, pz0 + 6, 1, 4, 0.015), lam("carpet", () => ({ color: "#b02e35" })));
    for (const s of [-1, 1]) {
      b.add(new THREE.CylinderGeometry(0.05, 0.06, 6.5, 8).translate(0, 3.25, 0), M.wood, new THREE.Matrix4().makeTranslation(px0 + s * 3.4, 0, pz0 - 0.6));
      const fl = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.2, 12, 1), lam("flagReich", () => ({ map: flagTex(), side: THREE.DoubleSide })));
      fl.position.set(px0 + s * 3.4, 5.75, pz0 - 0.6); fl.castShadow = true; fl.frustumCulled = false;
      this.flags.push(fl); R.add(fl);
    }
    // a flag on the town-hall tower too
    { const fl = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.2, 12, 1), lam("flagReich", () => ({ map: flagTex(), side: THREE.DoubleSide })));
      fl.position.set(0, TH + 14.8, RZ - TW + 0.4); fl.frustumCulled = false; this.flags.push(fl); R.add(fl); }
    // ---- railway: ballast bed + rails along x ----
    b.add(quadUp(-400, 400, RAIL_Z - 1.6, RAIL_Z + 1.6, 200, 1, 0.03), lam("rails", () => ({ map: rep(railTex(), 1, 1) })));
    for (const s of [-1, 1]) b.add(boxGeo(V(-400, 0.03, RAIL_Z + s * 0.72 - 0.04), V(400, 0.17, RAIL_Z + s * 0.72 + 0.04)), M.iron);
    // ---- trees: along the railway field, behind the town, on the square corners ----
    const trees = ["tree_oak", "tree_default", "tree_detailed", "tree_fat", "tree-high-round", "tree"];
    for (let i = 0; i < 70; i++) {
      const x = (r() - 0.5) * 360, z = RAIL_Z + 8 + r() * 120;
      prop(b, kit, pick(trees), x, 0, z, 7 + r() * 5, r() * 6);
    }
    for (let i = 0; i < 40; i++) { const x = (r() < 0.5 ? -1 : 1) * (42 + r() * 120), z = -90 + r() * 240; prop(b, kit, pick(trees), x, 0, z, 8 + r() * 4, r() * 6); }
    for (const [x, z] of [[-26, -32], [26, -32], [-26, -58], [26, -58]] as const) prop(b, kit, "tree_oak", x, 0, z, 8.5, x * z);
    for (let i = 0; i < 40; i++) { const a = r() * Math.PI * 2, d = 260 + r() * 160; prop(b, kit, pick(["tree_cone", "tree_default", "tree_oak"]), Math.cos(a) * d * 1.3, 0, Math.sin(a) * d, 12 + r() * 6, r() * 6); }
    for (let z = 140; z < 155; z += 4) for (const s of [-1, 1]) prop(b, kit, "plant_bushDetailed", s * 9, 0, z, 1.3);
    // hills
    const hill = new THREE.SphereGeometry(1, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2);
    const hm = [lam("hillA", () => ({ color: "#78b257" })), lam("hillB", () => ({ color: "#6aa24e" })), lam("hillC", () => ({ color: "#8bbf63" }))];
    ([[-360, 380, 190, 52, 120], [140, 420, 240, 64, 140], [430, 150, 170, 48, 130], [-440, -130, 190, 44, 150], [-90, -390, 250, 58, 140],
      [320, -330, 210, 54, 130], [520, -60, 160, 40, 120], [-560, 60, 200, 46, 140]] as const).forEach(([x, z, sx, sy, sz], i) =>
      b.add(hill, hm[i % 3], new THREE.Matrix4().compose(V(x, -2, z), new THREE.Quaternion(), V(sx, sy, sz))));
    b.build(R);
    setSight([]);

    // ---- the train (dynamic): locomotive + 3 carriages, front at local x = 0 ----
    const tb = new Batch(), boiler = lam("boiler", () => ({ color: "#2f3b33" })), red = lam("trainRed", () => ({ color: "#a23a32" }));
    const boilerG = new THREE.CylinderGeometry(0.85, 0.85, 4.6, 18); boilerG.rotateZ(Math.PI / 2);
    tb.add(boilerG, boiler, new THREE.Matrix4().makeTranslation(-2.6, 2.0, 0));
    tb.add(boxGeo(V(-7.4, 1.0, -1.15), V(-4.9, 3.6, 1.15)), boiler);
    tb.add(boxGeo(V(-7.6, 3.6, -1.3), V(-4.7, 3.8, 1.3)), M.dark);
    tb.add(new THREE.CylinderGeometry(0.28, 0.38, 1.3, 12).translate(0, 0.65, 0), M.dark, new THREE.Matrix4().makeTranslation(-1.2, 2.7, 0));
    tb.add(boxGeo(V(-7.6, 0.55, -1.2), V(0.2, 1.0, 1.2)), red);
    const wheel = new THREE.CylinderGeometry(0.55, 0.55, 0.2, 16); wheel.rotateX(Math.PI / 2);
    for (const wx of [-1.2, -3.0, -5.0, -6.8]) for (const s of [-1, 1]) tb.add(wheel, red, new THREE.Matrix4().makeTranslation(wx, 0.6, s * 0.95));
    for (let k = 0; k < 3; k++) {
      const x1 = -8.2 - k * 9.6, x0 = x1 - 9.0, cm = lam("car" + k, () => ({ map: carTex(String(k), k === 1 ? "#4e6b45" : "#7a3b33") }));
      tb.add(boxGeo(V(x0, 1.0, -1.25), V(x1, 3.4, 1.25)), cm);
      tb.add(boxGeo(V(x0 - 0.15, 3.4, -1.4), V(x1 + 0.15, 3.65, 1.4)), M.dark);
      for (const wx of [x0 + 1.5, x1 - 1.5]) for (const s of [-1, 1]) tb.add(wheel, M.dark, new THREE.Matrix4().makeTranslation(wx, 0.6, s * 0.95));
    }
    tb.build(this.train);
    this.train.position.set(0, 0.17, RAIL_Z);
    R.add(this.train);
  }

  /** camera-relative sun, frozen per shot */
  private shotSun(id: number, s: ShotDef, L: LightPreset) {
    let v = this.sunCache.get(id);
    if (v) return v;
    let fx = 0, fz = 0;
    for (let f = s.a; f < s.b; f += 3) {
      const c = camAt(id, f), x = c.look[0] - c.pos[0], z = c.look[2] - c.pos[2], n = Math.hypot(x, z) || 1;
      fx += x / n; fz += z / n;
    }
    const n = Math.hypot(fx, fz) || 1; fx /= n; fz /= n;
    const az = THREE.MathUtils.degToRad(s.sunAz ?? L.az), el = THREE.MathUtils.degToRad(s.sunEl ?? L.el);
    const hx = fx * Math.cos(az) - fz * Math.sin(az), hz = fz * Math.cos(az) + fx * Math.sin(az);
    v = new THREE.Vector3(hx * Math.cos(el), Math.sin(el), hz * Math.cos(el)).normalize();
    this.sunCache.set(id, v);
    return v;
  }

  private actor(i: number) { while (this.actors.length <= i) this.actors.push(new Actor(this.root)); return this.actors[i]; }
  private fx(i: number) { while (this.fxs.length <= i) this.fxs.push(new Fx(this.root)); return this.fxs[i]; }

  update(id: number, f: number, cam: THREE.PerspectiveCamera, scene: THREE.Scene) {
    const t = f / FPS, s = SHOTS[id - 1], L = LIGHTS[s.light];
    const c = camAt(id, f);
    cam.position.set(...c.pos); cam.up.set(0, 1, 0); cam.lookAt(...c.look); cam.rotateZ(c.roll);
    cam.fov = c.fov; cam.near = 0.2; cam.far = 1500; cam.updateProjectionMatrix(); cam.updateMatrixWorld();
    const focus = V(...c.look), dist = cam.position.distanceTo(focus);
    cam.layers.enable(NOINK);
    const K = LOOK[s.light], sunDir = this.shotSun(id, s, L);
    this.hemi.color.set(L.sky); this.hemi.groundColor.set(L.ground); this.hemi.intensity = L.hemiI;
    this.sun.color.set(L.sunCol); this.sun.intensity = L.sunI;
    let Rr = THREE.MathUtils.clamp(dist * 1.15 + 7, 12, 95);
    if (s.light === "golden") Rr = Math.max(Rr, 30);
    this.sun.position.copy(focus).addScaledVector(sunDir, 220); this.sun.target.position.copy(focus);
    const sc = this.sun.shadow.camera;
    sc.left = -Rr; sc.right = Rr; sc.top = Rr; sc.bottom = -Rr; sc.near = 20; sc.far = 480; sc.updateProjectionMatrix();
    this.sun.shadow.bias = L.bias; this.sun.shadow.normalBias = L.normalBias * (Rr / 12);
    TONE.uLitCol.value.set(...L.lit); TONE.uShadeCol.value.set(...L.shade); TONE.uShadeLift.value.set(...L.lift);
    TONE.uLambert.value = L.lambert; TONE.uSideK.value = L.sideK; TONE.uTerm.value = L.term; TONE.uBounce.value.set(...K.bounce); TONE.uSat.value = K.sat;
    CHAR.uCharTint.value.set(...L.charTint); CHAR.uCharShade.value = L.charShade; CHAR.uGrad.value = L.charGrad;
    CHAR.uBodyGrad.value = L.bodyGrad; CHAR.uSideTint.value.set(...L.sideTint);
    const su = this.skyMat.uniforms;
    K.sky.c.forEach((h, i) => untone(h, su["c" + i].value));
    const e = K.sky.e.map((deg) => THREE.MathUtils.degToRad(deg));
    su.e.value.set(e[1], e[2], e[3], e[4]);
    this.sky.position.copy(cam.position);
    untone(L.fog, this.fog.color); this.fog.near = L.fogNear; this.fog.far = L.fogFar;
    scene.fog = this.fog; scene.background = null;
    const showSun = s.light === "golden";
    this.sunDisc.visible = this.sunHalo.visible = showSun;
    if (showSun) {
      this.sunDisc.position.copy(cam.position).addScaledVector(sunDir, 900);
      this.sunDisc.scale.setScalar(2 * 900 * Math.tan(THREE.MathUtils.degToRad(1.7)));
      this.sunHalo.position.copy(this.sunDisc.position); this.sunHalo.scale.setScalar(2 * 900 * Math.tan(THREE.MathUtils.degToRad(24)));
      (this.sunHalo.material as THREE.SpriteMaterial).color.set(L.sunDisc).multiplyScalar(1.3);
    }
    for (let i = 0; i < this.clouds.length; i++) {
      const m = this.clouds[i], mat = m.material as THREE.MeshBasicMaterial;
      m.lookAt(cam.position.x, m.position.y, cam.position.z);
      mat.map = this.cloudMaps[s.light][i % 4];
    }
    // ---- train + flags ----
    const tx = trainX(t);
    this.train.position.x = id === 6 ? tx : -900;
    for (const fl of this.flags) {
      const p = fl.geometry.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < p.count; i++) {
        const u = (i % 13) / 12, y = i < 13 ? 0.6 : -0.6;
        p.setXYZ(i, -u * 1.8, y + 0.05 * u * Math.sin(t * 4 - u * 3), 0.2 * u * Math.sin(t * 5.5 - u * 5 + fl.position.x));
      }
      p.needsUpdate = true;
    }
    // ---- cast + effects ----
    const right = V(0, 0, 0).setFromMatrixColumn(cam.matrixWorld, 0);
    const st = stage(id, t, { pos: cam.position, right }, { trainX: tx, railZ: RAIL_Z });
    this.frustum.setFromProjectionMatrix(this.m4.multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse));
    let ai = 0;
    const used: Actor[] = [];
    for (const p of st.places) {
      const sc2 = p.scale ?? 1;
      if (!this.frustum.intersectsSphere(this.sph.set(this.v.set(p.x, p.y + 1.1 * sc2, p.z), 3.5))) continue;
      const a = this.actor(ai++);
      const [w, h, k] = p.size ?? [300, 500, 0.5];
      a.r = this.pool.req(p.key, w, h, k, p.draw);
      a.mesh.visible = true;
      a.mesh.position.set(p.x, p.y, p.z);
      a.mesh.rotation.set(0, p.yaw ?? Math.atan2(cam.position.x - p.x, cam.position.z - p.z), p.roll ?? 0);
      a.mesh.scale.set(p.mirror ? -sc2 : sc2, sc2, sc2);
      a.mesh.castShadow = L.actorShadow;
      used.push(a);
    }
    for (let i = ai; i < this.actors.length; i++) this.actors[i].mesh.visible = false;
    let fi = 0;
    const fused: Fx[] = [];
    for (const p of st.fx) {
      if (!this.frustum.intersectsSphere(this.sph.set(this.v.set(p.x, p.y, p.z), Math.max(p.w, p.h)))) continue;
      const e2 = this.fx(fi++);
      e2.r = this.pool.req(p.key, p.cw, p.ch, 1, p.draw);
      e2.use(!!p.soft);
      e2.mesh.visible = true;
      e2.mesh.position.set(p.x, p.y, p.z);
      if (p.flat) e2.mesh.rotation.set(-Math.PI / 2, 0, p.rot ?? 0);
      else { e2.mesh.quaternion.copy(cam.quaternion); e2.mesh.rotateZ(p.rot ?? 0); }
      e2.mesh.scale.set(p.w, p.h, 1);
      fused.push(e2);
    }
    for (let i = fi; i < this.fxs.length; i++) this.fxs[i].mesh.visible = false;
    this.pool.flush();
    for (const a of used) a.bind();
    for (const e3 of fused) e3.bind();
    return focus;
  }
}

/** unit-box helper in world space */
const UB = new THREE.BoxGeometry(1, 1, 1);
function ub(b: Batch, mat: THREE.Material, x0: number, x1: number, y0: number, y1: number, z0: number, z1: number) {
  b.add(UB, mat, new THREE.Matrix4().compose(V((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2), new THREE.Quaternion(), V(x1 - x0, y1 - y0, z1 - z0)));
}
