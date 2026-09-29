import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { fetchMyBilling, openPortal } from "../lib/billing";
import classes from "./ProfileView.module.css";

/* Profil : état de l'abonnement Hive+, boosts disponibles et accès au portail de gestion */
export default function SubscriptionCard() {
  const { t, i18n } = useTranslation();
  const [billing, setBilling] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetchMyBilling().then(setBilling).catch(() => setBilling({ plan: "free", boostCredits: 0 }));
  }, []);

  if (!billing) return null;
  const isPlus = billing.plan === "plus";
  const date = billing.planRenewsAt
    ? new Intl.DateTimeFormat(i18n.language === "en" ? "en-CH" : "fr-CH", { dateStyle: "long" }).format(new Date(billing.planRenewsAt))
    : null;

  const manage = async () => {
    setError(false);
    try { await openPortal(); } catch { setError(true); }
  };

  return (
    <div className={classes.planCard}>
      <div className={classes.planInfo}>
        <span className={classes.planName}>{isPlus ? t("billing.profilePlus") : t("billing.profileFree")}</span>
        {isPlus && (
          <span className={classes.planMeta}>
            {date && (billing.planCancelAtPeriodEnd ? t("billing.endsOn", { date }) : t("billing.renewsOn", { date }))}
            {date && " · "}
            {t("billing.credits", { count: billing.boostCredits || 0 })}
          </span>
        )}
      </div>
      {isPlus ? (
        <button type="button" className={classes.planBtn} onClick={manage}>{t("billing.manage")}</button>
      ) : (
        <Link to="/abonnement" className={classes.planBtn}>{t("billing.discoverPlus")}</Link>
      )}
      {error && <p className={classes.switchError} role="alert">{t("billing.error")}</p>}
    </div>
  );
}
