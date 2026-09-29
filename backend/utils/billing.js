/* Configuration de l'abonnement Hive+ et du boost.
   Tout se règle par variables d'environnement : sans STRIPE_SECRET_KEY, la facturation est
   désactivée proprement (les offres s'affichent, les paiements renvoient 503). */
const Stripe = require('stripe');

let client = null;
function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) return null;
  if (!client) client = new Stripe(process.env.STRIPE_SECRET_KEY);
  return client;
}

const BOOST_HOURS = Number(process.env.BOOST_HOURS || 48);
const BOOSTS_PER_INVOICE = Number(process.env.PLUS_BOOSTS_PER_MONTH || 2); // boosts crédités à chaque facture payée
const MAX_BOOST_CREDITS = 6;

/* Produits vendus → identifiant de prix Stripe + prix affiché par défaut (CHF, centimes) */
const PRODUCTS = {
  plus_monthly: { mode: 'subscription', priceEnv: 'STRIPE_PRICE_PLUS_MONTHLY', fallback: 590, interval: 'month' },
  plus_yearly: { mode: 'subscription', priceEnv: 'STRIPE_PRICE_PLUS_YEARLY', fallback: 4900, interval: 'year' },
  boost: { mode: 'payment', priceEnv: 'STRIPE_PRICE_BOOST', fallback: 390 },
};

const isEnabled = () => !!getStripe() && Object.values(PRODUCTS).every((p) => !!process.env[p.priceEnv]);

/* Offre « membres fondateurs » : réelle et datée (jamais un compte à rebours factice) */
function foundersOffer() {
  const endsAt = process.env.FOUNDERS_OFFER_ENDS_AT ? new Date(process.env.FOUNDERS_OFFER_ENDS_AT) : null;
  const percentOff = Number(process.env.FOUNDERS_PERCENT_OFF || 0);
  if (!endsAt || Number.isNaN(endsAt.getTime()) || endsAt.getTime() <= Date.now() || percentOff <= 0) return null;
  return { percentOff, endsAt: endsAt.toISOString(), couponId: process.env.STRIPE_FOUNDERS_COUPON || null };
}

/* Prix réels lus chez Stripe (cache 10 min), prix par défaut sinon */
let priceCache = { at: 0, amounts: null };
async function displayPrices() {
  const stripe = getStripe();
  const fallback = Object.fromEntries(Object.entries(PRODUCTS).map(([k, p]) => [k, { amount: p.fallback, currency: 'chf' }]));
  if (!stripe || !isEnabled()) return fallback;
  if (priceCache.amounts && Date.now() - priceCache.at < 10 * 60 * 1000) return priceCache.amounts;
  try {
    const entries = await Promise.all(Object.entries(PRODUCTS).map(async ([key, p]) => {
      const price = await stripe.prices.retrieve(process.env[p.priceEnv]);
      return [key, { amount: price.unit_amount, currency: price.currency }];
    }));
    priceCache = { at: Date.now(), amounts: Object.fromEntries(entries) };
    return priceCache.amounts;
  } catch (err) {
    console.error('displayPrices error:', err.message);
    return fallback;
  }
}

const isPlus = (user) => user?.plan === 'plus';

module.exports = { getStripe, isEnabled, foundersOffer, displayPrices, PRODUCTS, BOOST_HOURS, BOOSTS_PER_INVOICE, MAX_BOOST_CREDITS, isPlus };
