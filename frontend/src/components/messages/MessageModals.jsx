import { useId } from "react";
import { useTranslation } from "react-i18next";
import { Star, UserMinus, Ban, Trash2 } from "lucide-react";
import { Modal } from "./Dialogs";
import classes from "./Overlays.module.css";

function StarRating({ value, onChange, labelledBy }) {
  const { t } = useTranslation();
  return (
    <div className={classes.starRow} role="group" aria-labelledby={labelledBy}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          className={`${classes.starBtn} ${n <= value ? classes.starActive : ""}`}
          onClick={() => onChange(n)}
          aria-pressed={n === value}
          aria-label={t("messages.starLabel", { count: n })}
        >
          <Star size={24} fill={n <= value ? "currentColor" : "none"} aria-hidden="true" />
        </button>
      ))}
    </div>
  );
}

/* Notation d'un membre à la clôture du projet */
export function RatingModal({ target, score, comment, loading, error, onScore, onComment, onSubmit, onClose }) {
  const { t } = useTranslation();
  const starsId = useId();
  const commentId = useId();
  return (
    <Modal
      title={t("messages.rateTitle", { name: target.displayName })}
      icon={<Star size={20} aria-hidden="true" />}
      onClose={onClose}
      actions={(
        <>
          <button type="button" className={classes.btnSecondary} onClick={onClose}>{t("messages.cancel")}</button>
          <button type="button" className={classes.btnPrimary} onClick={onSubmit} disabled={!score || loading}>
            <Star size={18} aria-hidden="true" /> {loading ? t("messages.rateSending") : t("messages.rateSubmit")}
          </button>
        </>
      )}
    >
      <span id={starsId} className="sr-only">{t("messages.rateTitle", { name: target.displayName })}</span>
      <StarRating value={score} onChange={onScore} labelledBy={starsId} />
      <label htmlFor={commentId} className={classes.fieldLabel}>{t("messages.rateComment")}</label>
      <textarea
        id={commentId}
        className={classes.textField}
        rows={2}
        value={comment}
        onChange={(e) => onComment(e.target.value)}
        maxLength={300}
      />
      {error && <p className={classes.fieldError} role="alert">{error}</p>}
    </Modal>
  );
}

/* Retrait d'un membre par le propriétaire (raison + note obligatoire) */
export function KickModal({ target, reason, rating, loading, error, onReason, onRating, onSubmit, onClose }) {
  const { t } = useTranslation();
  const reasonId = useId();
  const ratingId = useId();
  return (
    <Modal
      title={t("messages.kickTitle", { name: target.name })}
      icon={<UserMinus size={20} aria-hidden="true" />}
      onClose={onClose}
      actions={(
        <>
          <button type="button" className={classes.btnSecondary} onClick={onClose}>{t("messages.cancel")}</button>
          <button type="button" className={classes.btnDanger} onClick={onSubmit} disabled={rating === 0 || loading}>
            <UserMinus size={18} aria-hidden="true" /> {loading ? t("messages.kickLoading") : t("messages.kickBtn")}
          </button>
        </>
      )}
    >
      <p className={classes.modalText}>{t("messages.kickDesc")}</p>
      <label htmlFor={reasonId} className={classes.fieldLabel}>{t("messages.kickReasonLabel")}</label>
      <textarea
        id={reasonId}
        className={classes.textField}
        rows={3}
        placeholder={t("messages.kickReasonPlaceholder")}
        value={reason}
        onChange={(e) => onReason(e.target.value)}
      />
      <span id={ratingId} className={classes.fieldLabel}>
        {t("messages.kickRatingLabel")} <span className={classes.required} aria-hidden="true">*</span>
      </span>
      <StarRating value={rating} onChange={onRating} labelledBy={ratingId} />
      {error && <p className={classes.fieldError} role="alert">{error}</p>}
    </Modal>
  );
}

/* Confirmation de blocage (modale existante conservée) */
export function BlockModal({ name, onConfirm, onClose }) {
  const { t } = useTranslation();
  return (
    <Modal
      title={t("messages.blockTitle", { name })}
      icon={<Ban size={20} aria-hidden="true" />}
      onClose={onClose}
      actions={(
        <>
          <button type="button" className={classes.btnSecondary} onClick={onClose}>{t("messages.cancel")}</button>
          <button type="button" className={classes.btnDanger} onClick={onConfirm}>
            <Ban size={18} aria-hidden="true" /> {t("messages.block")}
          </button>
        </>
      )}
    >
      <p className={classes.modalText}>{t("messages.blockDesc")}</p>
    </Modal>
  );
}

/* Confirmation de suppression définitive d'une discussion archivée */
export function DeleteConvModal({ title, onConfirm, onClose }) {
  const { t } = useTranslation();
  return (
    <Modal
      title={t("messages.deleteConvConfirm")}
      icon={<Trash2 size={20} aria-hidden="true" />}
      onClose={onClose}
      actions={(
        <>
          <button type="button" className={classes.btnSecondary} onClick={onClose}>{t("messages.cancel")}</button>
          <button type="button" className={classes.btnDanger} onClick={onConfirm}>
            <Trash2 size={18} aria-hidden="true" /> {t("messages.deleteConvTitle")}
          </button>
        </>
      )}
    >
      <p className={classes.modalText}><strong>{title}</strong></p>
      <p className={classes.modalText}>{t("messages.deleteConvText")}</p>
    </Modal>
  );
}
