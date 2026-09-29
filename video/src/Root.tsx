import React from "react";
import { Composition } from "remotion";
import { DURATION_S, FPS } from "./config";
import { Main } from "./Main";
import "./lib/fonts";

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="HiveMobile" component={Main} durationInFrames={DURATION_S * FPS} fps={FPS} width={1080} height={1920} />
    <Composition id="HiveDesktop" component={Main} durationInFrames={DURATION_S * FPS} fps={FPS} width={1920} height={1080} />
  </>
);
