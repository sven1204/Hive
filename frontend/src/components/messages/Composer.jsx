import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Send, AlertCircle, X } from "lucide-react";
import { COUNTER_FROM, MAX_LENGTH, matches } from "./messageUtils";
import classes from "./Chat.module.css";

const MAX_HEIGHT = 120;

/* Zone de saisie : auto-grow, compteur à partir de 1800 caractères, erreur d'envoi, bouton Envoyer.
   Desktop : Entrée envoie, Maj+Entrée = ligne. Pointeur grossier (tactile) : Entrée = ligne. */
export default function Composer({
  convKey,
  value,
  onChange,
  onSend,
  placeholder,
  canSend,
  error,
  onDismissError,
  autoFocus,
}) {
  const { t, i18n } = useTranslation();
  const ref = useRef(null);
  const errorId = useId();
  const [announce, setAnnounce] = useState("");
  const zoneRef = useRef("ok");

  const length = value.length;
  const over = length > MAX_LENGTH;
  const showCounter = length >= COUNTER_FROM;
  const sendable = canSend && value.trim().length > 0 && !over;

  // Focus à l'ouverture d'une discussion (desktop uniquement)
  useEffect(() => {
    if (autoFocus) ref.current?.focus();
  }, [convKey, autoFocus]);

  // Hauteur automatique jusqu'à 120 px
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    const border = el.offsetHeight - el.clientHeight;
    const next = Math.min((el.scrollHeight || 0) + border, MAX_HEIGHT);
    el.style.height = next > 0 ? `${next}px` : "";
  }, [value]);

  // Annonce seulement les franchissements de seuil (1800, puis au-delà de 2000)
  useEffect(() => {
    const zone = over ? "over" : showCounter ? "near" : "ok";
    if (zone === zoneRef.current) return;
    zoneRef.current = zone;
    if (zone === "near") setAnnounce(t("messages.charsLeft", { count: MAX_LENGTH - length }));
    else if (zone === "over") setAnnounce(t("messages.charsOver", { count: length - MAX_LENGTH }));
    else setAnnounce("");
  }, [over, showCounter, length, t]);

  const handleKeyDown = (e) => {
    if (e.key !== "Enter" || e.shiftKey || e.nativeEvent.isComposing) return;
    if (matches("(pointer: coarse)")) return; // tactile : retour à la ligne
    e.preventDefault();
    if (sendable) onSend();
  };

  const formatNumber = (n) => new Intl.NumberFormat(i18n.language || "fr").format(n);

  return (
    <div className={classes.composer}>
      {(error || showCounter) && (
        <div className={classes.composerInfo}>
          {error && (
            <div id={errorId} className={classes.sendError} role="alert">
              <AlertCircle size={16} aria-hidden="true" />
              <span>{error}</span>
              <button type="button" className={classes.iconBtn} onClick={onDismissError} aria-label={t("messages.dismissError")}>
                <X size={16} aria-hidden="true" />
              </button>
            </div>
          )}
          {showCounter && (
            <span className={`${classes.counter} ${over ? classes.counterOver : ""}`} aria-hidden="true">
              {formatNumber(length)} / {formatNumber(MAX_LENGTH)}
            </span>
          )}
        </div>
      )}
      <span className="sr-only" aria-live="polite">{announce}</span>
      <div className={classes.composerRow}>
        <textarea
          ref={ref}
          className={`${classes.input} ${over ? classes.inputOver : ""}`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          aria-label={t("messages.composerLabel")}
          aria-invalid={over || !!error || undefined}
          aria-describedby={error ? errorId : undefined}
          rows={1}
        />
        <button
          type="button"
          className={classes.sendBtn}
          onClick={onSend}
          disabled={!sendable}
          aria-label={t("messages.send")}
        >
          <Send size={20} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
