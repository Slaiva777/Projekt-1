// Interior rooms for the shorts: painted inner walls (wainscot, chair rail, windows with daylight, picture frames),
// an outer brick/plaster facade, floor (planks / tiles / stone) and a ceiling that casts no shadow (sun still shades
// the room through it). Rooms are boxes centred on (cx, cz), front wall at cz + d/2.
import * as THREE from "three";
import { Batch, V, lam, quad } from "./build";
import { ctex, facadeHD, rng } from "./paint";
import { quadUp } from "./world";

export type RoomStyle = { lower: string; upper: string; rail: string; floor: "planks" | "tiles" | "stone"; floorA: string; floorB: string; outer: string; brick?: boolean; windows?: number; frames?: boolean; tiledWalls?: boolean };
const PXM = 64;

/** inner wall texture: wm x hm metres, nWin windows (daylight sky + bars), wainscot below 1.1 m */
const wallTex = (key: string, wm: number, hm: number, s: RoomStyle, nWin: number, door = -1) => ctex("inw" + key, Math.round(wm * PXM), Math.round(hm * PXM), (g, r) => {
  const W = wm * PXM, H = hm * PXM, m = (v: number) => v * PXM, Y = (y: number) => H - m(y);
  g.fillStyle = s.upper; g.fillRect(0, 0, W, H);
  if (s.tiledWalls) { g.strokeStyle = "rgba(60,80,70,0.18)"; g.lineWidth = 2; for (let x = 0; x < W; x += m(0.2)) { g.beginPath(); g.moveTo(x, Y(2.2)); g.lineTo(x, H); g.stroke(); } for (let y = 0; y < 2.2; y += 0.2) { g.beginPath(); g.moveTo(0, Y(y)); g.lineTo(W, Y(y)); g.stroke(); } }
  for (let i = 0; i < wm * hm * 3; i++) { g.fillStyle = r() < 0.5 ? "rgba(255,255,255,0.05)" : "rgba(80,60,40,0.04)"; g.beginPath(); g.arc(r() * W, r() * H, 6 + r() * 30, 0, 7); g.fill(); }
  g.fillStyle = s.lower; g.fillRect(0, Y(s.tiledWalls ? 2.2 : 1.1), W, m(s.tiledWalls ? 2.2 : 1.1));
  if (!s.tiledWalls) for (let x = m(0.3); x < W; x += m(0.9)) { g.strokeStyle = "rgba(0,0,0,0.12)"; g.lineWidth = 3; g.strokeRect(x, Y(0.95), m(0.7), m(0.75)); }
  g.fillStyle = s.rail; g.fillRect(0, Y(s.tiledWalls ? 2.25 : 1.15), W, m(0.07)); g.fillRect(0, Y(0.14), W, m(0.14));
  g.fillStyle = "rgba(0,0,0,0.25)"; g.fillRect(0, Y(0.16), W, m(0.02));
  for (let i = 0; i < nWin; i++) {
    const cx = ((i + 0.5) / nWin) * W, ww = m(1.3), wh = m(1.7), y0 = Y(2.75);
    if (door >= 0 && Math.abs(cx - door * PXM) < m(1.2)) continue;
    const sky = g.createLinearGradient(0, y0, 0, y0 + wh); sky.addColorStop(0, "#8fc4f2"); sky.addColorStop(1, "#d8ecfa");
    g.fillStyle = "#efe8d8"; g.fillRect(cx - ww / 2 - m(0.1), y0 - m(0.1), ww + m(0.2), wh + m(0.25));
    g.fillStyle = sky; g.fillRect(cx - ww / 2, y0, ww, wh);
    g.fillStyle = "rgba(120,170,90,0.9)"; g.beginPath(); g.ellipse(cx - ww * 0.15, y0 + wh * 0.85, ww * 0.45, wh * 0.28, 0, 0, 7); g.fill();
    g.fillStyle = "rgba(255,255,255,0.55)"; g.beginPath(); g.moveTo(cx - ww / 2 + m(0.15), y0 + wh); g.lineTo(cx - ww / 2 + m(0.45), y0); g.lineTo(cx - ww / 2 + m(0.6), y0); g.lineTo(cx - ww / 2 + m(0.3), y0 + wh); g.fill();
    g.strokeStyle = "#f4efe2"; g.lineWidth = m(0.07); g.strokeRect(cx - ww / 2, y0, ww, wh);
    g.beginPath(); g.moveTo(cx, y0); g.lineTo(cx, y0 + wh); g.moveTo(cx - ww / 2, y0 + wh * 0.45); g.lineTo(cx + ww / 2, y0 + wh * 0.45); g.stroke();
    g.strokeStyle = "#241726"; g.lineWidth = 4; g.strokeRect(cx - ww / 2 - m(0.1), y0 - m(0.1), ww + m(0.2), wh + m(0.25));
  }
  if (door >= 0) {
    const dx = m(door), dw = m(1.0), dh = m(2.15);
    g.fillStyle = "#8a5a34"; g.fillRect(dx - dw / 2, Y(2.15), dw, dh);
    g.strokeStyle = "rgba(40,20,10,0.6)"; g.lineWidth = 4; g.strokeRect(dx - dw / 2 + m(0.12), Y(2.0), dw - m(0.24), m(0.8)); g.strokeRect(dx - dw / 2 + m(0.12), Y(1.0), dw - m(0.24), m(0.8));
    g.fillStyle = "#e8c45a"; g.beginPath(); g.arc(dx + dw / 2 - m(0.14), Y(1.05), m(0.04), 0, 7); g.fill();
    g.strokeStyle = "#241726"; g.lineWidth = 5; g.strokeRect(dx - dw / 2, Y(2.15), dw, dh);
  }
  if (s.frames) for (let i = 0; i < 2; i++) {
    const x = r() * (W - m(1)) + m(0.3), y = Y(2.1 + r() * 0.3);
    g.fillStyle = "#7a5a3e"; g.fillRect(x, y, m(0.5), m(0.4)); g.fillStyle = ["#9cc0a0", "#d8b48a", "#a0b0d8"][i % 3]; g.fillRect(x + m(0.05), y + m(0.05), m(0.4), m(0.3));
  }
});
const floorTex = (key: string, s: RoomStyle) => ctex("fl" + key, 512, 512, (g, r) => {
  if (s.floor === "planks") {
    for (let y = 0, row = 0; y < 512; y += 64, row++) for (let x = -(row % 3) * 120; x < 512; x += 360) {
      g.fillStyle = r() < 0.5 ? s.floorA : s.floorB; g.fillRect(x, y, 360, 64);
      for (let k = 0; k < 6; k++) { g.strokeStyle = "rgba(60,30,10,0.12)"; g.lineWidth = 2; g.beginPath(); g.moveTo(x, y + 8 + k * 9 + r() * 4); g.lineTo(x + 360, y + 8 + k * 9 + r() * 4); g.stroke(); }
      g.fillStyle = "rgba(40,20,10,0.55)"; g.fillRect(x, y, 3, 64); g.fillRect(x, y, 360, 3);
    }
  } else {
    const n = s.floor === "tiles" ? 8 : 4, c = 512 / n;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      g.fillStyle = (i + j) % 2 ? s.floorA : s.floorB; g.fillRect(i * c, j * c, c, c);
      g.fillStyle = `rgba(0,0,0,${0.03 + r() * 0.05})`; g.fillRect(i * c, j * c, c, c);
    }
    g.strokeStyle = "rgba(40,30,30,0.35)"; g.lineWidth = 3;
    for (let k = 0; k <= n; k++) { g.beginPath(); g.moveTo(k * c, 0); g.lineTo(k * c, 512); g.moveTo(0, k * c); g.lineTo(512, k * c); g.stroke(); }
  }
});

/** a room; `doors` = { wall: "back" | "left" | "right" | "front", at: metres along the wall }; returns the ceiling batch (built without shadows) */
export const room = (b: Batch, ceil: Batch, key: string, cx: number, cz: number, w: number, d: number, h: number, s: RoomStyle,
  doors: { wall: "back" | "left" | "right" | "front"; at: number }[] = []) => {
  const x0 = cx - w / 2, x1 = cx + w / 2, z0 = cz - d / 2, z1 = cz + d / 2, T = 0.25;
  const door = (wall: string) => doors.find((q) => q.wall === wall)?.at ?? -1;
  const inner = (k: string, wm: number, nWin: number, dd: number) => lam(`in${key}${k}`, () => ({ map: wallTex(key + k, wm, h, s, nWin, dd) }));
  const nWin = s.windows ?? 2;
  b.add(quad(V(x0, 0, z0), V(x1, 0, z0), V(x1, h, z0), V(x0, h, z0)), inner("back", w, 0, door("back")));
  b.add(quad(V(x1, 0, z1), V(x0, 0, z1), V(x0, h, z1), V(x1, h, z1)), inner("front", w, nWin, door("front")));
  b.add(quad(V(x0, 0, z1), V(x0, 0, z0), V(x0, h, z0), V(x0, h, z1)), inner("left", d, nWin > 0 ? 1 : 0, door("left")));
  b.add(quad(V(x1, 0, z0), V(x1, 0, z1), V(x1, h, z1), V(x1, h, z0)), inner("right", d, nWin > 0 ? 1 : 0, door("right")));
  b.add(quadUp(x0, x1, z0, z1, w / 3, d / 3, 0.01), lam(`fl${key}`, () => ({ map: floorTex(key, s) })));
  // outside: facade on all four sides, a cornice line, a flat roof
  const fac = (k: string, wm: number) => lam(`out${key}${k}`, () => ({ map: facadeHD(`out${key}${k}`, wm, h + 0.6, { wall: s.outer, shutter: "#2f5f6a", brick: s.brick, door: k === "front" }) }));
  b.add(quad(V(x0 - T, 0, z1 + T), V(x1 + T, 0, z1 + T), V(x1 + T, h + 0.6, z1 + T), V(x0 - T, h + 0.6, z1 + T)), fac("front", w + 2 * T));
  b.add(quad(V(x1 + T, 0, z0 - T), V(x0 - T, 0, z0 - T), V(x0 - T, h + 0.6, z0 - T), V(x1 + T, h + 0.6, z0 - T)), fac("back", w + 2 * T));
  b.add(quad(V(x0 - T, 0, z0 - T), V(x0 - T, 0, z1 + T), V(x0 - T, h + 0.6, z1 + T), V(x0 - T, h + 0.6, z0 - T)), fac("side", d + 2 * T));
  b.add(quad(V(x1 + T, 0, z1 + T), V(x1 + T, 0, z0 - T), V(x1 + T, h + 0.6, z0 - T), V(x1 + T, h + 0.6, z1 + T)), fac("side", d + 2 * T));
  ceil.add(quadUp(x0 - T, x1 + T, z0 - T, z1 + T, 1, 1, h + 0.6), lam("roofFlat", () => ({ color: "#8f8a86" })));
  ceil.add(quadUp(x0, x1, z0, z1, 1, 1, h).rotateX(0).scale(1, 1, 1), lam("ceilWhite", () => ({ color: "#f2ede2", side: THREE.BackSide })));
  void rng;
};
