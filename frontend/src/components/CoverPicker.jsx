import { useId, useRef, useState } from "react";
import { ImagePlus, RefreshCw, Trash2, LoaderCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { COVER_ACCEPT, prepareCover } from "../lib/projectCover";
import ProjectCover from "./ProjectCover";
import classes from "./CoverPicker.module.css";

/* Choix de l'image de couverture (création et modification d'un projet).
   Aperçu au format de la bannière de la page projet ; sans image, on montre la
   couverture générée qui sera utilisée. Accepte le clic et le glisser-déposer.
   `previewUrl` : image à afficher (nouvelle ou existante), null s'il n'y en a pas.
   `onPick(prepared)` : nouvelle image prête ({ full, thumb }) ; `onRemove()` : retirer. */
function CoverPicker({ previewUrl, placeholderProject, onPick, onRemove }) {
  const { t } = useTranslation();
  const inputRef = useRef(null);
  const hintId = useId();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);

  const handleFile = async (file) => {
    if (!file) return;
    setError("");
    setBusy(true);
    try {
      onPick(await prepareCover(file));
    } catch (err) {
      const code = ["invalidType", "tooLarge"].includes(err.message) ? err.message : "unreadable";
      setError(t(`cover.error.${code}`));
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const onDrop = (event) => {
    event.preventDefault();
    setDragging(false);
    handleFile(event.dataTransfer.files?.[0]);
  };

  return (
    <div className={classes.picker}>
      <div
        className={`${classes.preview} ${dragging ? classes.dragging : ""}`}
        onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
      >
        {previewUrl ? (
          <img className={classes.previewImage} src={previewUrl} alt={t("cover.previewAlt")} />
        ) : (
          <ProjectCover
            project={placeholderProject}
            size="full"
            showInitials={Boolean(placeholderProject?.title?.trim())}
            className={classes.generated}
          />
        )}
        {!previewUrl && !busy && (
          <p className={classes.generatedNote}>{t("cover.generatedNote")}</p>
        )}
        {busy && (
          <div className={classes.busy} role="status">
            <LoaderCircle size={18} className={classes.spin} aria-hidden="true" />
            {t("cover.preparing")}
          </div>
        )}
      </div>

      <div className={classes.actions}>
        <button
          type="button"
          className={classes.pickBtn}
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          aria-describedby={hintId}
        >
          {previewUrl ? <RefreshCw size={16} aria-hidden="true" /> : <ImagePlus size={16} aria-hidden="true" />}
          {previewUrl ? t("cover.change") : t("cover.choose")}
        </button>
        {previewUrl && (
          <button type="button" className={classes.removeBtn} onClick={() => { setError(""); onRemove(); }} disabled={busy}>
            <Trash2 size={16} aria-hidden="true" />
            {t("cover.remove")}
          </button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={COVER_ACCEPT}
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
          onChange={(event) => handleFile(event.target.files?.[0])}
        />
      </div>

      <p id={hintId} className={classes.hint}>{t("cover.hint")}</p>
      {error && <p className={classes.error} role="alert">{error}</p>}
    </div>
  );
}

export default CoverPicker;
