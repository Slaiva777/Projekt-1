// Characters and effects for "Der Arzt, der Hände wusch" (Vienna 1847, our own designs).
import { Pen, Outfit, Expr, fxBurst } from "../../engine/toon";
import { Stage, CamInfo, walker, Who, Pose, hh, q, sparkle, fxAnim } from "../../engine/core";
import { Life } from "../../engine/world";
import { WARD_DOC, WARD_MID, DISSECT, OFFICE, SCILAB, BATH, BASIN, GATE, STREET_Z } from "./story";

const SEMMEL: Who = { i: 1, o: { jacket: "#2e2a36", pants: "#3b3f52", boots: "#241726", hat: "bald", hair: "#5a3b2a", moustache: "#5a3b2a", skin: "#f7d7bd", build: "stout" }, okey: "semmel" };
const KOLL: Who = { i: 2, o: { jacket: "#3a3a44", pants: "#3b3f52", boots: "#241726", hat: "bald", hair: "#9a948c", beard: "#8a8580", glasses: true }, okey: "koll" };
const DOCJ = ["#2e2a36", "#3a3328", "#2f3540", "#3f2f35", "#40403a", "#2a3a32"];
const doc = (i: number): Who => ({ i: 20 + i, o: { jacket: DOCJ[i % 6], pants: "#3b3f52", boots: "#241726", hat: (["hair", "bald", "hair", "hair"] as const)[i % 4], hair: ["#2b211c", "#8a5a34", "#5a3b2a", "#9a948c"][i % 4],
  beard: i % 3 === 0 ? ["#2b211c", "#8a5a34"][i % 2] : undefined, moustache: i % 3 === 1 ? "#5a3b2a" : undefined, glasses: i % 4 === 2, build: i % 5 === 3 ? "stout" : "adult", skin: ["#f7d7bd", "#ecd0b6", "#f5c9a0"][i % 3] }, okey: `doc${i}` });
const midwife = (i: number): Who => ({ i: 40 + i, o: { jacket: ["#6d7aa8", "#7a8f6a", "#a8584a"][i % 3], dress: ["#6d7aa8", "#7a8f6a", "#a8584a"][i % 3], pants: "#3b3f52", boots: "#3b2a20", hat: i % 2 ? "bonnet" : "scarf", hatCol: "#f6f2e6", hair: "#8a5a34", apron: "#f6f2e6", skin: ["#f7d7bd", "#f5c9a0"][i % 2] }, okey: `mw${i}` });
const mother = (i: number): Who => ({ i: 60 + i, o: { jacket: "#f6f2e6", dress: "#f6f2e6", pants: "#f6f2e6", boots: "#f6f2e6", hat: (["long", "bun", "scarf", "pony"] as const)[i % 4], hatCol: "#e8d8b0", hair: ["#5a3b2a", "#c99a5a", "#2b211c", "#8a5a34"][i % 4], skin: ["#f7d7bd", "#ecd0b6", "#f5c9a0", "#e0ac7e"][i % 4] }, okey: `mom${i}` });
const SCIENT: Who = { i: 80, o: { jacket: "#3a3328", pants: "#3b3f52", boots: "#241726", hat: "bald", hair: "#d9d4cc", beard: "#d9d4cc", glasses: true, build: "stout" }, okey: "sci" };
const KID: Who = { i: 81, o: { jacket: "#f2c24a", pants: "#3f5a7a", boots: "#f4f1ea", hat: "pony", hair: "#8a5a34", build: "kid", skin: "#f5c9a0" }, okey: "kidb" };
const at = (f: number, g: number) => f >= g - 2;

// ---- effect cards ----
const bars = (u: number) => (p: Pen) => {
  p.poly([[10, 10], [490, 10], [490, 490], [10, 490]], "#fbf8ee", 7);
  p.stroke([[60, 420], [450, 420]], 7); p.stroke([[60, 420], [60, 60]], 7);
  const h1 = 80 * u, h2 = 300 * u;
  p.poly([[110, 420], [210, 420], [210, 420 - h1], [110, 420 - h1]], "#7aa86a", 6);
  p.poly([[290, 420], [390, 420], [390, 420 - h2], [290, 420 - h2]], "#d8322e", 6);
  // icons: a midwife's bonnet and a doctor's top hat under the bars
  p.ell(160, 455, 34, 20, "#f6f2e6", 5); p.arc(160, 460, 40, 20, 200, 340, 6);
  p.poly([[318, 470], [362, 470], [358, 435], [322, 435]], "#2e2a36", 5); p.ell(340, 470, 34, 7, "#2e2a36", 5);
};
const fall = (u: number) => (p: Pen) => {
  p.poly([[10, 10], [490, 10], [490, 490], [10, 490]], "#fbf8ee", 7);
  p.stroke([[60, 430], [460, 430]], 7); p.stroke([[60, 430], [60, 60]], 7);
  const pts: [number, number][] = [];
  for (let k = 0; k <= 30 * u; k++) { const x = k / 30; pts.push([70 + 380 * x, 100 + 300 * (x < 0.35 ? 0.05 * Math.sin(x * 30) : Math.min(1, (x - 0.35) * 3.2)) ]); }
  if (pts.length > 1) p.stroke(pts, 10, "#d8322e");
  p.g.fillStyle = "#241726"; p.g.font = "bold 54px sans-serif"; p.g.fillText("10 %", 80, 85);
  if (u > 0.8) p.g.fillText("1 %", 360, 400);
};
const germ = (k: number, w: number) => (p: Pen) => {
  const col = ["#7ac25a", "#5aa8c2", "#c27ad8", "#e0a33a"][k % 4];
  for (let a = 0; a < 8; a++) { const t = (a / 8) * Math.PI * 2 + w; p.stroke([[100 + Math.cos(t) * 55, 100 + Math.sin(t) * 50], [100 + Math.cos(t) * 80, 100 + Math.sin(t) * 74]], 8, col); }
  p.ell(100, 100, 60, 55, col, 7); p.ell(80, 90, 12, 14, "#ffffff", 4); p.ell(120, 90, 12, 14, "#ffffff", 4); p.dot(82, 94, 6); p.dot(122, 94, 6); p.arc(100, 118, 18, 10, 20, 160, 5);
};
const qmark = (p: Pen) => { p.g.fillStyle = "#241726"; p.g.font = "bold 200px sans-serif"; p.g.textAlign = "center"; p.g.fillText("?", 100, 190); };
const bang = (p: Pen) => { p.g.fillStyle = "#d8322e"; p.g.font = "bold 200px sans-serif"; p.g.textAlign = "center"; p.g.fillText("!", 100, 190); };
const thermo = (u: number) => (p: Pen) => { p.poly([[80, 20], [120, 20], [120, 300], [80, 300]], "#f6f8fa", 6); p.ell(100, 320, 40, 40, "#d8322e", 6); p.poly([[90, 300 - 250 * u], [110, 300 - 250 * u], [110, 310], [90, 310]], "#d8322e", 0); };
const bubbleC = (p: Pen) => { p.ell(64, 64, 52, 52, "rgba(230,245,255,0.35)", 5); p.ell(46, 44, 12, 9, "#ffffff", 0); };
const stopwatch = (u: number) => (p: Pen) => {
  p.ell(200, 220, 160, 160, "#fbf8ee", 10); p.poly([[180, 40], [220, 40], [220, 70], [180, 70]], "#c9cdd2", 6);
  const a = -Math.PI / 2 + u * Math.PI * 2; p.stroke([[200, 220], [200 + Math.cos(a) * 120, 220 + Math.sin(a) * 120]], 10, "#d8322e"); p.dot(200, 220, 14);
  p.g.fillStyle = "#241726"; p.g.font = "bold 64px sans-serif"; p.g.textAlign = "center"; p.g.fillText(String(Math.min(20, Math.round(u * 20))), 200, 330);
};

export const stage = (id: number, t: number, f: number, cam: CamInfo, out: Stage) => {
  const W = (who: Who, x: number, z: number, p: Pose = {}, y = 0) => walker(out, cam, t, who, x, z, 0, 1, 0, p, y);
  const card = (key: string, draw: (p: Pen) => void, x: number, y: number, z: number, w: number, h = w, cw = 500, ch = 500) => out.fx.push({ key, cw, ch, draw, x, y, z, w, h });
  const bubbles = (x: number, y: number, z: number, n = 6) => { for (let k = 0; k < n; k++) { const u = (t * 0.6 + k / n) % 1; card("bubbleC", bubbleC, x + Math.sin(u * 7 + k) * 0.25, y + u * 0.9, z + 0.1, 0.09 + 0.05 * hh(k, 2), 0.09 + 0.05 * hh(k, 2), 128, 128); } };
  const mothersIn = (c: [number, number, number], happy: boolean, n = 6) => { for (let k = 0; k < n; k++) W(mother(k + (happy ? 0 : 10)), c[0] - 5.6 + k * 1.9, c[2] - 2.55, { mode: "sit", expr: happy ? (["smile", "grin", "smile_closed"] as Expr[])[k % 3] : (["pained", "nervous", "dazed"] as Expr[])[k % 3], prop: happy || k % 2 ? "baby" : null }, 0.48); };
  if (id === 1) {
    W(SEMMEL, BASIN[0] - 0.05, BASIN[2] + 0.62, { expr: at(f, 186) ? "stern" : "smile_closed", prop: "wash" });
    bubbles(BASIN[0], 1.05, BASIN[2] + 0.5);
    if (f >= 152) for (let k = 0; k < 4; k++) W(doc(k), BASIN[0] - 2.4 - (k % 2) * 0.9, BASIN[2] + 1.1 + (k >> 1) * 0.9, { expr: at(f, 186) ? (k % 2 ? "laugh" : "grin") : "smile", prop: k === 0 && at(f, 186) ? "point" : null, tilt: at(f, 186) ? 5 * Math.sin(t * 9 + k) : 0 });
    mothersIn(WARD_DOC, false, 3);
  }
  if (id === 3) {
    if (f < 518) { mothersIn(WARD_MID, true); for (let k = 0; k < 2; k++) walker(out, cam, t, midwife(k), WARD_MID[0] - 4 + ((t * 0.9 + k * 4) % 8), WARD_MID[2] - 0.6 + k * 0.9, 1, 0, 0.9, { expr: "smile" }); }
    else {
      mothersIn(WARD_DOC, false);
      for (let k = 0; k < 4; k++) walker(out, cam, t, doc(k + 4), WARD_DOC[0] + 4 - ((t * 0.8 + k * 1.2) % 9), WARD_DOC[2] - 0.4 + (k % 2) * 0.8, -1, 0, 0.8, { expr: "stern" });
      if (f >= 575) card(`bars${q(Math.min(1, (f - 575) / 30), 30)}`, bars(q(Math.min(1, (f - 575) / 30), 30)), WARD_DOC[0] - 0.4, 1.95, WARD_DOC[2] + 0.4, 1.0);
    }
  }
  if (id === 4) {
    if (f < 729) for (let k = 0; k < 5; k++) W(mother(20 + k), -23.4 + k * 0.75, 10.4 + (k % 2) * 0.6, { expr: k === 2 ? "nervous" : k % 2 ? "shock" : "nervous", look: k < 2 ? 1 : -1, prop: k === 4 ? "baby" : null });
    else {
      W({ ...mother(30), o: { ...mother(30).o, jacket: "#a8584a", dress: "#a8584a", hat: "scarf", hatCol: "#5a7ac2" } }, 2, STREET_Z + 0.4, { mode: "sit", expr: "smile_closed", prop: "baby" }, 0.25);
      W(midwife(5), 3.0, STREET_Z + 0.8, { expr: "smile", look: -1 });
      W({ ...mother(31), o: { ...mother(31).o, jacket: "#5a7a5a", dress: "#5a7a5a", apron: "#f6f2e6" } }, 0.9, STREET_Z + 0.9, { expr: "grin", look: 1 });
      sparkle(out, t, 759, 2, 1.0, STREET_Z + 0.6, 1.0);
    }
  }
  if (id === 5) {
    if (f < 949) { walker(out, cam, t, SEMMEL, OFFICE[0] - 1 + 1.0 * Math.sin(t * 0.9), OFFICE[2] - 0.2, Math.cos(t * 0.9) > 0 ? 1 : -1, 0, Math.abs(Math.cos(t * 0.9)) > 0.2 ? 0.9 : 0, { expr: "nervous" }); card("qmark", qmark, OFFICE[0] - 0.6, 2.2, OFFICE[2] - 0.2, 0.3, 0.33, 200, 220); }
    else if (f < 1071) {
      W(KOLL, DISSECT[0] + 0.6, DISSECT[2] + 0.4, { expr: at(f, 1015) ? "shock" : "smile", prop: at(f, 1010) ? "point" : null });
      for (let k = 0; k < 3; k++) W(doc(k + 8), DISSECT[0] - 1.6 - k * 0.8, DISSECT[2] - 0.6 + k * 0.6, { expr: "neutral", look: 1 });
      if (at(f, 1015)) card("bang", bang, DISSECT[0] + 1.1, 2.1, DISSECT[2] + 0.4, 0.28, 0.31, 200, 220);
    } else {
      W(KOLL, WARD_DOC[0] - 5.6, WARD_DOC[2] - 2.55, { mode: "sit", expr: "pained" }, 0.48);
      W(SEMMEL, WARD_DOC[0] - 4.5, WARD_DOC[2] - 1.2, { expr: "nervous", look: -1 });
      card(`th${q(Math.min(1, (f - 1092) / 20), 20)}`, thermo(q(Math.min(1, Math.max(0, (f - 1092) / 20)), 20)), WARD_DOC[0] - 5.0, 1.6, WARD_DOC[2] - 2.2, 0.25, 0.42, 200, 360);
    }
  }
  if (id === 6) {
    if (f < 1189) { W(SEMMEL, OFFICE[0], OFFICE[2] - 0.4, { expr: at(f, 1170) ? "shock" : "nervous" }); fxAnim(out, t, "idea", 1168, 12, (p, u) => fxBurst(p, u, "#fff3b0"), OFFICE[0], 2.2, OFFICE[2] - 0.3, 1.0, 1.0); }
    else for (let k = 0; k < 5; k++) {
      const x = -15 - ((t - 39.6) * 1.2 + k * 1.3) % 30, z = 7.6 + (k % 2) * 0.8;
      walker(out, cam, t, doc(k), x, z, -1, 0, 1.2, { expr: "neutral" });
      for (let g = 0; g < 3; g++) card(`germ${(k + g) % 4}${q(t % 1, 4)}`, germ(k + g, q(t * 2, 4)), x + 0.25 + (g - 1) * 0.12, 1.0 + 0.08 * g, z + 0.2, 0.13, 0.13, 200, 200);
    }
  }
  if (id === 7) {
    W(SEMMEL, BASIN[0] - 1.6, BASIN[2] + 0.8, { expr: at(f, 1368) ? "stern" : "smile", prop: at(f, 1368) ? "point" : null });
    W(doc(2), BASIN[0] - 0.05, BASIN[2] + 0.62, { expr: at(f, 1440) ? "smile_closed" : "nervous", prop: "wash" });
    for (let k = 0; k < 3; k++) W(doc(k + 3), BASIN[0] - 1.5 - k * 0.7, BASIN[2] + 1.3 + k * 0.5, { expr: "neutral" });
    bubbles(BASIN[0], 1.05, BASIN[2] + 0.5, 9);
  }
  if (id === 8) {
    mothersIn(WARD_DOC, true);
    if (f < 1612) card(`fall${q(Math.min(1, (f - 1525) / 40), 30)}`, fall(q(Math.min(1, (f - 1525) / 40), 30)), WARD_DOC[0] + 0.5, 2.0, WARD_DOC[2] + 0.6, 1.1);
    else { W(SEMMEL, WARD_DOC[0] + 1.6, WARD_DOC[2] - 0.6, { expr: "grin" }); W(midwife(1), WARD_DOC[0] - 1.0, WARD_DOC[2] - 0.8, { expr: "smile" }); }
  }
  if (id === 9) for (let k = 0; k < 7; k++) {
    const angry = at(f, 1722);
    W(doc(k + 10), -11.6 + (k % 4) * 1.15 + (k >= 4 ? 0.55 : 0), 11.6 + (k >= 4 ? 1.0 : 0), { expr: angry ? (k === 1 && at(f, 1845) ? "shock" : "stern") : "neutral", headTilt: angry ? -10 : 0, look: k % 2 ? 1 : -1, prop: k === 1 && at(f, 1843) ? "arms_up" : null });
  }
  if (id === 10) {
    if (f < 1961) walker(out, cam, t, SEMMEL, GATE[0] + 0.3, GATE[2] - 3 + (t - 62.8) * 0.8, 0, 1, 0.8, { expr: "nervous", prop: "cashbox", tilt: -4 });
    else {
      W(SCIENT, SCILAB[0] - 0.1, SCILAB[2] - 0.5, { expr: "grin" });
      for (let k = 0; k < 5; k++) card(`germ${k % 4}${q(t % 1, 4)}`, germ(k, q(t * 2, 4)), SCILAB[0] + 0.7 + Math.cos(t + k * 1.3) * 0.5, 1.7 + Math.sin(t * 1.3 + k) * 0.25, SCILAB[2] - 0.6, 0.22);
    }
  }
  if (id === 11) {
    W(KID, BATH[0], BATH[2] - 2.0, { expr: at(f, 2208) ? "grin" : "smile_closed", prop: "wash" });
    bubbles(BATH[0], 1.0, BATH[2] - 1.9, 12);
    if (f >= 2208) card(`sw${q(Math.min(1, (f - 2210) / 50), 20)}`, stopwatch(q(Math.min(1, (f - 2210) / 50), 20)), BATH[0] + 0.75, 1.75, BATH[2] - 1.9, 0.5, 0.55, 400, 440);
    sparkle(out, t, 2297, BATH[0], 1.2, BATH[2] - 1.8, 1.2);
  }
};

export const life = (id: number): Life => {
  const court: Life = {
    walk: [{ x0: -60, x1: 38, z0: 5.3, z1: 9.2, axis: "x", n: 8, era: "1850", base: 100 }, { x0: -1.8, x1: 1.8, z0: 10, z1: 42, axis: "z", n: 3, era: "1850", base: 120 }],
    groups: [{ x: -30, z: 18, n: 3, era: "1850", base: 140 }, { x: 14, z: 16, n: 4, era: "1850", base: 150 }, { x: -48, z: 24, n: 2, era: "1850", base: 160 }],
    birds: 5, birdY: 18,
  };
  if (id === 2 || id === 4 || id === 6 || id === 9 || id === 10) {
    if (id === 4) return { ...court, walk: [...court.walk!, { x0: -40, x1: 40, z0: STREET_Z + 1.8, z1: STREET_Z + 4.5, axis: "x", n: 7, era: "1850", base: 170 }] };
    if (id === 10) return { walk: [{ x0: -40, x1: 40, z0: STREET_Z + 0.5, z1: STREET_Z + 4.5, axis: "x", n: 6, era: "1850", base: 170 }], birds: 4 };
    return court;
  }
  return {};
};
