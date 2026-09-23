// Fond de carte : Esri (aucune clé API requise), en trois couches superposées :
//   1. un fond neutre (gris clair ou gris foncé selon le thème),
//   2. un ombrage du relief pour voir les montagnes (Alpes, Jura…),
//   3. les noms de lieux par-dessus pour qu'ils restent lisibles.
// CARTO a été abandonné : sans clé, ses tuiles affichent « API KEY REQUIRED ».
const ESRI = 'https://server.arcgisonline.com/ArcGIS/rest/services';
const tile = (service) => `${ESRI}/${service}/MapServer/tile/{z}/{y}/{x}`;

const ATTRIBUTION =
  'Fond &copy; <a href="https://www.esri.com/">Esri</a> &mdash; Esri, HERE, Garmin, USGS, NGA, NASA, &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

// Les services « Canvas » ne vont pas au-delà du niveau 16 : Leaflet agrandit
// ensuite les tuiles au lieu d'afficher des cases vides.
const MAX_NATIVE_ZOOM = 16;

export const LIGHT_MAP = {
  base: {url: tile('Canvas/World_Light_Gray_Base'), attribution: ATTRIBUTION},
  relief: {url: tile('Elevation/World_Hillshade'), className: 'hive-relief hive-relief--light'},
  labels: {url: tile('Canvas/World_Light_Gray_Reference')},
  maxNativeZoom: MAX_NATIVE_ZOOM,
};

export const DARK_MAP = {
  base: {url: tile('Canvas/World_Dark_Gray_Base'), attribution: ATTRIBUTION},
  relief: {url: tile('Elevation/World_Hillshade_Dark'), className: 'hive-relief hive-relief--dark'},
  labels: {url: tile('Canvas/World_Dark_Gray_Reference')},
  maxNativeZoom: MAX_NATIVE_ZOOM,
};

export const getMapLayers = (theme) => (theme === 'light' ? LIGHT_MAP : DARK_MAP);
