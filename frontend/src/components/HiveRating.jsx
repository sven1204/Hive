import { Sprout } from "lucide-react";
import classes from "./HiveRating.module.css";
import { useTranslation } from "react-i18next";

/* Affiche le score de réputation Hive avec une icône Sprout.
   Accepte deux formats : { rating } (valeur directe) ou { score, votes } (moyenne calculée). */
function getRatingValue(reputation = {}) {
  if (typeof reputation.rating === "number") return reputation.rating;
  if (typeof reputation.score === "number" && reputation.votes > 0) {
    return reputation.score;
  }
  return 0;
}

export default function HiveRating({ reputation, compact = false }) {
  const { t } = useTranslation();
  const value = getRatingValue(reputation);
  const label = compact ? t("rating.compact") : t("rating.full");

  return (
    <span className={`${classes.rating} ${compact ? classes.compact : ""}`.trim()}>
      <Sprout size={compact ? 14 : 16} className={classes.icon} />
      <span className={classes.value}>{value.toFixed(1)}</span>
      <span className={classes.label}>{label}</span>
    </span>
  );
}
