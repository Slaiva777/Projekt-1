// "Nachteinsatz – Teil 1": ~72 s story built from the Google-Doc blueprint (full-3D cartoon style), German narration
// + German police radio, one-word captions. Shot boundaries and word times come from voice/timeline.json
// (written by videos/einsatz/layout.py). Foreground: a calm man in a tailored dark suit (curved scar under the right
// eye) and a red-haired, tense man in a leather/shearling jacket. Midground: two silver/blue federal police vans,
// a neutral civilian van with magnetic blue lights, tactical officers. Background: a five-blade police helicopter.
import React from "react";
import * as THREE from "three";
import { makeShort3, Built, Def3, Mood, V3, lerp, sm, Cam } from "../../engine3d/Short3D";
import { Person, Look } from "../../engine3d/toon3d";
import { ground, rng, noiseTex } from "../../engine3d/props";
import { policeVan, civilVan, helicopter, building, streetLamp, parkedCar, plane } from "../../engine3d/city";
import TL from "../../../videos/einsatz/voice/timeline.json";

type TLT = { total: number; shots: { name: string; a: number; b: number }[]; words: { w: string; s: number; e: number; radio: boolean }[] };
const tl = TL as TLT;
const SH: Record<string, { a: number; b: number }> = Object.fromEntries(tl.shots.map((s) => [s.name, { a: s.a, b: s.b }]));
const sec = (name: string) => ({ a: SH[name].a / 30, b: SH[name].b / 30 });
const wordAt = (w: string, after = 0) => tl.words.find((x) => x.w === w && x.s >= after)!.s;

// ---- story clock ----
const T_WALK_END = sec("walk").b - 0.6;
const T_ARRIVE = sec("arrive").a - 0.8;                 // vans start rolling in just before the cut
const T_LIGHTS = wordAt("Blaulichter");                 // every blue light switches on with the word
const T_GUARDS = sec("arrive").b;
const T_DOOR = wordAt("Schiebetür") + 0.2;
const T_TURN = wordAt("fährt");
const T_TITLE = sec("final").b - 2.6;

const NIGHT: Mood = { sky: ["#0b1233", "#2b3a66"], fog: ["#0c1328", 22, 110], sun: [-0.35, 0.85, 0.45], sunCol: "#9db4ff", sunK: 0.55, hemi: ["#3a4d86", "#0e1018", 0.55], shadowR: 14, exposure: 1.0 };

// ---- cast (own designs from the blueprint's descriptions) ----
const SUIT: Look = { skin: "#6b4630", glove: "#6b4630", coat: "#1b2131", pants: "#1b2131", shoes: "#0f0f12", tie: "#5c1b28", scar: true, hair: "#121010", hairStyle: "short", buttons: "#0c0d12" };
const JACKET: Look = { skin: "#f0c6a2", glove: "#f0c6a2", coat: "#5b3a23", pants: "#2a2a31", shoes: "#2a1c14", collar: "#e9dcc2", hair: "#c45620", hairStyle: "short", stubble: "#b8501e", girth: 1.06, buttons: "#2a1a10" };
const OFFICER = (skin: string, s = 1): Look => ({ skin, glove: "#141414", coat: "#1d2a4a", pants: "#1d2a4a", shoes: "#0f0f12", vest: "#131a2b", label: "POLIZEI", hat: "helmet", hatCol: "#1a2131", scale: s, buttons: "#131a2b" });
const OFFICERS = ["#f0c6a2", "#c9906a", "#e8b896", "#8a5a3c", "#f2d0b0", "#d6a07a", "#b77d58"];

// ---- blocking ----
const GHOST: V3 = [0.0, 0, 1.0], TOMMY: V3 = [1.05, 0, 1.25];
const WALK_V = 1.05;
const SPRINTER_X = -6.6;
const walkX = (x0: number, t: number) => x0 - WALK_V * Math.max(0, T_WALK_END - t);
const ghostAt = (t: number): V3 => { const u = sm((t - T_TURN - 0.4) / 0.7); return [walkX(GHOST[0], t) + 0.25 * u, 0, GHOST[2] + 0.45 * u]; };
const tommyAt = (t: number): V3 => [walkX(TOMMY[0], t), 0, TOMMY[2]];
const exitAt = (k: number, t: number) => {
  const t0 = T_DOOR + 0.45 + k * 0.38, u = Math.max(0, t - t0);
  const door: V3 = [SPRINTER_X + 0.35, 0, -0.75];
  if (u <= 0) return { pos: door, d: 0, vis: false };
  const out = Math.min(u * 1.6, 1.0), fwd = Math.min(Math.max(0, u * 1.6 - 1.0), 2.8 - k * 0.55);
  return { pos: [door[0] + fwd, 0, door[2] + out + k * 0.38] as V3, d: out + fwd, vis: true };
};
/** vans roll in and brake to their marks */
const rollIn = (x0: number, x1: number, t: number) => lerp(x0, x1, 1 - Math.pow(1 - Math.min(1, Math.max(0, (t - T_ARRIVE) / 3.2)), 2.4));
const heliAt = (t: number) => {
  const tm = sm((t - sec("move").a - 2) / 3) - sm((t - sec("final").a) / 3) * 0.7;
  return { pos: [lerp(4, 9, tm) + Math.sin(t * 0.21) * 1.2, 21 + Math.sin(t * 0.7) * 0.25, lerp(-1.5, -4, tm)] as V3, yaw: lerp(0.4, -0.5, tm) + Math.sin(t * 0.13) * 0.1, bank: -0.12 * Math.sin(Math.PI * Math.min(1, Math.max(0, tm))) };
};

const build = (): Record<string, Built> => {
  const s = new THREE.Group(), r = rng(31), anims: ((t: number) => void)[] = [];
  const asphalt = new THREE.MeshStandardMaterial({ map: noiseTex("asphalt", "#2a2c31", ["#1c1d21", "#3a3c42", "#26282d"], 5000, 512, 2, 22), roughness: 0.62, metalness: 0.1 });
  const road = new THREE.Mesh(new THREE.PlaneGeometry(220, 10), asphalt); road.rotation.x = -Math.PI / 2; road.receiveShadow = true; s.add(road);
  for (const z of [-1, 1]) {
    const pave = ground(220, 3.6, "#55585e", ["#4a4d52", "#62656b"], "pave", 40, 0.12); pave.position.z = z * 6.8; s.add(pave);
    const kerb = new THREE.Mesh(new THREE.BoxGeometry(220, 0.14, 0.25), new THREE.MeshStandardMaterial({ color: "#8a8c90", roughness: 0.8 })); kerb.position.set(0, 0.07, z * 5.0); kerb.receiveShadow = true; s.add(kerb);
  }
  const dash = new THREE.MeshStandardMaterial({ color: "#d8d8d0", roughness: 0.7 });
  for (let x = -100; x < 100; x += 6) { const d = plane(3, 0.14, dash); d.rotation.x = -Math.PI / 2; d.position.set(x, 0.005, 0); s.add(d); }
  const walls = ["#8a7a6a", "#6f7782", "#9a8a72", "#7a6a62", "#5f6670", "#8f8478"];
  let x = -60; let i = 0;
  while (x < 60) { const w = 7 + r() * 6, b = building(w, 3 + Math.floor(r() * 4), i + 3, walls[i % walls.length]); b.position.set(x + w / 2, 0, -8.6); s.add(b); x += w + 0.2; i++; }
  x = -60;
  while (x < 60) { const w = 7 + r() * 6, b = building(w, 3 + Math.floor(r() * 3), i + 50, walls[(i + 2) % walls.length]); b.position.set(x + w / 2, 0, 8.6); b.rotation.y = Math.PI; s.add(b); x += w + 0.2; i++; }
  [-14, -4, 6, 16, 26].forEach((lx, k) => { const l = streetLamp(k === 1 || k === 2); l.position.set(lx, 0.12, -5.5); l.rotation.y = -Math.PI / 2; s.add(l); });
  [-9, 11].forEach((lx, k) => { const l = streetLamp(k === 0); l.position.set(lx, 0.12, 5.5); l.rotation.y = Math.PI / 2; s.add(l); });
  [[-18, -4.0, "#7a1f22"], [-24, -4.0, "#c8c8c8"], [13, -4.1, "#1f3a5a"], [19, -4.0, "#2a2a2a"], [-15, 4.1, "#4a5a3a"], [16, 4.1, "#8a8a90"]].forEach(([px, pz, c], k) => { const car = parkedCar(c as string, k); car.position.set(px as number, 0, pz as number); s.add(car); });
  // police vehicles (arrive in the story)
  const vanA = policeVan("BP 28-715", 1, false); vanA.rotation.y = 0.18; s.add(vanA); anims.push(vanA.userData.anim);
  const vanB = policeVan("BP 29-119", 2, false); vanB.rotation.y = Math.PI - 0.12; s.add(vanB); anims.push(vanB.userData.anim);
  const civ = civilVan("B-KX 4471"); s.add(civ); anims.push(civ.userData.anim);
  const spill = new THREE.PointLight("#2f62ff", 0, 12, 1.4); spill.position.set(0.4, 2.2, -1.0); s.add(spill);
  const warm = new THREE.PointLight("#ffb46a", 6, 10, 1.8); warm.position.set(2.5, 3.2, 3.5); s.add(warm);
  // helicopter, searchlight and its beam
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
    // vehicles
    vanA.position.set(rollIn(-34, -1.6, t), 0, -2.6); vanB.position.set(rollIn(38, 5.0, t), 0, -2.9); civ.position.set(rollIn(-42, SPRINTER_X, t - 0.5), 0, -1.75);
    const lit = t >= T_LIGHTS; vanA.userData.on = lit; vanB.userData.on = lit; civ.userData.on = lit;
    anims.forEach((a) => a(t));
    const k = (t * 2.4) % 1; spill.intensity = !lit ? 0 : (k < 0.12 || (k > 0.24 && k < 0.36) || (k > 0.5 && k < 0.62) || (k > 0.74 && k < 0.86)) ? 9 : 1.2;
    civ.userData.door(sm((t - T_DOOR) / 0.5));
    // helicopter + searchlight on the two men
    const h = heliAt(t); heli.position.set(...h.pos); heli.rotation.set(h.bank, h.yaw, 0.04); heli.userData.anim(t);
    const gp = ghostAt(t), tp = tommyAt(t), tgt = new THREE.Vector3((gp[0] + tp[0]) / 2, 0, (gp[2] + tp[2]) / 2);
    search.intensity = 240; search.position.copy(heli.localToWorld(new THREE.Vector3(2.4, -1.4, 0))); search.target.position.copy(tgt);
    (heli.userData.cone as THREE.Mesh).visible = false;
    beam.position.copy(search.position); const dir = tgt.clone().sub(search.position); const len = dir.length();
    beam.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), dir.normalize()); beam.scale.set(1, len / 34, 1);
    // Ghost
    ghost.root.position.set(...gp);
    const walking = t < T_WALK_END, stepping = t > T_TURN + 0.4 && t < T_TURN + 1.1;
    const lookUp = t > sec("look").a && t < sec("look").b ? -0.55 * sm((t - sec("look").a) / 0.8) : 0;
    const watch = (t > sec("ghost").a + 2.5 && t < sec("ghost").a + 4.5) || (t > sec("wait").a + 1 && t < sec("wait").a + 2.6);
    const dlg = sec("dialog");
    ghost.pose(t, {
      yaw: walking ? Math.PI / 2 : t < T_TURN ? 0.55 : lerp(0.55, -0.55, sm((t - T_TURN) / 0.6)), expr: "neutral",
      headYaw: walking ? -0.15 : t < dlg.a ? 0.1 : t < T_TURN ? 0.25 : -0.2, headTilt: lookUp + (watch ? 0.35 : 0),
      armL: watch ? 0.75 : 0, armR: t > dlg.a + 1.2 && t < dlg.a + 4.2 ? 0.45 * sm((t - dlg.a - 1.2) / 0.4) * (1 - sm((t - dlg.a - 3.7) / 0.5)) : 0,
      walk: walking ? walkX(GHOST[0], t) : stepping ? -(t - T_TURN - 0.4) * 0.6 : undefined,
    });
    // Tommy
    tommy.root.position.set(...tp);
    const turn = sm((t - T_TURN) / 0.22), restless = t > sec("tommy").a && t < sec("arrive").a;
    tommy.pose(t, {
      yaw: walking ? Math.PI / 2 : lerp(-0.85, -1.75, turn), expr: t < dlg.a && !restless ? "smug" : "stare",
      lean: t > dlg.a + 0.8 && t < T_TURN ? 0.16 * sm((t - dlg.a - 0.8) / 0.6) : 0.02,
      headYaw: walking ? 0.2 : restless ? Math.sin(t * 1.7) * 0.6 : 0, headTilt: lookUp, armL: 0.08, armR: 0.08, bounce: restless ? 0.006 : 0,
      walk: walking ? walkX(TOMMY[0], t) : undefined,
    });
    // guards appear once the vans have unloaded
    guards.forEach(({ p, gy }, k) => { p.root.visible = t >= T_GUARDS; p.pose(t, { yaw: gy, expr: "neutral", headYaw: Math.sin(t * 0.5 + k) * 0.35, armL: 0.35, armR: 0.35 }); });
    team.forEach((p, k) => { const e = exitAt(k, t); p.root.visible = e.vis; p.root.position.set(...e.pos); p.pose(t, { yaw: e.d < 1 ? 0 : Math.PI / 2 - 0.15, walk: e.d * 0.9, expr: "neutral", armL: 0.4, armR: 0.4, lean: 0.12 }); });
  };
  return { street: { root: s, mood: NIGHT, center: [0, 0, 0], update } };
};

// ---- cameras (one dominant move per shot) ----
const U = (name: string, f: number) => { const s = SH[name]; return Math.min(1, Math.max(0, (f - s.a) / (s.b - s.a))); };
const midX = (t: number) => (walkX(GHOST[0], t) + walkX(TOMMY[0], t)) / 2;
const CAMS: Record<string, (f: number) => Cam> = {
  heli: (f) => { const u = sm(U("heli", f)); return { pos: [lerp(3.4, 2.0, u), lerp(5.5, 2.2, u), lerp(7.9, 7.7, u)], look: [lerp(4.0, -3.5, u), lerp(19.5, 1.6, u), lerp(-1.5, 0.0, u)], fov: 66 }; },
  walk: (f) => { const t = f / 30, m = midX(Math.min(t, T_WALK_END)); const u = U("walk", f); return { pos: [m + lerp(5.0, 4.4, u), 1.4, 4.9], look: [m, 1.1, 1.1], fov: 40 }; },
  look: (f) => { const u = sm(U("look", f)); return { pos: [lerp(-1.6, -1.3, u), 0.55, 3.6], look: [lerp(1.0, 2.6, u), lerp(4, 14, u), lerp(0, -1.5, u)], fov: 62 }; },
  ghost: (f) => { const u = U("ghost", f); return { pos: [lerp(0.45, 0.3, u), 1.45, lerp(4.4, 3.9, u)], look: [0.0, 1.22, 1.0], fov: 27 }; },
  tommy: (f) => { const u = U("tommy", f); return { pos: [lerp(1.8, 1.6, u), 1.45, lerp(4.6, 4.1, u)], look: [1.05, 1.22, 1.25], fov: 27, roll: 0.03 }; },
  wait: (f) => { const u = U("wait", f); return { pos: [lerp(4.4, 4.0, u), 1.2, 6.0], look: [0.5, 1.1, 1.1], fov: 38 }; },
  arrive: (f) => { const u = U("arrive", f); return { pos: [lerp(13, 12, u), 2.6, lerp(2.6, 2.4, u)], look: [-5, 1.0, -1.2], fov: 50 }; },
  dialog: (f) => { const u = U("dialog", f); return { pos: [lerp(0.65, 0.55, u), 1.45, lerp(5.6, 5.0, u)], look: [0.55, 1.2, 1.1], fov: 29 }; },
  move: (f) => { const u = U("move", f); return { pos: [lerp(3.6, 2.8, u), 1.6, lerp(7.4, 7.6, u)], look: [lerp(-0.2, -0.9, u), 1.05, lerp(0.4, 0.5, u)], fov: 48 }; },
  thermal: (f) => { const u = U("thermal", f), a = lerp(1.2, 1.7, u), R = 32; const jx = Math.sin(f * 0.9) * 0.05, jy = Math.cos(f * 1.3) * 0.05; return { pos: [0.6 + Math.cos(a) * R, 70, 1.5 + Math.sin(a) * R], look: [0.6 + jx, 0.8 + jy, 1.5], fov: 8 }; },
  final: (f) => { const u = sm(U("final", f)); return { pos: [lerp(-1.7, -1.4, u), 0.42, lerp(5.2, 4.8, u)], look: [lerp(0.6, 1.2, u), lerp(2.4, 4.6, u), lerp(1.0, 0.0, u)], fov: 60 }; },
};
const WHIP: Record<string, number> = { walk: 1, look: -1, ghost: 1, tommy: -1, wait: 1, arrive: -1, dialog: 1, move: -1, final: 1 };

const mono = { fontFamily: "JetBrains Mono, monospace", color: "#f2f2f2", fontSize: 26, letterSpacing: 1 } as const;
const HUD: React.FC<{ f: number }> = ({ f }) => {
  const S = SH.thermal; if (f < S.a || f >= S.b) return null;
  const t = (f - S.a) / 30, blink = Math.floor(f / 8) % 2 === 0, lock = f > S.a + 18;
  const s = lock ? 120 : 120 + (S.a + 18 - f) * 9;
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
      {lock && blink && <div style={{ ...mono, position: "absolute", left: 0, right: 0, top: 1300, textAlign: "center", fontSize: 30, fontWeight: 700 }}>TRACK</div>}
    </div>
  );
};
const Title: React.FC<{ f: number }> = ({ f }) => {
  const t = f / 30 - T_TITLE; if (t < 0) return null;
  const a = Math.min(1, t / 0.5);
  return (
    <div style={{ position: "absolute", inset: 0, background: `rgba(0,0,0,${0.55 * a})`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", opacity: a }}>
      <div style={{ fontFamily: "Inter", fontWeight: 900, fontSize: 120, color: "#fff", letterSpacing: 8, textShadow: "0 4px 24px rgba(0,0,0,0.8)", transform: `scale(${1.08 - 0.08 * a})` }}>TEIL 1</div>
      <div style={{ fontFamily: "Inter", fontWeight: 600, fontSize: 44, color: "#ffe08a", marginTop: 18, letterSpacing: 2 }}>Fortsetzung folgt …</div>
    </div>
  );
};

const def: Def3 = {
  build, total: tl.total, bloom: 1.1, captionY: 1250,
  words: tl.words.filter((w) => !(w.s > T_TITLE - 0.1)),
  shots: tl.shots.map((s) => ({ a: s.a, b: s.b, set: "street", cam: CAMS[s.name], whip: WHIP[s.name], thermal: s.name === "thermal", cut: s.name === "thermal" || s.name === "final" })),
  overlay: (f) => <><HUD f={f} /><Title f={f} /></>,
  grade: (f) => (f >= SH.thermal.a && f < SH.thermal.b ? "grayscale(1) contrast(1.35) brightness(1.05)" : "saturate(1.0) contrast(1.06)"),
};
export const EINSATZ_FRAMES = def.total;
export const EinsatzShort = makeShort3(def);
