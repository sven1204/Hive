import data from "../captures.json";
import type { Fmt } from "./format";

export type Box = { x: number; y: number; w: number; h: number };
type PageData = { file: string; boxes: Record<string, Box | Box[] | null> };
type FmtData = { viewport: { width: number; height: number }; scale: number; pages: Record<string, PageData> };

const all = data as unknown as Record<Fmt, FmtData>;

export function capture(fmt: Fmt, page: string) {
  const f = all[fmt];
  const p = f.pages[page];
  return { ...p, viewport: f.viewport };
}

export function box(fmt: Fmt, page: string, key: string, index = 0): Box {
  const b = all[fmt].pages[page].boxes[key];
  if (!b) throw new Error(`Box introuvable : ${fmt}/${page}/${key}`);
  return Array.isArray(b) ? b[index] : b;
}
