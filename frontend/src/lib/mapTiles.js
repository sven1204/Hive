// CARTO exige désormais une clé API (gratuite) même pour les fonds de carte de base.
// Injectée au build via REACT_APP_CARTO_API_KEY (voir docker-compose.*.yml).
const CARTO_API_KEY = process.env.REACT_APP_CARTO_API_KEY || "";
const KEY_PARAM = CARTO_API_KEY ? `?api_key=${CARTO_API_KEY}` : "";

export const DARK_TILE_LAYER = {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>',
  url: `https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png${KEY_PARAM}`,
};

export const LIGHT_TILE_LAYER = {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>',
  url: `https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png${KEY_PARAM}`,
};

// Alias conservé pour ne pas casser les imports existants
export const DEFAULT_TILE_LAYER = DARK_TILE_LAYER;
