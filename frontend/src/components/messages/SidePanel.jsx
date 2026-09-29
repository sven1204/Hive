import { useId, useRef } from "react";
import { X } from "lucide-react";
import { Sheet } from "./Dialogs";
import { useDialog } from "./hooks";
import classes from "./Overlays.module.css";

/* Tiroir latéral (900-1099 px) : dialogue modal avec voile */
function Drawer({ id, onClose, render }) {
  const ref = useRef(null);
  const titleId = useId();
  useDialog(ref, onClose);
  return (
    <div className={classes.drawerLayer}>
      <div className={classes.scrim} onClick={onClose} aria-hidden="true" />
      <aside ref={ref} id={id} className={classes.drawer} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1}>
        {render(titleId)}
      </aside>
    </div>
  );
}

/* Panneau latéral d'une discussion : intégré (≥ 1100 px), tiroir (900-1099 px) ou feuille basse (mobile).
   Utilisé par les membres du groupe et l'espace projet. */
export default function SidePanel({ id, variant, title, closeLabel, onClose, children, wide = false }) {
  const inlineTitleId = useId();

  if (variant === "sheet") {
    return (
      <Sheet id={id} title={title} onClose={onClose} closeLabel={closeLabel}>
        <div className={classes.sheetScroll}>{children}</div>
      </Sheet>
    );
  }

  const head = (titleId) => (
    <div className={classes.panelHead}>
      <h2 id={titleId} className={classes.panelTitle}>{title}</h2>
      <button type="button" className={classes.iconBtn} onClick={onClose} aria-label={closeLabel}>
        <X size={20} aria-hidden="true" />
      </button>
    </div>
  );

  if (variant === "drawer") {
    return (
      <Drawer
        id={id}
        onClose={onClose}
        render={(titleId) => (
          <>
            {head(titleId)}
            <div className={classes.panelScroll}>{children}</div>
          </>
        )}
      />
    );
  }

  return (
    <aside id={id} className={`${classes.panel} ${wide ? classes.panelWide : ""}`} aria-labelledby={inlineTitleId}>
      {head(inlineTitleId)}
      <div className={classes.panelScroll}>{children}</div>
    </aside>
  );
}
