// Short renderer for the full-3D style: one three.js scene holding every set (each in its own group, far apart),
// soft key light with PCF soft shadows, hemisphere fill, ACES tone mapping, fog, per-shot camera. Cuts are
// whip-pans (fast camera yaw + motion blur) and the frame gets a film look: warm grade, vignette, rounded black
// border. Captions show one spoken word at a time, timed to the voice's word timestamps.
import React, { useMemo } from "react";
import * as THREE from "three";
import { AbsoluteFill, getInputProps, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useFrame, useThree } from "@react-three/fiber";
import { BlendFunction, BloomEffect, EffectComposer, EffectPass, RenderPass, ToneMappingEffect, ToneMappingMode } from "postprocessing";

export type V3 = [number, number, number];
export type Cam = { pos: V3; look: V3; fov?: number; roll?: number };
export type Mood = { sky: [string, string]; fog: [string, number, number]; sun: V3; sunCol: string; sunK: number; hemi: [string, string, number]; shadowR?: number; exposure?: number };
export type SetUpdate = (f: number, t: number) => void;
export type Built = { root: THREE.Object3D; update?: SetUpdate; mood: Mood; center: V3 };
export type Shot3 = { a: number; b: number; set: string; cam: (f: number) => Cam; whip?: number /** direction of the whip into this shot */; dof?: number; thermal?: boolean; cut?: boolean /** hard cut, no whip */ };
export type Word = { w: string; s: number; e: number; radio?: boolean };
export type Def3 = { build: () => Record<string, Built>; shots: Shot3[]; words: Word[]; total: number; captionY?: number; bloom?: number; overlay?: (f: number) => React.ReactNode; grade?: (f: number) => string };

const FPS = 30;
export const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
export const sm = (x: number) => { const u = Math.max(0, Math.min(1, x)); return u * u * (3 - 2 * u); };
export const L3 = (a: V3, b: V3, u: number): V3 => [lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u)];
/** slow push between two framings over the shot (eased) */
export const push = (p0: V3, l0: V3, p1: V3, l1: V3, a: number, b: number, fov = 40) => (f: number): Cam => {
  const u = sm((f - a) / Math.max(1, b - a)) * 0.6 + ((f - a) / Math.max(1, b - a)) * 0.4;
  return { pos: L3(p0, p1, u), look: L3(l0, l1, u), fov };
};

const skyMat = (top: string, bot: string) => new THREE.ShaderMaterial({
  side: THREE.BackSide, depthWrite: false, fog: false,
  uniforms: { top: { value: new THREE.Color(top) }, bot: { value: new THREE.Color(bot) } },
  vertexShader: "varying vec3 vp; void main(){ vp = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }",
  fragmentShader: "uniform vec3 top; uniform vec3 bot; varying vec3 vp; void main(){ float h = clamp(vp.y*1.6+0.15,0.0,1.0); gl_FragColor = vec4(mix(bot, top, pow(h,0.8)),1.0); }",
});

const WHIP = 5; // frames on each side of a cut
const shotAt = (shots: Shot3[], f: number) => { for (const s of shots) if (f < s.b) return s; return shots[shots.length - 1]; };

class Rig {
  scene = new THREE.Scene(); sets: Record<string, Built>; sky = new THREE.Mesh(new THREE.SphereGeometry(900, 32, 16), skyMat("#88b", "#ddd"));
  sun = new THREE.DirectionalLight("#fff", 2); hemi = new THREE.HemisphereLight("#fff", "#888", 1);
  constructor(def: Def3) {
    this.sets = def.build();
    for (const k in this.sets) this.scene.add(this.sets[k].root);
    this.scene.add(this.sky, this.hemi, this.sun, this.sun.target);
    this.sun.castShadow = true; this.sun.shadow.mapSize.set(4096, 4096); this.sun.shadow.bias = -0.0004; this.sun.shadow.normalBias = 0.02;
    this.sun.shadow.radius = 4;
    this.scene.fog = new THREE.Fog("#fff", 10, 100);
  }
  thermalOn = false;
  heatMats = new Map<number, THREE.MeshBasicMaterial>();
  thermal(root: THREE.Object3D, on: boolean) {
    if (on === this.thermalOn) return; this.thermalOn = on;
    const walk = (o: THREE.Object3D, heat: number) => {
      const h = (o.userData.heat as number | undefined) ?? heat;
      const m = o as THREE.Mesh;
      if (m.isMesh) {
        if (on) {
          if (!m.userData.mat0) m.userData.mat0 = m.material;
          const mm = m.material as THREE.Material & { transparent?: boolean; opacity?: number; blending?: THREE.Blending };
          if (mm.blending === THREE.AdditiveBlending) { m.visible = false; m.userData.hid = true; }
          const lvl = Math.round(h * 40);
          let hm = this.heatMats.get(lvl);
          if (!hm) { const v = Math.pow(h, 1.2); hm = new THREE.MeshBasicMaterial({ color: new THREE.Color(v, v, v), fog: false }); this.heatMats.set(lvl, hm); }
          m.material = hm;
        } else if (m.userData.mat0) { m.material = m.userData.mat0; if (m.userData.hid) { m.visible = true; m.userData.hid = false; } }
      }
      for (const c of o.children) walk(c, h);
    };
    walk(root, 0.14);
  }
  apply(def: Def3, f: number, cam: THREE.PerspectiveCamera) {
    const s = shotAt(def.shots, f), B = this.sets[s.set], m = B.mood, t = f / FPS;
    for (const k in this.sets) this.sets[k].root.visible = k === s.set;
    this.thermal(B.root, !!s.thermal); this.sky.visible = !s.thermal;
    this.scene.background = s.thermal ? new THREE.Color("#141414") : null;
    B.update?.(f, t);
    const c = s.cam(f);
    cam.position.set(...c.pos); cam.up.set(0, 1, 0); cam.lookAt(...c.look);
    // whip pan around cuts: extra yaw that accelerates into the cut and decelerates out of it
    const into = f - s.a, out = s.b - f, dir = s.whip ?? 1;
    let yaw = 0;
    if (into < WHIP && s.a > 0 && !s.cut) yaw = dir * Math.pow(1 - into / WHIP, 2) * 0.55;
    const next = def.shots[def.shots.indexOf(s) + 1];
    if (next && !next.cut && out <= WHIP) yaw = -(next.whip ?? 1) * Math.pow(1 - out / (WHIP + 1), 2) * 0.55;
    cam.rotateY(yaw); if (c.roll) cam.rotateZ(c.roll);
    cam.fov = c.fov ?? 40; cam.near = 0.05; cam.far = 1200; cam.updateProjectionMatrix(); cam.updateMatrixWorld();
    this.sky.position.copy(cam.position);
    (this.sky.material as THREE.ShaderMaterial).uniforms.top.value.set(m.sky[0]);
    (this.sky.material as THREE.ShaderMaterial).uniforms.bot.value.set(m.sky[1]);
    const fog = this.scene.fog as THREE.Fog; fog.color.set(s.thermal ? "#1a1a1a" : m.fog[0]); fog.near = s.thermal ? 30 : m.fog[1]; fog.far = s.thermal ? 400 : m.fog[2];
    this.hemi.color.set(m.hemi[0]); this.hemi.groundColor.set(m.hemi[1]); this.hemi.intensity = m.hemi[2];
    this.sun.color.set(m.sunCol); this.sun.intensity = m.sunK;
    // shadow frustum centred on what the camera looks at
    const look = new THREE.Vector3(...c.look), R = m.shadowR ?? 14;
    const sd = new THREE.Vector3(...m.sun).normalize();
    this.sun.position.copy(look).addScaledVector(sd, 60); this.sun.target.position.copy(look); this.sun.target.updateMatrixWorld();
    const sc = this.sun.shadow.camera; sc.left = -R; sc.right = R; sc.top = R; sc.bottom = -R; sc.near = 1; sc.far = 160; sc.updateProjectionMatrix();
    return { yaw, exposure: m.exposure ?? 1 };
  }
}

const Inner: React.FC<{ def: Def3 }> = ({ def }) => {
  const f = useCurrentFrame();
  const { camera, gl, scene, size } = useThree();
  const rig = useMemo(() => new Rig(def), [def]);
  const comp = useMemo(() => {
    if (!def.bloom) return null;
    const c = new EffectComposer(gl, { multisampling: 4, frameBufferType: THREE.HalfFloatType });
    c.addPass(new RenderPass(rig.scene, camera));
    c.addPass(new EffectPass(camera, new BloomEffect({ blendFunction: BlendFunction.ADD, intensity: def.bloom, luminanceThreshold: 0.75, luminanceSmoothing: 0.25, mipmapBlur: true, radius: 0.7 }), new ToneMappingEffect({ mode: ToneMappingMode.ACES_FILMIC })));
    return c;
  }, [def, gl, rig, camera]);
  useMemo(() => comp?.setSize(size.width, size.height), [comp, size]);
  gl.toneMapping = comp ? THREE.NoToneMapping : THREE.ACESFilmicToneMapping; gl.outputColorSpace = THREE.SRGBColorSpace;
  gl.shadowMap.enabled = true; gl.shadowMap.type = THREE.PCFShadowMap;
  const r = rig.apply(def, f, camera as THREE.PerspectiveCamera);
  gl.toneMappingExposure = r.exposure;
  scene.background = null;
  useFrame(() => { if (comp) comp.render(); }, comp ? 1 : 0);
  return <primitive object={rig.scene} dispose={null} />;
};

const dpr = () => (getInputProps() as { post?: { dpr?: number } }).post?.dpr;

const Caption: React.FC<{ words: Word[]; f: number; y: number }> = ({ words, f, y }) => {
  const t = f / FPS;
  let cur: Word | null = null;
  for (let i = 0; i < words.length; i++) {
    const w = words[i], nx = words[i + 1];
    const end = nx && nx.s - w.e < 0.6 ? nx.s : w.e + 0.25;
    if (t >= w.s - 0.03 && t < end) { cur = w; break; }
  }
  if (!cur) return null;
  const pop = Math.min(1, (t - cur.s + 0.03) / 0.08);
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: y, textAlign: "center", fontFamily: "Inter", fontWeight: 800, fontSize: 50,
      color: cur.radio ? "#ffe08a" : "#fff", fontStyle: cur.radio ? "italic" : "normal", letterSpacing: 0.5, transform: `scale(${0.92 + 0.08 * pop})`,
      textShadow: "0 0 3px #000, 0 0 3px #000, 0 2px 6px rgba(0,0,0,0.85)", WebkitTextStroke: "1.5px #111" }}>{cur.w}</div>
  );
};

export const makeShort3 = (def: Def3) => {
  const Comp: React.FC = () => {
    const f = useCurrentFrame();
    const s = shotAt(def.shots, f), into = f - s.a, out = s.b - f;
    const nx = def.shots[def.shots.indexOf(s) + 1];
    const near = Math.min(s.a > 0 && !s.cut ? into : 99, nx && !nx.cut ? out : 99);
    const blur = near < WHIP ? (1 - near / WHIP) * 9 : 0;
    return (
      <AbsoluteFill style={{ background: "#000" }}>
        <AbsoluteFill style={{ left: 30, right: 30, top: 70, bottom: 70, borderRadius: 44, overflow: "hidden", background: "#000" }}>
          <AbsoluteFill style={{ filter: `blur(${blur.toFixed(2)}px) ${def.grade ? def.grade(f) : "saturate(0.92) contrast(1.04) sepia(0.06)"}` }}>
            <ThreeCanvas width={1020} height={1780} {...(dpr() ? { dpr: dpr() } : {})} shadows gl={{ antialias: true, powerPreference: "high-performance" }} camera={{ fov: 40 }}>
              <Inner def={def} />
            </ThreeCanvas>
          </AbsoluteFill>
          {/* vignette */}
          <AbsoluteFill style={{ background: "radial-gradient(ellipse 75% 62% at 50% 48%, rgba(0,0,0,0) 55%, rgba(10,6,4,0.55) 100%)" }} />
          {def.overlay?.(f)}
          <Caption words={def.words} f={f} y={def.captionY ?? 1080} />
        </AbsoluteFill>
      </AbsoluteFill>
    );
  };
  return Comp;
};
