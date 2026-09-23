// Fond de carte vectoriel : OpenFreeMap (gratuit, sans clé, données OpenStreetMap),
// affiché par MapLibre. Le texte reste net à tous les zooms et sur écran haute densité.
// Les styles publics « positron » (clair) et « dark » (sombre) sont retouchés aux
// couleurs de Hive (vert sauge) avant affichage.
const STYLE_URLS = {
  light: 'https://tiles.openfreemap.org/styles/positron',
  dark: 'https://tiles.openfreemap.org/styles/dark',
};

export const MAP_ATTRIBUTION = [
  { label: 'OpenFreeMap', href: 'https://openfreemap.org' },
  { label: 'OpenMapTiles', href: 'https://www.openmaptiles.org/' },
  { label: 'OpenStreetMap', href: 'https://www.openstreetmap.org/copyright' },
];

// [identifiant de couche, propriété, valeur]. Une couche absente du style est ignorée.
const HIVE_PAINT = {
  light: [
    ['background', 'background-color', '#eff2ed'],
    ['water', 'fill-color', '#c3d9d3'],
    ['park', 'fill-color', '#dfe9dd'],
    ['landcover_wood', 'fill-color', '#d7e4d4'],
    ['landuse_residential', 'fill-color', '#e8ebe5'],
    ['building', 'fill-color', '#e4e8e1'],
    ['boundary_2', 'line-color', '#a9b6ae'],
    ['boundary_3', 'line-color', '#bcc6c0'],
    ['label_city', 'text-color', '#24302a'],
    ['label_city_capital', 'text-color', '#24302a'],
    ['label_town', 'text-color', '#3a463f'],
    ['label_village', 'text-color', '#4f5b54'],
    ['water_name_point_label', 'text-color', '#5d7f76'],
    ['water_name_line_label', 'text-color', '#5d7f76'],
  ],
  dark: [
    ['background', 'background-color', '#151a17'],
    ['water', 'fill-color', '#1d2c28'],
    ['landuse_residential', 'fill-color', '#1a201c'],
    ['landcover_wood', 'fill-color', '#18221c'],
    ['building', 'fill-color', '#1b211e'],
  ],
};

// Couleur affichée pendant le chargement des tuiles (évite un flash blanc).
export const MAP_BACKGROUND = { light: '#eff2ed', dark: '#151a17' };

const cache = {};

export async function loadHiveMapStyle(theme) {
  const key = theme === 'light' ? 'light' : 'dark';
  if (!cache[key]) {
    cache[key] = fetch(STYLE_URLS[key])
      .then((res) => {
        if (!res.ok) throw new Error(`Style ${key} indisponible (${res.status})`);
        return res.json();
      })
      .then((style) => {
        const byId = new Map(style.layers.map((layer) => [layer.id, layer]));
        HIVE_PAINT[key].forEach(([id, prop, value]) => {
          const layer = byId.get(id);
          if (layer) layer.paint = { ...layer.paint, [prop]: value };
        });
        return style;
      })
      .catch((err) => {
        delete cache[key];
        throw err;
      });
  }
  return cache[key];
}

export function supportsWebGL() {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'));
  } catch {
    return false;
  }
}
