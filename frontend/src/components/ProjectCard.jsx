import { useNavigate } from "react-router-dom";
import { Users, MapPin } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import classes from "./ProjectCard.module.css";
import { useTranslation } from "react-i18next";

/* Carte cliquable d'un projet. Gère :
   - l'affichage du propriétaire ("Vous" si c'est l'utilisateur connecté)
   - le label d'âge selon la combinaison minAge/maxAge
   - la troncature de la description
   - le badge "Complet" quand plus aucune place n'est disponible */
function ProjectCard({ project }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();

  const availableSlots = project.maxParticipants - (project.participants?.length || 0);

  const truncateDescription = (text, maxLength = 100) => {
    if (!text) return "";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  const handleViewDetails = () => {
    navigate(`/projects/${project._id}`);
  };

  const currentUserId = user?._id || user?.id;
  const ownerId = project.ownerId?._id || project.ownerId;
  const isOwner = currentUserId && ownerId && currentUserId === ownerId;
  const ownerLabel = isOwner
    ? t("card.you")
    : project.ownerId?.displayName ||
      [project.ownerId?.firstName, project.ownerId?.lastName].filter(Boolean).join(" ");

  const ageLabel = (() => {
    if (project.minAge && project.maxAge) return `${project.minAge}-${project.maxAge} ans`;
    if (project.minAge) return `${project.minAge}+`;
    if (project.maxAge) return t("card.upTo", { max: project.maxAge });
    return t("card.allAges");
  })();

  return (
    <div className={classes.projectCard} onClick={handleViewDetails}>

      {/* HEADER */}
      <div>
        <h3 className={classes.projectTitle}>{project.title}</h3>
        {ownerLabel && (
          <p className={classes.projectDescription}>
            {t("card.by", { name: ownerLabel })}
          </p>
        )}
        <p className={classes.projectDescription}>
          {truncateDescription(project.description)}
        </p>
      </div>

      {/* TAGS */}
      {project.tags?.length > 0 && (
        <div className={classes.tagContainer}>
          {project.tags.slice(0, 3).map((tag, index) => (
            <span key={index} className={classes.tag}>{tag}</span>
          ))}
          {project.tags.length > 3 && (
            <span className={classes.tag}>+{project.tags.length - 3}</span>
          )}
        </div>
      )}

      {/* INFOS */}
      <div className={classes.projectInfo}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Users size={14} />
          <span>
            {project.participants?.length || 0}/{project.maxParticipants} • {ageLabel}
          </span>
        </div>

        {project.projectMeta?.city && (
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <MapPin size={14} />
            <span>{project.projectMeta.city}</span>
          </div>
        )}
      </div>

      {/* STATUS */}
      {availableSlots === 0 && (
        <div className={classes.status}>
          <span className={classes.statusBadge}>{t("card.full")}</span>
        </div>
      )}
    </div>
  );
}

export default ProjectCard;
