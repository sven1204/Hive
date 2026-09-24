export const BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5050/api";

// ---------------------------------------------------
// Fonction API générique
// ---------------------------------------------------

export async function api(path, options = {}) {
  const token = localStorage.getItem("token");

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const isJson = res.headers
    .get("content-type")
    ?.includes("application/json");

  const data = isJson ? await res.json().catch(() => null) : null;

  if (res.status === 401) {
    const onLoginPage = window.location.pathname === "/login";
    if (token && !onLoginPage) {
      // Session expirée depuis une autre page : on nettoie et on redirige
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    throw new Error(data?.message || data?.error || "Email ou mot de passe incorrect.");
  }

if (!res.ok) {
  throw new Error(
    data?.message ||
    data?.error ||
    res.statusText
  );
}

  return data;
}
