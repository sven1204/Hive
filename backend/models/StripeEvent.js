/* Événements Stripe déjà traités : Stripe peut renvoyer un même webhook plusieurs fois,
   ce journal garantit qu'un paiement n'est appliqué qu'une seule fois (idempotence). */
const mongoose = require('mongoose');

const stripeEventSchema = new mongoose.Schema({
  _id: { type: String },           // identifiant de l'événement Stripe (evt_…)
  type: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model('StripeEvent', stripeEventSchema);
