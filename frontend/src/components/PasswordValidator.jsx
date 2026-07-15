import classes from "./RegisterForm.module.css";

export function computeEntropy(password) {
  if (!password) return 0;
  let N = 0;
  if (/[a-z]/.test(password)) N += 26;
  if (/[A-Z]/.test(password)) N += 26;
  if (/[0-9]/.test(password)) N += 10;
  if (/[^a-zA-Z0-9]/.test(password)) N += 32;
  return Math.round(password.length * Math.log2(N || 1));
}

const RULES = [
  { label: "8 à 15 caractères", test: (p) => p.length >= 8 && p.length <= 15 },
  { label: "Une minuscule", test: (p) => /[a-z]/.test(p) },
  { label: "Une majuscule", test: (p) => /[A-Z]/.test(p) },
  { label: "Un chiffre", test: (p) => /[0-9]/.test(p) },
  { label: "Un caractère spécial (@.#$!%*?&)", test: (p) => /[^a-zA-Z0-9]/.test(p) },
];

function getStrengthLabel(score) {
  if (score === 0) return null;
  if (score <= 2) return { label: "Faible", color: "#ef4444" };
  if (score <= 3) return { label: "Moyen", color: "#f97316" };
  if (score === 4) return { label: "Bon", color: "#eab308" };
  return { label: "Fort", color: "#EF9F27" };
}

export default function PasswordStrengthMeter({ password }) {
  if (!password) return null;

  const score = RULES.filter((r) => r.test(password)).length;
  const strength = getStrengthLabel(score);
  const entropy = computeEntropy(password);

  return (
    <div className={classes.strengthMeter}>
      <div className={classes.strengthBarTrack}>
        {RULES.map((_, i) => (
          <div
            key={i}
            className={classes.strengthBarSegment}
            style={{
              backgroundColor: i < score ? strength.color : undefined,
              opacity: i < score ? 1 : 0.15,
            }}
          />
        ))}
      </div>

      {strength && (
        <span className={classes.strengthLabel} style={{ color: strength.color }}>
          {strength.label} — {entropy} bits
        </span>
      )}

      <ul className={classes.ruleList}>
        {RULES.map((rule) => {
          const ok = rule.test(password);
          return (
            <li key={rule.label} className={ok ? classes.ruleOk : classes.ruleFail}>
              {ok ? "✓" : "✗"} {rule.label}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
