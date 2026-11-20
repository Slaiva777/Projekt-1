import React from "react";
import { Composition } from "remotion";
import { KoepenickShort, KOEPENICK_FRAMES } from "./videos/koepenick/Koepenick";
import { GeldShort, GELD_FRAMES } from "./videos/geld";
import { GedaechtnisShort, GEDAECHTNIS_FRAMES } from "./videos/gedaechtnis";
import { GesundheitShort, GESUNDHEIT_FRAMES } from "./videos/gesundheit";
import { GlaubeShort, GLAUBE_FRAMES } from "./videos/glaube";
import { EmuShort, EMU_FRAMES } from "./videos/emu";
import { StyleTest, STYLE_FRAMES } from "./videos/geld3";
import { EinsatzShort, EINSATZ_FRAMES } from "./videos/einsatz";

const C = { fps: 30, width: 1080, height: 1920 };
export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="KoepenickShort" component={KoepenickShort} durationInFrames={KOEPENICK_FRAMES} {...C} />
    <Composition id="GeldShort" component={GeldShort} durationInFrames={GELD_FRAMES} {...C} />
    <Composition id="GedaechtnisShort" component={GedaechtnisShort} durationInFrames={GEDAECHTNIS_FRAMES} {...C} />
    <Composition id="GesundheitShort" component={GesundheitShort} durationInFrames={GESUNDHEIT_FRAMES} {...C} />
    <Composition id="GlaubeShort" component={GlaubeShort} durationInFrames={GLAUBE_FRAMES} {...C} />
    <Composition id="EinsatzShort" component={EinsatzShort} durationInFrames={EINSATZ_FRAMES} {...C} />
    <Composition id="StyleTest" component={StyleTest} durationInFrames={STYLE_FRAMES} {...C} />
    <Composition id="EmuShort" component={EmuShort} durationInFrames={EMU_FRAMES} {...C} />
  </>
);
