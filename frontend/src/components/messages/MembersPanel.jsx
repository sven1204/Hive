import { useId, useRef } from "react";
import { useTranslation } from "react-i18next";
import { X, User, UserMinus } from "lucide-react";
import { PersonAvatar } from "./Avatars";
import { Sheet } from "./Dialogs";
import { useDialog } from "./hooks";
import { getUserName, idOf } from "./messageUtils";
import classes from "./Overlays.module.css";

function MemberRows({ participants, myId, isOwner, onProfile, onKick }) {
  const { t } = useTranslation();
  return (
    <ul className={classes.memberList}>
      {participants.map((p) => {
        const pId = idOf(p);
        const isMe = pId === myId;
        const name = getUserName(p, t("messages.userFallback"));
        return (
          <li key={pId} className={classes.memberItem}>
            <PersonAvatar user={p} size={32} />
            <span className={classes.memberName}>
              {name}
              {isMe && <span className={classes.memberMe}> {t("messages.meTag")}</span>}
            </span>
            {!isMe && (
              <span className={classes.memberActions}>
                <button
                  type="button"
                  className={classes.iconBtn}
                  onClick={() => onProfile(pId)}
                  aria-label={t("messages.viewProfileOf", { name })}
                >
                  <User size={18} aria-hidden="true" />
                </button>
                {isOwner && (
                  <button
                    type="button"
                    className={`${classes.iconBtn} ${classes.iconBtnDanger}`}
                    onClick={() => onKick({ _id: pId, name })}
                    aria-label={t("messages.kickMember", { name })}
                  >
                    <UserMinus size={18} aria-hidden="true" />
                  </button>
                )}
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/* Tiroir latéral (900-1099 px) : dialogue modal avec voile */
function Drawer({ id, title, onClose, children }) {
  const ref = useRef(null);
  const titleId = useId();
  useDialog(ref, onClose);
  return (
    <div className={classes.drawerLayer}>
      <div className={classes.scrim} onClick={onClose} aria-hidden="true" />
      <aside ref={ref} id={id} className={classes.drawer} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1}>
        {children(titleId)}
      </aside>
    </div>
  );
}

/* Membres d'un groupe : panneau intégré (≥ 1100 px), tiroir (900-1099 px) ou feuille basse (mobile) */
export default function MembersPanel({ id, variant, participants, myId, isOwner, onClose, onProfile, onKick }) {
  const { t } = useTranslation();
  const inlineTitleId = useId();
  const title = t("messages.membersTitle", { count: participants.length });
  const rows = (
    <MemberRows participants={participants} myId={myId} isOwner={isOwner} onProfile={onProfile} onKick={onKick} />
  );

  if (variant === "sheet") {
    return (
      <Sheet id={id} title={title} onClose={onClose} closeLabel={t("messages.membersClose")}>
        <div className={classes.sheetScroll}>{rows}</div>
      </Sheet>
    );
  }

  const head = (titleId) => (
    <div className={classes.panelHead}>
      <h2 id={titleId} className={classes.panelTitle}>{title}</h2>
      <button type="button" className={classes.iconBtn} onClick={onClose} aria-label={t("messages.membersClose")}>
        <X size={20} aria-hidden="true" />
      </button>
    </div>
  );

  if (variant === "drawer") {
    return (
      <Drawer id={id} title={title} onClose={onClose}>
        {(titleId) => (
          <>
            {head(titleId)}
            <div className={classes.panelScroll}>{rows}</div>
          </>
        )}
      </Drawer>
    );
  }

  return (
    <aside id={id} className={classes.panel} aria-labelledby={inlineTitleId}>
      {head(inlineTitleId)}
      <div className={classes.panelScroll}>{rows}</div>
    </aside>
  );
}
