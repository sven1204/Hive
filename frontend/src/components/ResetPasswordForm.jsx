import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import FloatingField from "./FloatingField";
import classes from "./ResetPasswordForm.module.css";
import { useTranslation } from "react-i18next";

export default function ResetPasswordForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const { confirmResetPassword } = useAuth();
  const { t } = useTranslation();

  const { email, code } = location.state || {};

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [msg, setMsg] = useState("");

  const passwordMismatch = confirmPassword.length > 0 && password !== confirmPassword;

  const onSubmit = async (e) => {
    e.preventDefault();
    setMsg("");

    if (!email || !code) {
      setMsg(t("reset.invalidSession"));
      return;
    }

    if (password !== confirmPassword) {
      setMsg(t("reset.passwordMismatch"));
      return;
    }

    try {
      await confirmResetPassword(email, code, password);
      navigate("/login");
    } catch {
      setMsg(t("reset.error"));
    }
  };

  return (
    <div className={classes.wrapper}>
      <div className={classes.card}>
        <h2 className={classes.title}>{t("reset.title")}</h2>

        <form onSubmit={onSubmit} className={classes.form} noValidate>
          <FloatingField
            id="new-password"
            name="password"
            type={showPassword ? "text" : "password"}
            label={t("reset.newPasswordPlaceholder")}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
          >
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? t("register.hidePassword") : t("register.showPassword")}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </FloatingField>

          <FloatingField
            id="confirm-password"
            name="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            label={t("reset.confirmPasswordPlaceholder")}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            error={passwordMismatch}
          >
            <button
              type="button"
              onClick={() => setShowConfirmPassword((v) => !v)}
              aria-label={showConfirmPassword ? t("register.hidePassword") : t("register.showPassword")}
            >
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </FloatingField>

          {msg && <p className={classes.error} role="alert">{msg}</p>}

          <button type="submit" className={classes.submitBtn}>
            {t("reset.submit")}
          </button>
        </form>

        <p className={classes.footer}>
          <Link to="/login" className={classes.link}>{t("reset.backToLogin")}</Link>
        </p>
      </div>
    </div>
  );
}
