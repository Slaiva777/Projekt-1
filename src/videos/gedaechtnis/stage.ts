// Characters and effects for "Der Mann, der alles vergaß".
import { Pen, Outfit, Expr, fxStars, fxBurst, SKIN } from "../../engine/toon";
import { Stage, CamInfo, walker, Who, Pose, hh, q, FPS, sparkle, fxAnim, V3 } from "../../engine/core";
import { Life } from "../../engine/world";
import { crowdWho } from "../../engine/people";
import { WARD, OR, LAB, TABLE, BOARD, BENCH, bikeX, brenda7 } from "./story";

const HENRY_O: Outfit = { jacket: "#6a6f7a", pants: "#4a4552", boots: "#3b2a20", hat: "hair", hair: "#3a2a20", glasses: true, skin: SKIN };
const HENRY: Who = { i: 1, o: HENRY_O, okey: "henry" };
const henryDay = (k: number): Who => ({ i: 1, o: { ...HENRY_O, jacket: ["#6a6f7a", "#7a5a3e", "#4f6a8a", "#6a7a4a"][k % 4] }, okey: `henry${k % 4}` });
const BRENDA: Who = { i: 2, o: { jacket: "#f4f4f0", dress: "#f0efe8", pants: "#3b3f52", boots: "#3b2a20", hat: "bun", hair: "#2b211c", skin: "#f7d7bd" }, okey: "brenda" };
const SCOVILLE: Who = { i: 3, o: { jacket: "#f4f4f0", pants: "#3b3f52", boots: INKB(), hat: "bald", hair: "#9a948c", glasses: true, build: "stout" }, okey: "scoville" };
const SURGEON: Who = { i: 4, o: { jacket: "#a8d0c0", pants: "#a8d0c0", boots: "#f4f4f0", hat: "nurse", hatCol: "#a8d0c0", moustache: "#5a3b2a" }, okey: "surgeon" };
const NURSE: Who = { i: 5, o: { jacket: "#ffffff", dress: "#ffffff", pants: "#ffffff", boots: "#f4f4f0", hat: "nurse", hair: "#c99a5a", skin: "#f5c9a0" }, okey: "nurse" };
const DOC2: Who = { i: 6, o: { jacket: "#f4f4f0", pants: "#4a4038", boots: "#3b2a20", hat: "hair", hair: "#8a5a34", beard: "#8a5a34" }, okey: "doc2" };
const RIDER: Who = { i: 7, o: { jacket: "#e05a5a", pants: "#3f5a7a", boots: "#2a2228", hat: "pony", hair: "#c99a5a", dress: undefined, skin: "#f5c9a0" }, okey: "rider" };
function INKB() { return "#241726"; }
const at = (f: number, g: number) => f >= g - 2;

// ---- effect cards ----
const calendar = (day: number, flip: number) => (p: Pen) => {
  p.poly([[30, 40], [370, 40], [370, 440], [30, 440]], "#fbf8ee", 8);
  p.poly([[30, 40], [370, 40], [370, 130], [30, 130]], "#d8322e", 8);
  for (const x of [110, 290]) p.ell(x, 40, 16, 22, "#c9ccd2", 5);
  p.g.fillStyle = "#241726"; p.g.font = "bold 220px sans-serif"; p.g.textAlign = "center"; p.g.fillText(String(day), 200, 380);
  if (flip > 0) { p.poly([[30, 130], [370, 130], [370, 130 + 310 * (1 - flip)], [30, 130 + 330 * (1 - flip)]], "#f0ead8", 6); }
};
const iconBubble = (kind: number, pop: number) => (p: Pen) => {
  if (pop > 0) { fxBurst(p, pop, "#ffffff", 10, 40, 230); return; }
  p.ell(250, 200, 200, 150, "#ffffff", 9); p.ell(100, 380, 34, 24, "#ffffff", 7); p.ell(60, 440, 18, 13, "#ffffff", 6);
  if (kind === 0) { p.ell(250, 200, 80, 90, "#f2cfb0", 7); p.dot(220, 185, 9); p.dot(280, 185, 9); p.arc(250, 225, 30, 18, 20, 160, 7); p.ell(250, 130, 82, 40, "#5a3b2a", 0, 180, 360); }
  if (kind === 1) { p.ell(200, 170, 90, 55, "#bfe0f2", 7); p.ell(300, 240, 80, 48, "#f2d8bf", 7); for (let k = 0; k < 3; k++) { p.stroke([[150, 150 + k * 20], [250, 150 + k * 20]], 7); p.stroke([[260, 225 + k * 18], [340, 225 + k * 18]], 7); } }
  if (kind === 2) { p.ell(250, 230, 130, 40, "#fbf8ee", 7); p.ell(230, 205, 60, 32, "#d89a4a", 6); p.ell(300, 212, 34, 20, "#7ab05a", 6); p.stroke([[120, 110], [130, 250]], 8, "#9a9a9a"); }
};
const brain = (glow: number, cut: number) => (p: Pen) => {
  p.ell(250, 230, 210, 160, "#f2a6b0", 10);
  for (let k = 0; k < 7; k++) p.arc(110 + k * 48, 200 + (k % 2) * 50, 42, 34, 20, 160, 7, "#c86a7a");
  p.arc(250, 180, 140, 60, 200, 340, 7, "#c86a7a");
  if (cut > 0) { p.ell(300, 300, 60, 28, `rgba(80,20,40,${cut})`, 6); p.stroke([[300, 300], [430, 420]], 6, "#241726"); p.ell(440, 430, 18, 18, "#e8c45a", 5); }
  if (glow > 0) { const g = p.g.createRadialGradient(170, 170, 10, 170, 170, 140); g.addColorStop(0, `rgba(255,240,120,${0.9 * glow})`); g.addColorStop(1, "rgba(255,240,120,0)"); p.g.fillStyle = g; p.g.fillRect(20, 20, 300, 300); }
};
/** the star tracing on paper: a double-outlined star band and the subject's line (0 chaos .. 1 clean); progress = how far drawn */
const tracing = (skill: number, prog: number, seed: number) => (p: Pen) => {
  p.poly([[10, 10], [490, 10], [490, 490], [10, 490]], "#fbf8ee", 6);
  const star = (r1: number, r2: number) => { const pts: [number, number][] = []; for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + (k * Math.PI) / 5, r = k % 2 ? r2 : r1; pts.push([250 + Math.cos(a) * r, 260 + Math.sin(a) * r]); } return pts; };
  p.poly(star(200, 85), null, 5); p.poly(star(165, 62), null, 5);
  const path = star(183, 73); const pts: [number, number][] = [];
  const N = Math.floor(prog * 200);
  for (let i = 0; i <= N; i++) {
    const u = (i / 200) * 10, k = Math.floor(u) % 10, fu = u - Math.floor(u), a = path[k], c = path[(k + 1) % 10];
    const wob = (1 - skill) * 40 * Math.sin(i * 0.9 + seed) + (1 - skill) * 26 * Math.sin(i * 0.37 + seed * 2);
    const nx = -(c[1] - a[1]), ny = c[0] - a[0], nl = Math.hypot(nx, ny) || 1;
    pts.push([a[0] + (c[0] - a[0]) * fu + (nx / nl) * wob, a[1] + (c[1] - a[1]) * fu + (ny / nl) * wob]);
  }
  if (pts.length > 1) p.stroke(pts, 6, "#d8322e");
};
const qmark = (p: Pen) => { p.g.fillStyle = "#241726"; p.g.font = "bold 200px sans-serif"; p.g.textAlign = "center"; p.g.fillText("?", 100, 190); };
const paperFly = (u: number) => (p: Pen) => { p.poly([[20, 30 + u * 20], [180, 10], [190, 130 - u * 20], [30, 150]], "#fbf8ee", 6); for (let k = 0; k < 4; k++) p.stroke([[50, 50 + k * 22], [150, 45 + k * 22]], 4, "#9a9a9a"); };

const sitT = (who: Who, x: number, z: number, p: Pose = {}): [Who, number, number, Pose] => [who, x, z, { mode: "sit", ...p }];

export const stage = (id: number, t: number, f: number, cam: CamInfo, out: Stage) => {
  const W = (who: Who, x: number, z: number, p: Pose = {}, y = 0) => walker(out, cam, t, who, x, z, 0, 1, 0, p, y);
  const henryAtTable = (p: Pose, who = HENRY) => W(who, TABLE[0], TABLE[2] - 0.62, { mode: "sit", ...p }, 0.3);
  const cal = (day: number, f0: number, x = LAB[0] + 2.2, y = 2.35, z = LAB[2] - 4.3, s = 0.7) => {
    const flip = Math.max(0, 1 - (f - f0) / 10);
    out.fx.push({ key: `cal${day}${q(flip, 10)}`, cw: 400, ch: 480, draw: calendar(day, q(flip, 10)), x, y, z, w: s, h: s * 1.2 });
  };
  if (id === 1) {
    henryAtTable({ expr: at(f, 119) ? "grin" : "smile", prop: at(f, 100) ? "point" : null });
    W(BRENDA, TABLE[0] + 0.95, TABLE[2] + 0.45, { expr: "smile", prop: at(f, 100) ? "point" : null, look: -1, wave: at(f, 100) ? undefined : q(Math.sin(t * 6), 12) });
    const day = 1 + Math.floor(Math.max(0, f - 80) / 7);
    cal(Math.min(31, day), 80 + (day - 1) * 7, TABLE[0] - 1.4, 2.0, TABLE[2] - 1.2, 0.7);
    sparkle(out, t, 119, TABLE[0] + 0.45, 1.6, TABLE[2] + 0.1, 1.0);
  }
  if (id === 3) {
    W(HENRY, WARD[0] - 0.2, WARD[2] - 1.5, { mode: "sit", expr: at(f, 287) ? "dazed" : "nervous", tilt: at(f, 287) ? 6 * Math.sin(t * 7) : 0 }, 0.18);
    if (at(f, 287)) { const u = q((t * 1.2) % 1, 20); out.fx.push({ key: `stars${u}`, cw: 420, ch: 210, draw: (p) => fxStars(p, u), x: WARD[0] - 0.2, y: 2.0, z: WARD[2] - 1.4, w: 0.9, h: 0.45 }); }
    if (f >= 300) { W(SCOVILLE, WARD[0] - 1.6, WARD[2] + 0.3, { expr: at(f, 332) ? "stern" : "nervous", look: 1 }); W(DOC2, WARD[0] - 0.4, WARD[2] + 0.7, { expr: "nervous", look: -1, prop: "book" }); }
  }
  if (id === 4) {
    W(SCOVILLE, OR[0] - 0.7, OR[2] - 2.0, { expr: "stern", prop: "wash" });
    W(SURGEON, OR[0] + 0.7, OR[2] - 2.0, { expr: "stern" });
    W(NURSE, OR[0] + 1.7, OR[2] - 0.8, { expr: "nervous", look: -1 });
    if (f >= 428) { const cut = q(Math.min(1, (f - 440) / 12), 12); out.fx.push({ key: `brain${cut}`, cw: 500, ch: 500, draw: brain(0, cut), x: OR[0], y: 1.95, z: OR[2] + 0.5, w: 0.9, h: 0.9 }); }
  }
  if (id === 5) {
    W(HENRY, WARD[0] - 0.2, WARD[2] - 1.5, { mode: "sit", expr: "grin" }, 0.18);
    W(NURSE, WARD[0] + 0.8, WARD[2] - 0.9, { expr: "smile", wave: q(Math.sin(t * 6), 12) });
    sparkle(out, t, 499, WARD[0] - 0.2, 1.4, WARD[2] - 1.2, 1.0);
  }
  if (id === 6) {
    const bub = (kind: number, f0: number) => { const age = f - f0; if (age < 0 || age > 30) return; const pop = age < 22 ? 0 : q((age - 22) / 8, 8); out.fx.push({ key: `ib${kind}${pop}`, cw: 500, ch: 480, draw: iconBubble(kind, pop), x: TABLE[0] + 0.38, y: 1.62, z: TABLE[2] - 0.4, w: 0.6, h: 0.58 }); };
    henryAtTable({ expr: at(f, 727) ? "nervous" : at(f, 611) ? "neutral" : "smile", look: at(f, 727) ? 1 : 0 });
    bub(0, 657); bub(1, 687); bub(2, 717);
    if (f >= 700) W(NURSE, TABLE[0] + 0.95, TABLE[2] + 0.35, { expr: "smile", prop: "plate", look: -1 });
    if (f >= 735) out.fx.push({ key: "qmark", cw: 200, ch: 220, draw: qmark, x: TABLE[0] - 0.35, y: 1.75, z: TABLE[2] - 0.5, w: 0.25, h: 0.28 });
  }
  if (id === 7) {
    const k = f < 865 ? 0 : f < 899 ? 1 : f < 929 ? 2 : 3;
    henryAtTable({ expr: "smile", look: 1 }, henryDay(k));
    if (f < 865) { const { u, x, z } = brenda7(f);
      walker(out, cam, t, BRENDA, x, z, 1, -0.4, u < 1 ? 1.2 : 0, { expr: "smile", wave: at(f, 829) ? q(Math.sin(t * 7), 12) : undefined }); }
    else { W(BRENDA, TABLE[0] + 0.95, TABLE[2] + 0.45, { expr: k === 3 ? "smile_closed" : "smile", prop: "point", look: -1 }); cal([1, 2, 3, 4][k], [865, 899, 929, 929][k] - 2, TABLE[0] - 1.3, 2.0, TABLE[2] - 1.2, 0.6); }
  }
  if (id === 8) {
    henryAtTable({ expr: at(f, 1100) ? "nervous" : "smile", prop: "pencil" });
    W(BRENDA, TABLE[0] + 1.05, TABLE[2] + 0.45, { expr: "smile_closed", prop: f < 1040 ? "paper" : "book", look: -1 });
    if (f >= 1054 && f < 1100) out.fx.push({ key: "trace0", cw: 500, ch: 500, draw: tracing(0, 0, 1), x: TABLE[0] + 0.05, y: 1.0, z: TABLE[2] + 0.32, w: 0.5, h: 0.5 });
  }
  if (id === 9) {
    const day = f < 1213 ? 0 : f < 1281 ? 1 : 2, f0 = [1131, 1213, 1281][day], prog = q(Math.min(1, (f - f0) / 50), 50);
    henryAtTable({ expr: (["pained", "stern", "grin"] as Expr[])[day], prop: "pencil" }, henryDay(day));
    out.fx.push({ key: `trace${day}${prog}`, cw: 500, ch: 500, draw: tracing([0.05, 0.55, 0.95][day], prog, day + 1), x: TABLE[0] + 0.05, y: 1.0, z: TABLE[2] + 0.32, w: 0.5, h: 0.5 });
    cal(day + 1, f0 + 2, TABLE[0] - 0.75, 1.75, TABLE[2] - 0.3, 0.32);
    if (day === 2) sparkle(out, t, 1336, TABLE[0], 1.25, TABLE[2] + 0.2, 0.7);
  }
  if (id === 10) {
    henryAtTable({ expr: at(f, 1423) ? "nervous" : "smile", headTilt: at(f, 1423) ? -8 : 0, look: at(f, 1450) ? 1 : 0 });
    W(BRENDA, TABLE[0] + 1.25, TABLE[2] - 0.9, { expr: "smile_closed", prop: "book" });
    if (at(f, 1423)) out.fx.push({ key: "qmark", cw: 200, ch: 220, draw: qmark, x: TABLE[0] + 0.35, y: 1.6, z: TABLE[2] - 0.35, w: 0.22, h: 0.24 });
  }
  if (id === 11) {
    henryAtTable(at(f, 1595) ? { expr: "dazed", prop: "shrug" } : { expr: "smile" });
    const glow = q(0.6 + 0.4 * Math.sin(t * 5), 8);
    if (f < 1593) out.fx.push({ key: `brainG${glow}`, cw: 500, ch: 500, draw: brain(glow, 0), x: TABLE[0] + 0.15, y: 1.85, z: TABLE[2] - 0.6, w: 0.75, h: 0.75 });
    W(BRENDA, TABLE[0] + 1.2, TABLE[2] - 0.9, { expr: "smile", prop: "book" });
  }
  if (id === 12) {
    W(BRENDA, BOARD[0] - 1.45, BOARD[2] + 1.5, { expr: "smile", prop: "point" });
    henryAtTable({ expr: "smile", look: -1 });
    sparkle(out, t, 1767, BOARD[0] - 0.8, 2.1, BOARD[2] + 0.1, 1.4); sparkle(out, t, 1824, BOARD[0] + 0.8, 2.1, BOARD[2] + 0.1, 1.4);
  }
  if (id === 13) {
    const x = bikeX(t);
    walker(out, cam, t, RIDER, x - 0.05, 14.2, 1, 0, 0, { mode: "sit", expr: at(f, 2039) ? "laugh" : "grin", noBlob: true }, 0.42);
    out.fx.push({ key: "blob|contact|#7a7f8f", cw: 128, ch: 128, draw: (p) => { p.ell(64, 64, 60, 60, "#7a7f8f", 0); }, x, y: 0.03, z: 14.2, w: 1.6, h: 0.45, flat: true });
  }
  if (id === 14) {
    W(HENRY, BENCH[0] - 0.35, BENCH[2] + 0.05, { mode: "sit", expr: "smile_closed" }, 0.1);
    W(BRENDA, BENCH[0] + 0.45, BENCH[2] + 0.05, { mode: "sit", expr: "smile", look: -1, prop: "book" }, 0.1);
    for (let k = 0; k < 5; k++) { const u = ((t * 0.25 + k * 0.21) % 1); out.fx.push({ key: `paper${q(u, 6)}`, cw: 200, ch: 160, draw: paperFly(q(u, 6)), x: BENCH[0] - 3 + u * 8 + k, y: 1.2 + u * 6 + Math.sin(t * 2 + k) * 0.3, z: BENCH[2] - 1 - k * 0.8, w: 0.35, h: 0.28, rot: Math.sin(t * 3 + k) }); }
  }
  void FPS; void hh; void sitT; void crowdWho;
};

export const life = (id: number): Life => {
  const park: Life = {
    walk: [{ x0: -50, x1: 50, z0: 13.0, z1: 15.4, axis: "x", n: 8, era: "1950", base: 100 }, { x0: -40, x1: 40, z0: 6.0, z1: 7.3, axis: "x", n: 4, era: "1950", base: 120 }],
    groups: [{ x: -8, z: 20, n: 3, era: "1950", base: 140 }, { x: 22, z: 22, n: 4, era: "1950", base: 150 }, { x: -26, z: 17.5, n: 2, era: "1950", base: 160 }],
    birds: 6, birdY: 15,
  };
  if (id === 2 || id === 13 || id === 14) return park;
  if (id === 3 || id === 5) return { groups: [{ x: WARD[0] + 2.8, z: WARD[2] - 1.0, n: 2, era: "1950", base: 170 }] };
  return {};
};
export const _unused: V3 = [0, 0, 0];
