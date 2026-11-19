// Generic short: one three.js world per canvas, posed per frame from the short's def. Post chain (manual composer):
// RenderPass -> InkPass -> lens blur pre -> lens blur main -> [bloom + NEUTRAL tone map + grade], MSAA 4.
// Two canvases stay mounted all the time (base + crossfade layer): the second one only renders during a crossfade,
// so no world is ever rebuilt mid-render (rebuilding one made a frame time out in the Köpenick render).
import React, { useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import { AbsoluteFill, continueRender, delayRender, getInputProps, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useFrame, useThree } from "@react-three/fiber";
import { BlendFunction, BloomEffect, ToneMappingEffect, ToneMappingMode, EffectComposer, RenderPass, EffectPass, Pass } from "postprocessing";
import { World, loadKit, ShortDef } from "./world";
import { InkPass, noInkFallback } from "./ink";
import { LensBlur } from "./lensblur";
import { GradeEffect, GRADES, GRADE_STRENGTH, gradeFor } from "./grade";
import { Kit } from "./build";

const makeBloom = () => {
  const b = new BloomEffect({ blendFunction: BlendFunction.ADD, intensity: 0.5, luminanceThreshold: 1.0, luminanceSmoothing: 0.2, mipmapBlur: true, levels: 6, radius: 0.6 });
  const mip = b.mipmapBlurPass, setSize = mip.setSize.bind(mip);
  mip.setSize = (w: number, h: number) => setSize(Math.round((1920 * w) / Math.max(h, 1)), 1920);
  return b;
};
const fwd = new THREE.Vector3(), fpt = new THREE.Vector3();
const dpr = () => (getInputProps() as { post?: { dpr?: number } }).post?.dpr;

const Inner: React.FC<{ def: ShortDef; id: number; kit: Kit; active: boolean }> = ({ def, id, kit, active }) => {
  const f = useCurrentFrame();
  const { camera, scene, gl, size } = useThree();
  const world = useMemo(() => new World(def, kit), [def, kit]);
  const cam = camera as THREE.PerspectiveCamera;
  const fx = useMemo(() => ({
    ink: new InkPass(scene, cam), lens: new LensBlur({ maxCoC: 24, nearScale: 1.2 }), bloom: makeBloom(),
    tone: new ToneMappingEffect({ mode: ToneMappingMode.NEUTRAL }), grade: new GradeEffect(GRADES.day, GRADE_STRENGTH.day),
  }), [cam, scene]);
  const comp = useMemo(() => {
    const c = new EffectComposer(gl, { multisampling: 4, frameBufferType: THREE.HalfFloatType });
    c.addPass(new RenderPass(scene, cam));
    c.addPass(fx.ink as unknown as Pass);
    c.addPass(new EffectPass(cam, fx.lens.pre));
    c.addPass(new EffectPass(cam, fx.lens.main));
    c.addPass(new EffectPass(cam, fx.bloom, fx.tone, fx.grade));
    return c;
  }, [gl, scene, cam, fx]);
  useMemo(() => comp.setSize(size.width, size.height), [comp, size]);
  useEffect(() => () => fx.ink.dispose(), [fx]);
  if (active) {
    const target = world.update(id, f, cam, scene);
    noInkFallback(world.root);
    const d = def.tl.dofAt(f);
    cam.getWorldDirection(fwd);
    if (d.focus) fpt.set(...d.focus(f)); else fpt.copy(target);
    fx.lens.focus = Math.max(0.3, fpt.sub(cam.position).dot(fwd));
    fx.lens.cInf = d.cInf;
    gradeFor(fx.grade, def.tl.SHOTS[id - 1].light);
  }
  useFrame(() => { if (active) comp.render(); }, 1);
  return <primitive object={world.root} dispose={null} />;
};

const ShotView: React.FC<{ def: ShortDef; id: number; kit: Kit; alpha: number; active: boolean }> = ({ def, id, kit, alpha, active }) => (
  <AbsoluteFill style={{ opacity: alpha }}>
    <ThreeCanvas width={1080} height={1920} {...(dpr() ? { dpr: dpr() } : {})} shadows gl={{ antialias: false, stencil: false, powerPreference: "high-performance" }}
      camera={{ fov: 40, near: 0.3, far: 1500 }}>
      <Inner def={def} id={id} kit={kit} active={active} />
    </ThreeCanvas>
  </AbsoluteFill>
);

export const makeShort = (def: ShortDef) => {
  const Comp: React.FC = () => {
    const f = useCurrentFrame();
    const [kit, setKit] = useState<Kit | null>(null);
    const [handle] = useState(() => delayRender("kit"));
    useEffect(() => { loadKit().then((k) => { setKit(k); continueRender(handle); }); }, [handle]);
    if (!kit) return null;
    const L = def.tl.layersAt(f), F = def.tl.FLASH_AT;
    let flash = 0;
    for (const g of [F, ...(def.tl.FLASHES ?? [])]) if (g >= 0 && f >= g && f < g + 4) flash = Math.max(flash, [1, 0.75, 0.45, 0.2][f - g]);
    const over = L[1];
    return (
      <AbsoluteFill style={{ background: def.bg ?? "#cfe3f2" }}>
        <ShotView def={def} id={L[0].id} kit={kit} alpha={1} active />
        <ShotView def={def} id={over ? over.id : L[0].id} kit={kit} alpha={over ? over.alpha : 0} active={!!over} />
        {flash > 0 && <AbsoluteFill style={{ background: "#ffffff", opacity: flash }} />}
      </AbsoluteFill>
    );
  };
  return Comp;
};
