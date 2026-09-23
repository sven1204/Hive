import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ArrowDown, AlertCircle, RotateCw, Pencil, Trash2 } from "lucide-react";
import MessageBubble from "./MessageBubble";
import { ActionSheet } from "./Dialogs";
import { REDUCED_MOTION_QUERY } from "./hooks";
import { GROUP_WINDOW_MS, formatDayLabel, idOf, isSameDay, matches } from "./messageUtils";
import classes from "./Chat.module.css";

const NEAR_BOTTOM_PX = 150;

/* Construit la suite d'éléments du fil : séparateurs de date, messages système, bulles groupées.
   Regroupement : même auteur, même jour, moins de 5 min d'écart ; système et séparateurs coupent. */
function buildItems(messages, { myId, isGroup, blockedUserIds, lang, t }) {
  const out = [];
  let prevDate = null;
  let run = [];

  const flush = () => {
    run.forEach((entry, i) => {
      const n = run.length;
      entry.pos = n === 1 ? "single" : i === 0 ? "first" : i === n - 1 ? "last" : "middle";
      const isOther = !entry.isMine;
      entry.showName = isGroup && isOther && !entry.blocked && (i === 0);
      entry.avatar = isGroup && isOther ? (i === n - 1 ? "show" : "reserve") : null;
      if (entry.blocked) entry.avatar = isGroup && isOther ? "reserve" : null;
    });
    run = [];
  };

  messages.forEach((msg) => {
    const date = msg.createdAt ? new Date(msg.createdAt) : new Date();
    if (!prevDate || !isSameDay(prevDate, date)) {
      flush();
      out.push({ type: "day", key: `day-${date.toDateString()}`, label: formatDayLabel(date, lang, t) });
    }
    prevDate = date;

    if (msg.isSystem) {
      flush();
      out.push({ type: "system", key: idOf(msg), msg });
      return;
    }

    const senderId = idOf(msg.senderId);
    const isMine = senderId === myId;
    const blocked = !isMine && isGroup && blockedUserIds.has(senderId);
    const last = run[run.length - 1];
    const continues =
      last && !blocked && !last.blocked && last.senderId === senderId &&
      date - new Date(last.msg.createdAt) < GROUP_WINDOW_MS;
    if (!continues) flush();
    const entry = { type: "msg", key: idOf(msg), msg, senderId, isMine, blocked };
    run.push(entry);
    out.push(entry);
  });
  flush();
  return out;
}

function MessagesSkeleton() {
  return (
    <div className={classes.skeletonThread} aria-hidden="true">
      {["38%", "56%", "30%", "48%"].map((w, i) => (
        <span key={w} className={`${classes.skeletonBubble} ${i % 2 ? classes.skeletonMine : ""}`} style={{ width: w }} />
      ))}
    </div>
  );
}

export default function MessageList({
  status,
  messages,
  myId,
  isGroup,
  blockedUserIds,
  logLabel,
  emptyState,
  onRetry,
  editingId,
  editDraft,
  onEditDraft,
  onEditSave,
  onEditCancel,
  onStartEdit,
  onDelete,
  onProfile,
}) {
  const { t, i18n } = useTranslation();
  const scrollRef = useRef(null);
  const nearBottomRef = useRef(true);
  const lastIdRef = useRef(null);
  const initialDoneRef = useRef(false);
  // Messages présents à l'ouverture : seuls les suivants (reçus / envoyés en direct) sont animés
  const initialIdsRef = useRef(null);
  const [newCount, setNewCount] = useState(0);
  const [scrollPos, setScrollPos] = useState({ near: true, far: false });
  const [sheetMsg, setSheetMsg] = useState(null);

  const items = useMemo(
    () => buildItems(messages, { myId, isGroup, blockedUserIds, lang: i18n.language, t }),
    [messages, myId, isGroup, blockedUserIds, i18n.language, t]
  );

  const scrollToBottom = useCallback((animate) => {
    const el = scrollRef.current;
    if (!el) return;
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
    const smooth = animate && distance < el.clientHeight * 2 && !matches(REDUCED_MOTION_QUERY);
    if (smooth && typeof el.scrollTo === "function") el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    else el.scrollTop = el.scrollHeight;
    nearBottomRef.current = true;
  }, []);

  // Ouverture : ancrage en bas sans animation. Ensuite : défilement selon qui écrit et où l'on se trouve.
  useLayoutEffect(() => {
    if (status !== "ready") return;
    const lastId = messages.length ? idOf(messages[messages.length - 1]) : null;
    if (!initialDoneRef.current) {
      initialDoneRef.current = true;
      lastIdRef.current = lastId;
      scrollToBottom(false);
      return;
    }
    if (lastId === lastIdRef.current) return; // édition, suppression : pas de défilement
    const prevIndex = messages.findIndex((m) => idOf(m) === lastIdRef.current);
    const appended = messages.slice(prevIndex + 1);
    lastIdRef.current = lastId;
    const mineSent = appended.some((m) => !m.isSystem && idOf(m.senderId) === myId);
    if (mineSent || nearBottomRef.current) {
      scrollToBottom(true);
      setNewCount(0);
    } else {
      setNewCount((c) => c + appended.length);
    }
  }, [messages, status, myId, scrollToBottom]);

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
    const near = distance < NEAR_BOTTOM_PX;
    const far = distance > el.clientHeight;
    nearBottomRef.current = near;
    if (near && newCount) setNewCount(0);
    if (near !== scrollPos.near || far !== scrollPos.far) setScrollPos({ near, far });
  };

  if (status === "ready" && !initialIdsRef.current) {
    initialIdsRef.current = new Set(messages.map((m) => idOf(m)));
  }
  const isLive = (id) => !!initialIdsRef.current && !initialIdsRef.current.has(id);

  const showPill = status === "ready" && ((newCount > 0 && !scrollPos.near) || scrollPos.far);
  const onLongPress = useCallback((msg) => setSheetMsg(msg), []);

  let content;
  if (status === "loading") {
    content = <MessagesSkeleton />;
  } else if (status === "error") {
    content = (
      <div className={classes.threadState} role="alert">
        <AlertCircle size={28} aria-hidden="true" className={classes.stateIconError} />
        <p>{t("messages.loadErrorMessages")}</p>
        <button type="button" className={classes.secondaryBtn} onClick={onRetry}>
          <RotateCw size={18} aria-hidden="true" /> {t("messages.retry")}
        </button>
      </div>
    );
  } else if (items.length === 0) {
    content = emptyState;
  } else {
    content = items.map((item) => {
      if (item.type === "day") {
        return (
          <h3 key={item.key} className={classes.daySep}>
            <span>{item.label}</span>
          </h3>
        );
      }
      if (item.type === "system") {
        return (
          <p key={item.key} className={`${classes.systemMsg} ${isLive(item.key) ? classes.msgEnter : ""}`}>
            {item.msg.content}
          </p>
        );
      }
      const msgId = item.key;
      return (
        <MessageBubble
          key={msgId}
          msg={item.msg}
          isMine={item.isMine}
          isGroup={isGroup}
          pos={item.pos}
          showName={item.showName}
          avatar={item.avatar}
          blocked={item.blocked}
          isLive={isLive(msgId)}
          isEditing={editingId === msgId}
          editDraft={editDraft}
          onEditDraft={onEditDraft}
          onEditSave={() => onEditSave(msgId)}
          onEditCancel={onEditCancel}
          onStartEdit={() => onStartEdit(item.msg)}
          onDelete={() => onDelete(msgId)}
          onProfile={onProfile}
          onLongPress={onLongPress}
        />
      );
    });
  }

  return (
    <div className={classes.thread}>
      {/* Zone qui défile : focusable au clavier ; limite de placement des menus */}
      <div
        ref={scrollRef}
        className={classes.messages}
        onScroll={onScroll}
        tabIndex={0}
        data-menu-boundary
        aria-label={logLabel}
      >
        <div
          className={classes.messagesInner}
          role="log"
          aria-live="polite"
          aria-relevant="additions"
          aria-label={logLabel}
          aria-busy={status === "loading"}
        >
          {status === "loading" && <span className="sr-only">{t("messages.loadingMessages")}</span>}
          {content}
        </div>
      </div>

      {showPill && (
        newCount > 0 ? (
          <button type="button" className={classes.newPill} onClick={() => { scrollToBottom(true); setNewCount(0); }}>
            <ArrowDown size={16} aria-hidden="true" />
            {t("messages.newMessages", { count: newCount })}
          </button>
        ) : (
          <button
            type="button"
            className={`${classes.newPill} ${classes.newPillRound}`}
            onClick={() => scrollToBottom(true)}
            aria-label={t("messages.scrollToBottom")}
          >
            <ArrowDown size={16} aria-hidden="true" />
          </button>
        )
      )}

      {sheetMsg && (
        <ActionSheet
          title={t("messages.actions")}
          onClose={() => setSheetMsg(null)}
          items={[
            { key: "edit", label: t("messages.edit"), icon: Pencil, onSelect: () => onStartEdit(sheetMsg) },
            { key: "delete", label: t("messages.delete"), icon: Trash2, danger: true, onSelect: () => onDelete(idOf(sheetMsg)) },
          ]}
        />
      )}
    </div>
  );
}
