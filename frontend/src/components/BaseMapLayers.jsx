import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import { Info } from "lucide-react";
import { useTranslation } from "react-i18next";
import { getMapLayers } from "../lib/mapTiles";
import { loadHiveMapStyle, supportsWebGL, MAP_ATTRIBUTION, MAP_BACKGROUND } from "../lib/mapStyle";

/* Fond de carte commun (accueil, création et détail d'un projet).
   - Par défaut : carte vectorielle OpenFreeMap aux couleurs de Hive (MapLibre).
   - Repli si WebGL ou le style ne sont pas disponibles : tuiles Esri sans relief.
   - Le texte « Leaflet » par défaut est remplacé par un crédit discret : les
     données OpenStreetMap doivent rester créditées, mais derrière un bouton (i). */
function BaseMapLayers({ theme }) {
  const [vectorFailed, setVectorFailed] = useState(false);
  const onVectorFail = useCallback(() => setVectorFailed(true), []);

  return (
    <>
      <MapBackground theme={theme} />
      {vectorFailed ? <RasterLayers theme={theme} /> : <VectorLayer theme={theme} onFail={onVectorFail} />}
      <MapCredit sources={vectorFailed ? ESRI_CREDIT : MAP_ATTRIBUTION} />
    </>
  );
}

/* Couleur du fond pendant le chargement des tuiles : évite un flash blanc en thème sombre. */
function MapBackground({ theme }) {
  const map = useMap();
  useEffect(() => {
    const container = map.getContainer?.();
    if (container) container.style.background = MAP_BACKGROUND[theme === "light" ? "light" : "dark"];
  }, [map, theme]);
  return null;
}

function VectorLayer({ theme, onFail }) {
  const map = useMap();

  useEffect(() => {
    let layer = null;
    let cancelled = false;

    (async () => {
      try {
        if (typeof map.addLayer !== "function" || !supportsWebGL()) throw new Error("WebGL indisponible");
        await Promise.all([
          import("maplibre-gl/dist/maplibre-gl.css"),
          import("@maplibre/maplibre-gl-leaflet"),
        ]);
        const style = await loadHiveMapStyle(theme);
        if (cancelled) return;
        layer = L.maplibreGL({ style, attributionControl: false, interactive: false });
        layer.addTo(map);
      } catch (err) {
        if (!cancelled) {
          console.warn("Carte vectorielle indisponible, repli sur les tuiles :", err);
          onFail();
        }
      }
    })();

    return () => {
      cancelled = true;
      if (layer) map.removeLayer(layer);
    };
  }, [map, theme, onFail]);

  return null;
}

function RasterLayers({ theme }) {
  const layers = getMapLayers(theme);
  return (
    <>
      <TileLayer
        key={`base-${theme}`}
        url={layers.base.url}
        maxNativeZoom={layers.maxNativeZoom}
        detectRetina
        zIndex={1}
      />
      <TileLayer
        key={`labels-${theme}`}
        url={layers.labels.url}
        maxNativeZoom={layers.maxNativeZoom}
        zIndex={3}
      />
    </>
  );
}

const ESRI_CREDIT = [
  { label: "Esri", href: "https://www.esri.com/" },
  { label: "OpenStreetMap", href: "https://www.openstreetmap.org/copyright" },
];

/* Crédit compact en bas à droite : ouvert quelques secondes au chargement,
   puis réduit à un bouton (i). Rendu dans un contrôle Leaflet via un portail React. */
function MapCredit({ sources }) {
  const map = useMap();
  const { t } = useTranslation();
  const [container, setContainer] = useState(null);
  const [open, setOpen] = useState(true);

  useEffect(() => {
    // Les tests simulent une carte partielle, sans gestion des contrôles.
    if (typeof map.addControl !== "function") return undefined;
    map.attributionControl?.remove();
    const Control = L.Control.extend({
      options: { position: "bottomright" },
      onAdd() {
        const el = L.DomUtil.create("div", "hive-map-credit");
        L.DomEvent.disableClickPropagation(el);
        return el;
      },
    });
    const control = new Control();
    control.addTo(map);
    setContainer(control.getContainer());
    const timer = setTimeout(() => setOpen(false), 4000);
    return () => {
      clearTimeout(timer);
      control.remove();
    };
  }, [map]);

  if (!container) return null;

  return createPortal(
    <div className={`hive-map-credit__inner${open ? " is-open" : ""}`}>
      {open && (
        <span className="hive-map-credit__text">
          ©{" "}
          {sources.map((source, index) => (
            <span key={source.label}>
              {index > 0 && ", "}
              <a href={source.href} target="_blank" rel="noreferrer">{source.label}</a>
            </span>
          ))}
        </span>
      )}
      <button
        type="button"
        className="hive-map-credit__btn"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-label={t("map.credits")}
      >
        <Info size={14} aria-hidden="true" />
      </button>
    </div>,
    container
  );
}

export default BaseMapLayers;
