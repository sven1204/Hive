import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, Marker, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MagnifyingGlass } from 'react-loader-spinner';
import { MapPin, Users, Calendar, X, ArrowUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import { api } from '../lib/api';
import { DARK_TILE_LAYER, LIGHT_TILE_LAYER } from '../lib/mapTiles';
import classes from './MapView.module.css';

/* Centre par défaut : Genève. Recalé sur la position réelle de l'utilisateur dès que la géolocalisation est disponible. */
const DEFAULT_CENTER = [46.2044, 6.1432];

const PROJECT_PIN_SVG = `<svg width="34" height="42" viewBox="0 0 34 42" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="ps" x="-50%" y="-50%" width="200%" height="200%">
      <feDropShadow dx="0" dy="4" stdDeviation="3" flood-color="#08111d" flood-opacity="0.28"/>
    </filter>
  </defs>
  <g filter="url(#ps)">
    <path d="M17 2C9.82 2 4 7.82 4 15c0 9.45 11.2 20.84 12.45 22.08a.78.78 0 0 0 1.1 0C18.8 35.84 30 24.45 30 15 30 7.82 24.18 2 17 2Z" fill="#EF9F27"/>
    <path d="M17 5.2c5.4 0 9.8 4.4 9.8 9.8 0 6.03-6.15 13.96-9.8 17.82C13.35 28.96 7.2 21.03 7.2 15c0-5.4 4.4-9.8 9.8-9.8Z" fill="#0B1220"/>
    <ellipse cx="17" cy="14.8" rx="6.3" ry="7.2" fill="#F8FFFB"/>
    <path d="M12.7 16.1 14.7 18.2 16 15.2 17.2 17.5 18.8 14.5 20.8 18 21.5 17.2" fill="none" stroke="#0B1220" stroke-width="1.45" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M11.95 16.85c.25 3.7 2.48 6.42 5.05 6.42 2.63 0 4.85-2.79 5.06-6.57l-1 1.01c-.28.28-.74.2-.91-.16l-1.13-2.23-1.3 2.49c-.22.42-.81.43-1.04.02l-.85-1.57-.99 2.26c-.18.42-.73.52-1.04.19l-1.85-1.86Z" fill="#EF9F27"/>
  </g>
</svg>`;

const projectIcon = L.divIcon({
  html: PROJECT_PIN_SVG,
  className: "",
  iconSize: [34, 42],
  iconAnchor: [17, 42],
  popupAnchor: [0, -42],
});

function createClusterIcon(count) {
  const size = count >= 20 ? 58 : count >= 10 ? 52 : 46;
  return L.divIcon({
    html: `
      <div class="${classes.clusterMarker}" style="width:${size}px;height:${size}px;">
        <div class="${classes.clusterMarkerInner}">
          <span>${count}</span>
        </div>
      </div>
    `,
    className: classes.clusterMarkerWrap,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function Recenter({ position }) {
  const map = useMap();

  useEffect(() => {
    if (position) {
      map.setView(position, 10, { animate: true });
    }
  }, [position, map]);

  return null;
}

function MapSizeInvalidator() {
  const map = useMap();

  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 50);
    return () => clearTimeout(t);
  }, [map]);

  return null;
}

function PanToSelected({ project }) {
  const map = useMap();

  useEffect(() => {
    if (!project) return;
    const pos = getProjectPosition(project);
    if (!pos) return;
    if (window.innerWidth > 900) return;

    // Décaler le centre vers le haut pour que le marqueur soit au-dessus du panel
    const containerPt = map.latLngToContainerPoint(pos);
    const shifted = L.point(containerPt.x, containerPt.y - 100);
    map.panTo(map.containerPointToLatLng(shifted), { animate: true, duration: 0.3 });
  }, [project, map]);

  return null;
}

function formatDate(dateStr) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString('fr-CH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatAgeLabel(project) {
  if (project.minAge && project.maxAge) return `${project.minAge}-${project.maxAge} ans`;
  if (project.minAge) return `${project.minAge}+`;
  if (project.maxAge) return `jusqu'à ${project.maxAge} ans`;
  return null;
}

function getProjectPosition(project) {
  const coords = project.location?.coordinates;
  if (!coords || coords.length !== 2) return null;
  if (coords[0] === 0 && coords[1] === 0) return null;
  return [coords[1], coords[0]];
}

function getClusterRadius(zoom) {
  if (zoom <= 6) return 110;
  if (zoom <= 8) return 85;
  if (zoom <= 10) return 65;
  return 0;
}

/* Gère le clustering manuel des markers Leaflet : regroupe les projets proches en fonction du zoom. */
function ProjectMarkers({ projects, onProjectClick }) {
  const map = useMap();
  const [zoom, setZoom] = useState(map.getZoom());
  const [clusters, setClusters] = useState([]);

  useEffect(() => {
    const syncClusters = () => {
      const nextZoom = map.getZoom();
      setZoom(nextZoom);

      const radius = getClusterRadius(nextZoom);
      if (radius === 0) {
        setClusters(projects.map((project) => ({
          type: 'project',
          id: project._id,
          position: getProjectPosition(project),
          project,
        })));
        return;
      }

      const grouped = new Map();

      projects.forEach((project) => {
        const position = getProjectPosition(project);
        if (!position) return;

        const point = map.project(L.latLng(position[0], position[1]), nextZoom);
        const key = `${Math.floor(point.x / radius)}:${Math.floor(point.y / radius)}`;

        if (!grouped.has(key)) {
          grouped.set(key, { projects: [], pointX: 0, pointY: 0 });
        }

        const cluster = grouped.get(key);
        cluster.projects.push(project);
        cluster.pointX += point.x;
        cluster.pointY += point.y;
      });

      const nextClusters = Array.from(grouped.values()).map((cluster, index) => {
        if (cluster.projects.length === 1) {
          const project = cluster.projects[0];
          return { type: 'project', id: project._id, position: getProjectPosition(project), project };
        }

        const averagePoint = L.point(cluster.pointX / cluster.projects.length, cluster.pointY / cluster.projects.length);
        const center = map.unproject(averagePoint, nextZoom);

        return {
          type: 'cluster',
          id: `cluster-${nextZoom}-${index}`,
          position: [center.lat, center.lng],
          projects: cluster.projects,
          count: cluster.projects.length,
        };
      });

      setClusters(nextClusters);
    };

    syncClusters();
    map.on('zoomend moveend', syncClusters);
    return () => { map.off('zoomend moveend', syncClusters); };
  }, [map, projects]);

  return (
    <>
      {clusters.map((entry) => {
        if (entry.type === 'cluster') {
          return (
            <Marker
              key={entry.id}
              position={entry.position}
              icon={createClusterIcon(entry.count)}
              eventHandlers={{
                click: () => { map.setView(entry.position, Math.min(zoom + 2, 12), { animate: true }); },
              }}
            />
          );
        }

        return (
          <Marker
            key={entry.id}
            position={entry.position}
            icon={projectIcon}
            eventHandlers={{ click: () => onProjectClick(entry.project._id) }}
          />
        );
      })}
    </>
  );
}

/* Vue principale de la carte : charge tous les projets, géolocalise l'utilisateur,
   et affiche un panneau latéral glissant au clic sur un marker. */
function MapView() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [userLocation, setUserLocation] = useState(null);
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [showHint, setShowHint] = useState(true);
  const [showScrollTop, setShowScrollTop] = useState(false);
  // La molette ne zoome la carte qu'après un clic dessus, pour ne pas
  // capturer le scroll de la page quand on la traverse simplement.
  const [mapActive, setMapActive] = useState(false);

  // Le scroll sur la carte zoome au lieu de faire défiler la page : ce bouton
  // permet de revenir en haut sans avoir à quitter la carte au clavier/trackpad.
  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 200);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  useEffect(() => {
    api('/projects?status=open')
      .then((data) => setProjects(Array.isArray(data) ? data : []))
      .catch((err) => { console.error('Erreur chargement projets:', err); setProjects([]); })
      .finally(() => setLoadingProjects(false));
  }, []);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => { setUserLocation([pos.coords.latitude, pos.coords.longitude]); },
        (err) => console.error('Erreur de géolocalisation :', err)
      );
    }
  }, []);

  const { theme } = useTheme();
  const tileLayer = theme === "light" ? LIGHT_TILE_LAYER : DARK_TILE_LAYER;

  const mappableProjects = useMemo(() => projects.filter((project) => getProjectPosition(project)), [projects]);
  const selectedProject = useMemo(() => mappableProjects.find((project) => project._id === selectedProjectId) || null, [mappableProjects, selectedProjectId]);
  const isBusy = !userLocation && loadingProjects;

  return (
    <div className={classes.mapShell}>
      {showScrollTop && (
        <button
          type="button"
          className={classes.scrollTopBtn}
          onClick={scrollToTop}
          aria-label={t("map.backToTop")}
          title={t("map.backToTop")}
        >
          <ArrowUp size={16} />
        </button>
      )}

      {isBusy && (
        <div className={classes.loadingOverlay}>
          <MagnifyingGlass
            visible
            height="80"
            width="80"
            ariaLabel="magnifying-glass-loading"
            wrapperStyle={{ position: 'absolute', inset: '50%', transform: 'translate(-50%, -50%)' }}
            wrapperClass="magnifying-glass-wrapper"
            glassColor="rgba(255, 255, 255, .1)"
            color="#707070"
          />
        </div>
      )}

      {showHint && !selectedProject && (
        <div className={classes.mapHint}>
          <button
            type="button"
            className={classes.hintClose}
            onClick={() => setShowHint(false)}
            aria-label={t("map.closeHint")}
          >
            <X size={16} />
          </button>
          {t("map.hint")}
        </div>
      )}

      {mappableProjects.length === 0 && !loadingProjects && (
        <div className={classes.emptyState}>
          <strong>{t("map.noProjects")}</strong>
          {t("map.noProjectsHint")}
        </div>
      )}

      <div className={classes.panelWrap}>
        <aside className={`${classes.panel} ${selectedProject ? classes.panelOpen : ''}`}>
          <div className={classes.panelHandle} />
          {selectedProject && (
            <>
              <div className={classes.panelHeader}>
                <div>
                  <div className={classes.panelEyebrow}>
                    <MapPin size={14} />
                    {t("map.projectOnMap")}
                  </div>
                  <h2 className={classes.panelTitle}>{selectedProject.title}</h2>
                </div>

                <button
                  type="button"
                  className={classes.closeButton}
                  onClick={() => setSelectedProjectId(null)}
                  aria-label={t("map.closePanel")}
                >
                  
                  <X size={18} />
                </button>
              </div>

              <div className={classes.panelBody} onClick={() => navigate(`/projects/${selectedProject._id}`)} style={{ cursor: 'pointer' }}>
                <div className={classes.metaRow}>
                  {selectedProject.projectMeta?.city && (
                    <span className={classes.metaPill}>
                      <MapPin size={13} />
                      {[selectedProject.projectMeta.city, selectedProject.projectMeta.region].filter(Boolean).join(', ')}
                    </span>
                  )}
                  <span className={classes.metaPill}>
                    <Users size={13} />
                    {selectedProject.participants?.length || 0}
                    {selectedProject.maxParticipants ? `/${selectedProject.maxParticipants}` : ''} {t("map.members")}
                  </span>
                  {formatAgeLabel(selectedProject) && (
                    <span className={classes.metaPill}>
                      <Users size={13} />
                      {formatAgeLabel(selectedProject)}
                    </span>
                  )}
                  {selectedProject.projectMeta?.startDate && (
                    <span className={classes.metaPill}>
                      <Calendar size={13} />
                      {formatDate(selectedProject.projectMeta.startDate)}
                      {selectedProject.projectMeta?.endDate
                        ? ` → ${formatDate(selectedProject.projectMeta.endDate)}`
                        : ` ${t("map.recurring")}`}
                    </span>
                  )}
                </div>

                <div>
                  <h3 className={classes.sectionTitle}>{t("map.description")}</h3>
                  <p className={classes.description}>
                    {selectedProject.description || t("map.noDescription")}
                  </p>
                </div>

                {selectedProject.tags?.length > 0 && (
                  <div>
                    <h3 className={classes.sectionTitle}>{t("map.tags")}</h3>
                    <div className={classes.tagList}>
                      {selectedProject.tags.map((tag) => (
                        <span key={tag} className={classes.tag}>{tag}</span>
                      ))}
                    </div>
                  </div>
                )}

                <div className={classes.actions}>
                  <span className={classes.primaryButton}>
                    {t("map.openProject")}
                  </span>
                </div>
              </div>
            </>
          )}
        </aside>
      </div>

      <div
        className={classes.mapCanvasWrap}
        onClick={() => setMapActive(true)}
        onMouseLeave={() => setMapActive(false)}
      >
        {!mapActive && (
          <div className={classes.scrollHint}>{t("map.scrollHint")}</div>
        )}

        <MapContainer
          center={DEFAULT_CENTER}
          zoom={7}
          zoomControl={false}
          scrollWheelZoom={mapActive}
          className={classes.mapCanvas}
        >
          <TileLayer
            attribution={tileLayer.attribution}
            url={tileLayer.url}
          />
          <MapSizeInvalidator />
          <PanToSelected project={selectedProject} />
          {userLocation && <Recenter position={userLocation} />}
          <ProjectMarkers projects={mappableProjects} onProjectClick={setSelectedProjectId} />
        </MapContainer>
      </div>
    </div>
  );
}

export default MapView;
