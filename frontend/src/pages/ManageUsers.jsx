import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Activity, FolderOpen, Mail, Search, ShieldCheck, Trash2, UserCheck, Users, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { api } from "../lib/api";
import UserAvatar from "../components/UserAvatar";
import HiveRating from "../components/HiveRating";
import classes from "./ManageUsers.module.css";

function getUserName(user) {
  return user?.displayName || [user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.email || "Utilisateur";
}

function formatDate(date) {
  if (!date) return "—";
  return new Intl.DateTimeFormat("fr-CH", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(date));
}

export default function ManageUsers() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [section, setSection] = useState("users");
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [usersData, projectsData] = await Promise.all([
          api("/admin/users"),
          api("/admin/projects"),
        ]);
        setUsers(Array.isArray(usersData) ? usersData : []);
        setProjects(Array.isArray(projectsData) ? projectsData : []);
      } catch (err) {
        setError(err.message || "Impossible de charger les données.");
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const handleDeleteUser = async (id) => {
    if (!window.confirm(t("admin.deleteUser"))) return;
    try {
      await api(`/admin/users/${id}`, { method: "DELETE" });
      setUsers((prev) => prev.filter((u) => u._id !== id));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteProject = async (id) => {
    if (!window.confirm(t("admin.deleteProject"))) return;
    try {
      await api(`/admin/projects/${id}`, { method: "DELETE" });
      setProjects((prev) => prev.filter((p) => p._id !== id));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleChangeRole = async (id, currentRole) => {
    const newRole = currentRole === "admin" ? "user" : "admin";
    if (!window.confirm(t("admin.changeRole", { role: newRole }))) return;
    try {
      const updated = await api(`/admin/users/${id}/role`, {
        method: "PUT",
        body: JSON.stringify({ role: newRole }),
      });
      setUsers((prev) => prev.map((u) => (u._id === id ? updated : u)));
    } catch (err) {
      alert(err.message);
    }
  };

  const stats = useMemo(() => [
    { label: t("admin.users"), value: users.length, icon: Users },
    { label: t("admin.admins"), value: users.filter((u) => u.role === "admin").length, icon: ShieldCheck },
    { label: t("admin.emailsVerified"), value: users.filter((u) => u.emailVerified).length, icon: Mail },
    { label: t("admin.totalProjects"), value: projects.length, icon: FolderOpen },
    { label: t("admin.activeProjects"), value: projects.filter((p) => p.status === "open").length, icon: UserCheck },
  ], [users, projects, t]);

  const filteredUsers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) =>
      [getUserName(u), u.email, u.role].filter(Boolean).join(" ").toLowerCase().includes(q)
    );
  }, [users, searchQuery]);

  const filteredProjects = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return projects;
    return projects.filter((p) =>
      [p.title, p.status, p.projectMeta?.city].filter(Boolean).join(" ").toLowerCase().includes(q)
    );
  }, [projects, searchQuery]);

  return (
    <div className={classes.layout}>

      {/* SIDEBAR */}
      <aside className={classes.sidebar}>
        <div className={classes.sidebarBrand}>
          <span className={classes.sidebarTitle}>Hive</span>
          <span className={classes.adminBadge}>Admin</span>
        </div>

        <nav className={classes.sidebarNav}>
          <button
            className={`${classes.sidebarLink} ${section === "users" ? classes.sidebarLinkActive : ""}`}
            onClick={() => { setSection("users"); setSearchQuery(""); }}
          >
            <Users size={17} /> {t("admin.users")}
            <span className={classes.sidebarCount}>{users.length}</span>
          </button>
          <button
            className={`${classes.sidebarLink} ${section === "projects" ? classes.sidebarLinkActive : ""}`}
            onClick={() => { setSection("projects"); setSearchQuery(""); }}
          >
            <FolderOpen size={17} /> {t("admin.projects")}
            <span className={classes.sidebarCount}>{projects.length}</span>
          </button>
          <button
            className={`${classes.sidebarLink} ${section === "monitoring" ? classes.sidebarLinkActive : ""}`}
            onClick={() => { setSection("monitoring"); setSearchQuery(""); }}
          >
            <Activity size={17} /> {t("admin.monitoring")}
          </button>
        </nav>
      </aside>

      {/* MAIN */}
      <main className={classes.main}>

        {/* MOBILE TABS — remplace la sidebar sur mobile */}
        <div className={classes.mobileTabs}>
          <button
            className={`${classes.mobileTab} ${section === "users" ? classes.mobileTabActive : ""}`}
            onClick={() => { setSection("users"); setSearchQuery(""); }}
          >
            <Users size={15} /> {t("admin.users")}
          </button>
          <button
            className={`${classes.mobileTab} ${section === "projects" ? classes.mobileTabActive : ""}`}
            onClick={() => { setSection("projects"); setSearchQuery(""); }}
          >
            <FolderOpen size={15} /> {t("admin.projects")}
          </button>
          <button
            className={`${classes.mobileTab} ${section === "monitoring" ? classes.mobileTabActive : ""}`}
            onClick={() => { setSection("monitoring"); setSearchQuery(""); }}
          >
            <Activity size={15} /> {t("admin.monitoring")}
          </button>
        </div>

        {/* KPI */}
        <div className={classes.statsGrid}>
          {stats.map(({ label, value, icon: Icon }) => (
            <article className={classes.statCard} key={label}>
              <div className={classes.statIcon}><Icon size={18} /></div>
              <div>
                <strong>{value}</strong>
                <span>{label}</span>
              </div>
            </article>
          ))}
        </div>

        {/* TOOLBAR */}
        {section !== "monitoring" && (
          <div className={classes.toolbar}>
            <h2 className={classes.sectionTitle}>
              {section === "users" ? t("admin.users") : t("admin.projects")}
            </h2>
            <div className={classes.searchBox}>
              <Search size={16} className={classes.searchIcon} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={section === "users" ? t("admin.searchUsers") : t("admin.searchProjects")}
                className={classes.searchInput}
              />
              {searchQuery && (
                <button type="button" className={classes.clearBtn} onClick={() => setSearchQuery("")}>
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
        )}

        {/* TABLE */}
        {section !== "monitoring" && (
        <div className={classes.panel}>
          {loading ? (
            <div className={classes.state}>{t("admin.loading")}</div>
          ) : error ? (
            <div className={`${classes.state} ${classes.errorState}`}>{error}</div>
          ) : section === "users" ? (
            <div className={classes.tableWrap}>
              <table className={classes.table}>
                <thead>
                  <tr>
                    <th>{t("admin.users")}</th>
                    <th>{t("admin.colRole")}</th>
                    <th>{t("admin.colEmail")}</th>
                    <th>{t("admin.colReputation")}</th>
                    <th>{t("admin.colJoined")}</th>
                    <th>{t("admin.colActions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => (
                    <tr key={u._id}>
                      <td>
                        <button type="button" className={classes.userBtn} onClick={() => navigate(`/users/${u._id}`)}>
                          <UserAvatar user={u} className={classes.avatar} imageClassName={classes.avatarImg} fallbackClassName={classes.avatarFallback} alt={getUserName(u)} />
                          <span className={classes.userMeta}>
                            <strong>{getUserName(u)}</strong>
                            <span>{u.email}</span>
                          </span>
                        </button>
                      </td>
                      <td>
                        <span className={`${classes.badge} ${u.role === "admin" ? classes.badgeAdmin : ""}`}>
                          {u.role === "admin" ? t("admin.roleAdmin") : t("admin.roleUser")}
                        </span>
                      </td>
                      <td>
                        <span className={u.emailVerified ? classes.badgeGood : classes.badgeWarn}>
                          {u.emailVerified ? t("admin.verified") : t("admin.notVerified")}
                        </span>
                      </td>
                      <td><HiveRating reputation={u.reputation} compact /></td>
                      <td className={classes.dateCell}>{formatDate(u.createdAt)}</td>
                      <td>
                        <div className={classes.actions}>
                          <button type="button" className={classes.actionBtn} onClick={() => handleChangeRole(u._id, u.role)} title={u.role === "admin" ? t("admin.demoteTitle") : t("admin.promoteTitle")}>
                            <ShieldCheck size={15} />
                          </button>
                          {u.role !== "admin" && (
                            <button type="button" className={`${classes.actionBtn} ${classes.actionDanger}`} onClick={() => handleDeleteUser(u._id)} title={t("admin.deleteTitle")}>
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className={classes.tableWrap}>
              <table className={classes.table}>
                <thead>
                  <tr>
                    <th>{t("admin.colTitle")}</th>
                    <th>{t("admin.colOwner")}</th>
                    <th>{t("admin.colStatus")}</th>
                    <th>{t("admin.colCity")}</th>
                    <th>{t("admin.colCreated")}</th>
                    <th>{t("admin.colActions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProjects.map((p) => (
                    <tr key={p._id}>
                      <td>
                        <button
                          type="button"
                          className={classes.projectTitleBtn}
                          onClick={() => window.open(`/projects/${p._id}`, "_blank")}
                        >
                          {p.title}
                        </button>
                      </td>
                      <td className={classes.dateCell}>{getUserName(p.ownerId)}</td>
                      <td>
                        <span className={`${classes.badge} ${p.status === "open" ? classes.badgeGood : ""}`}>
                          {p.status}
                        </span>
                      </td>
                      <td className={classes.dateCell}>{p.projectMeta?.city || "—"}</td>
                      <td className={classes.dateCell}>{formatDate(p.createdAt)}</td>
                      <td>
                        <div className={classes.actions}>
                          <button type="button" className={`${classes.actionBtn} ${classes.actionDanger}`} onClick={() => handleDeleteProject(p._id)} title={t("admin.deleteTitle")}>
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        )}

        {/* MONITORING */}
        {section === "monitoring" && (
          <div className={classes.monitoringGrid}>
            {window.location.hostname === "localhost" ? (
              <>
                <div className={classes.monitoringCard}>
                  <h3 className={classes.monitoringCardTitle}>{t("admin.metricsMetier")}</h3>
                  <iframe
                    src="http://localhost:3001/d/hive-biz-api?orgId=1&refresh=30s&kiosk"
                    className={classes.grafanaFrame}
                    title="Business Dashboard"
                  />
                </div>
                <div className={classes.monitoringCard}>
                  <h3 className={classes.monitoringCardTitle}>{t("admin.backendNode")}</h3>
                  <iframe
                    src="http://localhost:3001/d/hive-backend?orgId=1&refresh=15s&kiosk"
                    className={classes.grafanaFrame}
                    title="Backend Dashboard"
                  />
                </div>
                <div className={classes.monitoringCard}>
                  <h3 className={classes.monitoringCardTitle}>{t("admin.mongodb")}</h3>
                  <iframe
                    src="http://localhost:3001/d/hive-mongodb?orgId=1&refresh=15s&kiosk"
                    className={classes.grafanaFrame}
                    title="MongoDB Dashboard"
                  />
                </div>
              </>
            ) : (
              <div className={classes.monitoringUnavailable}>
                <Activity size={32} />
                <strong>{t("admin.monitoringUnavailableTitle")}</strong>
                <p>{t("admin.monitoringUnavailableDesc")}</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
