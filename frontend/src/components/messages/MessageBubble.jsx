import { useCallback, useEffect, useId, useRef } from "react";
import { useTranslation } from "react-i18next";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { PersonAvatar } from "./Avatars";
import ActionMenu from "./ActionMenu";
import { useLongPress } from "./hooks";
import { formatClock, formatFullDate, getUserName, idOf } from "./messageUtils";
import { personStyle } from "../../lib/personColor";
import classes from "./Chat.module.css";

function EditArea({ value, onChange, onSave, onCancel }) {
  const { t } = useTranslation();
  const ref = useRef(null);
  const hintId = useId();
  useEffect(() => { ref.current?.focus(); ref.current?.select(); }, []);
  return (
    <>
      <textarea
        ref={ref}
        className={classes.editInput}
        value={value}
        aria-label={t("messages.edit")}
        aria-describedby={hintId}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.nativeEvent.isComposing) return;
          if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSave(); }
          if (e.key === "Escape") { e.preventDefault(); onCancel(); }
        }}
        rows={Math.max(1, value.split("\n").length)}
      />
      <span id={hintId} className={classes.editHint}>{t("messages.editHint")}</span>
    </>
  );
}

/* Une bulle de message. pos = single | first | middle | last (coins côté auteur). */
export default function MessageBubble({
  msg,
  isMine,
  isGroup,
  pos,
  showName,
  avatar, // "show" | "reserve" | null
  blocked,
  isLive,
  isEditing,
  editDraft,
  onEditDraft,
  onEditSave,
  onEditCancel,
  onStartEdit,
  onDelete,
  onProfile,
  onLongPress,
}) {
  const { t, i18n } = useTranslation();
  const sender = msg.senderId;
  const senderName = getUserName(sender, t("messages.userFallback"));
  const clock = formatClock(msg.createdAt, i18n.language);
  const fullDate = formatFullDate(msg.createdAt, i18n.language);
  const muted = msg.deleted || blocked;
  const canAct = isMine && !msg.deleted && !isEditing;
  const content = blocked
    ? t("messages.blockedMessage")
    : msg.deleted ? t("messages.deletedMessage") : msg.content;
  const metaText = msg.edited && !muted ? `${t("messages.edited")} · ${clock}` : clock;

  const menuItems = [
    { key: "edit", label: t("messages.edit"), icon: Pencil, onSelect: onStartEdit, keepFocus: true },
    { key: "delete", label: t("messages.delete"), icon: Trash2, onSelect: onDelete, danger: true },
  ];

  const handleLongPress = useCallback(() => onLongPress(msg), [onLongPress, msg]);
  const pressHandlers = useLongPress(handleLongPress, { disabled: !canAct });

  const bubbleClass = [
    classes.bubble,
    isMine ? classes.bubbleMine : classes.bubbleTheirs,
    muted ? classes.bubbleMuted : "",
  ].join(" ");

  return (
    <div
      className={`${classes.msgRow} ${isMine ? classes.msgRowMine : ""} ${classes[`group_${pos}`] || ""} ${isLive ? classes.msgEnter : ""}`}
    >
      {avatar === "show" && (
        <button
          type="button"
          className={classes.msgAvatarBtn}
          onClick={() => onProfile(idOf(sender))}
          aria-label={t("messages.viewProfileOf", { name: senderName })}
        >
          <PersonAvatar user={sender} size={30} />
        </button>
      )}
      {avatar === "reserve" && <span className={classes.avatarReserve} aria-hidden="true" />}

      <div className={classes.bubbleWrap}>
        <div className={bubbleClass} data-pos={pos} {...pressHandlers}>
          <span className="sr-only">
            {t("messages.previewSender", { name: isMine ? t("messages.you") : senderName, text: "" })}
          </span>
          {showName && (
            <span className={classes.bubbleSender} style={personStyle(sender)} aria-hidden="true">{senderName}</span>
          )}
          {isEditing ? (
            <EditArea value={editDraft} onChange={onEditDraft} onSave={onEditSave} onCancel={onEditCancel} />
          ) : (
            <p className={classes.bubbleText}>
              {content}
              <span className={classes.metaSpacer} aria-hidden="true">{metaText}</span>
            </p>
          )}
          {!isEditing && (
            <span className={classes.bubbleMeta}>
              {msg.edited && !muted && <>{t("messages.edited")} · </>}
              <time dateTime={msg.createdAt} title={fullDate}>{clock}</time>
            </span>
          )}
        </div>

        {canAct && (
          <ActionMenu
            items={menuItems}
            buttonLabel={t("messages.actions")}
            buttonClassName={classes.dotsBtn}
            openClassName={classes.dotsBtnOpen}
            wrapperClassName={classes.dotsWrap}
            icon={<MoreHorizontal size={16} aria-hidden="true" />}
          />
        )}
      </div>
    </div>
  );
}
