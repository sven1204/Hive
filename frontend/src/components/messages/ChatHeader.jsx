import { useTranslation } from "react-i18next";
import { ArrowLeft, MoreHorizontal } from "lucide-react";
import { PersonAvatar, ProjectAvatar } from "./Avatars";
import ActionMenu from "./ActionMenu";
import classes from "./Chat.module.css";

/* En-tête de discussion : [Retour (mobile)] [identité] [⋯].
   Le sous-titre n'affiche que des informations vraies (frappe, nombre de participants). */
export default function ChatHeader({
  titleId,
  isGroup,
  name,
  partner,
  conversation,
  subtitle,
  subtitleIsTyping,
  showBack,
  onBack,
  onIdentity,
  identityLabel,
  membersOpen,
  membersPanelId,
  menuItems,
}) {
  const { t } = useTranslation();
  return (
    <header className={classes.header}>
      {/* Titre de la section (le nom visible est dans le bouton d'identité) */}
      <h2 id={titleId} className="sr-only">{name}</h2>
      {showBack && (
        <button type="button" className={classes.iconBtn} onClick={onBack} aria-label={t("messages.backToList")}>
          <ArrowLeft size={20} aria-hidden="true" />
        </button>
      )}
      <button
        type="button"
        className={classes.identity}
        onClick={onIdentity}
        aria-label={isGroup ? undefined : identityLabel}
        aria-expanded={isGroup ? membersOpen : undefined}
        aria-controls={isGroup && membersOpen ? membersPanelId : undefined}
      >
        {isGroup
          ? <ProjectAvatar conversation={conversation} title={name} size={40} />
          : <PersonAvatar user={partner} size={40} />}
        <span className={classes.identityText}>
          <span className={classes.headerName}>{name}</span>
          {subtitle && (
            <span className={`${classes.headerSub} ${subtitleIsTyping ? classes.headerSubTyping : ""}`}>
              {subtitle}
            </span>
          )}
        </span>
      </button>
      <ActionMenu
        items={menuItems}
        buttonLabel={t("messages.convOptions")}
        buttonClassName={classes.iconBtn}
        openClassName={classes.iconBtnOpen}
        wrapperClassName={classes.headerMenu}
        icon={<MoreHorizontal size={20} aria-hidden="true" />}
      />
    </header>
  );
}
