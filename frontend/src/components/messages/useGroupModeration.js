import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { api } from "../../lib/api";
import { getUserName, idOf } from "./messageUtils";

/* Groupe de projet : propriétaire, retrait d'un membre (raison + note), notation à la clôture.
   Les notes déjà données sont mémorisées par conversation pour survivre à la navigation. */
export default function useGroupModeration({ activeGroup, myId, setGroupConvs, loadGroupConvs }) {
  const { t } = useTranslation();
  const [kick, setKick] = useState(null); // { target, reason, rating, error, loading }
  const [rating, setRating] = useState(null); // { target, score, comment, error, loading }
  const [ratedByConv, setRatedByConv] = useState({});
  const [kickedUsers, setKickedUsers] = useState(() => new Set());

  const convId = idOf(activeGroup);
  const projectId = idOf(activeGroup?.projectId);
  const ownerId = idOf(activeGroup?.projectId?.ownerId);
  const isOwner = !!ownerId && ownerId === myId;
  const isClosed = activeGroup?.projectId?.status === "closed";
  const participants = useMemo(() => activeGroup?.participants || [], [activeGroup]);
  const ratedUsers = (convId && ratedByConv[convId]) || new Set();

  const openKick = (target) => setKick({ target, reason: "", rating: 0, error: "", loading: false });
  const openRating = (target) => setRating({ target, score: 0, comment: "", error: "", loading: false });

  const submitKick = async () => {
    if (!kick || kick.rating === 0) return;
    const target = kick.target;
    setKick((k) => ({ ...k, loading: true, error: "" }));
    try {
      await api(`/projects/${projectId}/participants/${target._id}`, {
        method: "DELETE",
        body: JSON.stringify({ reason: kick.reason, rating: kick.rating }),
      });
      setKickedUsers((prev) => new Set([...prev, target._id]));
      setKick(null);
      setGroupConvs((prev) => prev.map((gc) => (idOf(gc.conversation) === convId
        ? { ...gc, conversation: { ...gc.conversation, participants: gc.conversation.participants?.filter((p) => idOf(p) !== target._id) } }
        : gc)));
      loadGroupConvs().catch(console.error);
    } catch (err) {
      setKick((k) => (k ? { ...k, loading: false, error: err.message || t("messages.actionError") } : k));
    }
  };

  const submitRating = async () => {
    if (!rating || !rating.score) return;
    setRating((r) => ({ ...r, loading: true, error: "" }));
    try {
      await api(`/projects/${projectId}/rate`, {
        method: "POST",
        body: JSON.stringify({ targetId: rating.target._id, score: rating.score, comment: rating.comment }),
      });
      setRatedByConv((prev) => ({ ...prev, [convId]: new Set([...(prev[convId] || []), rating.target._id]) }));
      setRating(null);
    } catch (err) {
      setRating((r) => (r ? { ...r, loading: false, error: err.message || t("messages.actionError") } : r));
    }
  };

  // Membres à noter : participants (hors moi et membres retirés) + propriétaire s'il n'y figure pas
  const closedMembers = useMemo(() => {
    if (!isClosed) return [];
    const seen = new Set([myId]);
    const list = [];
    participants.forEach((p) => {
      const id = idOf(p);
      if (seen.has(id) || kickedUsers.has(id)) return;
      seen.add(id);
      list.push({ id, user: p, name: getUserName(p, t("messages.userFallback")) });
    });
    if (ownerId && !seen.has(ownerId)) {
      list.unshift({ id: ownerId, user: { _id: ownerId }, name: t("messages.userFallback") });
    }
    return list;
  }, [isClosed, participants, myId, kickedUsers, ownerId, t]);

  return {
    projectId, isOwner, isClosed, participants, ratedUsers, closedMembers,
    kick, setKick, openKick, submitKick,
    rating, setRating, openRating, submitRating,
  };
}
