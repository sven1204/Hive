import { useNavigate } from "react-router-dom";
import { Users, MapPin } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import classes from "./ProjectCard.module.css";
import { useTranslation } from "react-i18next";

/* Palette d'accents assignée par catégorie (déterministe, basée sur le premier
   tag du projet) pour que les cartes ne soient plus toutes identiques. */
const ACCENTS = [
  { text: "#2FA372", bg: "rgba(47, 163, 114, 0.12)", border: "rgba(47, 163, 114, 0.35)" },   // émeraude
  { text: "#C79A4A", bg: "rgba(199, 154, 74, 0.12)", border: "rgba(199, 154, 74, 0.35)" },   // sable
  { text: "#5B8DB8", bg: "rgba(91, 141, 184, 0.12)", border: "rgba(91, 141, 184, 0.35)" },   // ardoise
  { text: "#C9705A", bg: "rgba(201, 112, 90, 0.12)", border: "rgba(201, 112, 90, 0.35)" },   // argile
  { text: "#9B7BB8", bg: "rgba(155, 123, 184, 0.12)", border: "rgba(155, 123, 184, 0.35)" }, // prune
];

function getAccent(project) {
  const key = project.tags?.[0] || project.title || "";
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return ACCENTS[hash % ACCENTS.length];
}

/* Carte cliquable d'un projet. Gère :
   - l'affichage du propriétaire ("Vous" si c'est l'utilisateur connecté)
   - le label d'âge selon la combinaison minAge/maxAge
   - la troncature de la description
   - le badge "Complet" quand plus aucune place n'est disponible
   - un accent de couleur par catégorie pour varier visuellement les cartes */
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

  const accent = getAccent(project);

  return (
    <div
      className={classes.projectCard}
      onClick={handleViewDetails}
      style={{
        "--card-accent": accent.text,
        "--card-accent-bg": accent.bg,
        "--card-accent-border": accent.border,
      }}
    >

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
