// Background life for a German night street: lit shop fronts with signs (Kiosk, Apotheke, Döner, Bäckerei, Späti),
// rain (falling streaks + ground ripples), manhole steam, police tape, distant skyline with blinking aircraft lights
// and a TV tower, cross traffic far away, trees in planters, bins, bike rack, bus stop with lit ad panel, blinking amber
// traffic light, silhouettes in windows, low ground haze. Every animated part returns an update(t) function.
import * as THREE from "three";
import { mat } from "./toon3d";
import { rng, M, SPH, CYL, BOX } from "./props";
import { canvasTex, plane, emi } from "./city";

type Upd = (t: number) => void;
const add = (g: THREE.Object3D, o: THREE.Object3D, p: [number, number, number], ry = 0) => { o.position.set(...p); o.rotation.y = ry; g.add(o); return o; };

/** shop front: lit display window, door, illuminated sign, awning. Faces +z, width w. */
export const shopFront = (w: number, name: string, signCol: string, glow: string, seed: number) => {
  const g = new THREE.Group(), r = rng(seed);
  const disp = canvasTex("disp" + seed, 512, 256, (c) => {
    const gr = c.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, glow); gr.addColorStop(1, "#3a2a1a"); c.fillStyle = gr; c.fillRect(0, 0, 512, 256);
    for (let i = 0; i < 14; i++) { c.fillStyle = ["#d94c3a", "#f2c84a", "#4a8ad9", "#f2f2f2", "#5ab25a"][i % 5]; c.globalAlpha = 0.75; c.fillRect(20 + i * 34, 150 + (i % 3) * 20, 22, 60 - (i % 3) * 20); }
    c.globalAlpha = 0.5; c.fillStyle = "#fff"; c.fillRect(0, 120, 512, 6);
  });
  const dm = new THREE.MeshStandardMaterial({ map: disp, emissive: "#ffffff", emissiveMap: disp, emissiveIntensity: 1.3, roughness: 0.2 });
  add(g, plane(w - 1.6, 2.1, dm), [-0.5, 1.35, 0.03]);
  add(g, plane(0.95, 2.2, mat("#1a1d22", 0.3, { metalness: 0.5 })), [w / 2 - 0.75, 1.1, 0.03]);
  const sign = canvasTex("sign" + name, 1024, 192, (c) => { c.fillStyle = "#141414"; c.fillRect(0, 0, 1024, 192); c.font = "bold 128px Arial"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillStyle = signCol; c.shadowColor = signCol; c.shadowBlur = 24; c.fillText(name, 512, 100); });
  const sm = new THREE.MeshStandardMaterial({ map: sign, emissive: "#ffffff", emissiveMap: sign, emissiveIntensity: 2.4, roughness: 0.4 });
  add(g, new THREE.Mesh(new THREE.BoxGeometry(Math.min(w - 0.6, 4.2), 0.62, 0.16), [mat("#222"), mat("#222"), mat("#222"), mat("#222"), sm, mat("#222")]), [0, 2.85, 0.12]);
  if (r() > 0.4) { const aw = M(BOX, mat(["#7a1f22", "#1f4a3a", "#2a3a6a"][seed % 3], 0.8), [0, 2.45, 0.55], [w - 0.4, 0.06, 1.1], [0.32, 0, 0]); g.add(aw); }
  return g;
};

export const pharmacyCross = () => {
  const g = new THREE.Group(), m = emi("#22e06a", 3.2);
  g.add(M(BOX, m, [0, 0, 0], [0.18, 0.62, 0.62])); g.add(M(BOX, m, [0, 0, 0], [0.18, 0.2, 0.62])); g.children[1].scale.set(0.18, 0.62, 0.2);
  g.add(M(BOX, mat("#333"), [-0.25, 0, 0], [0.5, 0.05, 0.05]));
  return g;
};

/** rain streaks in a box around the camera target; update moves them */
export const rain = (n = 2600, box = 26, h = 14) => {
  const pos = new Float32Array(n * 6), r = rng(77), seeds = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { seeds[i * 3] = r() * box - box / 2; seeds[i * 3 + 1] = r() * h; seeds[i * 3 + 2] = r() * box - box / 2; }
  const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const lines = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: "#b8c8e8", transparent: true, opacity: 0.32, depthWrite: false, blending: THREE.AdditiveBlending }));
  lines.frustumCulled = false;
  const upd = (t: number, c: THREE.Vector3) => {
    for (let i = 0; i < n; i++) {
      const y = (((seeds[i * 3 + 1] - t * 9.5) % h) + h) % h;
      const x = c.x + seeds[i * 3] + t * 0.6, z = c.z + seeds[i * 3 + 2];
      pos.set([x, y, z, x - 0.04, y + 0.38, z], i * 6);
    }
    geo.attributes.position.needsUpdate = true;
  };
  return { obj: lines, upd };
};

/** ground ripples (rain hits) as small expanding rings */
export const ripples = (n = 40, area: [number, number, number, number]) => {
  const g = new THREE.Group(), r = rng(13), rings: { m: THREE.Mesh; x: number; z: number; ph: number }[] = [];
  const geo = new THREE.RingGeometry(0.8, 1, 24); geo.rotateX(-Math.PI / 2);
  for (let i = 0; i < n; i++) {
    const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: "#9fb4d8", transparent: true, opacity: 0.3, depthWrite: false, blending: THREE.AdditiveBlending }));
    const x = area[0] + r() * (area[1] - area[0]), z = area[2] + r() * (area[3] - area[2]); m.position.set(x, 0.012, z); g.add(m); rings.push({ m, x, z, ph: r() });
  }
  const upd: Upd = (t) => rings.forEach((q) => { const u = (t * 1.6 + q.ph) % 1; q.m.scale.setScalar(0.03 + u * 0.16); (q.m.material as THREE.MeshBasicMaterial).opacity = 0.32 * (1 - u); });
  return { obj: g, upd };
};

const puffTex = () => canvasTex("puff", 128, 128, (c) => { const gr = c.createRadialGradient(64, 64, 4, 64, 64, 62); gr.addColorStop(0, "rgba(255,255,255,0.55)"); gr.addColorStop(1, "rgba(255,255,255,0)"); c.fillStyle = gr; c.fillRect(0, 0, 128, 128); });
/** manhole with rising steam sprites */
export const steam = (n = 14) => {
  const g = new THREE.Group(), tex = puffTex();
  g.add(M(CYL, mat("#1a1b1e", 0.5, { metalness: 0.6 }), [0, 0.01, 0], [0.42, 0.02, 0.42]));
  const ps = Array.from({ length: n }, (_, i) => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color: "#c8cfdc", transparent: true, depthWrite: false, opacity: 0.4 })); g.add(s); return { s, ph: i / n }; });
  const upd: Upd = (t) => ps.forEach(({ s, ph }) => { const u = (t * 0.18 + ph) % 1; s.position.set(Math.sin(t * 0.7 + ph * 9) * 0.3 * u + u * 0.6, 0.1 + u * 3.2, Math.cos(t * 0.5 + ph * 7) * 0.2 * u); s.scale.setScalar(0.5 + u * 2.4); (s.material as THREE.SpriteMaterial).opacity = 0.42 * Math.sin(Math.PI * u); });
  return { obj: g, upd };
};

/** police tape between two points (sagging, fluttering) */
export const tape = (a: THREE.Vector3, b: THREE.Vector3, seed: number) => {
  const g = new THREE.Group();
  for (const p of [a, b]) { g.add(M(CYL, mat("#d8d8d8", 0.5), [p.x, 0.55, p.z], [0.03, 1.1, 0.03])); g.add(M(CYL, mat("#c4231c", 0.5), [p.x, 0.02, p.z], [0.16, 0.04, 0.16])); }
  const tex = canvasTex("tape", 256, 32, (c) => { for (let i = 0; i < 8; i++) { c.fillStyle = i % 2 ? "#c4231c" : "#f4f4f4"; c.beginPath(); c.moveTo(i * 32, 0); c.lineTo(i * 32 + 32, 0); c.lineTo(i * 32 + 16, 32); c.lineTo(i * 32 - 16, 32); c.fill(); } c.fillStyle = "#111"; c.font = "bold 20px Arial"; c.fillText("POLIZEI", 90, 23); });
  tex.wrapS = THREE.RepeatWrapping; const len = a.distanceTo(b); tex.repeat.set(len / 1.2, 1);
  const segs = 24, geo = new THREE.PlaneGeometry(len, 0.08, segs, 1);
  const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: tex, side: THREE.DoubleSide, roughness: 0.6 }));
  const mid = a.clone().add(b).multiplyScalar(0.5); m.position.set(mid.x, 1.0, mid.z); m.rotation.y = -Math.atan2(b.z - a.z, b.x - a.x); g.add(m);
  const base = Float32Array.from(geo.attributes.position.array as Float32Array);
  const upd: Upd = (t) => {
    const p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) { const x = base[i * 3], u = x / len + 0.5; const sag = -0.12 * Math.sin(Math.PI * u); p.setY(i, base[i * 3 + 1] + sag + Math.sin(t * 5 + u * 14 + seed) * 0.015 * Math.sin(Math.PI * u)); p.setZ(i, Math.sin(t * 3.3 + u * 9 + seed) * 0.04 * Math.sin(Math.PI * u)); }
    p.needsUpdate = true;
  };
  return { obj: g, upd };
};

/** distant skyline (beyond the street), TV tower and blinking aircraft-warning lights */
export const skyline = (z: number, seed: number) => {
  const g = new THREE.Group(), r = rng(seed), blinkers: THREE.MeshStandardMaterial[] = [];
  const win = canvasTex("skywin", 256, 512, (c) => { c.fillStyle = "#0c0f18"; c.fillRect(0, 0, 256, 512); for (let y = 8; y < 512; y += 16) for (let x = 6; x < 256; x += 14) if (Math.random() < 0.32) { c.fillStyle = Math.random() < 0.7 ? "#ffcf7a" : "#a8c4ff"; c.fillRect(x, y, 7, 8); } });
  win.wrapS = win.wrapT = THREE.RepeatWrapping;
  for (let i = 0; i < 26; i++) {
    const h = 18 + r() * 55, w = 8 + r() * 14, x = -150 + i * 12 + r() * 6;
    const m = new THREE.MeshStandardMaterial({ color: "#0c0f18", emissive: "#ffffff", emissiveMap: win, emissiveIntensity: 0.55, roughness: 0.9 });
    const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, 8), m); b.position.set(x, h / 2, z - r() * 30); g.add(b);
    if (h > 45) { const bm = emi("#ff2020", 0); blinkers.push(bm); g.add(M(SPH, bm, [x, h + 0.6, b.position.z], [0.4, 0.4, 0.4])); }
  }
  // TV tower
  const tx = 40, tz = z - 60;
  g.add(M(CYL, mat("#1a1e28", 0.7), [tx, 90, tz], [2.2, 180, 2.2]));
  g.add(M(SPH, emi("#ffcf8a", 0.6), [tx, 150, tz], [9, 8, 9]));
  g.add(M(CYL, mat("#1a1e28", 0.7), [tx, 200, tz], [0.6, 40, 0.6]));
  const top = emi("#ff2020", 0); blinkers.push(top); g.add(M(SPH, top, [tx, 221, tz], [1.2, 1.2, 1.2]));
  const upd: Upd = (t) => blinkers.forEach((m, i) => { m.emissiveIntensity = ((t * 0.8 + i * 0.37) % 1) < 0.35 ? 6 : 0.2; });
  g.traverse((o) => { o.castShadow = false; });
  return { obj: g, upd };
};

/** cars crossing at a far intersection (headlights + tail lights) */
export const crossTraffic = (x: number, n = 3) => {
  const g = new THREE.Group(), cars: { o: THREE.Group; ph: number; dir: number }[] = [];
  for (let i = 0; i < n; i++) {
    const o = new THREE.Group(); const body = mat(["#2a2d33", "#6a6d72", "#1f2a44"][i % 3], 0.3, { metalness: 0.5 });
    o.add(M(BOX, body, [0, 0.6, 0], [1.8, 0.7, 4.2])); o.add(M(BOX, body, [0, 1.15, -0.2], [1.6, 0.5, 2.2]));
    for (const s of [-1, 1]) { o.add(M(SPH, emi("#fff1d0", 6), [s * 0.65, 0.65, 2.12], [0.14, 0.1, 0.05])); o.add(M(BOX, emi("#ff2a2a", 3), [s * 0.7, 0.75, -2.12], [0.3, 0.12, 0.04])); }
    g.add(o); cars.push({ o, ph: i / n, dir: i % 2 ? 1 : -1 });
  }
  const upd: Upd = (t) => cars.forEach(({ o, ph, dir }) => { const u = (t * 0.05 + ph) % 1; o.position.set(x + (dir > 0 ? 1.8 : -1.8), 0, dir * (-70 + 140 * u)); o.rotation.y = dir > 0 ? 0 : Math.PI; });
  return { obj: g, upd };
};

export const tree = (seed: number) => {
  const g = new THREE.Group(), r = rng(seed);
  g.add(M(BOX, mat("#4a4c52", 0.9), [0, 0.25, 0], [1.2, 0.5, 1.2]));
  g.add(M(CYL, mat("#3a2a20", 0.9), [0, 2.0, 0], [0.12, 3.4, 0.12]));
  for (let i = 0; i < 6; i++) g.add(M(SPH, mat(i % 2 ? "#2f4a2a" : "#3a5a32", 0.85), [(r() - 0.5) * 1.4, 3.6 + r() * 1.3, (r() - 0.5) * 1.4], [1.0 + r() * 0.4, 0.8 + r() * 0.3, 1.0 + r() * 0.4]));
  const leaves = g.children.slice(2);
  const upd: Upd = (t) => leaves.forEach((l, i) => { l.rotation.z = Math.sin(t * 1.3 + i + seed) * 0.03; });
  return { obj: g, upd };
};

export const busStop = () => {
  const g = new THREE.Group();
  g.add(M(BOX, mat("#2a2d33", 0.5, { metalness: 0.6 }), [0, 2.4, 0], [3.4, 0.08, 1.3]));
  for (const x of [-1.6, 1.6]) g.add(M(CYL, mat("#2a2d33", 0.5, { metalness: 0.6 }), [x, 1.2, -0.5], [0.05, 2.4, 0.05]));
  const glass = new THREE.MeshStandardMaterial({ color: "#8fa0b8", transparent: true, opacity: 0.18, roughness: 0.05, metalness: 0.3 });
  g.add(M(BOX, glass, [0, 1.25, -0.6], [3.2, 2.2, 0.03]));
  const ad = canvasTex("ad", 256, 512, (c) => { const gr = c.createLinearGradient(0, 0, 0, 512); gr.addColorStop(0, "#f26a3a"); gr.addColorStop(1, "#3a1a6a"); c.fillStyle = gr; c.fillRect(0, 0, 256, 512); c.fillStyle = "#fff"; c.font = "bold 46px Arial"; c.textAlign = "center"; c.fillText("NACHT", 128, 180); c.fillText("SALE", 128, 236); c.font = "28px Arial"; c.fillText("−50 %", 128, 300); });
  g.add(M(BOX, new THREE.MeshStandardMaterial({ map: ad, emissive: "#ffffff", emissiveMap: ad, emissiveIntensity: 1.4 }), [1.15, 1.25, -0.55], [1.0, 1.9, 0.12]));
  g.add(M(BOX, mat("#3a3c42", 0.6), [-0.4, 0.5, -0.35], [1.8, 0.06, 0.4]));
  return g;
};

export const bin = (col = "#e07a1a") => { const g = new THREE.Group(); g.add(M(CYL, mat(col, 0.6), [0, 0.45, 0], [0.28, 0.9, 0.28])); g.add(M(CYL, mat("#2a2a2a", 0.5), [0, 0.93, 0], [0.3, 0.06, 0.3])); return g; };

export const bikeRack = (n: number, seed: number) => {
  const g = new THREE.Group(), r = rng(seed);
  for (let i = 0; i < n; i++) {
    const b = new THREE.Group(), fr = mat(["#c4231c", "#2a6ab0", "#e8e8e8", "#2a2a2a"][Math.floor(r() * 4)], 0.4, { metalness: 0.5 });
    for (const z of [-0.5, 0.5]) { const w = new THREE.Mesh(new THREE.TorusGeometry(0.33, 0.025, 6, 24), mat("#111", 0.6)); w.position.set(0, 0.35, z); w.rotation.y = Math.PI / 2; b.add(w); }
    b.add(M(CYL, fr, [0, 0.6, 0], [0.025, 1.0, 0.025], [Math.PI / 2 - 0.3, 0, 0])); b.add(M(CYL, fr, [0, 0.55, -0.15], [0.025, 0.6, 0.025], [0.4, 0, 0]));
    b.add(M(BOX, mat("#111", 0.6), [0, 0.92, -0.1], [0.12, 0.04, 0.25])); b.add(M(BOX, mat("#222", 0.4), [0, 0.98, 0.42], [0.5, 0.03, 0.03]));
    b.position.set(i * 0.7, 0, 0); b.rotation.y = (r() - 0.5) * 0.15; g.add(b);
  }
  return g;
};

/** amber blinking traffic light (German night mode) */
export const trafficLight = () => {
  const g = new THREE.Group(), amber = emi("#ffae1a", 0);
  g.add(M(CYL, mat("#2a2d33", 0.5), [0, 1.6, 0], [0.06, 3.2, 0.06]));
  g.add(M(BOX, mat("#1a1a1a", 0.5), [0, 3.1, 0.1], [0.3, 0.85, 0.22]));
  g.add(M(SPH, mat("#2a0a0a"), [0, 3.35, 0.22], [0.08, 0.08, 0.04])); g.add(M(SPH, amber, [0, 3.1, 0.22], [0.08, 0.08, 0.04])); g.add(M(SPH, mat("#0a2a0a"), [0, 2.85, 0.22], [0.08, 0.08, 0.04]));
  const upd: Upd = (t) => { amber.emissiveIntensity = (t % 1.2) < 0.6 ? 5 : 0.1; };
  return { obj: g, upd };
};

/** person silhouette in a lit window (moves a little); for a window centred at p facing +z */
export const windowWatcher = (seed: number) => {
  const tex = canvasTex("sil", 128, 192, (c) => { c.fillStyle = "#1a1410"; c.beginPath(); c.arc(64, 50, 26, 0, 7); c.fill(); c.beginPath(); c.moveTo(18, 192); c.quadraticCurveTo(20, 92, 64, 84); c.quadraticCurveTo(108, 92, 110, 192); c.fill(); });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 1.05), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }));
  const upd = (t: number, visible: boolean) => { m.visible = visible; m.position.x = Math.sin(t * 0.4 + seed) * 0.15; };
  return { obj: m, upd };
};

/** soft ground haze layer (large transparent gradient planes) */
export const haze = (w: number, d: number, col = "#2a3550", op = 0.22) => {
  const tex = canvasTex("haze", 256, 64, (c) => { const gr = c.createLinearGradient(0, 0, 0, 64); gr.addColorStop(0, "rgba(255,255,255,0)"); gr.addColorStop(1, "rgba(255,255,255,1)"); c.fillStyle = gr; c.fillRect(0, 0, 256, 64); });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshBasicMaterial({ map: tex, color: col, transparent: true, opacity: op, depthWrite: false }));
  return m;
};
