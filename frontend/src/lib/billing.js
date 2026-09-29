import { api } from "./api";

/* Abonnement Hive+ et boosts : redirections vers Stripe (paiement, portail) et formats de prix. */

export function formatPrice(price, lang = "fr") {
  if (!price) return "";
  const amount = price.amount / 100;
  const whole = Number.isInteger(amount);
  try {
    return new Intl.NumberFormat(lang === "en" ? "en-CH" : "fr-CH", {
      style: "currency",
      currency: (price.currency || "chf").toUpperCase(),
      minimumFractionDigits: whole ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount} CHF`;
  }
}

export const fetchPlans = () => api("/billing/plans");
export const fetchMyBilling = () => api("/billing/me");

/** Ouvre Stripe Checkout (abonnement ou boost). Lève une erreur si le paiement ne peut pas démarrer. */
export async function startCheckout(product, projectId) {
  const data = await api("/billing/checkout", { method: "POST", body: JSON.stringify({ product, projectId }) });
  if (!data?.url) throw new Error("checkout");
  window.location.assign(data.url);
}

/** Ouvre le portail Stripe (résilier, factures, moyen de paiement). */
export async function openPortal() {
  const data = await api("/billing/portal", { method: "POST" });
  if (!data?.url) throw new Error("portal");
  window.location.assign(data.url);
}

export const isBoosted = (project) => !!project?.boostedUntil && new Date(project.boostedUntil).getTime() > Date.now();
