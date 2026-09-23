import { TileLayer } from "react-leaflet";
import { getMapLayers } from "../lib/mapTiles";

/* Fond de carte commun (accueil, création et détail d'un projet) :
   fond neutre + relief ombré + noms de lieux, adaptés au thème.
   detectRetina sur le fond et le relief : sur écran haute densité, Leaflet charge
   des tuiles plus détaillées (net au lieu de flou). Pas sur les noms de lieux :
   le texte y serait deux fois plus petit, donc illisible. */
function BaseMapLayers({ theme }) {
  const layers = getMapLayers(theme);
  return (
    <>
      <TileLayer
        key={`base-${theme}`}
        url={layers.base.url}
        attribution={layers.base.attribution}
        maxNativeZoom={layers.maxNativeZoom}
        detectRetina
        zIndex={1}
      />
      <TileLayer
        key={`relief-${theme}`}
        url={layers.relief.url}
        className={layers.relief.className}
        maxNativeZoom={layers.maxNativeZoom}
        detectRetina
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
