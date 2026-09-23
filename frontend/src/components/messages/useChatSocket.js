import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../../lib/api";
import { dmKey, groupKey, idOf, sendErrorKey } from "./messageUtils";

const SEND_TIMEOUT_MS = 10000;
const TYPING_TIMEOUT_MS = 3000;

const appendUnique = (msg) => (prev) =>
  prev.some((m) => idOf(m) === idOf(msg)) ? prev : [...prev, msg];

/* Temps réel de la messagerie : messages entrants, édition / suppression, frappe,
   retrait d'un projet, reconnexion, erreurs d'envoi (message_error + délai dépassé).
   Chaque écouteur est retiré avec sa propre référence (ne touche pas ceux des autres composants). */
export default function useChatSocket({
  socket,
  myId,
  activeKey,
  activeGroup,
  lists,
  setMessages,
  refreshActiveMessages,
  setDrafts,
  onKicked,
}) {
  const [typing, setTyping] = useState(null); // { key, from }
  const [sendError, setSendError] = useState(null); // { key, messageKey }
  const pendingRef = useRef([]); // envois en attente de confirmation : [{ key, content, timer }]
  const typingTimerRef = useRef(null);

  const activeKeyRef = useRef(activeKey);
  const activeGroupRef = useRef(activeGroup);
  useEffect(() => { activeKeyRef.current = activeKey; }, [activeKey]);
  useEffect(() => { activeGroupRef.current = activeGroup; }, [activeGroup]);

  // Échec d'un envoi : texte restauré (ajouté si le champ n'est plus vide) + message d'erreur
  const failPending = useCallback((messageKey, entry) => {
    const pending = entry || pendingRef.current[0];
    if (!pending) {
      if (activeKeyRef.current) setSendError({ key: activeKeyRef.current, messageKey });
      return;
    }
    clearTimeout(pending.timer);
    pendingRef.current = pendingRef.current.filter((p) => p !== pending);
    setDrafts((prev) => {
      const current = prev[pending.key] || "";
      return { ...prev, [pending.key]: current.trim() ? `${current}\n${pending.content}` : pending.content };
    });
    setSendError({ key: pending.key, messageKey });
  }, [setDrafts]);

  const resolvePending = useCallback((key) => {
    const index = pendingRef.current.findIndex((p) => p.key === key);
    if (index === -1) return;
    clearTimeout(pendingRef.current[index].timer);
    pendingRef.current = pendingRef.current.filter((_, i) => i !== index);
  }, []);

  const trackSend = useCallback((key, content) => {
    const entry = { key, content, timer: null };
    entry.timer = setTimeout(() => failPending("messages.sendErrorGeneric", entry), SEND_TIMEOUT_MS);
    pendingRef.current = [...pendingRef.current, entry];
  }, [failPending]);

  useEffect(() => () => {
    pendingRef.current.forEach((p) => clearTimeout(p.timer));
    clearTimeout(typingTimerRef.current);
  }, []);

  const showTyping = useCallback((key, from) => {
    setTyping({ key, from });
    clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => setTyping(null), TYPING_TIMEOUT_MS);
  }, []);

  const clearTypingFrom = useCallback((from) => {
    setTyping((prev) => (prev && prev.from === from ? null : prev));
  }, []);

  useEffect(() => {
    if (!socket) return undefined;
    const {
      setConversations, setGroupConvs, setArchivedConvs, setArchivedDMs,
      listsRef, loadGroupConvs, loadLists, markGroupRead,
    } = lists;
    const isVisible = () => typeof document === "undefined" || document.visibilityState !== "hidden";

    const onNewMessage = (msg) => {
      const mine = idOf(msg.senderId) === myId;
      const partner = mine ? msg.receiverId : msg.senderId;
      const partnerId = idOf(partner);
      const key = dmKey(partnerId);
      const isActive = activeKeyRef.current === key;
      const readNow = isActive && isVisible();

      if (isActive) {
        setMessages(appendUnique(msg));
        if (!mine) clearTypingFrom(partnerId);
        if (!mine && readNow) api(`/messages/${partnerId}/read`, { method: "PUT" }).catch(console.error);
      }
      if (mine) resolvePending(key);

      if (listsRef.current.archivedDMs.some((d) => idOf(d.partner) === partnerId)) {
        setArchivedDMs((prev) => prev.map((d) => (idOf(d.partner) === partnerId ? { ...d, lastMessage: msg } : d)));
        return;
      }
      setConversations((prev) => {
        const existing = prev.find((c) => idOf(c.partner) === partnerId);
        const unread = readNow ? 0 : (existing?.unread || 0) + (mine ? 0 : 1);
        return [
          { partner: existing?.partner || partner, lastMessage: msg, unread },
          ...prev.filter((c) => idOf(c.partner) !== partnerId),
        ];
      });
    };

    const onNewGroupMessage = ({ conversationId, message }) => {
      const convId = String(conversationId);
      const key = groupKey(convId);
      if (activeKeyRef.current === key) {
        setMessages(appendUnique(message));
        clearTypingFrom(idOf(message.senderId));
        if (isVisible()) markGroupRead(convId, message.createdAt);
      }
      if (!message.isSystem && idOf(message.senderId) === myId) resolvePending(key);

      const update = (prev) => prev.map((gc) => (idOf(gc.conversation) === convId ? { ...gc, lastMessage: message } : gc));
      const { groupConvs, archivedConvs } = listsRef.current;
      if (groupConvs.some((gc) => idOf(gc.conversation) === convId)) setGroupConvs(update);
      else if (archivedConvs.some((gc) => idOf(gc.conversation) === convId)) setArchivedConvs(update);
      else loadGroupConvs().catch(console.error);
    };

    const patchMessage = (msgId, patch) => {
      const apply = (m) => (idOf(m) === msgId ? { ...m, ...patch } : m);
      setMessages((prev) => prev.map(apply));
      const patchLast = (prev) => prev.map((c) => (c.lastMessage && idOf(c.lastMessage) === msgId ? { ...c, lastMessage: apply(c.lastMessage) } : c));
      setConversations(patchLast);
      setGroupConvs(patchLast);
    };

    const onDeleted = ({ msgId }) => patchMessage(String(msgId), { deleted: true });
    const onEdited = ({ msgId, content }) => patchMessage(String(msgId), { content, edited: true });
    const onConversationUpdated = () => { loadGroupConvs().catch(console.error); };

    const onKickedFromProject = ({ projectId } = {}) => {
      loadGroupConvs().catch(console.error);
      const group = activeGroupRef.current;
      if (!activeKeyRef.current?.startsWith("grp-")) return;
      const activeProjectId = idOf(group?.projectId);
      if (!projectId || !activeProjectId || activeProjectId === String(projectId)) onKicked();
    };

    const onTyping = ({ from }) => {
      if (activeKeyRef.current === dmKey(from)) showTyping(dmKey(from), String(from));
    };
    const onTypingGroup = ({ from, conversationId }) => {
      const key = groupKey(conversationId);
      if (activeKeyRef.current === key) showTyping(key, String(from));
    };

    const onMessageError = ({ message } = {}) => failPending(sendErrorKey(message));

    // Reconnexion (ex. réveil du serveur) : rafraîchissement silencieux
    const onConnect = () => {
      loadLists(true);
      refreshActiveMessages();
      if (activeKeyRef.current?.startsWith("grp-")) {
        socket.emit("join_conversation", activeKeyRef.current.slice(4));
      }
    };

    const handlers = {
      new_message: onNewMessage,
      new_group_message: onNewGroupMessage,
      message_deleted: onDeleted,
      message_edited: onEdited,
      conversation_updated: onConversationUpdated,
      kicked_from_project: onKickedFromProject,
      typing: onTyping,
      typing_group: onTypingGroup,
      message_error: onMessageError,
      connect: onConnect,
    };
    Object.entries(handlers).forEach(([event, handler]) => socket.on(event, handler));
    return () => {
      Object.entries(handlers).forEach(([event, handler]) => socket.off(event, handler));
    };
  }, [socket, myId, lists, setMessages, refreshActiveMessages, resolvePending, failPending, showTyping, clearTypingFrom, onKicked]);

  return { typing, sendError, setSendError, trackSend };
}
