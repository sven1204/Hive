import { useEffect, useRef } from 'react';
import classes from './DecodeText.module.css';

const GLYPHS = 'abcdefghijklmnopqrstuvwxyz0123456789#<>/_+=';

/* Texte qui se « décode » caractère par caractère, de gauche à droite.
   Chaque caractère garde sa vraie largeur (le glyphe aléatoire est dessiné par
   un ::after), donc la mise en page ne bouge pas pendant l'animation.
   Le texte réel est exposé aux lecteurs d'écran par le parent. */
function DecodeText({ text, delay = 0, duration = 900 }) {
  const rootRef = useRef(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    const chars = Array.from(root.querySelectorAll('[data-char]'));
    const resolve = (el) => {
      el.dataset.glyph = el.dataset.char;
      el.classList.add(classes.done);
    };

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      chars.forEach(resolve);
      return undefined;
    }

    chars.forEach((el) => el.classList.remove(classes.done));
    let frame = 0;
    let startTime = 0;
    let lastShuffle = 0;

    const tick = (now) => {
      if (!startTime) startTime = now;
      const elapsed = now - startTime - delay;
      const progress = Math.max(0, Math.min(elapsed / duration, 1));
      const resolved = Math.floor(progress * chars.length);
      const shuffle = now - lastShuffle > 45;
      if (shuffle) lastShuffle = now;

      chars.forEach((el, index) => {
        if (index < resolved) {
          if (!el.classList.contains(classes.done)) resolve(el);
        } else if (shuffle) {
          el.dataset.glyph = GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
        }
      });

      if (progress < 1) frame = requestAnimationFrame(tick);
      else chars.forEach(resolve);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [text, delay, duration]);

  const words = text.split(' ');

  return (
    <span ref={rootRef} aria-hidden="true">
      {words.map((word, wordIndex) => (
        <span key={`${word}-${wordIndex}`}>
          {Array.from(word).map((char, charIndex) => (
            <span key={charIndex} className={classes.char} data-char={char} data-glyph="">
              {char}
            </span>
          ))}
          {wordIndex < words.length - 1 ? ' ' : null}
        </span>
      ))}
    </span>
  );
}

export default DecodeText;
