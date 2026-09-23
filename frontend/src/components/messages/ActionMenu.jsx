import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import classes from "./Overlays.module.css";

const itemsOf = (node) => Array.from(node?.querySelectorAll('[role="menuitem"]') || []);

/* Menu ⋯ partagé (en-tête de discussion et bulles).
   items : [{ key, label, icon: Icone, onSelect, danger }] ou { key, separator: true }.
   Clavier : focus sur le 1er item, flèches cycliques, Début / Fin, Échap (rend le focus), Tab ferme. */
export default function ActionMenu({
  items,
  buttonLabel,
  buttonClassName = "",
  openClassName = "",
  icon,
  wrapperClassName = "",
  onOpenChange,
}) {
  const [open, setOpen] = useState(false);
  const [placeUp, setPlaceUp] = useState(false);
  const buttonRef = useRef(null);
  const menuRef = useRef(null);
  const menuId = useId();

  const setOpenState = (value) => {
    setOpen(value);
    onOpenChange?.(value);
  };
  const onOpenChangeRef = useRef(onOpenChange);
  useEffect(() => { onOpenChangeRef.current = onOpenChange; }, [onOpenChange]);

  const menuItems = () => itemsOf(menuRef.current);

  // Place le menu vers le haut s'il manque de place sous le bouton (dans la zone qui défile)
  useLayoutEffect(() => {
    if (!open || !menuRef.current || !buttonRef.current) return;
    const boundary = buttonRef.current.closest("[data-menu-boundary]");
    const bottomLimit = boundary ? boundary.getBoundingClientRect().bottom : window.innerHeight;
    const btnRect = buttonRef.current.getBoundingClientRect();
    const menuHeight = menuRef.current.offsetHeight;
    setPlaceUp(btnRect.bottom + 4 + menuHeight > bottomLimit - 8 && btnRect.top - menuHeight - 4 > 8);
    itemsOf(menuRef.current)[0]?.focus();
  }, [open]);

  // Clic extérieur : fermeture
  useEffect(() => {
    if (!open) return undefined;
    const onPointer = (e) => {
      if (menuRef.current?.contains(e.target) || buttonRef.current?.contains(e.target)) return;
      setOpen(false);
      onOpenChangeRef.current?.(false);
    };
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, [open]);

  const close = (returnFocus) => {
    setOpenState(false);
    if (returnFocus) buttonRef.current?.focus();
  };

  const onMenuKeyDown = (e) => {
    const list = menuItems();
    const index = list.indexOf(document.activeElement);
    if (e.key === "ArrowDown") { e.preventDefault(); list[(index + 1) % list.length]?.focus(); }
    else if (e.key === "ArrowUp") { e.preventDefault(); list[(index - 1 + list.length) % list.length]?.focus(); }
    else if (e.key === "Home") { e.preventDefault(); list[0]?.focus(); }
    else if (e.key === "End") { e.preventDefault(); list[list.length - 1]?.focus(); }
    else if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); close(true); }
    else if (e.key === "Tab") { close(false); }
  };

  const onButtonKeyDown = (e) => {
    if ((e.key === "ArrowDown" || e.key === "ArrowUp") && !open) {
      e.preventDefault();
      setOpenState(true);
    }
  };

  return (
    <div className={`${classes.menuWrap} ${wrapperClassName}`.trim()}>
      <button
        ref={buttonRef}
        type="button"
        className={`${buttonClassName} ${open ? openClassName : ""}`.trim()}
        aria-label={buttonLabel}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpenState(!open)}
        onKeyDown={onButtonKeyDown}
      >
        {icon}
      </button>
      {open && (
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          aria-label={buttonLabel}
          className={`${classes.menu} ${placeUp ? classes.menuUp : ""}`}
          onKeyDown={onMenuKeyDown}
        >
          {items.map((item) =>
            item.separator ? (
              <div key={item.key} role="separator" className={classes.menuSeparator} />
            ) : (
              <button
                key={item.key}
                type="button"
                role="menuitem"
                tabIndex={-1}
                className={`${classes.menuItem} ${item.danger ? classes.menuItemDanger : ""}`}
                onClick={() => {
                  close(!item.keepFocus);
                  item.onSelect();
                }}
              >
                {item.icon && <item.icon size={18} aria-hidden="true" />}
                <span>{item.label}</span>
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}
