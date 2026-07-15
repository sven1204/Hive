import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import classes from "./ForgotPasswordForm.module.css";
import { useTranslation } from "react-i18next";
import FloatingField from "./FloatingField";

/* Formulaire en 2 étapes : saisie de l'email (step 1) → saisie du code OTP reçu par email (step 2).
   Le code vérifié, l'utilisateur est redirigé vers /reset-password avec email+code dans le state. */
export default function ForgotPasswordForm() {
  const { t } = useTranslation();

  const navigate = useNavigate();
  const { resetPassword, verifyResetCode } = useAuth();

  const [email, setEmail] = useState("");
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [step, setStep] = useState(1); // 1=email | 2=code
  const [msg, setMsg] = useState("");


  const handleCodeChange = (value, index) => {
    if (!/^\d?$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  const handleCodeKeyDown = (e, index) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
  };

  // STEP 1 — envoyer email
  const submitEmail = async (e) => {
    e.preventDefault();
    setMsg("");

    try {
      await resetPassword(email);
      setStep(2);
      setMsg(t("forgot.codeSent"));
    } catch {
      setMsg(t("forgot.sendError"));
    }
  };

  // STEP 2 — vérifier code
  const submitCode = async (e) => {
    e.preventDefault();
    setMsg("");

    const otpCode = code.join("");
    if (otpCode.length !== 6) {
      setMsg(t("forgot.codeIncomplete"));
      return;
    }

    try {
      await verifyResetCode(email, otpCode);
      navigate("/reset-password", {
        state: { email, code: otpCode },
      });
    } catch {
      setMsg(t("forgot.codeInvalid"));
    }
  };

  return (
    <div className={classes.loginWrapper}>
      <div className={classes.loginCard}>
        <h2>{t("forgot.title")}</h2>

        {/* STEP 1 */}
        {step === 1 && (
          <form onSubmit={submitEmail} className={classes.form}>
            <FloatingField
              id="forgot-email"
              name="email"
              type="email"
              label={t("forgot.emailPlaceholder")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />

            <button type="submit" className={classes.loginBtn}>
              {t("forgot.sendBtn")}
            </button>
          </form>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <form onSubmit={submitCode}>
            <p className={classes.resetInfo}>
              {t("forgot.codeInstruction")}
            </p>

            <div className={classes.otpWrapper}>
              {code.map((digit, index) => (
                <input
                  key={index}
                  id={`otp-${index}`}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength="1"
                  className={classes.otpInput}
                  value={digit}
                  onChange={(e) => handleCodeChange(e.target.value, index)}
                  onKeyDown={(e) => handleCodeKeyDown(e, index)}
                />

              ))}
            </div>

            <button type="submit" className={classes.loginBtn}>
              {t("forgot.verifyBtn")}
            </button>
          </form>
        )}
    
        {msg && <p className={classes.error}>{msg}</p>}

        <p className={classes.registerText}>
          <Link to="/login" className={classes.link}>
            {t("forgot.backToLogin")}
          </Link>
        </p>
      </div>
    </div>
  )
}
