import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  Search, X, Archive, ChevronRight, MessageSquare, AlertCircle, RotateCw,
} from "lucide-react";
import ConversationRow from "./ConversationRow";
import ArchivedView from "./ArchivedView";
import { ActionSheet } from "./Dialogs";
import { normalize } from "./messageUtils";
import classes from "./ConversationList.module.css";

function ListSkeleton() {
  const { t } = useTranslation();
  return (
    <div className={classes.skeletonList} aria-busy="true">
      <span className="sr-only">{t("messages.loading")}</span>
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className={classes.skeletonRow} aria-hidden="true">
          <span className={classes.skeletonAvatar} />
          <span className={classes.skeletonLines}>
            <span className={classes.skeletonBar} style={{ width: "40%" }} />
            <span className={classes.skeletonBar} style={{ width: "70%" }} />
          </span>
        </div>
      ))}
    </div>
  );
}

/* Colonne de gauche : titre, recherche, « Archivées (N) », liste unique DM + groupes */
export default function ConversationList({
  items,
  status,
  onRetry,
  activeKey,
  myId,
  onOpen,
  getRowActions,
  archivedItems,
  onUnarchive,
  onDelete,
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [sheetItem, setSheetItem] = useState(null);

  const trimmed = query.trim();
  const filtered = useMemo(() => {
    if (!trimmed) return items;
    const q = normalize(trimmed);
    return items.filter((item) =>
      [item.name, item.lastMessage?.deleted ? "" : item.lastMessage?.content]
        .some((field) => normalize(field).includes(q))
    );
  }, [items, trimmed]);

  const openSheet = useCallback((item) => setSheetItem(item), []);

  if (showArchived) {
    return (
      <ArchivedView
        items={archivedItems}
        onBack={() => setShowArchived(false)}
        onUnarchive={onUnarchive}
        onDelete={onDelete}
      />
    );
  }

  let body;
  if (status === "loading") {
    body = <ListSkeleton />;
  } else if (status === "error") {
    body = (
      <div className={classes.state} role="alert">
        <AlertCircle size={28} aria-hidden="true" className={classes.stateIconError} />
        <p className={classes.stateText}>{t("messages.loadErrorList")}</p>
        <button type="button" className={classes.secondaryBtn} onClick={onRetry}>
          <RotateCw size={18} aria-hidden="true" /> {t("messages.retry")}
        </button>
      </div>
    );
  } else if (items.length === 0) {
    body = (
      <div className={classes.state}>
        <span className={classes.stateBadge} aria-hidden="true"><MessageSquare size={28} /></span>
        <p className={classes.stateTitle}>{t("messages.emptyListTitle")}</p>
        <p className={classes.stateText}>{t("messages.emptyListText")}</p>
        <button type="button" className={classes.primaryBtn} onClick={() => navigate("/projects")}>
          {t("messages.exploreProjects")}
        </button>
      </div>
    );
  } else if (filtered.length === 0) {
    body = <p className={classes.noResults}>{t("messages.searchNoResults", { query: trimmed })}</p>;
  } else {
    body = (
      <ul className={classes.list}>
        {filtered.map((item) => (
          <ConversationRow
            key={item.key}
            item={item}
            active={item.key === activeKey}
            myId={myId}
            onOpen={onOpen}
            onLongPress={openSheet}
          />
        ))}
      </ul>
    );
  }

  return (
    <>
      <div className={classes.head}>
        <h1 className={classes.title}>{t("messages.title")}</h1>
      </div>

      {status === "ready" && items.length > 0 && (
        <div role="search" className={classes.search}>
          <Search size={18} aria-hidden="true" className={classes.searchIcon} />
          <input
            type="search"
            className={classes.searchInput}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("messages.searchPlaceholder")}
            aria-label={t("messages.searchLabel")}
          />
          {query && (
            <button
              type="button"
              className={classes.searchClear}
              onClick={() => setQuery("")}
              aria-label={t("messages.searchClear")}
            >
              <X size={18} aria-hidden="true" />
            </button>
          )}
        </div>
      )}

      <div className={classes.scroll}>
        {!trimmed && archivedItems.length > 0 && (
          <button type="button" className={classes.archivedRow} onClick={() => setShowArchived(true)}>
            <span className={classes.archivedIcon} aria-hidden="true"><Archive size={20} /></span>
            <span className={classes.archivedLabel}>{t("messages.archived")}</span>
            <span className={classes.archivedCount}>({archivedItems.length})</span>
            <ChevronRight size={18} aria-hidden="true" className={classes.archivedChevron} />
          </button>
        )}
        {body}
      </div>

      {sheetItem && (
        <ActionSheet
          title={sheetItem.name}
          items={getRowActions(sheetItem)}
          onClose={() => setSheetItem(null)}
        />
      )}
    </>
  );
}
