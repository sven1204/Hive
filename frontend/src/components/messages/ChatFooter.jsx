import { useTranslation } from "react-i18next";
import { ShieldOff, Star, Check } from "lucide-react";
import { PersonAvatar } from "./Avatars";
import classes from "./Chat.module.css";

/* Bandeau affiché à la place de la saisie quand l'interlocuteur est bloqué */
export function BlockedBanner({ name, onUnblock }) {
  const { t } = useTranslation();
  return (
    <div className={classes.blockedBanner}>
      <ShieldOff size={18} aria-hidden="true" className={classes.blockedIcon} />
      <p className={classes.blockedText}>{t("messages.blockedBanner", { name })}</p>
      <button type="button" className={classes.secondaryBtn} onClick={onUnblock}>
        {t("messages.unblock")}
      </button>
    </div>
  );
}

/* Projet clôturé : discussion fermée, notation des membres */
export function ClosedBanner({ members, ratedUsers, onRate }) {
  const { t } = useTranslation();
  return (
    <div className={classes.closedBanner}>
      <p className={classes.closedBannerTitle}>{t("messages.closedBannerTitle")}</p>
      <p className={classes.closedBannerSub}>{t("messages.closedBannerSub")}</p>
      <ul className={classes.closedRatingList}>
        {members.map((m) => (
          <li key={m.id} className={classes.closedRatingItem}>
            <PersonAvatar user={m.user} size={32} />
            <span className={classes.closedName}>{m.name}</span>
            {ratedUsers.has(m.id) ? (
              <span className={classes.ratingDone}><Check size={16} aria-hidden="true" /> {t("messages.ratingDone")}</span>
            ) : (
              <button
                type="button"
                className={classes.rateBtn}
                onClick={() => onRate({ _id: m.id, displayName: m.name })}
                aria-label={t("messages.rateTitle", { name: m.name })}
              >
                <Star size={16} aria-hidden="true" /> {t("messages.rateBtn")}
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
