import { useEffect, useMemo, useState } from "react";
import { useNavigate, useViewTransitionState } from "react-router-dom";
import { Search, X, Filter, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import ProjectCard from "../components/ProjectCard";
import classes from "./Projects.module.css";

const DEFAULT_VISIBLE_TAGS = 12;

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

  const myId = user?._id || user?.id || "";

  const [recommended, setRecommended] = useState([]);

  useEffect(() => {
    if(!user){
      return;
    }
    const fetchRecommended = async() => {
      try {
        const data = await api("/projects/recommended");
        console.log("recommended raw:", data);
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
  const visibleTags = showAllTags ? allTags : allTags.slice(0, DEFAULT_VISIBLE_TAGS);
  const hiddenTagsCount = Math.max(allTags.length - DEFAULT_VISIBLE_TAGS, 0);

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
        {/* SEARCH */}
        <div className={classes.searchBlock}>
          <Search size={18} className={classes.searchIcon} />
          <input
            type="text"
            placeholder={t("projects.searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={classes.searchInput}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className={classes.clearBtn}>
              <X size={16} />
            </button>
          )}
        </div>

        {/* FILTERS */}
        <div className={classes.filters}>
          <div className={classes.filterGroup}>
            <div className={classes.filterLabel}>
              <Filter size={14} />
              <span>{t("projects.tags")}</span>
            </div>
            <div className={classes.filterList}>
              {visibleTags.map((tag, i) => (
                <button
                  key={i}
                  onClick={() => toggleTag(tag)}
                  className={`${classes.filterBtn} ${selectedTags.includes(tag) ? classes.activeFilter : ""}`}
                >
                  {tag}
                </button>
              ))}
              {hiddenTagsCount > 0 && (
                <button
                  type="button"
                  onClick={() => setShowAllTags((prev) => !prev)}
                  className={classes.moreTagsBtn}
                >
                  {showAllTags ? t("projects.showLess") : t("projects.moreTags", { count: hiddenTagsCount })}
                </button>
              )}
            </div>
          </div>

          <div className={classes.filterGroup}>
            <div className={classes.filterLabel}>
              <Filter size={14} />
              <span>{t("projects.regions")}</span>
            </div>
            <div className={classes.filterList}>
              {allRegions.map((region, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedRegion(selectedRegion === region ? "" : region)}
                  className={`${classes.filterBtn} ${selectedRegion === region ? classes.activeFilter : ""}`}
                >
                  {region}
                </button>
              ))}
            </div>
          </div>

          {hasActiveFilters && (
            <button onClick={clearAllFilters} className={classes.clearFilters}>
              {t("projects.resetFilters")}
            </button>
          )}
        </div>

        {/* RECOMMANDÉS */}
        {user && recommended.length > 0 && !hasActiveFilters && (
          <div className={classes.recommendedSection}>
            <h2 className={classes.recommendedTitle}>Recommandés pour toi</h2>
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
