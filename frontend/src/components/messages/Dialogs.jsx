import { useId, useRef } from "react";
import { useTranslation } from "react-i18next";
import { X } from "lucide-react";
import { useDialog } from "./hooks";
import classes from "./Overlays.module.css";

/* Feuille basse (mobile) : actions d'une ligne / bulle, ou liste des membres.
   role=dialog + aria-modal, piège du focus, Échap et clic sur le voile ferment. */
export function Sheet({ title, onClose, children, id, titleHidden = false, closeLabel }) {
  const ref = useRef(null);
  const titleId = useId();
  useDialog(ref, onClose);
  return (
    <div className={classes.sheetLayer}>
      <div className={classes.scrim} onClick={onClose} aria-hidden="true" />
      <div
        ref={ref}
        id={id}
        className={classes.sheet}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <div className={classes.sheetHandle} aria-hidden="true" />
        <div className={classes.sheetHead}>
          <h2 id={titleId} className={titleHidden ? "sr-only" : classes.sheetTitle}>{title}</h2>
          {closeLabel && (
            <button type="button" className={classes.iconBtn} onClick={onClose} aria-label={closeLabel}>
              <X size={20} aria-hidden="true" />
            </button>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}

/* Feuille d'actions (appui long) : mêmes items que le menu ⋯ */
export function ActionSheet({ title, items, onClose }) {
  return (
    <Sheet title={title} onClose={onClose}>
      <div role="menu" aria-label={title} className={classes.sheetMenu}>
        {items.map((item) =>
          item.separator ? (
            <div key={item.key} role="separator" className={classes.menuSeparator} />
          ) : (
            <button
              key={item.key}
              type="button"
              role="menuitem"
              className={`${classes.sheetItem} ${item.danger ? classes.menuItemDanger : ""}`}
              onClick={() => { onClose(); item.onSelect(); }}
            >
              {item.icon && <item.icon size={20} aria-hidden="true" />}
              <span>{item.label}</span>
            </button>
          )
        )}
      </div>
    </Sheet>
  );
}

/* Modale centrée (notation, retrait, blocage, suppression) */
export function Modal({ title, icon, onClose, children, actions }) {
  const { t } = useTranslation();
  const ref = useRef(null);
  const titleId = useId();
  useDialog(ref, onClose);
  return (
    <div className={classes.modalOverlay} onClick={onClose}>
      <div
        ref={ref}
        className={classes.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={classes.modalHead}>
          {icon}
          <h2 id={titleId} className={classes.modalTitle}>{title}</h2>
          <button type="button" className={classes.iconBtn} onClick={onClose} aria-label={t("messages.close")}>
            <X size={20} aria-hidden="true" />
          </button>
        </div>
        {children}
        {actions && <div className={classes.modalActions}>{actions}</div>}
      </div>
    </div>
  );
}
