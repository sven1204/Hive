import { useTranslation } from "react-i18next";
import { User, UserMinus } from "lucide-react";
import { PersonAvatar } from "./Avatars";
import SidePanel from "./SidePanel";
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

/* Membres d'un groupe : panneau intégré (≥ 1100 px), tiroir (900-1099 px) ou feuille basse (mobile) */
export default function MembersPanel({ id, variant, participants, myId, isOwner, onClose, onProfile, onKick }) {
  const { t } = useTranslation();
  return (
    <SidePanel
      id={id}
      variant={variant}
      title={t("messages.membersTitle", { count: participants.length })}
      closeLabel={t("messages.membersClose")}
      onClose={onClose}
    >
      <MemberRows participants={participants} myId={myId} isOwner={isOwner} onProfile={onProfile} onKick={onKick} />
    </SidePanel>
  );
}
