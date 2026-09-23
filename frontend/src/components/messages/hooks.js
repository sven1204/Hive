import { useCallback, useEffect, useRef, useState } from "react";
import { matches } from "./messageUtils";

export const MOBILE_QUERY = "(max-width: 899.98px)";
export const WIDE_QUERY = "(min-width: 1100px)";
export const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

/* Suit une media query (false si matchMedia est indisponible, ex. jsdom) */
export function useMediaQuery(query) {
  const [value, setValue] = useState(() => matches(query));

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return undefined;
    const mql = window.matchMedia(query);
    const onChange = () => setValue(mql.matches);
    onChange();
    if (mql.addEventListener) mql.addEventListener("change", onChange);
    else mql.addListener(onChange);
    return () => {
      if (mql.removeEventListener) mql.removeEventListener("change", onChange);
      else mql.removeListener(onChange);
    };
  }, [query]);

  return value;
}

/* Appui long au toucher (450 ms), annulé si le doigt bouge de plus de 10 px.
   Le clic qui suit un appui long abouti est neutralisé. */
export function useLongPress(onLongPress, { delay = 450, disabled = false } = {}) {
  const timerRef = useRef(null);
  const startRef = useRef(null);
  const firedRef = useRef(false);
  const targetRef = useRef(null);

  const clear = useCallback(() => {
    clearTimeout(timerRef.current);
    timerRef.current = null;
    startRef.current = null;
    if (targetRef.current) delete targetRef.current.dataset.pressing;
    targetRef.current = null;
  }, []);

  useEffect(() => clear, [clear]);

  const onPointerDown = useCallback((e) => {
    if (disabled || e.pointerType === "mouse") return;
    firedRef.current = false;
    startRef.current = { x: e.clientX, y: e.clientY };
    targetRef.current = e.currentTarget;
    e.currentTarget.dataset.pressing = "true";
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      firedRef.current = true;
      const target = targetRef.current;
      clear();
      onLongPress(target);
    }, delay);
  }, [disabled, delay, onLongPress, clear]);

  const onPointerMove = useCallback((e) => {
    const start = startRef.current;
    if (!start) return;
    if (Math.hypot(e.clientX - start.x, e.clientY - start.y) > 10) clear();
  }, [clear]);

  const onClickCapture = useCallback((e) => {
    if (firedRef.current) {
      firedRef.current = false;
      e.preventDefault();
      e.stopPropagation();
    }
  }, []);

  const onContextMenu = useCallback((e) => {
    // Menu natif du navigateur mobile remplacé par la feuille d'actions
    if (startRef.current || firedRef.current) e.preventDefault();
  }, []);

  if (disabled) return {};
  return {
    onPointerDown,
    onPointerMove,
    onPointerUp: clear,
    onPointerCancel: clear,
    onPointerLeave: clear,
    onClickCapture,
    onContextMenu,
  };
}

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/* Dialogue modal : focus initial, piège du focus (Tab), Échap, retour du focus à la fermeture. */
export function useDialog(ref, onClose) {
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;
    const previous = document.activeElement;
    const focusables = () => Array.from(node.querySelectorAll(FOCUSABLE));
    const initial = node.querySelector("[data-autofocus]") || focusables()[0] || node;
    initial.focus();

    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onCloseRef.current?.();
        return;
      }
      if (e.key !== "Tab") return;
      const list = focusables();
      if (list.length === 0) { e.preventDefault(); return; }
      const first = list[0];
      const last = list[list.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    node.addEventListener("keydown", onKeyDown);
    return () => {
      node.removeEventListener("keydown", onKeyDown);
      if (previous && typeof previous.focus === "function" && document.contains(previous)) previous.focus();
    };
  }, [ref]);
}
