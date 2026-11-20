// Characters and effects for "Der Kran, der 300 Jahre wartete" (our own designs).
import { Pen, Outfit, Expr, fxPuff } from "../../engine/toon";
import { Stage, CamInfo, walker, Who, Pose, hh, q, sparkle, V3 } from "../../engine/core";
import { Life } from "../../engine/world";
import { crowdWho } from "../../engine/people";
import { TOWER_X, SOUTH, STUMP_H, SQUARE, ATTIC, PARIS, WORK } from "./story";

const MED = (o: Partial<Outfit>): Outfit => ({ jacket: "#7a5a3e", pants: "#5d5040", boots: "#3b2a20", hat: "hair", hair: "#5a3b2a", skin: "#f2cfb0", ...o });
const MASTER: Who = { i: 1, o: MED({ jacket: "#5a2f35", dress: "#5a2f35", hat: "cap", cap: "#2e2a36", beard: "#9a948c", hair: "#9a948c", build: "stout" }), okey: "master" };
const mason = (i: number): Who => ({ i: 10 + i, o: MED({ jacket: ["#7a5a3e", "#5d6a3a", "#8c4a3a", "#4a5a7a", "#9a8a6a"][i % 5], hat: (["cap", "hair", "bald", "cap"] as const)[i % 4], cap: ["#4b4a52", "#7a6a50"][i % 2], hair: ["#5a3b2a", "#2b211c", "#8a5a34"][i % 3], beard: i % 3 === 0 ? "#5a3b2a" : undefined, skin: ["#f2cfb0", "#ecd0b6", "#e0ac7e"][i % 3], apron: "#c8b89a" }), okey: `mason${i}` });
const FATHER: Who = { i: 30, o: MED({ jacket: "#5d6a3a", beard: "#5a3b2a", hat: "cap", cap: "#4b4a52", apron: "#c8b89a" }), okey: "father" };
const SON: Who = { i: 31, o: MED({ jacket: "#8c4a3a", build: "kid", hair: "#8a5a34" }), okey: "son" };
const SON_OLD: Who = { i: 32, o: MED({ jacket: "#8c4a3a", beard: "#8a5a34", hair: "#8a5a34", apron: "#c8b89a" }), okey: "sonold" };
const GRANDPA: Who = { i: 33, o: MED({ jacket: "#5d6a3a", beard: "#d9d4cc", hat: "bald", hair: "#d9d4cc" }), okey: "grandpa" };
const GRANDSON: Who = { i: 34, o: MED({ jacket: "#4a5a7a", build: "kid", hair: "#c99a5a" }), okey: "grandson" };
const MOLLER: Who = { i: 40, o: { jacket: "#2f4a3a", pants: "#d8c8a0", boots: "#241726", hat: "tophat", hair: "#5a3b2a", moustache: "#5a3b2a", skin: "#f7d7bd" }, okey: "moller" };
const BOISS: Who = { i: 41, o: { jacket: "#5a3b2a", pants: "#3b3f52", boots: "#241726", hat: "hair", hair: "#2b211c", glasses: true, skin: "#f5c9a0" }, okey: "boiss" };
const PAINTER: Who = { i: 42, o: { jacket: "#6d7aa8", pants: "#3b3f52", boots: "#3b2a20", hat: "cap", cap: "#8c3b4a", beard: "#8a5a34" }, okey: "painter" };
const OLD: Who = { i: 43, o: { jacket: "#3a3328", pants: "#3b3f52", boots: "#241726", hat: "bowler", hair: "#d9d4cc", moustache: "#d9d4cc" }, okey: "old" };
const KID: Who = { i: 44, o: { jacket: "#c2453f", pants: "#3f5a7a", boots: "#3b2a20", hat: "pony", hair: "#c99a5a", dress: "#c2453f", build: "kid", skin: "#f7d7bd" }, okey: "kid" };
const at = (f: number, g: number) => f >= g - 2;

// ---- effect cards ----
const dream = (p: Pen) => {
  p.g.setLineDash([26, 20]); p.g.strokeStyle = "rgba(255,255,255,0.9)"; p.g.lineWidth = 14; p.g.lineJoin = "round";
  for (const cx of [260, 760]) { p.g.strokeRect(cx - 120, 600, 240, 400); p.g.strokeRect(cx - 100, 380, 200, 220); p.g.beginPath(); p.g.moveTo(cx - 95, 380); p.g.lineTo(cx, 40); p.g.lineTo(cx + 95, 380); p.g.stroke(); }
  p.g.beginPath(); p.g.moveTo(380, 1000); p.g.lineTo(380, 560); p.g.lineTo(510, 460); p.g.lineTo(640, 560); p.g.lineTo(640, 1000); p.g.stroke(); p.g.setLineDash([]);
};
const plan = (half: 0 | 1 | 2) => (p: Pen) => {
  p.poly([[10, 10], [390, 10], [390, 590], [10, 590]], "#e9dcb8", 6);
  const tower = (cx: number) => { p.g.strokeStyle = "#5a3b2a"; p.g.lineWidth = 5; p.g.strokeRect(cx - 50, 300, 100, 260); p.g.strokeRect(cx - 42, 200, 84, 100); p.g.beginPath(); p.g.moveTo(cx - 40, 200); p.g.lineTo(cx, 40); p.g.lineTo(cx + 40, 200); p.g.stroke(); for (let k = 0; k < 6; k++) { p.g.beginPath(); p.g.moveTo(cx - 30 + k * 12, 520); p.g.lineTo(cx - 30 + k * 12, 330); p.g.stroke(); } };
  if (half !== 2) tower(110); if (half !== 1) tower(290);
  p.g.strokeRect(160, 380, half === 0 ? 80 : 40, 180);
  if (half === 1) p.stroke([[392, 20], [372, 120], [392, 220], [370, 330], [392, 440], [372, 590]], 4, "#8a6a4a");
  if (half === 2) p.stroke([[8, 20], [28, 120], [8, 220], [30, 330], [8, 440], [28, 590]], 4, "#8a6a4a");
};
const easel = (p: Pen) => {
  p.stroke([[60, 390], [150, 40]], 10, "#7a4b2a"); p.stroke([[240, 390], [150, 40]], 10, "#7a4b2a");
  p.poly([[50, 60], [250, 60], [250, 250], [50, 250]], "#f3ecd8", 6);
  p.poly([[50, 180], [250, 180], [250, 250], [50, 250]], "#9cc0a0", 0);
  p.poly([[110, 250], [150, 250], [150, 120], [110, 120]], "#8f897c", 4);
  p.stroke([[150, 120], [205, 85]], 5, "#5a3b2a"); p.stroke([[205, 85], [205, 120]], 2, "#5a3b2a");
  p.poly([[50, 60], [250, 60], [250, 250], [50, 250]], null, 6);
};
const flag = (w: number) => (p: Pen) => { p.stroke([[20, 10], [20, 300]], 8, "#5a3b2a"); p.poly([[24, 20], [180, 30 + w * 10], [180, 120 + w * 10], [24, 110]], "#f4f0e6", 5); p.poly([[24, 65], [180, 75 + w * 10], [180, 120 + w * 10], [24, 110]], "#c8323a", 0); };

export const stage = (id: number, t: number, f: number, cam: CamInfo, out: Stage) => {
  const W = (who: Who, x: number, z: number, p: Pose = {}, y = 0) => walker(out, cam, t, who, x, z, 0, 1, 0, p, y);
  const card = (key: string, draw: (p: Pen) => void, x: number, y: number, z: number, w: number, h: number, cw = 500, ch = 500, soft = false) => out.fx.push({ key, cw, ch, draw, x, y, z, w, h, soft });
  const hammerers = (n: number, x0: number, z0: number, base = 0) => { for (let k = 0; k < n; k++) { const ph = (t * 1.5 + k * 0.37) % 1, kk = q(ph < 0.72 ? 0 : 1, 4); W(mason(k + base), x0 + k * 1.3, z0 + (k % 2) * 0.7, { expr: kk ? "grin" : "stern", prop: ["hammer", kk] }); if (ph > 0.72 && ph < 0.86) card(`dust${k}`, (p) => fxPuff(p, q((ph - 0.72) / 0.14, 6)), x0 + k * 1.3 + 0.4, 0.9, z0 + (k % 2) * 0.7 + 0.3, 0.7, 0.7, 300, 300, true); } };
  const sx = WORK[0] + 9.5, sz = WORK[2] - 3.5; // offsets below were laid out around this point (all on the square, west of the tower)
  void SOUTH;
  if (id === 1) {
    W(MASTER, sx - 3.2, sz - 0.6, { expr: at(f, 90) ? "smile_closed" : "smile", prop: "paper", headTilt: f >= 88 && f < 166 ? -10 : 0 });
    for (let k = 0; k < 4; k++) W(mason(k), sx - 5.4 + k * 1.1, sz + 0.4 + (k % 2) * 0.8, { expr: at(f, 124) ? "nervous" : "smile", headTilt: f >= 88 && f < 166 ? -12 : 0, look: k < 2 ? 1 : -1 });
    W(GRANDSON, sx - 4.6, sz + 2.8, { expr: at(f, 185) ? "smile_closed" : "grin", headTilt: -12 });
    if (f >= 88 && f < 166) card("dream", dream, TOWER_X - 3, 34, 0, 46, 46, 1024, 1024, true);
  }
  if (id === 2 && f >= 336) for (let k = 0; k < 6; k++) W(mason(k + 5), 26 + k * 1.4, 14.5 + (k % 2) * 0.8, { expr: "smile", headTilt: -10, prop: k % 3 === 0 ? ["hammer", 0] : null });
  if (id === 3) {
    if (f < 525) hammerers(5, sx - 10.5, sz + 3.6);
    else if (f < 586) { W(FATHER, sx - 9.4, sz + 4.1, { expr: "smile", prop: "point" }); W(SON, sx - 8.4, sz + 4.5, { expr: "grin", prop: ["hammer", q((t * 1.5) % 1 < 0.7 ? 0 : 1, 4)] }); }
    else { W(GRANDPA, sx - 10.3, sz + 3.9, { expr: "smile_closed", prop: "cane" }); W(SON_OLD, sx - 9.3, sz + 4.2, { expr: "smile", prop: "point" }); W(GRANDSON, sx - 8.3, sz + 4.6, { expr: "grin", prop: ["hammer", q((t * 1.5) % 1 < 0.7 ? 0 : 1, 4)] }); }
  }
  if (id === 4) {
    if (f < 720) {
      W(MASTER, sx - 7.0, sz + 4.4, { expr: at(f, 689) ? "nervous" : "smile", prop: at(f, 696) ? "shrug" : "bag" });
      for (let k = 0; k < 3; k++) W(mason(k), sx - 9.5 + k * 1.0, sz + 3.4, { expr: "nervous", look: 1 });
    } else for (let k = 0; k < 5; k++) walker(out, cam, t, mason(k), sx - 10 - (t - 24) * 1.1 - k * 1.4, sz + 6 + (k % 2), -1, 0, 1.1, { expr: "nervous" });
  }
  if (id === 7) {
    if (f < 1120) {
      W(PAINTER, SQUARE[0] + 1.4, SQUARE[2] + 9.6, { expr: "smile_closed", prop: "pencil", look: 1 });
      card("easel", easel, SQUARE[0] + 2.4, 1.0, SQUARE[2] + 9.8, 1.0, 1.3, 300, 400);
      for (let k = 0; k < 4; k++) W(crowdWho("1850", k + 20), SQUARE[0] - 1.6 + k * 0.9, SQUARE[2] + 8.6 - (k % 2) * 0.8, { expr: "smile", prop: k === 1 ? "point" : null, headTilt: -8 });
    } else W(KID, SQUARE[0] + 0.5, SQUARE[2] + 10.5, { expr: "smile_closed", headTilt: -14 });
  }
  if (id === 8) {
    W(MOLLER, ATTIC[0] + 0.2, ATTIC[2] - 0.1, { expr: at(f, 1340) ? "shock" : "nervous", prop: at(f, 1322) ? "paper" : null, look: at(f, 1322) ? 0 : -1 });
    for (let k = 0; k < 4; k++) { const u = ((t * 0.4 + k * 0.25) % 1); card(`dustA${q(u, 8)}`, (p) => fxPuff(p, q(u, 8)), ATTIC[0] - 1 + k * 0.7, 0.8 + u * 1.2, ATTIC[2] - 0.8, 0.6, 0.6, 300, 300, true); }
    if (f >= 1338) { card("plan1", plan(1), ATTIC[0] + 0.15, 1.45, ATTIC[2] + 0.5, 0.42, 0.63, 400, 600); sparkle(out, t, 1342, ATTIC[0] + 0.15, 1.5, ATTIC[2] + 0.6, 1.0); }
  }
  if (id === 9) {
    W(BOISS, PARIS[0] + 0.1, PARIS[2] - 0.1, { expr: at(f, 1507) ? "grin" : "smile", prop: "paper" });
    if (f >= 1505) {
      const u = Math.min(1, (f - 1505) / 12);
      card("plan1", plan(1), PARIS[0] - 0.4 + 0.19 * u, 1.62, PARIS[2] + 0.5, 0.38, 0.57, 400, 600);
      card("plan2", plan(2), PARIS[0] + 0.4 - 0.19 * u, 1.62, PARIS[2] + 0.5, 0.38, 0.57, 400, 600);
      sparkle(out, t, 1517, PARIS[0], 1.62, PARIS[2] + 0.6, 1.2);
    }
  }
  if (id === 10 && f >= 1645) { hammerers(6, sx - 14, sz + 2.8, 5); for (let k = 0; k < 3; k++) W(crowdWho("1880", k + 30), sx - 6.5 + k * 1.3, sz + 4.2 + (k % 2) * 0.6, { expr: "smile", headTilt: -10, prop: k === 0 ? "point" : null }); }
  if (id === 11 && f >= 1830 && f < 1915) for (let k = 0; k < 18; k++) {
    const x = SQUARE[0] - 2 + (k % 6) * 1.6 + hh(k, 7) * 0.5, z = SQUARE[2] - 2 + Math.floor(k / 6) * 1.6;
    W(crowdWho("1880", k + 40), x, z, { expr: (["laugh", "grin", "smile"] as Expr[])[k % 3], wave: k % 3 === 0 ? q(Math.sin(t * 7 + k), 12) : undefined, headTilt: -6 });
    if (k % 4 === 1) card(`flag${q(Math.sin(t * 5 + k), 6)}`, flag(q(Math.sin(t * 5 + k), 6)), x + 0.4, 2.1, z, 0.55, 0.85, 200, 320);
  }
  if (id === 12) { W(OLD, SQUARE[0] + 8.6, SQUARE[2] + 7.0, { expr: "smile_closed", prop: "cane", headTilt: -10 }); W(KID, SQUARE[0] + 9.5, SQUARE[2] + 7.2, { expr: "grin", headTilt: -14, prop: "point" }); }
  void STUMP_H;
};

export const life = (id: number): Life => {
  const era = id <= 4 ? "medieval" : id <= 9 ? "1850" : "1880";
  const square: Life = {
    walk: [{ x0: -88, x1: -40, z0: 24, z1: 30, axis: "x", n: 8, era, base: 100 }, { x0: -86, x1: -44, z0: -22, z1: -14, axis: "x", n: 6, era, base: 120 }, { x0: -90, x1: -40, z0: -6, z1: 6, axis: "x", n: 4, era, base: 130 }],
    groups: [{ x: -66, z: 10, n: 3, era, base: 140 }, { x: -74, z: -8, n: 4, era, base: 150 }, { x: -50, z: 18, n: 2, era, base: 160 }],
    birds: 7, birdY: 22, smoke: [[-104, 12, -20], [-60, 13, 36], [-30, 12, 42]] as V3[],
  };
  if ([1, 2, 3, 7, 10, 11, 12].includes(id)) return square;
  if (id === 4) return { birds: 4, birdY: 18, smoke: square.smoke };
  if (id === 5 || id === 6) return { birds: 9, birdY: 34 };
  return {};
};
