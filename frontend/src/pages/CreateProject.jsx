import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { X, MapPin, LoaderCircle } from "lucide-react";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useTranslation } from "react-i18next";
import { api } from "../lib/api";
import { DARK_TILE_LAYER, LIGHT_TILE_LAYER } from "../lib/mapTiles";
import { useTheme } from "../context/ThemeContext";
import classes from "./CreateProject.module.css";

const DRAFT_STORAGE_KEY = "hive-create-project-draft";
const DEFAULT_MAP_CENTER = [46.2044, 6.1432];

function svgToDataUrl(svg) {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

const LOCATION_ICON = L.icon({
  iconUrl: svgToDataUrl(`
    <svg width="34" height="42" viewBox="0 0 34 42" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="4" stdDeviation="3" flood-color="#08111d" flood-opacity="0.28"/>
        </filter>
      </defs>
      <g filter="url(#shadow)">
        <path d="M17 2C9.82 2 4 7.82 4 15c0 9.45 11.2 20.84 12.45 22.08a.78.78 0 0 0 1.1 0C18.8 35.84 30 24.45 30 15 30 7.82 24.18 2 17 2Z" fill="#EF9F27"/>
        <path d="M17 5.2c5.4 0 9.8 4.4 9.8 9.8 0 6.03-6.15 13.96-9.8 17.82C13.35 28.96 7.2 21.03 7.2 15c0-5.4 4.4-9.8 9.8-9.8Z" fill="#0B1220"/>
        <ellipse cx="17" cy="14.8" rx="6.3" ry="7.2" fill="#F8FFFB"/>
        <path d="M12.7 16.1 14.7 18.2 16 15.2 17.2 17.5 18.8 14.5 20.8 18 21.5 17.2" fill="none" stroke="#0B1220" stroke-width="1.45" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M11.95 16.85c.25 3.7 2.48 6.42 5.05 6.42 2.63 0 4.85-2.79 5.06-6.57l-1 1.01c-.28.28-.74.2-.91-.16l-1.13-2.23-1.3 2.49c-.22.42-.81.43-1.04.02l-.85-1.57-.99 2.26c-.18.42-.73.52-1.04.19l-1.85-1.86Z" fill="#EF9F27"/>
      </g>
    </svg>
  `),
  iconSize: [34, 42],
  iconAnchor: [17, 42],
  popupAnchor: [0, -42],
});

function getStoredDraft() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function extractCity(address = {}) {
  return address.city || address.town || address.village || address.municipality || address.county || "";
}

function extractCountry(address = {}) {
  return address.country || "";
}

function getTodayDateString() {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now.toISOString().split("T")[0];
}

function MapRecenter({ center }) {
  const map = useMap();

  useEffect(() => {
    if (center) {
      map.setView(center, map.getZoom(), { animate: true });
    }
  }, [center, map]);

  return null;
}

function MapInteraction({ markerPosition, onChange }) {
  useMapEvents({
    click(event) {
      onChange([event.latlng.lat, event.latlng.lng], { syncAddress: true });
    },
  });

  if (!markerPosition) return null;

  return (
    <Marker
      position={markerPosition}
      icon={LOCATION_ICON}
      draggable
      eventHandlers={{
        dragend: (event) => {
          const latlng = event.target.getLatLng();
          onChange([latlng.lat, latlng.lng], { syncAddress: true });
        },
      }}
    />
  );
}

export default function CreateProject() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { t } = useTranslation();
  const { theme } = useTheme();
  const tileLayer = theme === "light" ? LIGHT_TILE_LAYER : DARK_TILE_LAYER;
  const isEditMode = Boolean(id);
  const loadedDraft = useRef(getStoredDraft());
  const today = getTodayDateString();

  const [form, setForm] = useState(() => {
    const source = isEditMode ? null : loadedDraft.current?.form;
    return {
      title: source?.title || "",
      description: source?.description || "",
      status: source?.status || "open",
      maxParticipants: source?.maxParticipants || "",
      minAge: source?.minAge || "",
      maxAge: source?.maxAge || "",
      city: source?.city || "",
      country: source?.country || "",
      startDate: source?.startDate || "",
      endDate: source?.endDate || "",
      budget: source?.budget || "",
      repoUrl: source?.repoUrl || "",
    };
  });

  const [tags, setTags] = useState(() => (isEditMode ? [] : loadedDraft.current?.tags || []));
  const [skills, setSkills] = useState(() => (isEditMode ? [] : loadedDraft.current?.skills || []));
  const [languages, setLanguages] = useState(() => (isEditMode ? [] : loadedDraft.current?.languages || []));
  const [markerPosition, setMarkerPosition] = useState(() => (
    isEditMode ? DEFAULT_MAP_CENTER : loadedDraft.current?.markerPosition || DEFAULT_MAP_CENTER
  ));
  const [mapCenter, setMapCenter] = useState(() => (
    isEditMode ? DEFAULT_MAP_CENTER : loadedDraft.current?.markerPosition || DEFAULT_MAP_CENTER
  ));

  const [tagInput, setTagInput] = useState("");
  const [skillInput, setSkillInput] = useState("");
  const [langInput, setLangInput] = useState("");

  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingProject, setLoadingProject] = useState(isEditMode);

  const minStartDate = useMemo(() => {
    if (isEditMode && form.startDate && form.startDate < today) return form.startDate;
    return today;
  }, [form.startDate, isEditMode, today]);

  useEffect(() => {
    if (!isEditMode) return;

    let active = true;
    setLoadingProject(true);
    setError("");

    api(`/projects/${id}`)
      .then((data) => {
        if (!active) return;

        const coords = data.location?.coordinates;
        const nextMarkerPosition =
          Array.isArray(coords) && coords.length === 2 ? [coords[1], coords[0]] : DEFAULT_MAP_CENTER;

        setForm({
          title: data.title || "",
          description: data.description || "",
          status: data.status || "open",
          maxParticipants: data.maxParticipants ?? "",
          minAge: data.minAge ?? "",
          maxAge: data.maxAge ?? "",
          city: data.projectMeta?.city || "",
          country: data.projectMeta?.region || "",
          startDate: data.projectMeta?.startDate ? new Date(data.projectMeta.startDate).toISOString().split("T")[0] : "",
          endDate: data.projectMeta?.endDate ? new Date(data.projectMeta.endDate).toISOString().split("T")[0] : "",
          budget: data.projectMeta?.budget ?? "",
          repoUrl: data.projectMeta?.repoUrl || "",
        });
        setTags(Array.isArray(data.tags) ? data.tags : []);
        setSkills(Array.isArray(data.requiredSkills) ? data.requiredSkills : []);
        setLanguages(Array.isArray(data.langues) ? data.langues : []);
        setMarkerPosition(nextMarkerPosition);
        setMapCenter(nextMarkerPosition);
      })
      .catch((err) => {
        if (!active) return;
        setError(err.message || t("createProject.errorEdit"));
      })
      .finally(() => {
        if (active) setLoadingProject(false);
      });

    return () => { active = false; };
  }, [id, isEditMode, t]);

  useEffect(() => {
    if (isEditMode || typeof window === "undefined") return;
    window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify({ form, tags, skills, languages, markerPosition }));
  }, [form, isEditMode, tags, skills, languages, markerPosition]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (loadingProject) return;

    const cityQuery = form.city.trim();
    const countryQuery = form.country.trim();
    const query = [cityQuery, countryQuery].filter(Boolean).join(", ");

    if (cityQuery.length < 2) {
      setLocationSuggestions([]);
      setIsSearchingLocation(false);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setIsSearchingLocation(true);
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=5&q=${encodeURIComponent(query)}`,
          { signal: controller.signal, headers: { Accept: "application/json" } }
        );

        if (!response.ok) throw new Error("Location search failed");

        const data = await response.json();
        setLocationSuggestions(data);
      } catch (fetchError) {
        if (fetchError.name !== "AbortError") setLocationSuggestions([]);
      } finally {
        setIsSearchingLocation(false);
      }
    }, 350);

    return () => { controller.abort(); window.clearTimeout(timer); };
  }, [form.city, form.country, loadingProject]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((current) => ({ ...current, [name]: value }));

    if (name === "city") setShowSuggestions(true);

    if (name === "startDate" && form.endDate && value && form.endDate <= value) {
      setForm((current) => ({ ...current, startDate: value, endDate: "" }));
    }
  };

  const updateLocationFromCoordinates = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`,
        { headers: { Accept: "application/json" } }
      );
      if (!response.ok) throw new Error("Reverse geocoding failed");

      const data = await response.json();
      setForm((current) => ({
        ...current,
        city: extractCity(data.address) || current.city,
        country: extractCountry(data.address) || current.country,
      }));
    } catch {
      // On garde les valeurs déjà saisies si la recherche inverse échoue.
    }
  };

  const handleMarkerChange = (nextPosition, { syncAddress = false } = {}) => {
    setMarkerPosition(nextPosition);
    setMapCenter(nextPosition);
    if (syncAddress) void updateLocationFromCoordinates(nextPosition[0], nextPosition[1]);
  };

  const handleSuggestionSelect = (suggestion) => {
    const lat = Number.parseFloat(suggestion.lat);
    const lon = Number.parseFloat(suggestion.lon);
    const city = extractCity(suggestion.address);
    const country = extractCountry(suggestion.address);

    setForm((current) => ({
      ...current,
      city: city || current.city,
      country: country || current.country,
    }));
    setLocationSuggestions([]);
    setShowSuggestions(false);
    handleMarkerChange([lat, lon]);
  };

  const addItem = (value, setList, list, reset) => {
    if (!value.trim() || list.includes(value.trim())) return;
    setList([...list, value.trim()]);
    reset("");
  };

  const removeItem = (item, setList, list) => {
    setList(list.filter((i) => i !== item));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.title.trim()) { setError(t("createProject.errorTitle")); return; }
    if (!form.city.trim()) { setError(t("createProject.errorCity")); return; }
    if (!form.country.trim()) { setError(t("createProject.errorCountry")); return; }
    if (!form.startDate) { setError(t("createProject.errorStartDate")); return; }
    if (!isEditMode && form.startDate < today) { setError(t("createProject.errorStartDatePast")); return; }
    if (form.endDate && form.endDate <= form.startDate) { setError(t("createProject.errorEndDate")); return; }
    if (form.minAge && Number(form.minAge) < 0) { setError(t("createProject.errorMinAge")); return; }
    if (form.maxAge && Number(form.maxAge) < 0) { setError(t("createProject.errorMaxAge")); return; }
    if (form.minAge && form.maxAge && Number(form.maxAge) < Number(form.minAge)) {
      setError(t("createProject.errorAgeRange"));
      return;
    }

    setLoading(true);
    try {
      await api(isEditMode ? `/projects/${id}` : "/projects/create", {
        method: isEditMode ? "PUT" : "POST",
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          tags,
          requiredSkills: skills,
          langues: languages,
          minAge: form.minAge ? Number(form.minAge) : null,
          maxAge: form.maxAge ? Number(form.maxAge) : null,
          maxParticipants: form.maxParticipants ? Number(form.maxParticipants) : null,
          status: form.status,
          visibility: "public",
          location: { type: "Point", coordinates: [markerPosition[1], markerPosition[0]] },
          projectMeta: {
            startDate: form.startDate || null,
            endDate: form.endDate || null,
            repoUrl: form.repoUrl || "",
            budget: form.budget ? Number(form.budget) : 0,
            city: form.city || "",
            region: form.country || "",
          },
        }),
      });

      if (!isEditMode) window.localStorage.removeItem(DRAFT_STORAGE_KEY);
      navigate(isEditMode ? `/projects/${id}` : "/projects");
    } catch (err) {
      setError(err.message || (isEditMode ? t("createProject.errorEdit") : t("createProject.errorCreate")));
    } finally {
      setLoading(false);
    }
  };

  if (loadingProject) {
    return (
      <section className={classes.createProjectPage}>
        <div className={classes.pageHeader}><h1>{t("createProject.loading")}</h1></div>
      </section>
    );
  }

  return (
    <section className={classes.createProjectPage}>
      <div className={classes.pageHeader}>
        <h1>{isEditMode ? t("createProject.titleEdit") : t("createProject.titleCreate")}</h1>
        <p>{isEditMode ? t("createProject.subtitleEdit") : t("createProject.subtitleCreate")}</p>
      </div>

      <div className={classes.formContainer}>
        <form className={classes.projectForm} onSubmit={handleSubmit}>
          {error && <div className={classes.errorMsg}>{error}</div>}

          <div className={classes.formGroup}>
            <label htmlFor="project-title">{t("createProject.titleLabel")}</label>
            <input
              id="project-title"
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder={t("createProject.titlePlaceholder")}
              required
            />
          </div>

          <div className={classes.formGroup}>
            <label>{t("createProject.description")}</label>
            <textarea
              rows="4"
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder={t("createProject.descriptionPlaceholder")}
            />
          </div>

          <div className={classes.formGroup}>
            <label>{t("createProject.tags")}</label>
            <div className={classes.tagInputWrapper}>
              <input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder={t("createProject.tagPlaceholder")}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addItem(tagInput, setTags, tags, setTagInput))}
              />
              <button type="button" onClick={() => addItem(tagInput, setTags, tags, setTagInput)}>+</button>
            </div>
            <div className={classes.tagList}>
              {tags.map((tag) => (
                <span key={tag} className={classes.tag}>
                  {tag}
                  <button type="button" onClick={() => removeItem(tag, setTags, tags)}>×</button>
                </span>
              ))}
            </div>
          </div>

          <div className={classes.formGroup}>
            <label>{t("createProject.skills")}</label>
            <div className={classes.tagInputWrapper}>
              <input
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                placeholder={t("createProject.skillPlaceholder")}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addItem(skillInput, setSkills, skills, setSkillInput))}
              />
              <button type="button" onClick={() => addItem(skillInput, setSkills, skills, setSkillInput)}>+</button>
            </div>
            <div className={classes.tagList}>
              {skills.map((skill) => (
                <span key={skill} className={classes.tag}>
                  {skill}
                  <button type="button" onClick={() => removeItem(skill, setSkills, skills)}>
                    <X size={12} strokeWidth={2} />
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className={classes.formGroup}>
            <label>{t("createProject.languages")}</label>
            <div className={classes.tagInputWrapper}>
              <input
                value={langInput}
                onChange={(e) => setLangInput(e.target.value)}
                placeholder={t("createProject.langPlaceholder")}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addItem(langInput, setLanguages, languages, setLangInput))}
              />
              <button type="button" onClick={() => addItem(langInput, setLanguages, languages, setLangInput)}>+</button>
            </div>
            <div className={classes.tagList}>
              {languages.map((lang) => (
                <span key={lang} className={classes.tag}>
                  {lang}
                  <button type="button" onClick={() => removeItem(lang, setLanguages, languages)}>×</button>
                </span>
              ))}
            </div>
          </div>

          <div className={classes.formRow}>
            <div className={classes.formGroup}>
              <label htmlFor="project-max-participants">{t("createProject.maxParticipants")}</label>
              <input id="project-max-participants" type="number" name="maxParticipants" value={form.maxParticipants} onChange={handleChange} min="1" max="20" />
            </div>
            <div className={classes.formGroup}>
              <label htmlFor="project-min-age">{t("createProject.minAge")}</label>
              <input id="project-min-age" type="number" name="minAge" value={form.minAge} onChange={handleChange} min="0" />
            </div>
            <div className={classes.formGroup}>
              <label htmlFor="project-max-age">{t("createProject.maxAge")}</label>
              <input id="project-max-age" type="number" name="maxAge" value={form.maxAge} onChange={handleChange} min={form.minAge || "0"} />
            </div>
          </div>

          <div className={classes.formRow}>
            <div className={classes.formGroup}>
              <label htmlFor="project-city">{t("createProject.city")}</label>
              <div className={classes.locationField}>
                <input
                  id="project-city"
                  type="text"
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => window.setTimeout(() => setShowSuggestions(false), 150)}
                  placeholder={t("createProject.cityPlaceholder")}
                  autoComplete="off"
                  required
                />
                <MapPin size={16} className={classes.locationInputIcon} />
                {isSearchingLocation && <LoaderCircle size={16} className={classes.locationLoader} />}
                {showSuggestions && locationSuggestions.length > 0 && (
                  <div className={classes.locationSuggestions}>
                    {locationSuggestions.map((suggestion) => {
                      const city = extractCity(suggestion.address);
                      const country = extractCountry(suggestion.address);
                      return (
                        <button
                          key={`${suggestion.place_id}-${suggestion.lat}-${suggestion.lon}`}
                          type="button"
                          className={classes.locationSuggestion}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => handleSuggestionSelect(suggestion)}
                        >
                          <span>{city || suggestion.display_name}</span>
                          {country && <small>{country}</small>}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
            <div className={classes.formGroup}>
              <label htmlFor="project-country">{t("createProject.country")}</label>
              <input
                id="project-country"
                type="text"
                name="country"
                value={form.country}
                onChange={handleChange}
                placeholder={t("createProject.countryPlaceholder")}
                required
              />
            </div>
          </div>

          <div className={classes.formGroup}>
            <label>{t("createProject.mapLabel")}</label>
            <p className={classes.locationHint}>{t("createProject.mapHint")}</p>
            <div className={classes.locationPreview}>
              <MapContainer center={mapCenter} zoom={6} style={{ height: "100%", width: "100%" }} scrollWheelZoom>
                <TileLayer attribution={tileLayer.attribution} url={tileLayer.url} />
                <MapRecenter center={mapCenter} />
                <MapInteraction markerPosition={markerPosition} onChange={handleMarkerChange} />
              </MapContainer>
            </div>
            <div className={classes.coordinatesRow}>
              <span>Lat: {markerPosition[0].toFixed(5)}</span>
              <span>Lng: {markerPosition[1].toFixed(5)}</span>
            </div>
          </div>

          <div className={classes.formRow}>
            <div className={classes.formGroup}>
              <label htmlFor="project-start-date">{t("createProject.startDate")}</label>
              <input id="project-start-date" type="date" name="startDate" value={form.startDate} onChange={handleChange} min={minStartDate} required />
            </div>
            <div className={classes.formGroup}>
              <label htmlFor="project-end-date">{t("createProject.endDate")}</label>
              <input id="project-end-date" type="date" name="endDate" value={form.endDate} onChange={handleChange} min={form.startDate || today} />
            </div>
          </div>

          <div className={classes.formRow}>
            <div className={classes.formGroup}>
              <label>{t("createProject.budget")}</label>
              <input type="number" name="budget" value={form.budget} onChange={handleChange} min="0" placeholder="0" />
            </div>
            <div className={classes.formGroup}>
              <label>{t("createProject.repo")}</label>
              <input type="url" name="repoUrl" value={form.repoUrl} onChange={handleChange} placeholder="https://github.com/..." />
            </div>
          </div>

          <div className={classes.formGroup}>
            <label>{t("createProject.status")}</label>
            <select name="status" value={form.status} onChange={handleChange}>
              <option value="open">{t("createProject.statusOpen")}</option>
              <option value="closed">{t("createProject.statusClosed")}</option>
              <option value="draft">{t("createProject.statusDraft")}</option>
            </select>
          </div>

          <div className={classes.formActions}>
            <button type="submit" className={classes.btnPrimary} disabled={loading}>
              {loading
                ? (isEditMode ? t("createProject.loadingEdit") : t("createProject.loadingCreate"))
                : (isEditMode ? t("createProject.submitEdit") : t("createProject.submitCreate"))}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
