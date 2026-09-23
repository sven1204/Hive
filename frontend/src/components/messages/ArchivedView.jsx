import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { ArrowLeft, ArchiveRestore, Trash2 } from "lucide-react";
import { PersonAvatar, ProjectAvatar } from "./Avatars";
import classes from "./ConversationList.module.css";

/* Sous-vue « Discussions archivées » : désarchiver (DM et groupes), supprimer (groupes, via modale) */
export default function ArchivedView({ items, onBack, onUnarchive, onDelete }) {
  const { t } = useTranslation();
  const backRef = useRef(null);

  useEffect(() => { backRef.current?.focus(); }, []);

  // Plus rien d'archivé : retour automatique à la liste
  useEffect(() => { if (items.length === 0) onBack(); }, [items.length, onBack]);

  return (
    <>
      <div className={classes.head}>
        <button ref={backRef} type="button" className={classes.iconBtn} onClick={onBack} aria-label={t("messages.backToList")}>
          <ArrowLeft size={20} aria-hidden="true" />
        </button>
        <h1 className={classes.subTitle}>{t("messages.archivedTitle")}</h1>
      </div>
      <div className={classes.scroll}>
        <ul className={classes.list}>
          {items.map((item) => (
            <li key={item.key} className={classes.archivedItem}>
              {item.type === "group"
                ? <ProjectAvatar conversation={item.conversation} title={item.name} size={48} dimmed />
                : <PersonAvatar user={item.partner} size={48} dimmed />}
              <span className={classes.rowName}>{item.name}</span>
              <span className={classes.archivedActions}>
                <button
                  type="button"
                  className={`${classes.iconBtn} ${classes.restoreBtn}`}
                  onClick={() => onUnarchive(item)}
                  aria-label={t("messages.unarchiveName", { name: item.name })}
                >
                  <ArchiveRestore size={20} aria-hidden="true" />
                </button>
                {item.type === "group" && (
                  <button
                    type="button"
                    className={`${classes.iconBtn} ${classes.deleteBtn}`}
                    onClick={() => onDelete(item)}
                    aria-label={t("messages.deleteConvName", { name: item.name })}
                  >
                    <Trash2 size={20} aria-hidden="true" />
                  </button>
                )}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
