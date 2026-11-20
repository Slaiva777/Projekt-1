// Reusable 3D props for the full-3D style: palms, huts, stone money, rocks, seaweed, fish, ground, water.
import * as THREE from "three";
import { mat } from "./toon3d";

export const rng = (seed: number) => { let s = seed >>> 0 || 1; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; };
const texCache = new Map<string, THREE.CanvasTexture>();
/** tileable painted noise texture */
export const noiseTex = (key: string, base: string, dabs: string[], n = 2500, size = 512, rmax = 6, rep = 8) => {
  let t = texCache.get(key);
  if (t) return t;
  const c = document.createElement("canvas"); c.width = c.height = size; const g = c.getContext("2d")!;
  const r = rng(key.length * 977 + n);
  g.fillStyle = base; g.fillRect(0, 0, size, size);
  for (let i = 0; i < n; i++) {
    const x = r() * size, y = r() * size, rr = 1 + r() * rmax;
    g.fillStyle = dabs[Math.floor(r() * dabs.length)]; g.globalAlpha = 0.15 + r() * 0.3;
    for (const ox of [-size, 0, size]) for (const oy of [-size, 0, size]) { g.beginPath(); g.arc(x + ox, y + oy, rr, 0, 7); g.fill(); }
  }
  t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep, rep); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  texCache.set(key, t); return t;
};
const shade = (o: THREE.Object3D) => { o.traverse((m) => { if ((m as THREE.Mesh).isMesh) { m.castShadow = true; m.receiveShadow = true; } }); return o; };
const M = (g: THREE.BufferGeometry, m: THREE.Material, p: [number, number, number] = [0, 0, 0], s: [number, number, number] = [1, 1, 1], r: [number, number, number] = [0, 0, 0]) => {
  const o = new THREE.Mesh(g, m); o.position.set(...p); o.scale.set(...s); o.rotation.set(...r); o.castShadow = true; o.receiveShadow = true; return o;
};
const SPH = new THREE.SphereGeometry(1, 24, 16), CYL = new THREE.CylinderGeometry(1, 1, 1, 14), BOX = new THREE.BoxGeometry(1, 1, 1);

export const ground = (w: number, d: number, col: string, dabs: string[], key: string, rep = 12, y = 0) => {
  const m = new THREE.MeshStandardMaterial({ map: noiseTex(key, col, dabs, 3000, 512, 5, rep), roughness: 0.95 });
  const o = new THREE.Mesh(new THREE.PlaneGeometry(w, d), m); o.rotation.x = -Math.PI / 2; o.position.y = y; o.receiveShadow = true; return o;
};

/** palm: curved trunk of rings + drooping fronds; sway animates with t */
export const palm = (h: number, lean: number, seed: number) => {
  const g = new THREE.Group(), r = rng(seed);
  const bark = mat("#8a6a4a", 0.95), bark2 = mat("#73563b", 0.95), leaf = mat("#4f8a3a", 0.75), leaf2 = mat("#3f7430", 0.75);
  const n = 12; let top = new THREE.Vector3();
  for (let i = 0; i < n; i++) {
    const u = i / n, x = lean * u * u * h, y = u * h;
    const seg = M(CYL, i % 2 ? bark : bark2, [x, y + h / n / 2, 0], [0.13 - 0.05 * u, h / n * 1.02, 0.13 - 0.05 * u], [0, 0, -lean * 1.6 * u]);
    g.add(seg); top = new THREE.Vector3(lean * h, h, 0);
  }
  const crown = new THREE.Group(); crown.position.copy(top); g.add(crown);
  for (let k = 0; k < 8; k++) {
    const fr = new THREE.Group(); fr.rotation.y = (k / 8) * Math.PI * 2 + r() * 0.4; crown.add(fr);
    // frond: 5 segments bending down
    let p = new THREE.Vector3(), ang = 0.35 + r() * 0.2;
    for (let s = 0; s < 5; s++) {
      const len = 0.45, dir = new THREE.Vector3(Math.cos(ang), Math.sin(ang), 0);
      const c = p.clone().addScaledVector(dir, len / 2);
      const m = M(SPH, s % 2 ? leaf : leaf2, [c.x, c.y, c.z], [len * 0.62, 0.025, 0.22 - s * 0.025], [0, 0, ang]);
      fr.add(m); p.addScaledVector(dir, len); ang -= 0.32;
    }
  }
  for (let k = 0; k < 3; k++) crown.add(M(SPH, mat("#6a4a2a", 0.6), [Math.cos(k * 2) * 0.12, -0.12, Math.sin(k * 2) * 0.12], [0.09, 0.1, 0.09]));
  g.userData.sway = (t: number) => { crown.rotation.z = Math.sin(t * 1.1 + seed) * 0.05; crown.rotation.x = Math.sin(t * 0.8 + seed * 2) * 0.04; };
  return shade(g);
};

/** hut on stilts with a thatched roof */
export const hut = (w: number, d: number, seed: number, wall = "#c9a46a") => {
  const g = new THREE.Group();
  const wm = new THREE.MeshStandardMaterial({ map: noiseTex("bamboo" + wall, wall, ["#a8844e", "#dcc08a", "#b89058"], 1800, 256, 3, 2), roughness: 0.9 });
  const roofM = new THREE.MeshStandardMaterial({ map: noiseTex("thatch", "#b8914f", ["#8f6c38", "#d6b273", "#a07a40"], 4000, 256, 3, 3), roughness: 1 });
  const H = 1.9;
  g.add(M(BOX, mat("#7a5a3a", 0.9), [0, 0.15, 0], [w + 0.3, 0.3, d + 0.3]));
  g.add(M(BOX, wm, [0, 0.3 + H / 2, 0], [w, H, d]));
  g.add(M(BOX, mat("#3a2a22", 0.9), [0, 0.3 + 0.75, d / 2 + 0.01], [0.7, 1.5, 0.04]));
  for (const sx of [-1, 1]) g.add(M(BOX, mat("#4a3428", 0.9), [sx * w * 0.3, 0.3 + 1.25, d / 2 + 0.01], [0.45, 0.4, 0.04]));
  const roof = new THREE.Mesh(new THREE.ConeGeometry(Math.hypot(w, d) * 0.62, 1.7, 4, 1), roofM);
  roof.rotation.y = Math.PI / 4; roof.scale.set(1, 1, d / w); roof.position.y = 0.3 + H + 0.8; roof.castShadow = roof.receiveShadow = true; g.add(roof);
  g.rotation.y = (rng(seed)() - 0.5) * 0.3;
  return shade(g);
};

/** stone money wheel of radius R standing upright (facing +z) */
export const stoneWheel = (R: number, seed: number, tilt = 0) => {
  // smooth disc with a round hole: lathe of a lens-shaped profile, thicker near the hole, tiny irregularity
  const hole = R * 0.2, th = R * 0.13, pts: THREE.Vector2[] = [], N = 30;
  const thick = (u: number) => th * (1 - 0.4 * u * u) * Math.sqrt(Math.max(0, 1 - Math.max(0, (u - 0.86) / 0.14) ** 2));
  for (let i = 0; i <= N; i++) { const u = i / N; pts.push(new THREE.Vector2(hole + (R - hole) * u, -thick(u))); }
  for (let i = N; i >= 0; i--) { const u = i / N; pts.push(new THREE.Vector2(hole + (R - hole) * u, thick(u))); }
  for (let i = 1; i < 12; i++) { const a = (Math.PI * i) / 12; pts.push(new THREE.Vector2(hole - Math.sin(a) * th * 0.35, th * Math.cos(a))); }
  pts.push(pts[0].clone());
  const geo = new THREE.LatheGeometry(pts, 72);
  const pos = geo.attributes.position, r = rng(seed);
  const bump = Array.from({ length: 4 }, () => [r() * 6.28, 1 + Math.floor(r() * 3), r() * 0.018]);
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i), a = Math.atan2(z, x), d = Math.hypot(x, z);
    let k = 1; for (const b of bump) k += b[2] * Math.sin(a * b[1] + b[0]) * (d / R);
    pos.setX(i, x * k); pos.setZ(i, z * k);
  }
  geo.computeVertexNormals();
  const m = new THREE.MeshStandardMaterial({ map: noiseTex("stone", "#c4bfb4", ["#9a958c", "#dcd8ce", "#aca69b", "#8a857c"], 5000, 512, 3, 2), roughness: 0.96, side: THREE.DoubleSide });
  const o = new THREE.Mesh(geo, m); o.rotation.x = Math.PI / 2; o.castShadow = o.receiveShadow = true;
  const g = new THREE.Group(); g.add(o); o.position.y = R; g.rotation.z = tilt;
  return g;
};

export const rock = (s: number, seed: number, col = "#8a8378") => {
  const geo = new THREE.IcosahedronGeometry(1, 2), pos = geo.attributes.position, r = rng(seed);
  const ph = [r() * 6, r() * 6, r() * 6];
  for (let i = 0; i < pos.count; i++) { const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i); const k = 0.85 + 0.12 * Math.sin(x * 3 + ph[0]) * Math.sin(y * 3 + ph[1]) + 0.1 * Math.sin(z * 4 + ph[2]); pos.setXYZ(i, x * k, y * k * 0.7, z * k); }
  geo.computeVertexNormals();
  const o = new THREE.Mesh(geo, mat(col, 0.95, { flatShading: true })); o.scale.setScalar(s); o.castShadow = o.receiveShadow = true; return o;
};

/** animated water surface (vertex waves) */
export const water = (w: number, d: number, col: string, seg = 120) => {
  const geo = new THREE.PlaneGeometry(w, d, seg, seg); geo.rotateX(-Math.PI / 2);
  const m = new THREE.MeshStandardMaterial({ color: col, roughness: 0.22, metalness: 0.05, map: noiseTex("waterTex", col, ["#ffffff", "#bfe8ee", col], 900, 256, 3, 30) });
  const o = new THREE.Mesh(geo, m); o.receiveShadow = true;
  const base = Float32Array.from(geo.attributes.position.array as Float32Array);
  o.userData.wave = (t: number, amp = 0.08) => {
    const p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = base[i * 3], z = base[i * 3 + 2];
      p.setY(i, amp * (Math.sin(x * 0.6 + t * 1.6) + 0.6 * Math.sin(z * 0.9 - t * 1.2) + 0.3 * Math.sin((x + z) * 1.7 + t * 2.3)));
    }
    p.needsUpdate = true; geo.computeVertexNormals();
  };
  return o;
};

export const seaweed = (h: number, seed: number) => {
  const g = new THREE.Group(), r = rng(seed), segs: THREE.Object3D[] = [];
  let parent: THREE.Object3D = g;
  const n = 7;
  for (let i = 0; i < n; i++) {
    const s = new THREE.Group(); s.position.y = i ? h / n : 0; parent.add(s);
    s.add(M(SPH, mat(i % 2 ? "#3f8a5a" : "#4f9a62", 0.7), [0, h / n / 2, 0], [0.07 - i * 0.006, h / n * 0.6, 0.035]));
    segs.push(s); parent = s;
  }
  const ph = r() * 6;
  g.userData.sway = (t: number) => segs.forEach((s, i) => { s.rotation.z = Math.sin(t * 1.2 + ph - i * 0.4) * 0.12; s.rotation.x = Math.sin(t * 0.9 + ph - i * 0.5) * 0.08; });
  return shade(g);
};

export const fish = (col: string, s = 1) => {
  const g = new THREE.Group();
  g.add(M(SPH, mat(col, 0.5), [0, 0, 0], [0.18 * s, 0.1 * s, 0.05 * s]));
  const tail = new THREE.Mesh(new THREE.ConeGeometry(0.08 * s, 0.12 * s, 3), mat(col, 0.5)); tail.rotation.z = Math.PI / 2; tail.position.x = -0.2 * s; tail.scale.z = 0.3; g.add(tail);
  for (const side of [-1, 1]) g.add(M(SPH, mat("#111", 0.3), [0.11 * s, 0.025 * s, side * 0.045 * s], [0.018 * s, 0.018 * s, 0.01 * s]));
  g.userData.tail = tail;
  return shade(g);
};

/** bush / shrub cluster */
export const bush = (s: number, seed: number, col = "#5a8f3e") => {
  const g = new THREE.Group(), r = rng(seed);
  for (let i = 0; i < 5; i++) g.add(M(SPH, mat(i % 2 ? col : "#4a7f34", 0.85), [(r() - 0.5) * s, s * (0.35 + r() * 0.3), (r() - 0.5) * s * 0.7], [s * (0.4 + r() * 0.2), s * (0.35 + r() * 0.15), s * (0.4 + r() * 0.2)]));
  return g;
};

/** distant island silhouette */
export const island = (w: number, h: number, seed: number) => {
  const g = new THREE.Group(), r = rng(seed);
  g.add(M(SPH, mat("#e6d29a", 1), [0, 0, 0], [w * 0.55, 0.4, w * 0.35]));
  for (let i = 0; i < 4; i++) g.add(M(SPH, mat(i % 2 ? "#4f8a3a" : "#5f9a44", 0.9), [(r() - 0.5) * w * 0.6, 0, (r() - 0.5) * w * 0.2], [w * 0.25, h * (0.6 + r() * 0.5), w * 0.2]));
  return g;
};
export { M, SPH, CYL, BOX, shade };
