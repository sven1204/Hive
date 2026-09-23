import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { api } from "../../lib/api";
import { idOf } from "./messageUtils";

/* Actions sur les conversations : archivage, désarchivage, suppression définitive (groupes),
   blocage / déblocage. Les échecs s'affichent dans un message inline (plus d'alert()). */
export default function useConversationActions({ lists, activeKeyRef, closeConversation }) {
  const { t } = useTranslation();
  const {
    setConversations, setArchivedConvs, setArchivedDMs, setBlockedUserIds,
    loadGroupConvs, loadConversations, loadArchived,
  } = lists;
  const [actionError, setActionError] = useState("");

  // Le message d'erreur disparaît seul
  useEffect(() => {
    if (!actionError) return undefined;
    const timer = setTimeout(() => setActionError(""), 6000);
    return () => clearTimeout(timer);
  }, [actionError]);

  const fail = useCallback((err) => {
    console.error(err);
    setActionError(t("messages.actionError"));
  }, [t]);

  const archive = useCallback(async (item) => {
    try {
      if (item.type === "group") {
        await api(`/messages/group/${item.id}/archive`, { method: "PUT" });
        await loadGroupConvs();
      } else {
        await api(`/messages/dm/${item.id}/archive`, { method: "PUT" });
        setConversations((prev) => prev.filter((c) => idOf(c.partner) !== item.id));
      }
      loadArchived();
      if (activeKeyRef.current === item.key) closeConversation();
    } catch (err) { fail(err); }
  }, [loadGroupConvs, loadArchived, setConversations, activeKeyRef, closeConversation, fail]);

  const unarchive = useCallback(async (item) => {
    try {
      if (item.type === "group") {
        await api(`/messages/group/${item.id}/unarchive`, { method: "PUT" });
        setArchivedConvs((prev) => prev.filter((gc) => idOf(gc.conversation) !== item.id));
        await loadGroupConvs();
      } else {
        await api(`/messages/dm/${item.id}/unarchive`, { method: "PUT" });
        setArchivedDMs((prev) => prev.filter((d) => idOf(d.partner) !== item.id));
        await loadConversations();
      }
    } catch (err) { fail(err); }
  }, [setArchivedConvs, setArchivedDMs, loadGroupConvs, loadConversations, fail]);

  // Suppression définitive (seules les discussions de groupe archivées sont concernées côté serveur)
  const deleteGroup = useCallback(async (item) => {
    try {
      await api(`/messages/group/${item.id}`, { method: "DELETE" });
      setArchivedConvs((prev) => prev.filter((gc) => idOf(gc.conversation) !== item.id));
      if (activeKeyRef.current === item.key) closeConversation();
    } catch (err) { fail(err); }
  }, [setArchivedConvs, activeKeyRef, closeConversation, fail]);

  const block = useCallback(async (target) => {
    try {
      await api(`/messages/block/${idOf(target)}`, { method: "POST" });
      const bid = idOf(target);
      setBlockedUserIds((prev) => new Set([...prev, bid]));
      setConversations((prev) => prev.filter((c) => idOf(c.partner) !== bid));
      closeConversation();
    } catch (err) { fail(err); }
  }, [setBlockedUserIds, setConversations, closeConversation, fail]);

  const unblock = useCallback(async (target) => {
    try {
      await api(`/messages/block/${idOf(target)}`, { method: "DELETE" });
      setBlockedUserIds((prev) => { const next = new Set(prev); next.delete(idOf(target)); return next; });
    } catch (err) { fail(err); }
  }, [setBlockedUserIds, fail]);

  return { actionError, setActionError, fail, archive, unarchive, deleteGroup, block, unblock };
}
