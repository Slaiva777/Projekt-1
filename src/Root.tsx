import React from "react";
import { Composition } from "remotion";
import { KoepenickShort, KOEPENICK_FRAMES } from "./videos/koepenick/Koepenick";

export const RemotionRoot: React.FC = () => (
  <Composition id="KoepenickShort" component={KoepenickShort} durationInFrames={KOEPENICK_FRAMES} fps={30} width={1080} height={1920} />
);
