// Fond de carte de secours (voir BaseMapLayers.jsx) : tuiles Esri sans clé API,
// utilisées seulement si la carte vectorielle ne peut pas s'afficher (pas de WebGL,
// style indisponible). Deux couches : un fond neutre, puis les noms de lieux.
// CARTO a été abandonné : sans clé, ses tuiles affichent « API KEY REQUIRED ».
const ESRI = 'https://server.arcgisonline.com/ArcGIS/rest/services';
const tile = (service) => `${ESRI}/${service}/MapServer/tile/{z}/{y}/{x}`;

// Les services « Canvas » ne vont pas au-delà du niveau 16 : Leaflet agrandit
// ensuite les tuiles au lieu d'afficher des cases vides.
const MAX_NATIVE_ZOOM = 16;

export const LIGHT_MAP = {
  base: {url: tile('Canvas/World_Light_Gray_Base')},
  labels: {url: tile('Canvas/World_Light_Gray_Reference')},
  maxNativeZoom: MAX_NATIVE_ZOOM,
};

export const DARK_MAP = {
  base: {url: tile('Canvas/World_Dark_Gray_Base')},
  labels: {url: tile('Canvas/World_Dark_Gray_Reference')},
  maxNativeZoom: MAX_NATIVE_ZOOM,
};

export const getMapLayers = (theme) => (theme === 'light' ? LIGHT_MAP : DARK_MAP);
