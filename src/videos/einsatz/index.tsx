// "Nachteinsatz": four-shot night sequence built from the Google-Doc blueprint (full-3D cartoon style).
// Foreground: a calm man in a tailored dark suit (curved scar under the right eye) and a red-haired, tense man in a
// leather/shearling jacket. Midground: two silver/blue federal police vans with contour markings and BP plates, a
// neutral civilian van with magnetic blue lights, tactical officers. Background: a five-blade police helicopter.
import React from "react";
import * as THREE from "three";
import { makeShort3, Built, Def3, Mood, V3, lerp, sm, Cam } from "../../engine3d/Short3D";
import { Person, Look } from "../../engine3d/toon3d";
import { ground, rng, noiseTex } from "../../engine3d/props";
import { policeVan, civilVan, helicopter, building, streetLamp, parkedCar, plane } from "../../engine3d/city";

const NIGHT: Mood = { sky: ["#0b1233", "#2b3a66"], fog: ["#0c1328", 22, 110], sun: [-0.35, 0.85, 0.45], sunCol: "#9db4ff", sunK: 0.55, hemi: ["#3a4d86", "#0e1018", 0.55], shadowR: 14, exposure: 1.0 };

// ---- cast (own designs from the blueprint's descriptions) ----
const SUIT: Look = { skin: "#6b4630", glove: "#6b4630", coat: "#1b2131", pants: "#1b2131", shoes: "#0f0f12", tie: "#5c1b28", scar: true, hair: "#121010", hairStyle: "short", buttons: "#0c0d12" };
const JACKET: Look = { skin: "#f0c6a2", glove: "#f0c6a2", coat: "#5b3a23", pants: "#2a2a31", shoes: "#2a1c14", collar: "#e9dcc2", hair: "#c45620", hairStyle: "short", stubble: "#b8501e", girth: 1.06, buttons: "#2a1a10" };
const OFFICER = (skin: string, s = 1): Look => ({ skin, glove: "#141414", coat: "#1d2a4a", pants: "#1d2a4a", shoes: "#0f0f12", vest: "#131a2b", label: "POLIZEI", hat: "helmet", hatCol: "#1a2131", scale: s, buttons: "#131a2b" });
const OFFICERS = ["#f0c6a2", "#c9906a", "#e8b896", "#8a5a3c", "#f2d0b0", "#d6a07a", "#b77d58"];

// ---- blocking ----
const GHOST: V3 = [0.0, 0, 1.0], TOMMY: V3 = [1.05, 0, 1.25];
const SPRINTER_X = -6.6;
const T_TURN = 14.4, T_DOOR = 14.0;
/** Ghost's controlled step back during shot 3 */
const ghostAt = (t: number): V3 => { const u = sm((t - 14.8) / 0.7); return [GHOST[0] + 0.25 * u, 0, GHOST[2] + 0.45 * u]; };
/** officer k leaving the civilian van */
const exitAt = (k: number, t: number) => {
  const t0 = T_DOOR + 0.45 + k * 0.38, u = Math.max(0, t - t0);
  const door: V3 = [SPRINTER_X + 0.35, 0, -0.75];
  if (u <= 0) return { pos: door, d: 0, vis: false };
  const out = Math.min(u * 1.6, 1.0), fwd = Math.min(Math.max(0, u * 1.6 - 1.0), 2.8 - k * 0.55);
  return { pos: [door[0] + fwd, 0, door[2] + out + k * 0.38] as V3, d: out + fwd, vis: true };
};
const heliAt = (t: number) => {
  const away = sm((t - 15) / 4);
  return { pos: [lerp(4, 34, away), lerp(21, 27, away) + Math.sin(t * 0.7) * 0.25, lerp(-1.5, -12, away)] as V3, yaw: lerp(0.4, -0.9, away), bank: -0.25 * Math.sin(Math.PI * Math.min(1, Math.max(0, (t - 15) / 4))) };
};

const build = (): Record<string, Built> => {
  const s = new THREE.Group(), r = rng(31), anims: ((t: number) => void)[] = [];
  // asphalt road, kerbs, pavements, lane markings, puddles
  const asphalt = new THREE.MeshStandardMaterial({ map: noiseTex("asphalt", "#2a2c31", ["#1c1d21", "#3a3c42", "#26282d"], 5000, 512, 2, 22), roughness: 0.62, metalness: 0.1 });
  const road = new THREE.Mesh(new THREE.PlaneGeometry(220, 10), asphalt); road.rotation.x = -Math.PI / 2; road.receiveShadow = true; s.add(road);
  for (const z of [-1, 1]) {
    const pave = ground(220, 3.6, "#55585e", ["#4a4d52", "#62656b"], "pave", 40, 0.12); pave.position.z = z * 6.8; s.add(pave);
    const kerb = new THREE.Mesh(new THREE.BoxGeometry(220, 0.14, 0.25), new THREE.MeshStandardMaterial({ color: "#8a8c90", roughness: 0.8 })); kerb.position.set(0, 0.07, z * 5.0); kerb.receiveShadow = true; s.add(kerb);
  }
  const dash = new THREE.MeshStandardMaterial({ color: "#d8d8d0", roughness: 0.7 });
  for (let x = -100; x < 100; x += 6) { const d = plane(3, 0.14, dash); d.rotation.x = -Math.PI / 2; d.position.set(x, 0.005, 0); s.add(d); }
  // buildings: north side (faces +z) and south side (faces -z)
  const walls = ["#8a7a6a", "#6f7782", "#9a8a72", "#7a6a62", "#5f6670", "#8f8478"];
  let x = -60; let i = 0;
  while (x < 60) { const w = 7 + r() * 6, b = building(w, 3 + Math.floor(r() * 4), i + 3, walls[i % walls.length]); b.position.set(x + w / 2, 0, -8.6); s.add(b); x += w + 0.2; i++; }
  x = -60;
  while (x < 60) { const w = 7 + r() * 6, b = building(w, 3 + Math.floor(r() * 3), i + 50, walls[(i + 2) % walls.length]); b.position.set(x + w / 2, 0, 8.6); b.rotation.y = Math.PI; s.add(b); x += w + 0.2; i++; }
  // street lamps
  [-14, -4, 6, 16, 26].forEach((lx, k) => { const l = streetLamp(k === 1 || k === 2); l.position.set(lx, 0.12, -5.5); l.rotation.y = -Math.PI / 2; s.add(l); });
  [-9, 11].forEach((lx) => { const l = streetLamp(false); l.position.set(lx, 0.12, 5.5); l.rotation.y = Math.PI / 2; s.add(l); });
  // parked civilian cars
  [[-18, -4.0, "#7a1f22"], [-24, -4.0, "#c8c8c8"], [13, -4.1, "#1f3a5a"], [19, -4.0, "#2a2a2a"], [-15, 4.1, "#4a5a3a"], [16, 4.1, "#8a8a90"]].forEach(([px, pz, c], k) => { const car = parkedCar(c as string, k); car.position.set(px as number, 0, pz as number); s.add(car); });
  // police vehicles
  const vanA = policeVan("BP 28-715", 1); vanA.position.set(-1.6, 0, -2.6); vanA.rotation.y = 0.18; s.add(vanA); anims.push(vanA.userData.anim);
  const vanB = policeVan("BP 29-119", 2); vanB.position.set(5.0, 0, -2.9); vanB.rotation.y = -0.12; s.add(vanB); anims.push(vanB.userData.anim);
  const civ = civilVan("B-KX 4471"); civ.position.set(SPRINTER_X, 0, -1.75); s.add(civ); anims.push(civ.userData.anim);
  // blue light spill on the foreground (rhythmic, matches the vans' flash pattern)
  const spill = new THREE.PointLight("#2f62ff", 0, 12, 1.4); spill.position.set(0.4, 2.2, -1.0); s.add(spill);
  const warm = new THREE.PointLight("#ffb46a", 6, 10, 1.8); warm.position.set(2.5, 3.2, 3.5); s.add(warm);
  // helicopter + its searchlight
  const heli = helicopter(); heli.scale.setScalar(0.62); s.add(heli);
  const heliLamp = new THREE.PointLight("#cfdcff", 30, 14, 1.4); heliLamp.position.set(1, -3, 2); heli.add(heliLamp);
  const search = new THREE.SpotLight("#e6eeff", 0, 60, 0.16, 0.6, 1.2); search.castShadow = true; search.shadow.mapSize.set(1024, 1024); s.add(search, search.target);
  const beam = new THREE.Mesh(new THREE.ConeGeometry(2.6, 34, 32, 1, true).translate(0, -17, 0), new THREE.MeshBasicMaterial({ color: "#dfe8ff", transparent: true, opacity: 0.05, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false })); s.add(beam);
  const key = new THREE.PointLight("#ffc890", 22, 16, 1.6); key.position.set(3.2, 3.0, 5.2); s.add(key);
  const fill = new THREE.PointLight("#8aa6ff", 8, 14, 1.6); fill.position.set(-3.5, 2.2, 5.0); s.add(fill);
  // people
  const ghost = new Person(SUIT, 3), tommy = new Person(JACKET, 7);
  ghost.root.userData.heat = 1; tommy.root.userData.heat = 1;
  s.add(ghost.root, tommy.root);
  const guards = [[-3.0, -0.4, 0.25], [2.6, -0.9, -0.2], [7.8, -1.2, -0.4], [9.2, -0.4, -0.7], [-9.6, -0.2, 0.4]].map(([gx, gz, gy], k) => { const p = new Person(OFFICER(OFFICERS[k], 1.04), 20 + k); p.root.position.set(gx, 0, gz); p.root.userData.heat = 0.95; s.add(p.root); return { p, gy }; });
  const team = [0, 1, 2, 3].map((k) => { const p = new Person(OFFICER(OFFICERS[(k + 3) % OFFICERS.length], 1.04), 40 + k); p.root.userData.heat = 0.95; s.add(p.root); return p; });
  const update = (_f: number, t: number) => {
    anims.forEach((a) => a(t));
    const k = (t * 2.4) % 1; spill.intensity = (k < 0.12 || (k > 0.24 && k < 0.36) || (k > 0.5 && k < 0.62) || (k > 0.74 && k < 0.86)) ? 9 : 1.2;
    civ.userData.door(sm((t - T_DOOR) / 0.5));
    // helicopter
    const h = heliAt(t); heli.position.set(...h.pos); heli.rotation.set(h.bank, h.yaw, 0.04); heli.userData.anim(t);
    const sOn = 1 - sm((t - 15.5) / 1.5);
    search.intensity = 260 * sOn; search.position.copy(heli.localToWorld(new THREE.Vector3(2.4, -1.4, 0))); search.target.position.set(0.5, 0, 1.0);
    (heli.userData.cone as THREE.Mesh).visible = false;
    beam.position.copy(search.position); const dir = new THREE.Vector3(0.5, 0, 1.0).sub(search.position); const len = dir.length();
    beam.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), dir.normalize()); beam.scale.set(1, len / 34, 1);
    (beam.material as THREE.MeshBasicMaterial).opacity = 0.045 * sOn; beam.visible = sOn > 0.02;
    // Ghost: calm, watches the street, small calming hand, then a controlled step back
    const gp = ghostAt(t); ghost.root.position.set(...gp);
    const stepping = t > 14.8 && t < 15.5;
    ghost.pose(t, { yaw: t < T_TURN ? 0.55 : lerp(0.55, -0.55, sm((t - T_TURN) / 0.6)), expr: "neutral", headYaw: t < 9 ? -0.35 : t < T_TURN ? 0.25 : -0.2, armR: t > 8.4 && t < 11.5 ? 0.45 * sm((t - 8.4) / 0.4) * (1 - sm((t - 11) / 0.5)) : 0, walk: stepping ? -(t - 14.8) * 0.6 : undefined });
    // Tommy: tense, leans in and stares, then turns abruptly towards the arriving unit
    tommy.root.position.set(...TOMMY);
    const turn = sm((t - T_TURN) / 0.22);
    tommy.pose(t, { yaw: lerp(-0.85, -1.75, turn), expr: "stare", lean: t > 7.6 && t < T_TURN ? 0.16 * sm((t - 7.6) / 0.6) : 0.02, headYaw: t < 7 ? 0.2 : 0, armL: 0.08, armR: 0.08, bounce: t < 7 ? 0.004 : 0 });
    // guards
    guards.forEach(({ p, gy }, k) => p.pose(t, { yaw: gy, expr: "neutral", headYaw: Math.sin(t * 0.5 + k) * 0.35, armL: 0.35, armR: 0.35 }));
    // the unit leaving the civilian van
    team.forEach((p, k) => { const e = exitAt(k, t); p.root.visible = e.vis; p.root.position.set(...e.pos); p.pose(t, { yaw: e.d < 1 ? 0 : Math.PI / 2 - 0.15, walk: e.d * 0.9, expr: "neutral", armL: 0.4, armR: 0.4, lean: 0.12 }); });
  };
  return { street: { root: s, mood: NIGHT, center: [0, 0, 0], update } };
};

// ---- camera: one dominant move per shot ----
const shot1 = (f: number): Cam => { const u = sm(f / 210); return { pos: [lerp(3.4, 2.2, u), lerp(5.5, 1.9, u), lerp(7.9, 7.6, u)], look: [lerp(4.0, 0.3, u), lerp(19.5, 2.4, u), lerp(-1.5, -1.6, u)], fov: 66 }; };
const shot2 = (f: number): Cam => { const u = (f - 210) / 210; return { pos: [lerp(0.65, 0.55, u), 1.45, lerp(5.6, 5.0, u)], look: [0.55, 1.2, 1.1], fov: 29 }; };
const shot3 = (f: number): Cam => { const u = (f - 420) / 180; return { pos: [lerp(3.6, 2.8, u), 1.6, lerp(7.4, 7.6, u)], look: [lerp(-0.2, -0.9, u), 1.05, lerp(0.4, 0.5, u)], fov: 48 }; };
const shot4 = (f: number): Cam => { const u = (f - 600) / 150, a = lerp(1.2, 1.6, u), R = 32; const jx = Math.sin(f * 0.9) * 0.05, jy = Math.cos(f * 1.3) * 0.05; return { pos: [0.5 + Math.cos(a) * R, 70, 1.1 + Math.sin(a) * R], look: [0.5 + jx, 0.8 + jy, 1.1], fov: 8 }; };

const mono = { fontFamily: "JetBrains Mono, monospace", color: "#f2f2f2", fontSize: 26, letterSpacing: 1 } as const;
const HUD: React.FC<{ f: number }> = ({ f }) => {
  if (f < 600) return null;
  const t = (f - 600) / 30, blink = Math.floor(f / 8) % 2 === 0, lock = f > 618;
  const s = lock ? 120 : 120 + (618 - f) * 9;
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <svg width="100%" height="100%" viewBox="0 0 1020 1780" style={{ position: "absolute", inset: 0 }}>
        <g stroke="#f4f4f4" strokeWidth="3" fill="none" opacity="0.9">
          <line x1="510" y1="0" x2="510" y2="790" /><line x1="510" y1="990" x2="510" y2="1780" />
          <line x1="0" y1="890" x2="410" y2="890" /><line x1="610" y1="890" x2="1020" y2="890" />
          <rect x={510 - s} y={890 - s} width={2 * s} height={2 * s} strokeWidth={lock ? 4 : 2} />
          {[-1, 1].map((sx) => [-1, 1].map((sy) => <path key={`${sx}${sy}`} d={`M ${510 + sx * 380} ${890 + sy * 620} l ${-sx * 70} 0 M ${510 + sx * 380} ${890 + sy * 620} l 0 ${-sy * 70}`} />))}
        </g>
      </svg>
      <div style={{ ...mono, position: "absolute", left: 60, top: 120 }}>WBK  WH<br />ZOOM 24x<br />FOV 1.8°</div>
      <div style={{ ...mono, position: "absolute", right: 60, top: 120, textAlign: "right" }}>ALT 0312 m<br />HDG {String(214 + Math.round(t * 6)).padStart(3, "0")}°<br />SPD 042 km/h</div>
      <div style={{ ...mono, position: "absolute", left: 60, bottom: 140 }}>TGT 2 PERS<br />RNG 0.58 km</div>
      <div style={{ ...mono, position: "absolute", right: 60, bottom: 140, textAlign: "right" }}>{`23:41:${String(12 + Math.floor(t)).padStart(2, "0")}`}</div>
      {lock && blink && <div style={{ ...mono, position: "absolute", left: 0, right: 0, top: 1060, textAlign: "center", fontSize: 30, fontWeight: 700 }}>TRACK</div>}
    </div>
  );
};

const def: Def3 = {
  build, total: 750, words: [], bloom: 1.1,
  shots: [
    { a: 0, b: 210, set: "street", cam: shot1 },
    { a: 210, b: 420, set: "street", cam: shot2, whip: 1 },
    { a: 420, b: 600, set: "street", cam: shot3, whip: -1 },
    { a: 600, b: 750, set: "street", cam: shot4, thermal: true, cut: true },
  ],
  overlay: (f) => <HUD f={f} />,
  grade: (f) => (f >= 600 ? "grayscale(1) contrast(1.35) brightness(1.05)" : "saturate(1.0) contrast(1.06)"),
};
export const EINSATZ_FRAMES = def.total;
export const EinsatzShort = makeShort3(def);
