import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";
import { FONT } from "../config";

/* Satoshi en local (public/fonts), chargé avant le rendu de chaque image. */
export const fontsReady = Promise.all(
  ["400", "500", "700", "900"].map((weight) =>
    loadFont({ family: FONT, url: staticFile(`fonts/Satoshi-${weight}.woff2`), weight, format: "woff2" }),
  ),
);
