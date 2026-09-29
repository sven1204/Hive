import { Pencil, Pin, PinOff, Reply, Trash2 } from "lucide-react";
import { idOf } from "./messageUtils";

/* Réactions proposées (même liste que le serveur) */
export const REACTIONS = ["👍", "❤️", "😂", "🎉", "🔥", "👀"];

/** Réactions regroupées par emoji, dans l'ordre de REACTIONS : [{ emoji, count, mine }] */
export function groupReactions(reactions, myId) {
  const list = Array.isArray(reactions) ? reactions : [];
  return REACTIONS.map((emoji) => {
    const matching = list.filter((r) => r.emoji === emoji);
    return { emoji, count: matching.length, mine: matching.some((r) => idOf(r.userId) === myId) };
  }).filter((r) => r.count > 0);
}

/** Actions d'un message (menu ⋯ desktop et feuille mobile). Vide si aucune action possible. */
export function buildMessageActions({ msg, isMine, isGroup, myId, t, onReact, onReply, onTogglePin, onStartEdit, onDelete }) {
  if (!msg || msg.deleted || msg.isSystem) return [];
  const myReactions = new Set((msg.reactions || []).filter((r) => idOf(r.userId) === myId).map((r) => r.emoji));
  const items = [
    { key: "react", reactions: REACTIONS, selected: myReactions, onReact: (emoji) => onReact(msg, emoji) },
    { key: "reply", label: t("messages.reply"), icon: Reply, onSelect: () => onReply(msg) },
  ];
  if (isGroup) {
    items.push(msg.pinned
      ? { key: "unpin", label: t("messages.unpin"), icon: PinOff, onSelect: () => onTogglePin(msg) }
      : { key: "pin", label: t("messages.pin"), icon: Pin, onSelect: () => onTogglePin(msg) });
  }
  if (isMine) {
    items.push(
      { key: "sep", separator: true },
      { key: "edit", label: t("messages.edit"), icon: Pencil, onSelect: onStartEdit, keepFocus: true },
      { key: "delete", label: t("messages.delete"), icon: Trash2, onSelect: onDelete, danger: true },
    );
  }
  return items;
}
