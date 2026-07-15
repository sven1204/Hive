/* Wrapper mince autour de sendEmail, conservé pour isoler la logique d'envoi des emails
   de réinitialisation de mot de passe si des customisations spécifiques sont ajoutées plus tard. */
const sendEmail = require("./sendEmail");

async function sendResetEmail({ to, subject, html }) {
  return sendEmail({ to, subject, html });
}

module.exports = sendResetEmail;
