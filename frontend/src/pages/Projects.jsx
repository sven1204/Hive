import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X, Plus, ChevronDown } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import ProjectCard from "../components/ProjectCard";
import classes from "./Projects.module.css";

// Only the most-used themes are shown up front; the rest live behind
// "Tous les thèmes" so the page does not open on a wall of 130+ chips.
const POPULAR_TAGS_COUNT = 8;

export default function Projects() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();

  const [projects, setProjects] = useState([]);
  const [allTags, setAllTags] = useState([]);
  const [allRegions, setAllRegions] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedRegion, setSelectedRegion] = useState("");
  const [showAllTags, setShowAllTags] = useState(false);
  const [tagQuery, setTagQuery] = useState("");

  const myId = user?._id || user?.id || "";

  const [recommended, setRecommended] = useState([]);

  useEffect(() => {
    if(!user){
      return;
    }
    const fetchRecommended = async() => {
      try {
        const data = await api("/projects/recommended");
        setRecommended(Array.isArray(data) ? data.map(item => item.project) : []);
      } catch(err) {
        console.error("fetchRecommended error:", err);
      }
    }
    fetchRecommended();
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchProjects();
    fetchTags();
    fetchRegions();
  }, []);

  const fetchProjects = async () => {
    try {
      const data = await api("/projects");
      setProjects(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Erreur chargement projets:", err);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchTags = async () => {
    try {
      const data = await api("/projects/tags");
      setAllTags(Array.isArray(data) ? data.filter((t) => t && t.trim()) : []);
    } catch (err) {
      console.error("Erreur chargement tags:", err);
    }
  };

  const fetchRegions = async () => {
    try {
      const data = await api("/projects/regions");
      setAllRegions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Erreur chargement régions:", err);
    }
  };

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const title = (project?.title ?? "").toLowerCase();
      const desc = (project?.description ?? "").toLowerCase();
      const q = searchQuery.toLowerCase();

      const tags = (project?.tags ?? []).join(" ").toLowerCase();
      const matchesSearch = q === "" || title.includes(q) || desc.includes(q) || tags.includes(q);
      const matchesTags = selectedTags.length === 0 || selectedTags.some((tag) => project?.tags?.includes(tag));
      const matchesRegion = selectedRegion === "" || project?.projectMeta?.region === selectedRegion;
      const isMyProject = project?.ownerId?._id?.toString() === myId || project?.ownerId?.toString() === myId;
      const matchesStatus = project?.status === "open" || isMyProject;

      return matchesSearch && matchesTags && matchesRegion && matchesStatus;
    });
  }, [projects, searchQuery, selectedTags, selectedRegion, myId]);

  const toggleTag = (tag) => {
    setSelectedTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]);
  };

  const clearAllFilters = () => {
    setSearchQuery("");
    setSelectedTags([]);
    setSelectedRegion("");
  };

  const hasActiveFilters = searchQuery || selectedTags.length > 0 || selectedRegion;

  // Most-used themes across projects, plus any theme the user already picked.
  const popularTags = useMemo(() => {
    const counts = new Map();
    projects.forEach((p) =>
      (p?.tags ?? []).forEach((tag) => counts.set(tag, (counts.get(tag) || 0) + 1)),
    );
    const top = [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, POPULAR_TAGS_COUNT)
      .map(([tag]) => tag);
    return [...new Set([...selectedTags, ...top])];
  }, [projects, selectedTags]);

  const matchingTags = useMemo(() => {
    const q = tagQuery.trim().toLowerCase();
    return q ? allTags.filter((tag) => tag.toLowerCase().includes(q)) : allTags;
  }, [allTags, tagQuery]);

  return (
    <div className={classes.page}>
      {/* HEADER */}
      <div className={classes.header}>
        <div className={classes.container}>
          <div className={classes.headerRow}>
            <div>
              <h1 className={classes.title}>{t("projects.title")}</h1>
              <p className={classes.subtitle}>{t("projects.subtitle")}</p>
            </div>

            {user && (
              <button className={classes.createBtn} onClick={() => navigate("/create-project")}>
                <Plus size={18} />
                {t("projects.create")}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className={classes.container}>
        {/* SEARCH + REGION */}
        <div className={classes.searchRow}>
          <div className={classes.searchBlock}>
            <Search size={18} className={classes.searchIcon} aria-hidden="true" />
            <input
              type="search"
              aria-label={t("projects.searchPlaceholder")}
              placeholder={t("projects.searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={classes.searchInput}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className={classes.clearBtn}
                aria-label={t("projects.clearSearch")}
              >
                <X size={16} />
              </button>
            )}
          </div>

          {allRegions.length > 0 && (
            <label className={classes.regionSelect}>
              <span className="sr-only">{t("projects.regions")}</span>
              <select
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
              >
                <option value="">{t("projects.allRegions")}</option>
                {allRegions.map((region) => (
                  <option key={region} value={region}>
                    {region}
                  </option>
                ))}
              </select>
              <ChevronDown size={16} aria-hidden="true" />
            </label>
          )}
        </div>

        {/* THEMES */}
        <div className={classes.filters}>
          <div className={classes.filterList}>
            <span className={classes.filterLabel}>{t("projects.popular")}</span>
            {popularTags.map((tag) => (
              <button
                type="button"
                key={tag}
                onClick={() => toggleTag(tag)}
                aria-pressed={selectedTags.includes(tag)}
                className={`${classes.filterBtn} ${selectedTags.includes(tag) ? classes.activeFilter : ""}`}
              >
                {tag}
              </button>
            ))}
            {allTags.length > popularTags.length && (
              <button
                type="button"
                onClick={() => setShowAllTags((prev) => !prev)}
                aria-expanded={showAllTags}
                className={classes.moreTagsBtn}
              >
                {showAllTags ? t("projects.hideThemes") : t("projects.allThemes")}
                <ChevronDown size={14} className={showAllTags ? classes.chevronOpen : ""} aria-hidden="true" />
              </button>
            )}
            {hasActiveFilters && (
              <button type="button" onClick={clearAllFilters} className={classes.clearFilters}>
                {t("projects.resetFilters")}
              </button>
            )}
          </div>

          {showAllTags && (
            <div className={classes.allThemes}>
              <input
                type="search"
                className={classes.themeSearch}
                placeholder={t("projects.searchThemes")}
                aria-label={t("projects.searchThemes")}
                value={tagQuery}
                onChange={(e) => setTagQuery(e.target.value)}
              />
              <div className={classes.filterList}>
                {matchingTags.map((tag) => (
                  <button
                    type="button"
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    aria-pressed={selectedTags.includes(tag)}
                    className={`${classes.filterBtn} ${selectedTags.includes(tag) ? classes.activeFilter : ""}`}
                  >
                    {tag}
                  </button>
                ))}
                {matchingTags.length === 0 && (
                  <span className={classes.noTheme}>{t("projects.noTheme")}</span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* RECOMMANDÉS */}
        {user && recommended.length > 0 && !hasActiveFilters && (
          <div className={classes.recommendedSection}>
            <h2 className={classes.recommendedTitle}>{t("projects.recommended")}</h2>
            <div className={classes.grid}>
              {recommended.map((project) => (
                <ProjectCard key={project._id} project={project} />
              ))}
            </div>
          </div>
        )}

        {/* RESULTS COUNT */}
        <div className={classes.results}>
          {t("projects.result", { count: filteredProjects.length })}
        </div>

        {/* GRID */}
        {loading ? (
          <div className={classes.center}>{t("projects.loading")}</div>
        ) : filteredProjects.length === 0 ? (
          <div className={classes.center}>{t("projects.noResults")}</div>
        ) : (
          <div className={classes.grid}>
            {filteredProjects.map((project) => (
              <ProjectCard key={project._id} project={project} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
