import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../../lib/api";
import { idOf } from "./messageUtils";

/* Listes de la messagerie (DM, groupes, archives, bloqués) et dernier passage dans les groupes.
   Le « dernier passage » d'un groupe est stocké dans localStorage : hive:lastRead:{myId}:{convId}. */
export default function useConversationLists(myId) {
  const [conversations, setConversations] = useState([]);
  const [groupConvs, setGroupConvs] = useState([]);
  const [listStatus, setListStatus] = useState("loading");
  const [archivedConvs, setArchivedConvs] = useState([]);
  const [archivedDMs, setArchivedDMs] = useState([]);
  const [blockedUserIds, setBlockedUserIds] = useState(() => new Set());
  const [lastReadMap, setLastReadMap] = useState({});

  // Copies en ref pour les gestionnaires socket (évite de les réabonner à chaque rendu)
  const listsRef = useRef({ conversations, groupConvs, archivedConvs, archivedDMs });
  useEffect(() => {
    listsRef.current = { conversations, groupConvs, archivedConvs, archivedDMs };
  }, [conversations, groupConvs, archivedConvs, archivedDMs]);

  const storageKey = useCallback((convId) => `hive:lastRead:${myId}:${convId}`, [myId]);

  const readStored = useCallback((convId) => {
    try { return localStorage.getItem(storageKey(convId)); } catch { return null; }
  }, [storageKey]);

  const markGroupRead = useCallback((convId, date) => {
    const iso = new Date(date || Date.now()).toISOString();
    const previous = readStored(convId);
    if (previous && previous > iso) return;
    try { localStorage.setItem(storageKey(convId), iso); } catch { /* stockage indisponible */ }
    setLastReadMap((prev) => ({ ...prev, [convId]: iso }));
  }, [readStored, storageKey]);

  const getLastRead = useCallback(
    (convId) => lastReadMap[convId] || readStored(convId),
    [lastReadMap, readStored]
  );

  // Premier passage : pas de faux « nouveau » sur les groupes jamais suivis
  const seedLastRead = useCallback((list) => {
    list.forEach(({ conversation, lastMessage }) => {
      const convId = idOf(conversation);
      if (!readStored(convId)) {
        try {
          localStorage.setItem(storageKey(convId), new Date(lastMessage?.createdAt || Date.now()).toISOString());
        } catch { /* stockage indisponible */ }
      }
    });
  }, [readStored, storageKey]);

  const loadGroupConvs = useCallback(() => (
    api("/messages/group/mine")
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        seedLastRead(list);
        setGroupConvs(list);
      })
  ), [seedLastRead]);

  const loadConversations = useCallback(() => (
    api("/messages/conversations").then((data) => setConversations(Array.isArray(data) ? data : []))
  ), []);

  const loadArchived = useCallback(() => {
    api("/messages/group/archived")
      .then((data) => setArchivedConvs(Array.isArray(data) ? data : []))
      .catch(console.error);
    api("/messages/dm/archived")
      .then((data) => setArchivedDMs(Array.isArray(data) ? data : []))
      .catch(console.error);
  }, []);

  /* Chargement des listes principales. silent : pas d'état de chargement (reconnexion) */
  const loadLists = useCallback((silent = false) => {
    if (!silent) setListStatus("loading");
    return Promise.all([loadConversations(), loadGroupConvs()])
      .then(() => setListStatus("ready"))
      .catch((err) => {
        console.error(err);
        if (!silent) setListStatus("error");
      });
  }, [loadConversations, loadGroupConvs]);

  useEffect(() => {
    loadLists();
    loadArchived();
    api("/messages/blocked")
      .then((list) => setBlockedUserIds(new Set((Array.isArray(list) ? list : []).map((u) => idOf(u)))))
      .catch(console.error);
  }, [loadLists, loadArchived]);

  return {
    conversations, setConversations,
    groupConvs, setGroupConvs,
    listStatus,
    archivedConvs, setArchivedConvs,
    archivedDMs, setArchivedDMs,
    blockedUserIds, setBlockedUserIds,
    listsRef,
    loadLists, loadGroupConvs, loadConversations, loadArchived,
    markGroupRead, getLastRead,
  };
}
