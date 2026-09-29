import { useVideoConfig } from "remotion";

export type Fmt = "mobile" | "desktop";

/** Format courant + réglages de mise en page propres à chaque format. */
export function useFormat() {
  const { width, height } = useVideoConfig();
  const fmt: Fmt = height > width ? "mobile" : "desktop";
  const m = fmt === "mobile";
  return {
    fmt,
    m,
    W: width,
    H: height,
    // Typo
    hero: m ? 86 : 78, // titres principaux
    sub: m ? 44 : 40, // labels d'étape
    // Grappe d'alvéoles
    hexR: m ? 118 : 104,
    clusterPos: m ? { x: width / 2, y: 820 } : { x: 1430, y: 540 },
    textPos: m ? { x: width / 2, y: 1420 } : { x: 130, y: 540 },
  };
}
