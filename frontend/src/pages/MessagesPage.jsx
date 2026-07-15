import { useEffect, useRef, useState, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  MessageSquare, Send, Users, MoreVertical, Trash2, Pencil,
  Ban, UserMinus, Star, X, ChevronRight, ShieldOff, ArrowLeft, Check,
  Archive, ArchiveRestore
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import UserAvatar from "../components/UserAvatar";
import classes from "./MessagesPage.module.css";

function getUserName(user) {
  return (
    user?.displayName ||
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    "Utilisateur"
  );
}

function formatTime(date) {
  if (!date) return "";
  const d = new Date(date);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) {
    return d.toLocaleTimeString("fr-CH", { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString("fr-CH", { day: "2-digit", month: "short" });
}

function EditArea({ value, onChange, onSave, onCancel }) {
  const ref = useRef(null);
  useEffect(() => { ref.current?.focus(); ref.current?.select(); }, []);
  return (
    <textarea
      ref={ref}
      className={classes.editInput}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSave(); }
        if (e.key === "Escape") onCancel();
      }}
      rows={Math.max(1, value.split("\n").length)}
    />
  );
}

function StarRating({ value, onChange }) {
  return (
    <div className={classes.starRow}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          className={`${classes.starBtn} ${n <= value ? classes.starActive : ""}`}
          onClick={() => onChange(n)}
        >
          <Star size={20} fill={n <= value ? "currentColor" : "none"} />
        </button>
      ))}
    </div>
  );
}

export default function MessagesPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const socket = useSocket();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const withUserId = searchParams.get("with");
  const withGroupId = searchParams.get("group");

  const myId = user?._id || user?.id || "";

  const [conversations, setConversations] = useState([]);
  const [activePartner, setActivePartner] = useState(null);
  const [messages, setMessages] = useState([]);
  const [blockedUserIds, setBlockedUserIds] = useState(new Set());

  const [groupConvs, setGroupConvs] = useState([]);
  const [activeGroup, setActiveGroup] = useState(null);
  const [groupMessages, setGroupMessages] = useState([]);

  const [draft, setDraft] = useState("");
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [typingFrom, setTypingFrom] = useState(null);

  // Panel participants (groupe)
  const [showParticipants, setShowParticipants] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);

  // Kick modal
  const [kickTarget, setKickTarget] = useState(null); // { _id, name }
  const [kickReason, setKickReason] = useState("");
  const [kickRating, setKickRating] = useState(0);
  const [kickError, setKickError] = useState("");
  const [kickLoading, setKickLoading] = useState(false);

  // Notation fin de projet
  const [ratingTarget, setRatingTarget] = useState(null);
  const [ratingScore, setRatingScore] = useState(0);
  const [ratingComment, setRatingComment] = useState("");
  const [ratingLoading, setRatingLoading] = useState(false);
  const [ratedUsers, setRatedUsers] = useState(new Set());
  const [kickedUsers, setKickedUsers] = useState(new Set());

  // Conversations archivées (groupes)
  const [archivedConvs, setArchivedConvs] = useState([]);
  // Conversations DM archivées
  const [archivedDMs, setArchivedDMs] = useState([]);
  const [showArchived, setShowArchived] = useState(false);

  // Message options menu
  const [menuMsg, setMenuMsg] = useState(null);
  const [editingMsg, setEditingMsg] = useState(null);
  const [editDraft, setEditDraft] = useState("");
  const menuRef = useRef(null);

  // Block confirm
  const [blockTarget, setBlockTarget] = useState(null);

  const socketRef = useRef(null);
  const activePartnerRef = useRef(null);
  const activeGroupRef = useRef(null);
  const messagesEndRef = useRef(null);
  const typingTimerRef = useRef(null);
  const loadedPartnerIdRef = useRef(null);
  const loadedGroupIdRef = useRef(null);
  const ratedUsersMapRef = useRef({});

  useEffect(() => { activePartnerRef.current = activePartner; }, [activePartner]);
  useEffect(() => { activeGroupRef.current = activeGroup; }, [activeGroup]);

  // Restore per-conversation rated set so ratings survive navigation
  useEffect(() => {
    if (activeGroup) {
      setRatedUsers(ratedUsersMapRef.current[activeGroup._id] || new Set());
    }
  }, [activeGroup]);

  // Close menu on outside click
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuMsg(null);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const loadGroupConvs = useCallback(() => {
    api("/messages/group/mine")
      .then((data) => setGroupConvs(Array.isArray(data) ? data : []))
      .catch(console.error);
  }, []);

  const loadArchivedConvs = useCallback(() => {
    api("/messages/group/archived")
      .then((data) => setArchivedConvs(Array.isArray(data) ? data : []))
      .catch(console.error);
  }, []);

  const loadArchivedDMs = useCallback(() => {
    api("/messages/dm/archived")
      .then((data) => setArchivedDMs(Array.isArray(data) ? data : []))
      .catch(console.error);
  }, []);

  const handleArchive = async (convId) => {
    try {
      await api(`/messages/group/${convId}/archive`, { method: "PUT" });
      loadGroupConvs();
      loadArchivedConvs();
      if (activeGroup?._id === convId) setActiveGroup(null);
    } catch (err) { alert(err.message); }
  };

  const handleUnarchive = async (convId) => {
    try {
      await api(`/messages/group/${convId}/unarchive`, { method: "PUT" });
      loadGroupConvs();
      loadArchivedConvs();
    } catch (err) { alert(err.message); }
  };

  const handleArchiveDM = async (partnerId) => {
    try {
      await api(`/messages/dm/${partnerId}/archive`, { method: "PUT" });
      const partnerId_ = partnerId.toString();
      setConversations((prev) => prev.filter((c) => c.partner._id.toString() !== partnerId_));
      loadArchivedDMs();
      if (activePartner?._id?.toString() === partnerId_) {
        setActivePartner(null);
        setMessages([]);
        navigate("/messages", { replace: true });
      }
    } catch (err) { alert(err.message); }
  };

  const handleUnarchiveDM = async (partnerId) => {
    try {
      await api(`/messages/dm/${partnerId}/unarchive`, { method: "PUT" });
      setArchivedDMs((prev) => prev.filter((d) => d.partner._id.toString() !== partnerId.toString()));
      api("/messages/conversations").then(setConversations).catch(console.error);
    } catch (err) { alert(err.message); }
  };

  const handleDeleteConv = async (convId) => {
    if (!window.confirm(t("messages.deleteConvConfirm"))) return;
    try {
      await api(`/messages/group/${convId}`, { method: "DELETE" });
      setArchivedConvs((prev) => prev.filter((c) => c.conversation._id !== convId));
      if (activeGroup?._id === convId) setActiveGroup(null);
    } catch (err) { alert(err.message); }
  };

  // Sync shared socket to ref (pour les emit existants)
  useEffect(() => {
    socketRef.current = socket;
  }, [socket]);

  // Event listeners
  useEffect(() => {
    if (!socket) return;

    socket.on("new_message", (msg) => {
      const activeId = activePartnerRef.current?._id;
      if (activeId && (msg.senderId._id === activeId || msg.receiverId._id === activeId)) {
        setMessages((prev) => [...prev, msg]);
      }
      setConversations((prev) => {
        const partnerObj =
          msg.senderId._id.toString() === myId.toString()
            ? msg.receiverId
            : msg.senderId;
        const key = partnerObj._id.toString();
        const filtered = prev.filter((c) => c.partner._id.toString() !== key);
        const existing = prev.find((c) => c.partner._id.toString() === key);
        const isActive = activePartnerRef.current?._id?.toString() === key;
        const unread = existing
          ? isActive ? 0 : existing.unread + (msg.receiverId._id.toString() === myId.toString() ? 1 : 0)
          : msg.receiverId._id.toString() === myId.toString() ? 1 : 0;
        return [{ partner: partnerObj, lastMessage: msg, unread }, ...filtered];
      });
    });

    socket.on("new_group_message", ({ conversationId, message: msg }) => {
      if (activeGroupRef.current?._id?.toString() === conversationId) {
        setGroupMessages((prev) => [...prev, msg]);
      }
      setGroupConvs((prev) =>
        prev.map((gc) =>
          gc.conversation._id.toString() === conversationId
            ? { ...gc, lastMessage: msg }
            : gc
        )
      );
    });

    socket.on("conversation_updated", () => loadGroupConvs());

    socket.on("message_deleted", ({ msgId }) => {
      const del = (prev) => prev.map((m) => m._id?.toString() === msgId ? { ...m, deleted: true, content: "Message supprimé" } : m);
      setMessages(del);
      setGroupMessages(del);
    });

    socket.on("message_edited", ({ msgId, content }) => {
      const upd = (prev) => prev.map((m) => m._id?.toString() === msgId ? { ...m, content, edited: true } : m);
      setMessages(upd);
      setGroupMessages(upd);
    });

    socket.on("kicked_from_project", () => {
      loadGroupConvs();
      setActiveGroup(null);
      navigate("/messages", { replace: true });
    });

    socket.on("typing", ({ from }) => {
      if (from === activePartnerRef.current?._id?.toString()) {
        setTypingFrom(from);
        clearTimeout(typingTimerRef.current);
        typingTimerRef.current = setTimeout(() => setTypingFrom(null), 2000);
      }
    });
    socket.on('typing_group', ({ from, conversationId}) => {
      if (conversationId === activeGroupRef.current?._id?.toString()){
        setTypingFrom(from);
        clearTimeout(typingTimerRef.current);
        typingTimerRef.current = setTimeout(() => setTypingFrom(null), 2000);
      }
    })
    // Refetch conversations après reconnexion (ex: réveil Render)
    socket.on("connect", () => {
      api("/messages/conversations").then(setConversations).catch(console.error);
      loadGroupConvs();
      if (activePartnerRef.current) {
        api(`/messages/${activePartnerRef.current._id}`).then(setMessages).catch(console.error);
      }
    });

    return () => {
      socket.off("new_message");
      socket.off("new_group_message");
      socket.off("conversation_updated");
      socket.off("message_deleted");
      socket.off("message_edited");
      socket.off("kicked_from_project");
      socket.off("typing");
      socket.off("typing_group");
      socket.off("connect");
      clearTimeout(typingTimerRef.current);
    };
  }, [socket, myId, loadGroupConvs, navigate]);

  useEffect(() => {
    api("/messages/conversations").then(setConversations).catch(console.error);
    api("/messages/blocked").then((list) => setBlockedUserIds(new Set(list.map((u) => u._id.toString())))).catch(console.error);
  }, []);

  useEffect(() => { loadGroupConvs(); loadArchivedConvs(); loadArchivedDMs(); }, [loadGroupConvs, loadArchivedConvs, loadArchivedDMs]);

  useEffect(() => {
    if (!withUserId) return;
    const existing = conversations.find((c) => c.partner._id.toString() === withUserId);
    if (existing) { setActivePartner(existing.partner); setActiveGroup(null); setShowSidebar(false); }
    else {
      api(`/user/${withUserId}`)
        .then((profile) => { setActivePartner(profile); setActiveGroup(null); setShowSidebar(false); })
        .catch(console.error);
    }
  }, [withUserId, conversations]);

  useEffect(() => {
    if (!withGroupId) return;
    const existing = groupConvs.find((gc) => gc.conversation._id.toString() === withGroupId);
    if (existing) { setActiveGroup(existing.conversation); setActivePartner(null); setShowSidebar(false); }
  }, [withGroupId, groupConvs]);

  useEffect(() => {
    if (!activePartner) { loadedPartnerIdRef.current = null; return; }
    const id = activePartner._id.toString();
    if (id === loadedPartnerIdRef.current) return;
    loadedPartnerIdRef.current = id;
    setLoadingMsgs(true);
    api(`/messages/${activePartner._id}`).then(setMessages).catch(console.error).finally(() => setLoadingMsgs(false));
    api(`/messages/${activePartner._id}/read`, { method: "PUT" }).catch(console.error);
    setConversations((prev) =>
      prev.map((c) => c.partner._id.toString() === id ? { ...c, unread: 0 } : c)
    );
  }, [activePartner]);

  useEffect(() => {
    if (!activeGroup) { loadedGroupIdRef.current = null; return; }
    const id = activeGroup._id.toString();
    if (id === loadedGroupIdRef.current) return;
    loadedGroupIdRef.current = id;
    setLoadingMsgs(true);
    api(`/messages/group/${activeGroup._id}`).then(setGroupMessages).catch(console.error).finally(() => setLoadingMsgs(false));
    socketRef.current?.emit("join_conversation", activeGroup._id);
  }, [activeGroup]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, groupMessages]);

  const openDirect = useCallback((partner) => {
    setMessages([]);
    setLoadingMsgs(true);
    setActivePartner(partner);
    setActiveGroup(null);
    setShowParticipants(false);
    setShowSidebar(false);
    navigate(`/messages?with=${partner._id}`, { replace: true });
  }, [navigate]);

  const openGroup = useCallback((conv) => {
    setGroupMessages([]);
    setLoadingMsgs(true);
    setActiveGroup(conv);
    setActivePartner(null);
    setShowSidebar(false);
    navigate(`/messages?group=${conv._id}`, { replace: true });
  }, [navigate]);

  const sendMessage = useCallback(() => {
    const content = draft.trim();
    if (!content || !socketRef.current) return;
    if (activeGroup) {
      socketRef.current.emit("send_group_message", { conversationId: activeGroup._id, content });
    } else if (activePartner) {
      socketRef.current.emit("send_message", { to: activePartner._id, content });
    } else return;
    setDraft("");
  }, [draft, activePartner, activeGroup]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const handleDraftChange = (e) => {
    setDraft(e.target.value);
    if (activePartner && socketRef.current) {
      socketRef.current.emit("typing", { to: activePartner._id });
    }else if(activeGroup){
      socketRef.current.emit("typing_group", { conversationId: activeGroup._id });
    }
  };

  const handleDeleteMsg = async (msgId) => {
    setMenuMsg(null);
    try {
      await api(`/messages/${msgId}/delete`, { method: "DELETE" });
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditSave = async (msgId) => {
    if (!editDraft.trim()) return;
    try {
      await api(`/messages/${msgId}/edit`, {
        method: "PUT",
        body: JSON.stringify({ content: editDraft.trim() }),
      });
      const update = (prev) =>
        prev.map((m) => m._id?.toString() === msgId ? { ...m, content: editDraft.trim(), edited: true } : m);
      setMessages(update);
      setGroupMessages(update);
    } catch (err) {
      console.error(err);
    } finally {
      setEditingMsg(null);
      setEditDraft("");
    }
  };

  const handleBlockConfirm = async () => {
    if (!blockTarget) return;
    try {
      await api(`/messages/block/${blockTarget._id}`, { method: "POST" });
      const bid = blockTarget._id.toString();
      setBlockedUserIds((prev) => new Set([...prev, bid]));
      setBlockTarget(null);
      setActivePartner(null);
      setMessages([]);
      setConversations((prev) => prev.filter((c) => c.partner._id.toString() !== bid));
      navigate("/messages", { replace: true });
    } catch (err) {
      console.error(err);
    }
  };

  const handleKick = async () => {
    if (!kickTarget || kickRating === 0) return;
    setKickLoading(true);
    setKickError("");
    try {
      const projectId = activeGroup?.projectId?._id || activeGroup?.projectId;
      await api(`/projects/${projectId}/participants/${kickTarget._id}`, {
        method: "DELETE",
        body: JSON.stringify({ reason: kickReason, rating: kickRating }),
      });
      setKickedUsers((prev) => new Set([...prev, kickTarget._id]));
      setKickTarget(null);
      setKickReason("");
      setKickRating(0);
      setKickError("");
      // Refresh group conv participants
      loadGroupConvs();
      if (activeGroup) {
        setActiveGroup((prev) => prev ? {
          ...prev,
          participants: prev.participants?.filter((p) => (p._id || p).toString() !== kickTarget._id),
        } : prev);
      }
    } catch (err) {
      setKickError(err.message || "Erreur serveur");
    } finally {
      setKickLoading(false);
    }
  };

  const handleRate = async () => {
    if (!ratingTarget || !ratingScore) return;
    setRatingLoading(true);
    try {
      const projectId = activeGroup?.projectId?._id || activeGroup?.projectId;
      await api(`/projects/${projectId}/rate`, {
        method: "POST",
        body: JSON.stringify({ targetId: ratingTarget._id, score: ratingScore, comment: ratingComment }),
      });
      setRatedUsers((prev) => {
        const next = new Set([...prev, ratingTarget._id.toString()]);
        if (activeGroup) ratedUsersMapRef.current[activeGroup._id] = next;
        return next;
      });
      setRatingTarget(null);
      setRatingScore(0);
      setRatingComment("");
    } catch (err) {
      alert(err.message || "Erreur");
    } finally {
      setRatingLoading(false);
    }
  };

  const activeMessages = activeGroup ? groupMessages : messages;
  const hasActive = activePartner || activeGroup;
  const isPartnerBlocked = !!activePartner && blockedUserIds.has(activePartner._id.toString());
  const activeName = activeGroup
    ? (activeGroup.projectTitle || "Groupe projet")
    : activePartner ? getUserName(activePartner) : "";

  const groupProjectId = activeGroup?.projectId?._id || activeGroup?.projectId;
  const groupOwnerId = activeGroup?.projectId?.ownerId?.toString?.() || activeGroup?.projectId?.ownerId;
  const isGroupOwner = !!groupOwnerId && groupOwnerId === myId;

  return (
    <div className={classes.layout}>
      {/* Sidebar */}
      <aside className={`${classes.sidebar} ${!showSidebar ? classes.sidebarHidden : ""}`}>
        <div className={classes.sidebarHead}>
          <span className={classes.sidebarEyebrow}>{t("messages.title")}</span>
          <h2 className={classes.sidebarTitle}>{t("messages.conversations")}</h2>
        </div>

        {conversations.length > 0 && (
          <>
            <p className={classes.sectionLabel}>{t("messages.direct")}</p>
            <ul className={classes.convList}>
              {conversations.map(({ partner, lastMessage, unread }) => (
                <li key={partner._id} className={classes.groupConvRow}>
                  <button
                    type="button"
                    className={`${classes.convItem} ${!activeGroup && activePartner?._id?.toString() === partner._id?.toString() ? classes.convActive : ""}`}
                    onClick={() => openDirect(partner)}
                  >
                    <UserAvatar user={partner} className={classes.avatar} imageClassName={classes.avatarImg} fallbackClassName={classes.avatarFallback} alt={getUserName(partner)} />
                    <div className={classes.convMeta}>
                      <span className={classes.convName}>{getUserName(partner)}</span>
                      <span className={classes.convLast}>
                        {lastMessage?.content?.slice(0, 40)}{lastMessage?.content?.length > 40 ? "…" : ""}
                      </span>
                    </div>
                    <div className={classes.convRight}>
                      <span className={classes.convTime}>{formatTime(lastMessage?.createdAt)}</span>
                      {unread > 0 && <span className={classes.unreadBadge}>{unread > 9 ? "9+" : unread}</span>}
                    </div>
                  </button>
                  <button
                    type="button"
                    className={classes.archiveBtn}
                    onClick={() => handleArchiveDM(partner._id)}
                    title={t("messages.archiveConv")}
                  >
                    <Archive size={14} />
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}

        {groupConvs.length > 0 && (
          <>
            <p className={classes.sectionLabel}>{t("messages.groups")}</p>
            <ul className={classes.convList}>
              {groupConvs.map(({ conversation, lastMessage }) => (
                <li key={conversation._id} className={classes.groupConvRow}>
                  <button
                    type="button"
                    className={`${classes.convItem} ${classes.convItemGroup} ${activeGroup?._id?.toString() === conversation._id?.toString() ? classes.convActive : ""}`}
                    onClick={() => openGroup(conversation)}
                  >
                    <div className={`${classes.avatar} ${classes.groupIcon}`}><Users size={18} /></div>
                    <div className={classes.convMeta}>
                      <span className={classes.convName}>{conversation.projectTitle || t("messages.groupDefault")}</span>
                      <span className={classes.convLast}>
                        {lastMessage
                          ? `${getUserName(lastMessage.senderId)}: ${lastMessage.content?.slice(0, 30)}${lastMessage.content?.length > 30 ? "…" : ""}`
                          : t("messages.startDiscussion")}
                      </span>
                    </div>
                    <div className={classes.convRight}>
                      <span className={classes.convTime}>{formatTime(lastMessage?.createdAt)}</span>
                    </div>
                  </button>
                  <button
                    type="button"
                    className={classes.archiveBtn}
                    onClick={() => handleArchive(conversation._id)}
                    title={t("messages.archiveConv")}
                  >
                    <Archive size={14} />
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}

        {/* Section archives */}
        <button
          type="button"
          className={classes.archivedToggle}
          onClick={() => setShowArchived((v) => !v)}
        >
          <Archive size={13} />
          {t("messages.archives")} {(archivedConvs.length + archivedDMs.length) > 0 && `(${archivedConvs.length + archivedDMs.length})`}
          <ChevronRight size={12} className={showArchived ? classes.chevronOpen : ""} />
        </button>

        {showArchived && (
          <ul className={classes.convList}>
            {archivedConvs.length === 0 && archivedDMs.length === 0 ? (
              <p className={classes.emptyArchive}>{t("messages.noArchived")}</p>
            ) : (
              <>
                {archivedDMs.map(({ partner }) => (
                  <li key={partner._id} className={classes.archivedItem}>
                    <UserAvatar user={partner} className={`${classes.avatar} ${classes.archivedIcon}`} imageClassName={classes.avatarImg} fallbackClassName={classes.avatarFallback} alt={getUserName(partner)} />
                    <span className={classes.archivedName}>{getUserName(partner)}</span>
                    <div className={classes.archivedActions}>
                      <button
                        type="button"
                        className={classes.unarchiveBtn}
                        onClick={() => handleUnarchiveDM(partner._id)}
                        title={t("messages.unarchive")}
                      >
                        <ArchiveRestore size={14} />
                      </button>
                    </div>
                  </li>
                ))}
                {archivedConvs.map(({ conversation }) => (
                  <li key={conversation._id} className={classes.archivedItem}>
                    <div className={`${classes.avatar} ${classes.groupIcon} ${classes.archivedIcon}`}><Users size={16} /></div>
                    <span className={classes.archivedName}>{conversation.projectTitle || t("messages.groupDefault")}</span>
                    <div className={classes.archivedActions}>
                      <button
                        type="button"
                        className={classes.unarchiveBtn}
                        onClick={() => handleUnarchive(conversation._id)}
                        title={t("messages.unarchive")}
                      >
                        <ArchiveRestore size={14} />
                      </button>
                      <button
                        type="button"
                        className={classes.deleteConvBtn}
                        onClick={() => handleDeleteConv(conversation._id)}
                        title={t("messages.deleteConvTitle")}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </li>
                ))}
              </>
            )}
          </ul>
        )}

        {conversations.length === 0 && groupConvs.length === 0 && (
          <p className={classes.empty}>{t("messages.noConversations")}</p>
        )}
      </aside>

      {/* Chat panel */}
      <section className={`${classes.chat} ${showSidebar ? classes.chatHidden : ""}`}>
        {!hasActive ? (
          <div className={classes.placeholder}>
            <MessageSquare size={40} strokeWidth={1.5} />
            <p>{t("messages.selectConvo")}</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <header className={classes.chatHeader}>
              <button type="button" className={classes.backToSidebar} onClick={() => setShowSidebar(true)}>
                <ArrowLeft size={16} />
              </button>
              {activeGroup ? (
                <>
                  <div className={`${classes.headerAvatar} ${classes.headerGroupIcon}`}><Users size={20} /></div>
                  <div className={classes.headerInfo}>
                    <span className={classes.chatHeaderName}>{activeName}</span>
                    <button
                      type="button"
                      className={classes.participantsToggle}
                      onClick={() => setShowParticipants((v) => !v)}
                    >
                      <Users size={13} />
                      {activeGroup.participants?.length || 0} participants
                      <ChevronRight size={12} className={showParticipants ? classes.chevronOpen : ""} />
                    </button>
                  </div>
                  <div className={classes.headerActions}>
                    <button
                      type="button"
                      className={classes.headerActionBtn}
                      onClick={() => navigate(`/projects/${groupProjectId}`)}
                      title="Voir le projet"
                    >
                      Voir le projet →
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <button type="button" className={classes.headerProfileBtn} onClick={() => navigate(`/users/${activePartner._id}`)} title="Voir le profil">
                    <UserAvatar user={activePartner} className={classes.headerAvatar} imageClassName={classes.headerAvatarImg} fallbackClassName={classes.headerAvatarFallback} alt={activeName} />
                    <div className={classes.headerInfo}>
                      <span className={classes.chatHeaderName}>{activeName}</span>
                      {typingFrom
                        ? <span className={classes.typingIndicator}>en train d'écrire…</span>
                        : <span className={classes.headerSub}>{t("messages.viewProfile")} →</span>}
                    </div>
                  </button>
                  <div className={classes.headerActions}>
                    <button
                      type="button"
                      className={`${classes.headerActionBtn} ${classes.headerActionDanger}`}
                      onClick={() => setBlockTarget(activePartner)}
                      title={t("messages.blockUser")}
                    >
                      <Ban size={14} /> {t("messages.block")}
                    </button>
                  </div>
                </>
              )}
            </header>

            <div className={classes.chatBody}>
              {/* Messages */}
              <div className={classes.messages}>
                {loadingMsgs ? (
                  <div className={classes.loadingMsgs}>{t("messages.loading")}</div>
                ) : activeMessages.length === 0 ? (
                  <div className={classes.loadingMsgs}>{t("messages.startConvo")}</div>
                ) : (
                  activeMessages.map((msg) => {
                    const senderId = msg.senderId?._id || msg.senderId;
                    const isMine   = senderId?.toString() === myId.toString();
                    const msgId    = msg._id?.toString();

                    if (msg.isSystem) {
                      return (
                        <div key={msgId} className={classes.systemMsg}>
                          <span>{msg.content}</span>
                        </div>
                      );
                    }

                    const senderIdStr = (msg.senderId?._id || msg.senderId)?.toString();
                    if (!isMine && activeGroup && blockedUserIds.has(senderIdStr)) {
                      return (
                        <div key={msgId} className={classes.msgRow}>
                          <div className={classes.blockedMsgPlaceholder}>
                            Message d'un utilisateur bloqué
                          </div>
                        </div>
                      );
                    }

                    const isMenuOpen = menuMsg === msgId;
                    const isEditing  = editingMsg === msgId;

                    return (
                      <div
                        key={msgId}
                        className={`${classes.msgRow} ${isMine ? classes.msgRowMine : ""}`}
                      >
                        {!isMine && (
                          <button
                            type="button"
                            className={classes.msgAvatarBtn}
                            onClick={() => navigate(`/users/${msg.senderId?._id || msg.senderId}`)}
                          >
                            <UserAvatar user={msg.senderId} className={classes.msgAvatar} imageClassName={classes.msgAvatarImg} fallbackClassName={classes.msgAvatarFallback} alt="" />
                          </button>
                        )}

                        {/* Wrapper bulle + bouton ••• (position: relative) */}
                        <div className={`${classes.bubbleWrap} ${isMine ? classes.bubbleWrapMine : ""}`}>
                          <div className={`${classes.bubble} ${isMine ? classes.bubbleMine : classes.bubbleTheirs} ${msg.deleted ? classes.bubbleDeleted : ""}`}>
                            {activeGroup && !isMine && (
                              <span className={classes.bubbleSender}>{getUserName(msg.senderId)}</span>
                            )}
                            {isEditing ? (
                              <EditArea
                                value={editDraft}
                                onChange={setEditDraft}
                                onSave={() => handleEditSave(msgId)}
                                onCancel={() => { setEditingMsg(null); setEditDraft(""); }}
                              />
                            ) : (
                              <p>
                                {msg.content}
                                {msg.edited && !msg.deleted && <span className={classes.editedTag}> (modifié)</span>}
                              </p>
                            )}
                            <span className={classes.bubbleTime}>{formatTime(msg.createdAt)}</span>
                          </div>

                          {/* Bouton ••• flottant — seulement si une action est disponible */}
                          {!msg.deleted && !isEditing && (isMine || !activeGroup) && (
                            <button
                              type="button"
                              className={`${classes.dotsBtn} ${isMine ? classes.dotsMine : classes.dotsTheirs} ${isMenuOpen ? classes.dotsBtnActive : ""}`}
                              onClick={() => setMenuMsg(isMenuOpen ? null : msgId)}
                            >
                              <MoreVertical size={14} />
                            </button>
                          )}

                          {/* Dropdown */}
                          {isMenuOpen && (
                            <div ref={menuRef} className={`${classes.msgMenu} ${isMine ? classes.msgMenuMine : classes.msgMenuTheirs}`}>
                              {isMine && (
                                <button type="button" className={classes.msgMenuItem}
                                  onClick={() => { setEditingMsg(msgId); setEditDraft(msg.content); setMenuMsg(null); }}>
                                  <Pencil size={13} /> {t("messages.edit")}
                                </button>
                              )}
                              {isMine && (
                                <button type="button" className={`${classes.msgMenuItem} ${classes.msgMenuDanger}`}
                                  onClick={() => handleDeleteMsg(msgId)}>
                                  <Trash2 size={13} /> {t("messages.delete")}
                                </button>
                              )}
                              {!isMine && !activeGroup && (
                                <button type="button" className={`${classes.msgMenuItem} ${classes.msgMenuDanger}`}
                                  onClick={() => { setBlockTarget(msg.senderId); setMenuMsg(null); }}>
                                  <Ban size={13} /> {t("messages.block")}
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
                {typingFrom && (
                  <div className={classes.msgRow}>
                    {activePartner && <UserAvatar user={activePartner} className={classes.msgAvatar} imageClassName={classes.msgAvatarImg} fallbackClassName={classes.msgAvatarFallback} alt="" />}
                    <div className={`${classes.bubble} ${classes.bubbleTheirs} ${classes.typingBubble}`}>
                      <span className={classes.dot} /><span className={classes.dot} /><span className={classes.dot} />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Participants panel (groupe) */}
              {showParticipants && activeGroup && (
                <>
                <div className={classes.participantsOverlay} onClick={() => setShowParticipants(false)} />
                <aside className={classes.participantsPanel}>
                  <div className={classes.panelHead}>
                    <span>Membres</span>
                    <button type="button" className={classes.panelClose} onClick={() => setShowParticipants(false)}>
                      <X size={16} />
                    </button>
                  </div>
                  <ul className={classes.participantsList}>
                    {activeGroup.participants?.map((p) => {
                      const pId = (p._id || p).toString();
                      const isMe = pId === myId;
                      return (
                        <li key={pId} className={classes.participantItem}>
                          <UserAvatar user={p} className={classes.pAvatar} imageClassName={classes.pAvatarImg} fallbackClassName={classes.pAvatarFallback} alt="" />
                          <span className={classes.pName}>
                            {getUserName(p)}
                            {isMe && <span className={classes.pYou}> (moi)</span>}
                          </span>
                          {!isMe && (
                            <div className={classes.pActions}>
                              <button
                                type="button"
                                className={classes.pProfileBtn}
                                onClick={(e) => { e.stopPropagation(); navigate(`/users/${pId}`); }}
                                title={t("messages.viewProfile")}
                              >
                                <ChevronRight size={14} />
                              </button>
                              {isGroupOwner && (
                                <button
                                  type="button"
                                  className={classes.pKickBtn}
                                  onClick={(e) => { e.stopPropagation(); setKickTarget({ _id: pId, name: getUserName(p) }); }}
                                  title={t("messages.kick")}
                                >
                                  <UserMinus size={14} />
                                </button>
                              )}
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </aside>
                </>
              )}
            </div>

            {/* Input ou bandeau clôture */}
            {activeGroup?.projectId?.status === 'closed' ? (
              <div className={classes.closedBanner}>
                <p className={classes.closedBannerTitle}>{t("messages.closedBannerTitle")}</p>
                <p className={classes.closedBannerSub}>{t("messages.closedBannerSub")}</p>
                <ul className={classes.closedRatingList}>
                  {[
                    ...(activeGroup?.projectId?.ownerId?.toString?.() !== myId
                      ? [{ _id: activeGroup.projectId.ownerId, ...activeGroup.projectId }]
                      : []),
                    ...(activeGroup.participants?.filter(p => {
                    const pid = (p._id || p).toString();
                    return pid !== myId && !kickedUsers.has(pid);
                  }) || [])
                  ].map((p) => {
                    const pid = (p._id || p).toString();
                    const name = p.displayName || p.firstName || "Membre";
                    const done = ratedUsers.has(pid);
                    return (
                      <li key={pid} className={classes.closedRatingItem}>
                        <UserAvatar user={p} className={classes.pAvatar} imageClassName={classes.pAvatarImg} fallbackClassName={classes.pAvatarFallback} alt={name} />
                        <span className={classes.pName}>{name}</span>
                        {done
                          ? <span className={classes.ratingDone}><Check size={13} /> {t("messages.ratingDone")}</span>
                          : <button className={classes.rateBtn} onClick={() => { setRatingTarget({ _id: pid, displayName: name }); setRatingScore(0); setRatingComment(""); }}><Star size={13} /> {t("messages.rateBtn")}</button>
                        }
                      </li>
                    );
                  })}
                </ul>
              </div>
            ) : isPartnerBlocked ? (
              <div className={classes.blockedBanner}>
                <span>Vous avez bloqué cet utilisateur — vous ne pouvez plus échanger de messages.</span>
                <button
                  className={classes.unblockInlineBtn}
                  onClick={async () => {
                    await api(`/messages/block/${activePartner._id}`, { method: "DELETE" });
                    setBlockedUserIds((prev) => { const s = new Set(prev); s.delete(activePartner._id.toString()); return s; });
                  }}
                >
                  Débloquer
                </button>
              </div>
            ) : (
              <div className={classes.inputRow}>
                <textarea
                  value={draft}
                  onChange={handleDraftChange}
                  onKeyDown={handleKeyDown}
                  placeholder={t("messages.inputPlaceholder")}
                  className={classes.input}
                  rows={1}
                />
                <button type="button" className={classes.sendBtn} onClick={sendMessage} disabled={!draft.trim()} aria-label="Envoyer">
                  <Send size={18} />
                </button>
              </div>
            )}
          </>
        )}
      </section>

      {/* Modal — Notation membre */}
      {ratingTarget && (
        <div className={classes.modalOverlay} onClick={() => setRatingTarget(null)}>
          <div className={classes.modal} onClick={(e) => e.stopPropagation()}>
            <div className={classes.modalHead}>
              <Star size={18} />
              <h3>Noter {ratingTarget.displayName}</h3>
              <button type="button" className={classes.modalClose} onClick={() => setRatingTarget(null)}><X size={16} /></button>
            </div>
            <div className={classes.starRow}>
              {[1,2,3,4,5].map((n) => (
                <button key={n} type="button" className={`${classes.starBtn} ${ratingScore >= n ? classes.starActive : ""}`} onClick={() => setRatingScore(n)}>
                  <Star size={26} />
                </button>
              ))}
            </div>
            <textarea
              className={classes.kickReasonInput}
              rows={2}
              placeholder="Commentaire optionnel…"
              value={ratingComment}
              onChange={(e) => setRatingComment(e.target.value)}
              maxLength={300}
            />
            <div className={classes.modalActions}>
              <button type="button" className={classes.btnCancel} onClick={() => setRatingTarget(null)}>Annuler</button>
              <button type="button" className={classes.btnKick} onClick={handleRate} disabled={!ratingScore || ratingLoading} style={{ background: 'var(--accent)' }}>
                <Star size={14} /> {ratingLoading ? "Envoi…" : "Envoyer la note"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal — Kick participant */}
      {kickTarget && (
        <div className={classes.modalOverlay} onClick={() => setKickTarget(null)}>
          <div className={classes.modal} onClick={(e) => e.stopPropagation()}>
            <div className={classes.modalHead}>
              <UserMinus size={18} />
              <h3>{t("messages.kickTitle", { name: kickTarget.name })}</h3>
              <button type="button" className={classes.modalClose} onClick={() => setKickTarget(null)}><X size={16} /></button>
            </div>
            <p className={classes.modalSub}>{t("messages.kickDesc")}</p>
            <label className={classes.fieldLabel}>{t("messages.kickReasonLabel")}</label>
            <textarea
              className={classes.kickReasonInput}
              rows={3}
              placeholder={t("messages.kickReasonPlaceholder")}
              value={kickReason}
              onChange={(e) => setKickReason(e.target.value)}
            />
            <label className={classes.fieldLabel}>{t("messages.kickRatingLabel")} <span className={classes.required}>*</span></label>
            <StarRating value={kickRating} onChange={setKickRating} />
            {kickError && <p className={classes.kickError}>{kickError}</p>}
            <div className={classes.modalActions}>
              <button type="button" className={classes.btnCancel} onClick={() => setKickTarget(null)}>{t("messages.cancel")}</button>
              <button
                type="button"
                className={classes.btnKick}
                onClick={handleKick}
                disabled={kickRating === 0 || kickLoading}
              >
                <UserMinus size={14} /> {kickLoading ? t("messages.kickLoading") : t("messages.kickBtn")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal — Block user */}
      {blockTarget && (
        <div className={classes.modalOverlay} onClick={() => setBlockTarget(null)}>
          <div className={classes.modal} onClick={(e) => e.stopPropagation()}>
            <div className={classes.modalHead}>
              <ShieldOff size={18} />
              <h3>{t("messages.blockTitle", { name: getUserName(blockTarget) })}</h3>
              <button type="button" className={classes.modalClose} onClick={() => setBlockTarget(null)}><X size={16} /></button>
            </div>
            <p className={classes.modalSub}>{t("messages.blockDesc")}</p>
            <div className={classes.modalActions}>
              <button type="button" className={classes.btnCancel} onClick={() => setBlockTarget(null)}>{t("messages.cancel")}</button>
              <button type="button" className={classes.btnKick} onClick={handleBlockConfirm}>
                <Ban size={14} /> {t("messages.block")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
