import { TileLayer } from "react-leaflet";
import { getMapLayers } from "../lib/mapTiles";

/* Fond de carte commun (accueil, création et détail d'un projet) :
   fond neutre + relief ombré + noms de lieux, adaptés au thème. */
function BaseMapLayers({ theme }) {
  const layers = getMapLayers(theme);
  return (
    <>
      <TileLayer
        key={`base-${theme}`}
        url={layers.base.url}
        attribution={layers.base.attribution}
        maxNativeZoom={layers.maxNativeZoom}
        zIndex={1}
      />
      <TileLayer
        key={`relief-${theme}`}
        url={layers.relief.url}
        className={layers.relief.className}
        maxNativeZoom={layers.maxNativeZoom}
        zIndex={2}
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

export default BaseMapLayers;
