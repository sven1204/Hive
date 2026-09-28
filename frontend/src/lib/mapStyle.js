// Fond de carte vectoriel : OpenFreeMap (gratuit, sans clé, données OpenStreetMap),
// affiché par MapLibre. Le texte reste net à tous les zooms et sur écran haute densité.
// Les styles publics « positron » (clair) et « dark » (sombre) sont retouchés aux
// couleurs de Hive (miel, neutres chauds) avant affichage.
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
    ['background', 'background-color', '#f6efe3'],
    ['water', 'fill-color', '#cfdce0'],
    ['park', 'fill-color', '#e6e7d2'],
    ['landcover_wood', 'fill-color', '#dfe2cb'],
    ['landuse_residential', 'fill-color', '#f1e9dc'],
    ['building', 'fill-color', '#ebe1d1'],
    ['boundary_2', 'line-color', '#bfae98'],
    ['boundary_3', 'line-color', '#cfc1ad'],
    ['label_city', 'text-color', '#3a2c1f'],
    ['label_city_capital', 'text-color', '#3a2c1f'],
    ['label_town', 'text-color', '#4a3a2b'],
    ['label_village', 'text-color', '#5e4d3c'],
    ['water_name_point_label', 'text-color', '#56707a'],
    ['water_name_line_label', 'text-color', '#56707a'],
  ],
  dark: [
    ['background', 'background-color', '#1a1511'],
    ['water', 'fill-color', '#1b2327'],
    ['landuse_residential', 'fill-color', '#1f1914'],
    ['landcover_wood', 'fill-color', '#1c1b14'],
    ['building', 'fill-color', '#221c16'],
  ],
};

// Couleur affichée pendant le chargement des tuiles (évite un flash blanc).
export const MAP_BACKGROUND = { light: '#f6efe3', dark: '#1a1511' };

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
