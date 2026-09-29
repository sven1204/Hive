import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { FONT, FPS, T } from "./config";
import { Background, Grain } from "./components/Background";
import { Intro } from "./scenes/Intro";
import { Chat } from "./scenes/Chat";
import { Create } from "./scenes/Create";
import { Team } from "./scenes/Team";
import { Montage } from "./scenes/Montage";
import { Outro } from "./scenes/Outro";
import { Soundtrack } from "./audio/Soundtrack";

/* Rend une scène seulement dans sa fenêtre de temps (secondes absolues, avec marge). */
const Window: React.FC<{ from: number; to: number; children: React.ReactNode }> = ({ from, to, children }) => {
  const s = useCurrentFrame() / FPS;
  return s >= from && s < to ? <>{children}</> : null;
};

export const Main: React.FC = () => (
  <AbsoluteFill style={{ fontFamily: `${FONT}, sans-serif`, overflow: "hidden" }}>
    <Background />
    <Window from={0} to={T.fill.end}>
      <Intro />
    </Window>
    <Window from={T.create.start} to={T.create.end}>
      <Create />
    </Window>
    <Window from={T.team.start} to={T.team.end}>
      <Team />
    </Window>
    <Window from={T.chat.start} to={T.chat.end + 0.35}>
      <Chat />
    </Window>
    <Window from={T.montage.start} to={T.montage.end + 0.15}>
      <Montage />
    </Window>
    <Window from={T.final.start - 0.05} to={T.logo.end}>
      <Outro />
    </Window>
    <Grain />
    <Soundtrack />
  </AbsoluteFill>
);
