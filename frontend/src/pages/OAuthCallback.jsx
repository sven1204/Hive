// pages/OAuthCallback.jsx
import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";

/* Retour de la connexion Google/GitHub : le backend redirige ici avec #token=…
   On retire aussitôt le token de l'URL (historique), puis on charge le profil. */
export default function OAuthCallback() {
  const { loginWithToken } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return; // StrictMode monte l'effet deux fois en dev
    handled.current = true;

    const token = new URLSearchParams(window.location.hash.slice(1)).get("token");
    window.history.replaceState(null, "", window.location.pathname);

    if (!token) {
      navigate("/login?oauthError=expired", { replace: true });
      return;
    }
    loginWithToken(token)
      .then(() => navigate("/profile", { replace: true }))
      .catch(() => navigate("/login?oauthError=server", { replace: true }));
  }, [loginWithToken, navigate]);

  return <p style={{ textAlign: "center", padding: "48px 16px" }}>{t("social.signingIn")}</p>;
}
