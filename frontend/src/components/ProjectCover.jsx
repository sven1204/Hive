import { useEffect, useState } from "react";
import { coverUrl, getProjectAccent, getProjectInitials } from "../lib/projectCover";
import classes from "./ProjectCover.module.css";

/* Couverture d'un projet : l'image envoyée par le créateur, ou à défaut une couverture
   générée (couleur du projet + motif en rayon de miel + initiales), pour qu'aucune
   carte ne reste vide. `size` : "thumb" (cartes) ou "full" (bannière de la page projet). */
function ProjectCover({ project, size = "thumb", showInitials = true, className = "" }) {
  const url = coverUrl(project, size);
  const [failed, setFailed] = useState(false);
  const accent = getProjectAccent(project);

  useEffect(() => setFailed(false), [url]);

  const hasImage = Boolean(url) && !failed;

  return (
    <div
      className={`${classes.cover} ${hasImage ? "" : classes.generated} ${className}`}
      style={{ "--cover-accent": accent.text }}
      aria-hidden="true"
    >
      {hasImage ? (
        <img
          className={classes.image}
          src={url}
          alt=""
          loading={size === "thumb" ? "lazy" : "eager"}
          decoding="async"
          onError={() => setFailed(true)}
        />
      ) : (
        <>
          <span className={classes.pattern} />
          {showInitials && <span className={classes.initials}>{getProjectInitials(project?.title)}</span>}
        </>
      )}
    </div>
  );
}

export default ProjectCover;
