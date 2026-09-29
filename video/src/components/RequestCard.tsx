import React from "react";
import { COLORS, PEOPLE, PERSON_COLORS, REQUEST_MESSAGE, TEXT } from "../config";
import { mix } from "../lib/anim";

/* Carte « Demande de participation » (reprise fidèle du style de l'app), en version nette.
   u = unité (px) ; accepted 0→1 fait passer « Accepter » à « Accepté » sur toute la largeur. */
export const REQUEST_CARD = { w: 360, pad: 18, avatar: 46, btnH: 44, gap: 10 };

export function requestCardHeight(u: number) {
  const c = REQUEST_CARD;
  return (c.pad * 2 + c.avatar + 42 + c.gap + c.btnH) * u;
}

/** Centre du bouton Accepter (relatif au coin haut-gauche de la carte). */
export function acceptCenter(u: number) {
  const c = REQUEST_CARD;
  const inner = c.w - c.pad * 2;
  return { x: (c.pad + (inner - c.gap) / 4) * u, y: requestCardHeight(u) - (c.pad + c.btnH / 2) * u };
}

const Check: React.FC<{ size: number; color: string }> = ({ size, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.8} strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </svg>
);

export const RequestCard: React.FC<{ u: number; accepted: number; press: number }> = ({ u, accepted, press }) => {
  const c = REQUEST_CARD;
  const ines = PEOPLE.ines;
  const inner = c.w - c.pad * 2;
  const half = (inner - c.gap) / 2;
  const acceptW = mix(half, inner, accepted);
  return (
    <div
      style={{
        width: c.w * u,
        height: requestCardHeight(u),
        padding: c.pad * u,
        borderRadius: 18 * u,
        background: COLORS.surface,
        border: `${1.2 * u}px solid ${COLORS.border}`,
        position: "relative",
        boxSizing: "border-box",
      }}
    >
      <div style={{ display: "flex", gap: 12 * u, alignItems: "flex-start" }}>
        <div
          style={{
            width: c.avatar * u,
            height: c.avatar * u,
            borderRadius: 999,
            flexShrink: 0,
            background: `linear-gradient(145deg, #B87A33, ${PERSON_COLORS.ines})`,
            color: "#fff",
            fontWeight: 700,
            fontSize: 17 * u,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {ines.firstName[0]}
          {ines.lastName[0]}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 17 * u, fontWeight: 700, color: COLORS.text, lineHeight: 1.25 }}>{ines.displayName}</div>
          <div style={{ fontSize: 13.5 * u, fontWeight: 500, color: COLORS.muted, lineHeight: 1.4, marginTop: 3 * u, fontStyle: "italic" }}>
            « {REQUEST_MESSAGE} »
          </div>
        </div>
      </div>
      <div style={{ position: "absolute", left: c.pad * u, right: c.pad * u, bottom: c.pad * u, height: c.btnH * u }}>
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: acceptW * u,
            height: c.btnH * u,
            borderRadius: 12 * u,
            background: accepted > 0.5 ? COLORS.accentHover : COLORS.accent,
            color: "#fff",
            fontWeight: 700,
            fontSize: 15.5 * u,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 7 * u,
            transform: `scale(${press})`,
            boxShadow: `0 ${6 * u}px ${16 * u}px rgba(${COLORS.glow}, ${0.25 + accepted * 0.2})`,
            zIndex: 2,
          }}
        >
          <Check size={17 * u} color="#fff" />
          {accepted > 0.5 ? TEXT.accepted : "Accepter"}
        </div>
        <div
          style={{
            position: "absolute",
            right: 0,
            top: 0,
            width: half * u,
            height: c.btnH * u,
            borderRadius: 12 * u,
            border: `${1.2 * u}px solid ${COLORS.border}`,
            background: COLORS.bg,
            color: COLORS.muted,
            fontWeight: 600,
            fontSize: 15.5 * u,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: 1 - accepted,
            boxSizing: "border-box",
          }}
        >
          Refuser
        </div>
      </div>
    </div>
  );
};

/* État « Accepté » posé sur la ligne de demande de la capture (remplace Accepter + Refuser). */
export const AcceptedOverlay: React.FC<{ accept: { x: number; y: number; w: number; h: number }; decline: { x: number; w: number }; kk: number; opacity: number }> = ({
  accept,
  decline,
  kk,
  opacity,
}) => (
  <div
    style={{
      position: "absolute",
      left: accept.x * kk,
      top: accept.y * kk,
      width: (decline.x + decline.w - accept.x) * kk,
      height: accept.h * kk,
      borderRadius: 9 * kk,
      background: COLORS.accentHover,
      color: "#fff",
      fontWeight: 700,
      fontSize: 13 * kk,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 5 * kk,
      opacity,
    }}
  >
    <Check size={13 * kk} color="#fff" />
    {TEXT.accepted}
  </div>
);

/* Pastille de confirmation « Inès a rejoint Night Owls » */
export const JoinedToast: React.FC<{ size: number }> = ({ size }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: size * 0.45,
      padding: `${size * 0.32}px ${size * 0.75}px ${size * 0.32}px ${size * 0.32}px`,
      borderRadius: 999,
      background: COLORS.text,
      color: COLORS.surface,
      fontSize: size,
      fontWeight: 700,
      whiteSpace: "nowrap",
      boxShadow: `0 20px 50px rgba(${COLORS.shadow}, 0.28)`,
    }}
  >
    <span
      style={{
        width: size * 1.6,
        height: size * 1.6,
        borderRadius: 999,
        background: COLORS.accent,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Check size={size * 0.95} color="#fff" />
    </span>
    {TEXT.joinedToast}
  </div>
);
