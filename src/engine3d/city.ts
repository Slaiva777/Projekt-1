// Night street kit: police vans (silver/white with traffic-blue foil, fluorescent yellow, contour markings,
// POLIZEI lettering, BP plates, roof light bar + grille flashers), a neutral civilian van with magnetic blue
// lights and an open sliding door, a twin-engine helicopter with a five-blade rotor, buildings with lit
// windows, street lamps, parked cars. Every animated part exposes userData.anim(t).
import * as THREE from "three";
import { mat, textTex } from "./toon3d";
import { rng, noiseTex, M, SPH, CYL, BOX, shade } from "./props";

const emi = (col: string, k = 3) => new THREE.MeshStandardMaterial({ color: "#000", emissive: col, emissiveIntensity: k, roughness: 0.4 });
const glass = () => mat("#1b2430", 0.12, { metalness: 0.6 });
const plane = (w: number, h: number, m: THREE.Material) => { const o = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m); o.receiveShadow = true; return o; };

const canvasTex = (key: string, w: number, h: number, draw: (g: CanvasRenderingContext2D) => void) => {
  const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d")!);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.name = key; return t;
};
/** side livery: traffic blue foil band with contour rectangles, yellow lower stripe, POLIZEI lettering */
const liveryTex = (lettering: boolean) => canvasTex("livery", 1024, 384, (g) => {
  g.fillStyle = "#e9ecef"; g.fillRect(0, 0, 1024, 384);
  g.fillStyle = "#0b3f8c"; g.fillRect(0, 150, 1024, 170);           // RAL 5017-like traffic blue
  g.fillStyle = "#d8ee1a"; g.fillRect(0, 320, 1024, 40);            // fluorescent yellow
  g.fillStyle = "#ffffff";                                           // contour gaps along both foil edges
  for (let x = 6; x < 1024; x += 26) { g.fillRect(x, 154, 18, 7); g.fillRect(x, 309, 18, 7); }
  if (lettering) { g.font = "bold 112px Arial"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillStyle = "#ffffff"; g.fillText("POLIZEI", 512, 238); }
});
const plateTex = (txt: string) => canvasTex("plate" + txt, 512, 112, (g) => {
  g.fillStyle = "#ffffff"; g.fillRect(0, 0, 512, 112); g.strokeStyle = "#111"; g.lineWidth = 6; g.strokeRect(3, 3, 506, 106);
  g.fillStyle = "#1a3fa8"; g.fillRect(6, 6, 48, 100); g.fillStyle = "#ffd200"; g.beginPath(); g.arc(30, 40, 12, 0, 7); g.fill();
  g.fillStyle = "#111"; g.font = "bold 78px Arial"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(txt, 285, 60);
});
const chevronTex = () => canvasTex("chev", 512, 256, (g) => {
  g.fillStyle = "#e9ecef"; g.fillRect(0, 0, 512, 256);
  g.save(); g.beginPath(); g.rect(0, 0, 512, 256); g.clip();
  for (let k = -6; k < 10; k++) { g.fillStyle = k % 2 ? "#d8ee1a" : "#c4231c"; g.beginPath(); const x = k * 70; g.moveTo(x, 256); g.lineTo(x + 256, 0); g.lineTo(x + 291, 0); g.lineTo(x + 35, 256); g.fill(); g.beginPath(); g.moveTo(x + 512, 256); g.lineTo(x + 256, 0); g.lineTo(x + 221, 0); g.lineTo(x + 477, 256); g.fill(); }
  g.restore();
});
/** stylised federal eagle badge (gold on blue) */
const badgeTex = () => canvasTex("badge", 256, 256, (g) => {
  g.fillStyle = "#0b3f8c"; g.beginPath(); g.arc(128, 128, 120, 0, 7); g.fill();
  g.strokeStyle = "#e3b53a"; g.lineWidth = 8; g.beginPath(); g.arc(128, 128, 108, 0, 7); g.stroke();
  g.fillStyle = "#e3b53a"; g.beginPath(); g.ellipse(128, 120, 24, 44, 0, 0, 7); g.fill();
  for (const s of [-1, 1]) { g.beginPath(); g.moveTo(128 + s * 18, 100); g.quadraticCurveTo(128 + s * 80, 70, 128 + s * 88, 130); g.lineTo(128 + s * 30, 140); g.fill(); }
  g.beginPath(); g.arc(128, 74, 14, 0, 7); g.fill();
  g.font = "bold 30px Arial"; g.textAlign = "center"; g.fillText("POLIZEI", 128, 205);
});

export type Van = THREE.Group;
/** police half-group van (T6-like, 4.9 m). Faces +x. */
export const policeVan = (plate: string, seed: number, lightsOn = true) => {
  const g = new THREE.Group(), L = 4.9, W = 1.95, H = 1.95;
  const livery = new THREE.MeshStandardMaterial({ map: liveryTex(true), roughness: 0.35, metalness: 0.3 });
  const silver = mat("#e3e6ea", 0.35, { metalness: 0.35 });
  const back = new THREE.MeshStandardMaterial({ map: chevronTex(), roughness: 0.4 });
  // body: main box (sides use livery), hood box
  const bodyMats = [back, silver, silver, mat("#2a2d33", 0.6), livery, livery]; // +x(front, replaced by hood), -x, +y, -y, +z, -z
  bodyMats[0] = silver; bodyMats[1] = back;
  const body = new THREE.Mesh(new THREE.BoxGeometry(L - 0.75, H - 0.35, W), bodyMats); body.position.set(-0.375, 0.35 + (H - 0.35) / 2, 0); g.add(body);
  const hood = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.7, W - 0.04), [silver, silver, silver, silver, livery, livery]); hood.position.set(L / 2 - 0.4, 0.35 + 0.35 + 0.05, 0); g.add(hood);
  // windscreen (slanted) + side windows
  const ws = plane(W - 0.18, 0.95, glass()); ws.position.set(L / 2 - 0.82, 1.55, 0); ws.rotation.set(0, Math.PI / 2, 0); ws.rotateX(-0.35); g.add(ws);
  for (const z of [-1, 1]) for (let i = 0; i < 3; i++) { const w = plane(1.0, 0.55, glass()); w.position.set(1.35 - i * 1.25, 1.75, z * (W / 2 + 0.005)); w.rotation.y = z > 0 ? 0 : Math.PI; g.add(w); }
  // badges on the front doors
  const bm = new THREE.MeshStandardMaterial({ map: badgeTex(), transparent: true, roughness: 0.5 });
  for (const z of [-1, 1]) { const b = plane(0.42, 0.42, bm); b.position.set(1.45, 1.2, z * (W / 2 + 0.008)); b.rotation.y = z > 0 ? 0 : Math.PI; g.add(b); }
  // plates
  const pm = new THREE.MeshStandardMaterial({ map: plateTex(plate), roughness: 0.4 });
  const pf = plane(0.52, 0.11, pm); pf.position.set(L / 2 + 0.005, 0.55, 0); pf.rotation.y = Math.PI / 2; g.add(pf);
  const pb = plane(0.52, 0.11, pm); pb.position.set(-L / 2 - 0.005, 0.6, 0); pb.rotation.y = -Math.PI / 2; g.add(pb);
  // wheels
  for (const x of [1.45, -1.55]) for (const z of [-1, 1]) {
    const w = M(CYL, mat("#16171a", 0.8), [x, 0.34, z * (W / 2 - 0.12)], [0.34, 0.24, 0.34], [Math.PI / 2, 0, 0]); g.add(w);
    g.add(M(CYL, mat("#9aa0a8", 0.3, { metalness: 0.6 }), [x, 0.34, z * (W / 2 - 0.0)], [0.2, 0.02, 0.2], [Math.PI / 2, 0, 0]));
  }
  // bumpers, headlights, tail lights
  g.add(M(BOX, mat("#2a2d33", 0.6), [L / 2 + 0.03, 0.42, 0], [0.1, 0.22, W + 0.02]));
  g.add(M(BOX, mat("#2a2d33", 0.6), [-L / 2 - 0.03, 0.42, 0], [0.1, 0.22, W + 0.02]));
  for (const z of [-1, 1]) {
    g.add(M(BOX, emi("#fff4dc", lightsOn ? 2.2 : 0.2), [L / 2 + 0.01, 0.82, z * 0.7], [0.04, 0.12, 0.32]));
    g.add(M(BOX, emi("#ff2020", lightsOn ? 1.6 : 0.2), [-L / 2 - 0.01, 0.95, z * 0.85], [0.04, 0.3, 0.12]));
  }
  // roof light bar + grille flashers (animated)
  const barBase = M(BOX, mat("#1d2026", 0.5), [0.9, H + 0.04, 0], [0.3, 0.08, 1.3]); g.add(barBase);
  const blues: THREE.MeshStandardMaterial[] = [];
  for (let i = 0; i < 4; i++) { const m = emi("#1f5bff", 0); blues.push(m); g.add(M(BOX, m, [0.9, H + 0.12, -0.48 + i * 0.32], [0.24, 0.1, 0.26])); }
  for (const z of [-1, 1]) { const m = emi("#2a6bff", 0); blues.push(m); g.add(M(BOX, m, [L / 2 + 0.035, 0.62, z * 0.35], [0.03, 0.06, 0.12])); }
  const pl = new THREE.PointLight("#2f6bff", 0, 16, 1.6); pl.position.set(0.9, H + 0.6, 0); g.add(pl);
  const ph = rng(seed)() * 2;
  g.userData.on = lightsOn;
  g.userData.anim = (t: number) => {
    if (!g.userData.on) { blues.forEach((m) => { m.emissiveIntensity = 0.25; }); pl.intensity = 0; return; }
    const k = (t * 2.4 + ph) % 1, a = k < 0.12 || (k > 0.24 && k < 0.36) ? 1 : 0, b = (k > 0.5 && k < 0.62) || (k > 0.74 && k < 0.86) ? 1 : 0;
    blues.forEach((m, i) => { m.emissiveIntensity = 0.4 + 9 * (i % 2 ? b : a); });
    pl.intensity = 18 * Math.max(a, b) + 2;
  };
  g.userData.heat = 0.45;
  return shade(g);
};

/** neutral civilian van (Sprinter-like, 5.9 m, dark grey) with magnetic blue lights; sliding door on +z opens by userData.door(u) */
export const civilVan = (plate: string) => {
  const g = new THREE.Group(), L = 5.9, W = 2.0, H = 2.45;
  const paint = mat("#3b3f46", 0.35, { metalness: 0.4 });
  const body = M(BOX, paint, [-0.4, 0.35 + (H - 0.35) / 2, 0], [L - 0.8, H - 0.35, W]); g.add(body);
  g.add(M(BOX, paint, [L / 2 - 0.4, 0.8, 0], [0.8, 0.9, W - 0.04]));
  const ws = plane(W - 0.18, 0.9, glass()); ws.position.set(L / 2 - 0.82, 1.7, 0); ws.rotation.set(0, Math.PI / 2, 0); ws.rotateX(-0.3); g.add(ws);
  // dark interior visible when the door opens
  const hole = plane(1.3, 1.7, mat("#0a0b0d", 1)); hole.position.set(0.35, 1.3, W / 2 + 0.004); g.add(hole);
  const door = M(BOX, paint, [0.35, 1.3, W / 2 + 0.03], [1.32, 1.72, 0.04]); g.add(door);
  g.add(plane(0.9, 0.5, glass())); (g.children[g.children.length - 1] as THREE.Mesh).position.set(-1.6, 1.85, W / 2 + 0.006);
  for (const x of [1.8, -1.9]) for (const z of [-1, 1]) g.add(M(CYL, mat("#16171a", 0.8), [x, 0.36, z * (W / 2 - 0.12)], [0.36, 0.25, 0.36], [Math.PI / 2, 0, 0]));
  const pm = new THREE.MeshStandardMaterial({ map: plateTex(plate), roughness: 0.4 });
  const pf = plane(0.52, 0.11, pm); pf.position.set(L / 2 + 0.005, 0.5, 0); pf.rotation.y = Math.PI / 2; g.add(pf);
  for (const z of [-1, 1]) { g.add(M(BOX, emi("#fff4dc", 2.2), [L / 2 + 0.01, 0.95, z * 0.75], [0.04, 0.12, 0.3])); g.add(M(BOX, emi("#ff2020", 1.4), [-L / 2 + 0.39, 1.0, z * 0.9], [0.04, 0.35, 0.12])); }
  const blues: THREE.MeshStandardMaterial[] = [];
  for (let i = 0; i < 3; i++) { const m = emi("#2a62ff", 0); blues.push(m); g.add(M(SPH, m, [1.2 - i * 1.4, H + 0.08, 0.3 - i * 0.25], [0.11, 0.1, 0.11])); g.add(M(CYL, mat("#111", 0.5), [1.2 - i * 1.4, H + 0.02, 0.3 - i * 0.25], [0.12, 0.04, 0.12])); }
  const pl = new THREE.PointLight("#2f6bff", 0, 14, 1.6); pl.position.set(0, H + 0.6, 0); g.add(pl);
  g.userData.door = (u: number) => { door.position.x = 0.35 - 1.35 * u; door.position.z = W / 2 + 0.03 + 0.08 * Math.min(1, u * 4); };
  g.userData.on = true;
  g.userData.anim = (t: number) => { if (!g.userData.on) { blues.forEach((m) => { m.emissiveIntensity = 0.25; }); pl.intensity = 0; return; } const k = (t * 2.1) % 1; blues.forEach((m, i) => { const on = ((k + i * 0.33) % 1) < 0.18; m.emissiveIntensity = on ? 10 : 0.3; }); pl.intensity = 14 * (k % 0.33 < 0.18 ? 1 : 0.3); };
  g.userData.heat = 0.42;
  return shade(g);
};

/** twin-engine police helicopter, ~16 m rotor, five-blade main rotor. Faces +x. */
export const helicopter = () => {
  const g = new THREE.Group();
  const blue = mat("#13336b", 0.35, { metalness: 0.3 }), white = mat("#e8ecef", 0.35, { metalness: 0.2 }), dark = mat("#20242a", 0.5);
  g.add(M(SPH, blue, [0, 0, 0], [4.6, 1.45, 1.35]));
  g.add(M(SPH, white, [0.2, -0.45, 0], [4.3, 1.0, 1.32]));
  const cockpit = M(SPH, glass(), [2.6, 0.25, 0], [1.9, 1.05, 1.18]); g.add(cockpit);
  g.add(M(CYL, blue, [-6.2, 0.35, 0], [0.42, 6.0, 0.42], [0, 0, Math.PI / 2 - 0.06]));
  g.add(M(BOX, blue, [-9.0, 1.4, 0], [1.4, 2.4, 0.18], [0, 0, -0.35]));
  g.add(M(BOX, blue, [-8.2, 0.55, 0], [0.9, 0.1, 2.6]));
  g.add(M(BOX, dark, [0.4, 1.55, 0], [3.0, 0.7, 1.4]));
  g.add(M(CYL, dark, [0.6, 2.05, 0], [0.22, 0.6, 0.22]));
  // POLIZEI lettering on the tail boom
  const tm = new THREE.MeshStandardMaterial({ map: textTex("POLIZEI", "#ffffff"), transparent: true });
  for (const z of [-1, 1]) { const p = plane(3.4, 0.85, tm); p.position.set(-4.6, 0.45, z * 0.45); p.rotation.y = z > 0 ? 0 : Math.PI; g.add(p); }
  // wheels / sponsons
  for (const z of [-1, 1]) { g.add(M(SPH, blue, [-0.4, -0.9, z * 1.25], [1.4, 0.45, 0.4])); g.add(M(CYL, dark, [-0.4, -1.45, z * 1.3], [0.28, 0.2, 0.28], [Math.PI / 2, 0, 0])); }
  g.add(M(CYL, dark, [3.0, -1.4, 0], [0.22, 0.16, 0.22], [Math.PI / 2, 0, 0]));
  // main rotor: hub + 5 blades + faint disc
  const rotor = new THREE.Group(); rotor.position.set(0.6, 2.4, 0); g.add(rotor);
  rotor.add(M(CYL, dark, [0, 0, 0], [0.35, 0.3, 0.35]));
  for (let i = 0; i < 5; i++) { const b = M(BOX, mat("#15171b", 0.5), [4.05, 0, 0], [8.1, 0.06, 0.48]); const arm = new THREE.Group(); arm.rotation.y = (i / 5) * Math.PI * 2; arm.add(b); rotor.add(arm); }
  const disc = new THREE.Mesh(new THREE.CircleGeometry(8.1, 64), new THREE.MeshBasicMaterial({ color: "#7c8696", transparent: true, opacity: 0.07, depthWrite: false, side: THREE.DoubleSide }));
  disc.rotation.x = -Math.PI / 2; rotor.add(disc);
  const tail = new THREE.Group(); tail.position.set(-9.15, 1.5, 0.2); g.add(tail);
  for (let i = 0; i < 3; i++) { const a = new THREE.Group(); a.rotation.z = (i / 3) * Math.PI * 2; a.add(M(BOX, dark, [0, 0.7, 0], [0.14, 1.4, 0.04])); tail.add(a); }
  // nav lights + strobe, searchlight
  const red = emi("#ff2a2a", 4), green = emi("#2aff6a", 4), strobe = emi("#ffffff", 0), beacon = emi("#ff2a2a", 0);
  g.add(M(SPH, red, [-0.3, -0.2, -1.4], [0.09, 0.09, 0.09])); g.add(M(SPH, green, [-0.3, -0.2, 1.4], [0.09, 0.09, 0.09]));
  g.add(M(SPH, strobe, [-9.6, 2.6, 0], [0.12, 0.12, 0.12])); g.add(M(SPH, beacon, [0, -1.0, 0], [0.12, 0.12, 0.12]));
  const lamp = M(SPH, emi("#fffbe8", 6), [2.4, -1.35, 0], [0.22, 0.22, 0.22]); g.add(lamp);
  const cone = new THREE.Mesh(new THREE.ConeGeometry(4.2, 34, 32, 1, true), new THREE.MeshBasicMaterial({ color: "#dfe8ff", transparent: true, opacity: 0.06, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false }));
  cone.geometry.translate(0, -17, 0); cone.position.copy(lamp.position); g.add(cone);
  g.userData.cone = cone;
  g.userData.anim = (t: number) => {
    rotor.rotation.y = t * 26; tail.rotation.y = 0; tail.rotation.z = t * 60;
    strobe.emissiveIntensity = (t * 1.1) % 1 < 0.06 ? 14 : 0; beacon.emissiveIntensity = (t * 1.4 + 0.5) % 1 < 0.15 ? 8 : 0.2;
  };
  g.userData.heat = 0.7;
  g.traverse((o) => { o.frustumCulled = false; });
  return shade(g);
};

/** city block façade along x (front faces +z) with lit/unlit windows; width w, floors n */
export const building = (w: number, floors: number, seed: number, wall: string) => {
  const g = new THREE.Group(), r = rng(seed), fh = 3.1, H = floors * fh + 0.8, D = 10;
  const wm = new THREE.MeshStandardMaterial({ map: noiseTex("wall" + wall, wall, ["#00000022", "#ffffff22"], 1500, 256, 4, 3), roughness: 0.95 });
  g.add(M(BOX, wm, [0, H / 2, -D / 2], [w, H, D]));
  g.add(M(BOX, mat("#3a3c42", 0.8), [0, H + 0.15, -D / 2], [w + 0.3, 0.3, D + 0.3]));
  const lit = emi("#ffcf7a", 1.6), lit2 = emi("#ffe2a8", 1.1), dark = mat("#20262f", 0.2, { metalness: 0.5 }), tv = emi("#8fb4ff", 1.0);
  const cols = Math.max(2, Math.floor(w / 2.4));
  for (let f = 0; f < floors; f++) for (let c = 0; c < cols; c++) {
    const x = -w / 2 + (c + 0.5) * (w / cols), y = 1.2 + f * fh + (f === 0 ? 0 : 0.6);
    const k = r(), m = f === 0 ? (k < 0.5 ? lit2 : dark) : k < 0.33 ? lit : k < 0.42 ? lit2 : k < 0.47 ? tv : dark;
    const win = plane(1.1, f === 0 ? 2.0 : 1.5, m); win.position.set(x, y + (f === 0 ? 0.2 : 0), 0.02); g.add(win);
    g.add(M(BOX, mat("#d8d2c4", 0.8), [x, y - (f === 0 ? 0.85 : 0.8), 0.06], [1.3, 0.1, 0.14]));
  }
  g.userData.heat = 0.2;
  return shade(g);
};

export const streetLamp = (withLight: boolean) => {
  const g = new THREE.Group();
  g.add(M(CYL, mat("#2a2d33", 0.5, { metalness: 0.5 }), [0, 2.6, 0], [0.07, 5.2, 0.07]));
  g.add(M(BOX, mat("#2a2d33", 0.5), [0.55, 5.2, 0], [1.2, 0.08, 0.12]));
  g.add(M(BOX, emi("#ffb860", 5), [1.05, 5.12, 0], [0.42, 0.06, 0.22]));
  if (withLight) { const l = new THREE.PointLight("#ffae55", 26, 22, 1.7); l.position.set(1.05, 4.9, 0); g.add(l); }
  return shade(g);
};

export const parkedCar = (col: string, seed: number) => {
  const g = new THREE.Group(), p = mat(col, 0.3, { metalness: 0.4 });
  g.add(M(BOX, p, [0, 0.6, 0], [4.2, 0.7, 1.8]));
  g.add(M(BOX, p, [-0.3, 1.18, 0], [2.3, 0.55, 1.62]));
  for (const z of [-1, 1]) { const w = plane(2.1, 0.42, glass()); w.position.set(-0.3, 1.2, z * 0.815); w.rotation.y = z > 0 ? 0 : Math.PI; g.add(w); }
  for (const x of [1.35, -1.35]) for (const z of [-1, 1]) g.add(M(CYL, mat("#16171a", 0.8), [x, 0.33, z * 0.8], [0.33, 0.22, 0.33], [Math.PI / 2, 0, 0]));
  g.rotation.y = (rng(seed)() - 0.5) * 0.04;
  g.userData.heat = 0.22;
  return shade(g);
};
export { canvasTex, plane, emi };
