import UserAvatar from "../UserAvatar";
import { personStyle } from "../../lib/personColor";
import classes from "./Avatars.module.css";

/* Avatar rond d'une personne, taille fixe (évite les décalages au chargement des images) */
export function PersonAvatar({ user, size = 48, alt = "", dimmed = false, className = "" }) {
  return (
    <UserAvatar
      user={user}
      style={{ ...personStyle(user), "--avatar-size": `${size}px` }}
      className={`${classes.person} ${dimmed ? classes.dimmed : ""} ${className}`.trim()}
      imageClassName={classes.personImg}
      fallbackClassName={classes.personFallback}
      alt={alt}
    />
  );
}

/* Initiales d'un projet : premières lettres des deux premiers mots du titre */
function projectInitials(title = "") {
  const words = String(title).trim().split(/\s+/).filter(Boolean);
  const letters = words.slice(0, 2).map((w) => w[0]).join("");
  return (letters || "?").toUpperCase();
}

/* Avatar carré d'une conversation de groupe (projet), décoratif */
export function ProjectAvatar({ conversation, title, size = 48, dimmed = false }) {
  return (
    <span
      className={`${classes.project} ${dimmed ? classes.dimmed : ""}`.trim()}
      style={{ ...personStyle(conversation), "--avatar-size": `${size}px` }}
      aria-hidden="true"
    >
      {projectInitials(title)}
    </span>
  );
}
