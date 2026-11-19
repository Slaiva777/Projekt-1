// Characters, fish, rain and other effects for "Das Geld auf dem Meeresgrund".
import { Pen, Outfit, Expr, fxBurst, fxSplash, fxPuff, fxStars } from "../../engine/toon";
import { Stage, CamInfo, walker, Who, Pose, hh, q, FPS, smooth, sparkle, fxAnim, V3 } from "../../engine/core";
import { Life } from "../../engine/world";
import { crowdWho } from "../../engine/people";
import { UW, STONE_ROW_Z, BIG, QUARRY, HUT_FAMILY, BEACH, canoeX, CANOE_Z } from "./story";

// ---- cast (our own designs) ----
const P = (o: Partial<Outfit>): Outfit => ({ jacket: "#e07a3a", pants: "#3a6a8a", boots: "#a8704a", skin: "#a8704a", hair: "#2b211c", hat: "hair", ...o });
const CREW: Who[] = [
  { i: 1, o: P({ jacket: "#e07a3a", beard: "#2b211c" }), okey: "crew0" },
  { i: 2, o: P({ jacket: "#3a9a8a", skin: "#8a5a3a", boots: "#8a5a3a", hat: "bald", hair: "#2b211c" }), okey: "crew1" },
  { i: 3, o: P({ jacket: "#d8b45a", skin: "#c99067", boots: "#c99067", moustache: "#2b211c", build: "stout" }), okey: "crew2" },
];
const CHIEF: Who = { i: 4, o: P({ jacket: "#c2453f", skin: "#8a5a3a", boots: "#8a5a3a", hat: "bald", hair: "#e8e4dc", beard: "#e8e4dc", build: "stout" }), okey: "chief" };
const TRADER_A: Who = { i: 5, o: P({ jacket: "#5a8fc2", skin: "#c99067", boots: "#c99067" }), okey: "tA" };
const TRADER_B: Who = { i: 6, o: P({ jacket: "#f2e2c2", skin: "#a8704a", moustache: "#2b211c", glasses: false }), okey: "tB" };
const FAMILY: Who[] = [
  { i: 7, o: P({ jacket: "#7a9a3a", skin: "#8a5a3a", boots: "#8a5a3a", hat: "bald", hair: "#d9d4cc", beard: "#d9d4cc" }), okey: "grandpa" },
  { i: 8, o: P({ jacket: "#e05a3a", dress: "#e05a3a", hat: "long", hair: "#1e1814", skin: "#a8704a" }), okey: "mother" },
  { i: 9, o: P({ jacket: "#3a6a8a", skin: "#a8704a", moustache: "#1e1814" }), okey: "father" },
  { i: 10, o: P({ jacket: "#f2c24a", build: "kid", skin: "#a8704a" }), okey: "kid1" },
  { i: 11, o: P({ jacket: "#c24a8a", dress: "#c24a8a", build: "kid", hat: "pony", skin: "#a8704a" }), okey: "kid2" },
];
const WORKERS: Who[] = [12, 13, 14].map((i, k) => ({ i, o: P({ jacket: ["#c2453f", "#5a8f3a", "#e07a3a"][k], skin: ["#a8704a", "#8a5a3a", "#c99067"][k], boots: "#5a3a2a", beard: k === 1 ? "#2b211c" : undefined }), okey: `w${k}` }));
const TOURIST: Who = { i: 15, o: { jacket: "#f2c24a", pants: "#d8c8a0", boots: "#f4f1ea", skin: "#f5c9a0", hat: "straw", glasses: true, hair: "#8a5a34", build: "stout" }, okey: "tourist" };

const at = (f: number, g: number) => f >= g - 2;

// ---- effects ----
const fishCard = (col: string, fin: number) => (p: Pen) => {
  p.ell(150, 100, 95, 52, col, 7);
  p.poly([[240, 100], [292, 52 + fin * 10], [292, 148 - fin * 10]], col, 7);
  p.poly([[120, 55], [165, 20], [185, 58]], col, 6);
  p.ell(95, 88, 15, 15, "#ffffff", 4); p.dot(91, 88, 7);
  p.arc(150, 100, 40, 40, 300, 420, 5, "rgba(0,0,0,0.25)");
};
const rainCard = (p: Pen) => { for (let k = 0; k < 9; k++) p.stroke([[20 + k * 26, 10 + (k * 37) % 60], [12 + k * 26, 90 + (k * 37) % 60]], 4, "rgba(220,235,255,0.85)"); };
const bubble = (p: Pen) => { p.ell(64, 64, 52, 52, "rgba(220,250,255,0.25)", 5); p.ell(46, 44, 12, 9, "#ffffff", 0); };
const rays = (p: Pen) => {
  for (let k = 0; k < 5; k++) {
    const g = p.g.createLinearGradient(0, 0, 0, 512); g.addColorStop(0, "rgba(230,255,255,0.22)"); g.addColorStop(1, "rgba(230,255,255,0)");
    p.g.fillStyle = g; p.g.beginPath(); p.g.moveTo(40 + k * 95, 0); p.g.lineTo(80 + k * 95, 0); p.g.lineTo(150 + k * 95, 512); p.g.lineTo(90 + k * 95, 512); p.g.fill();
  }
};
const phoneBig = (p: Pen) => {
  p.poly([[40, 10], [260, 10], [260, 470], [40, 470]], "#24232a", 10);
  p.poly([[58, 40], [242, 40], [242, 430], [58, 430]], "#eaf6ff", 0);
  p.poly([[70, 60], [230, 60], [230, 120], [70, 120]], "#3f7ad8", 0);
  p.g.fillStyle = "#1d2a44"; p.g.font = "bold 46px sans-serif"; p.g.textAlign = "center"; p.g.fillText("1.250,00 €", 150, 210);
  for (let k = 0; k < 4; k++) { p.poly([[72, 250 + k * 44], [228, 250 + k * 44], [228, 282 + k * 44], [72, 282 + k * 44]], k % 2 ? "#d8e4f2" : "#c8d6e8", 0); }
};
const monitor = (p: Pen) => {
  p.poly([[20, 20], [480, 20], [480, 320], [20, 320]], "#2a2a33", 10);
  p.poly([[40, 40], [460, 40], [460, 300], [40, 300]], "#0f2a20", 0);
  p.g.fillStyle = "#5af08a"; p.g.font = "bold 30px monospace";
  for (let r = 0; r < 7; r++) p.g.fillText(["0110 1001 1100", "1250,00 EUR", "1011 0010 0111", "KONTO 0042", "0001 1110 1010", "1001 0110 0101", "SALDO 1250,00"][r], 60, 80 + r * 34);
  p.poly([[210, 320], [290, 320], [310, 380], [190, 380]], "#3a3a44", 8);
};
const coin = (k: number) => (p: Pen) => { const w = 150 * Math.abs(Math.cos(k)); p.ell(160, 160, Math.max(10, w), 150, "#f2c94c", 10); p.ell(160, 160, Math.max(6, w * 0.72), 110, null, 6); };
const thought = (p: Pen) => {
  p.ell(220, 150, 190, 125, "#ffffff", 9); p.ell(90, 300, 34, 26, "#ffffff", 7); p.ell(50, 350, 18, 14, "#ffffff", 6);
  p.ell(220, 150, 85, 85, "#cfc6b4", 8); p.ell(220, 150, 16, 16, "#ffffff", 6);
};

const fishSchool = (out: Stage, t: number, n: number, seed: number, cx: number, cy: number, cz: number, span = 14) => {
  for (let k = 0; k < n; k++) {
    const sp = 0.8 + hh(k, seed) * 0.8, dir = hh(k, seed + 1) < 0.5 ? 1 : -1, ph = hh(k, seed + 2) * span * 2;
    const s = ((ph + sp * t) % (2 * span)) - span, x = cx + dir * s, y = cy + (hh(k, seed + 3) - 0.3) * 5 + 0.3 * Math.sin(t * 2 + k), z = cz + (hh(k, seed + 4) - 0.5) * 12;
    const col = ["#f2a03a", "#3ab0f2", "#f25a7a", "#f2e04a", "#7af2b0"][k % 5], fin = q(0.5 + 0.5 * Math.sin(t * 9 + k), 4), sz = 0.35 + hh(k, seed + 5) * 0.35;
    out.fx.push({ key: `fish${col}${fin}`, cw: 300, ch: 200, draw: fishCard(col, fin), x, y, z, w: sz * 1.5 * (dir > 0 ? -1 : 1), h: sz });
  }
};
const bubbles = (out: Stage, t: number, x: number, y0: number, z: number, n = 8, rise = 6) => {
  for (let k = 0; k < n; k++) { const u = (t * 0.5 + k / n) % 1; out.fx.push({ key: "bubble", cw: 128, ch: 128, draw: bubble, x: x + Math.sin(u * 9 + k) * 0.3, y: y0 + u * rise, z: z + (hh(k, 3) - 0.5) * 0.6, w: 0.18 + 0.1 * hh(k, 4), h: 0.18 + 0.1 * hh(k, 4) }); }
};
const underwater = (out: Stage, t: number) => {
  fishSchool(out, t, 14, 50, UW[0], UW[1] + 3, UW[2]);
  bubbles(out, t, UW[0] + 1.6, UW[1] + 0.2, UW[2] + 1.2, 6, 7);
  if (0) for (let k = 0; k < 2; k++) out.fx.push({ key: "rays", cw: 512, ch: 512, draw: rays, soft: true, x: UW[0] - 8 + k * 11, y: UW[1] + 8, z: UW[2] - 9 - k * 4, w: 12, h: 14 });
};
const rain = (out: Stage, cam: CamInfo, t: number) => {
  const fw = { x: -cam.right.z, z: cam.right.x };
  for (let k = 0; k < 70; k++) {
    const d = 2.5 + hh(k, 61) * 14, s = (hh(k, 62) - 0.5) * d * 0.9, fall = ((t * 9 + hh(k, 63) * 12) % 12);
    out.fx.push({ key: "rain", cw: 256, ch: 160, draw: rainCard, soft: true, x: cam.pos.x + fw.x * d + cam.right.x * s, y: cam.pos.y + 5 - fall, z: cam.pos.z + fw.z * d + cam.right.z * s, w: 0.9, h: 0.55, rot: 0.25 });
  }
};
/** seated rower on the canoe (deck at canoe height) */
const rowers = (out: Stage, cam: CamInfo, t: number, f: number, storm: boolean) => {
  const x = canoeX(t), y = -0.2 + (storm ? 0.35 * Math.sin(t * 2.3 + 0.5) : 0.05 * Math.sin(t * 1.7)) + 0.72;
  CREW.forEach((w, k) => {
    const lost = storm && f >= 731;
    const expr: Expr = storm ? (lost ? "shock" : k === 1 ? "nervous" : "pained") : (["smile", "grin", "smile_closed"] as Expr[])[k];
    walker(out, cam, t, w, x - 2.6 + k * 2.0, CANOE_Z + 0.05, 1, 0, 0, { mode: "sit", expr, prop: lost && k !== 1 ? "arms_up" : null, tilt: storm ? 8 * Math.sin(t * 2.3 + k) : 2 * Math.sin(t * 2 + k), noBlob: true }, y);
  });
};

export const stage = (id: number, t: number, f: number, cam: CamInfo, out: Stage) => {
  if (id === 1 || id === 13) underwater(out, t);
  if (id === 6) { underwater(out, t); bubbles(out, t, UW[0], UW[1] + 2, UW[2], 10, 9); }
  if (id === 2) {
    walker(out, cam, t, TRADER_A, BIG[0] + 1.3, BIG[2] + 1.7, 0, 1, 0, { expr: "grin", prop: "point" });
    walker(out, cam, t, TRADER_B, BIG[0] + 3.0, BIG[2] + 1.9, 0, 1, 0, { expr: "smile", prop: "point", look: -1 });
    walker(out, cam, t, crowdWho("pacific", 5), BIG[0] + 4.4, BIG[2] + 0.6, 0, 1, 0, { expr: "smile", look: -1 });
    sparkle(out, t, 179, BIG[0] + 2.15, 1.3, BIG[2] + 1.9, 0.9);
  }
  if (id === 3 && f >= 276 && f < 325) walker(out, cam, t, FAMILY[1], -1.2, STONE_ROW_Z + 1.6, 0, 1, 0, { expr: "smile", prop: "point", look: 1 });
  if (id === 3 && f >= 325) {
    walker(out, cam, t, TRADER_B, BIG[0] + 0.5, BIG[2] + 1.3, 0, 1, 0, { expr: at(f, 340) ? "shock" : "smile", headTilt: -12, look: -1 });
    walker(out, cam, t, FAMILY[3], BIG[0] + 1.3, BIG[2] + 1.9, 0, 1, 0, { expr: "grin", headTilt: -10 });
  }
  if (id === 4) {
    if (f < 462) WORKERS.forEach((w, k) => {
      const ph = (t * 1.6 + k * 0.33) % 1, kk = q(ph < 0.7 ? 0 : 1, 4);
      walker(out, cam, t, w, QUARRY[0] - 1.6 + k * 1.7, QUARRY[2] + 1.3 + (k % 2) * 0.5, 0, 1, 0, { expr: kk ? "grin" : "stern", prop: ["hammer", kk] });
      if (ph > 0.7 && ph < 0.85) out.fx.push({ key: `dust${k}`, cw: 300, ch: 300, draw: (p) => fxPuff(p, q((ph - 0.7) / 0.15, 6)), soft: true, x: QUARRY[0] - 1.1 + k * 1.7, y: 1.2, z: QUARRY[2] + 0.6, w: 0.8, h: 0.8 });
    });
    else rowers(out, cam, t, f, false);
  }
  if (id === 5) {
    rowers(out, cam, t, f, true); rain(out, cam, t);
    const x = canoeX(t);
    for (let k = 0; k < 3; k++) fxAnim(out, t, "spl", 600 + k * 45, 22, (p, u) => fxSplash(p, u), x - 3 + k * 3, 0.9, CANOE_Z + 1.2, 3, 3, 800, 800);
    fxAnim(out, t, "bigsplash", 733, 22, (p, u) => fxSplash(p, u), x + 0.4, 1.4, CANOE_Z - 2.6, 5, 5, 800, 800);
  }
  if (id === 7 || id === 8) {
    const lead = CREW[0];
    const ex7: Expr = !at(f, 853) ? "smile" : !at(f, 906) ? "laugh" : !at(f, 941) ? "grin" : "nervous";
    const p7: Pose = id === 7 ? { expr: ex7, prop: at(f, 853) && !at(f, 906) ? "arms_up" : at(f, 941) ? "point" : null, headTilt: at(f, 941) ? 12 : 0 } : { expr: at(f, 1078) ? "laugh" : "nervous", prop: at(f, 1080) ? "arms_up" : null };
    walker(out, cam, t, lead, -1.8, 25.4, 0, 1, 0, p7);
    walker(out, cam, t, CREW[1], -0.5, 25.0, 0, 1, 0, { expr: id === 8 && at(f, 1078) ? "laugh" : "nervous", look: -1 });
    walker(out, cam, t, CREW[2], 0.8, 25.3, 0, 1, 0, { expr: id === 8 && at(f, 1078) ? "grin" : "smile_closed", look: -1, prop: id === 8 && at(f, 1082) ? "arms_up" : null });
    walker(out, cam, t, CHIEF, -5.2, 22.4, 0, 1, 0, { expr: id === 8 && at(f, 1047) ? "smile_closed" : "neutral", prop: "cane", look: 1, headTilt: id === 8 && f >= 1045 && f < 1075 ? 6 * Math.sin((f - 1045) / 4) : 0 });
    for (let k = 0; k < 9; k++) {
      const x = -6.5 + (k % 5) * 2.4 + hh(k, 71) * 0.6, z = 21.2 - (k >= 5 ? 1.6 : 0);
      const ex: Expr = id === 8 && at(f, 1078) ? (k % 2 ? "laugh" : "grin") : at(f, 941) && id === 7 ? "shock" : at(f, 906) && id === 7 ? "smile" : "neutral";
      walker(out, cam, t, crowdWho("pacific", k + 20), x, z, 0, 1, 0, { expr: ex, wave: id === 8 && at(f, 1080) && k % 3 === 0 ? q(Math.sin(t * 8 + k), 12) : undefined });
    }
    if (id === 7) sparkle(out, t, 906, -1.8, 2.3, 25.6, 1.4);
  }
  if (id === 9) {
    walker(out, cam, t, TRADER_A, -1.6, STONE_ROW_Z + 1.5, 0, 1, 0, { expr: at(f, 1246) ? "grin" : "smile", prop: !at(f, 1215) ? "fish" : null });
    walker(out, cam, t, TRADER_B, -0.1, STONE_ROW_Z + 1.8, 0, 1, 0, { expr: "smile_closed", prop: at(f, 1215) ? "fish" : "point", look: 1 });
    if (f >= 1269) for (let k = 0; k < 10; k++)
      walker(out, cam, t, crowdWho("pacific", k + 40), -8 + k * 1.8 + hh(k, 81) * 0.5, STONE_ROW_Z + 3.4 + (k % 3) * 1.1, 0, 1, 0, { expr: "smile_closed", headTilt: 5 * Math.sin(t * 5 + k) });
  }
  if (id === 10) {
    const [hx, , hz] = HUT_FAMILY, z = hz + 2.4;
    const xs = [-1.4, -0.3, 0.9, -0.85, 0.35];
    FAMILY.forEach((w, k) => walker(out, cam, t, w, hx + xs[k], z + (k >= 3 ? 0.6 : 0), 0, 1, 0, {
      expr: k === 0 && at(f, 1415) ? "smile_closed" : (["smile", "grin", "smile_closed", "grin", "laugh"] as Expr[])[k], prop: k === 0 ? (at(f, 1415) ? "point" : "cane") : null,
    }));
  }
  if (id === 11) {
    walker(out, cam, t, TOURIST, BEACH[0], BEACH[2], 0, 1, 0, { expr: at(f, 1538) ? "grin" : "smile", prop: "phone", look: at(f, 1564) ? 0 : 1 });
    if (f >= 1562 && f < 1693) out.fx.push({ key: "phoneBig", cw: 300, ch: 480, draw: phoneBig, x: BEACH[0] + 0.12, y: 1.32, z: BEACH[2] + 0.75, w: 0.36, h: 0.58 });
    if (f >= 1693) { out.fx.push({ key: "monitor", cw: 500, ch: 400, draw: monitor, x: BEACH[0] + 1.55, y: 2.1, z: BEACH[2] + 0.3, w: 1.5, h: 1.2, rot: 0.04 * Math.sin(t * 2) }); sparkle(out, t, 1695, BEACH[0] + 1.55, 2.1, BEACH[2] + 0.4, 1.6); }
  }
  if (id === 12) {
    if (f < 1864) {
      walker(out, cam, t, CHIEF, BIG[0] + 2.4, BIG[2] + 1.0, 0, 1, 0, { expr: "smile_closed", prop: "cane" });
      const k = q(t * 3, 12);
      out.fx.push({ key: `coin${k}`, cw: 320, ch: 320, draw: coin(t * 3), x: BIG[0] + 1.1, y: 2.0 + 0.1 * Math.sin(t * 2), z: BIG[2] + 1.1, w: 0.7, h: 0.7 });
      sparkle(out, t, 1836, BIG[0] + 1.1, 2.0, BIG[2] + 1.2, 1.2);
    } else for (let k = 0; k < 16; k++) {
      const x = -6 + (k % 6) * 2.3 + hh(k, 91) * 0.6, z = 28 + Math.floor(k / 6) * 1.8 + hh(k, 92) * 0.5;
      walker(out, cam, t, crowdWho("pacific", k + 60), x, z, 0, 1, 0, { expr: (["smile_closed", "smile", "grin"] as Expr[])[k % 3], headTilt: 4 * Math.sin(t * 3 + k) });
      if (k % 3 === 0) fxAnim(out, t, "th", 1880 + k * 2, 90, (p) => thought(p), x + 0.5, 2.9, z, 1.0, 0.85, 440, 420);
    }
  }
  void fxBurst; void fxStars; void smooth; void FPS;
};

export const life = (id: number): Life => {
  const village: Life = {
    walk: [{ x0: -40, x1: 40, z0: 18.5, z1: 21.5, axis: "x", n: 7, era: "pacific", base: 100 }, { x0: -30, x1: 30, z0: 36, z1: 40, axis: "x", n: 5, era: "pacific", base: 120 }],
    groups: [{ x: 16, z: 26, n: 3, era: "pacific", base: 140 }, { x: -18, z: 34, n: 4, era: "pacific", base: 150 }, { x: 6, z: 42, n: 3, era: "pacific", base: 160 }],
    birds: 6, birdY: 16, smoke: [[-1, 0.8, 27] as V3],
  };
  if (id === 2 || id === 3 || id === 9 || id === 10 || id === 12) return village;
  if (id === 7 || id === 8) return { ...village, smoke: [], walk: [{ x0: -40, x1: 40, z0: 36, z1: 40, axis: "x", n: 5, era: "pacific", base: 120 }], birds: 3 };
  if (id === 11) return { walk: [{ x0: -10, x1: 60, z0: 5, z1: 9, axis: "x", n: 6, era: "pacific", base: 170 }, { x0: 0, x1: 50, z0: 16, z1: 20, axis: "x", n: 4, era: "pacific", base: 180 }], groups: [{ x: 31, z: 6, n: 3, era: "1950", base: 190 }], birds: 5, birdY: 12 };
  if (id === 4) return { birds: 4, groups: [{ x: QUARRY[0] + 6, z: QUARRY[2] + 4, n: 2, era: "pacific", base: 200 }] };
  return {};
};
