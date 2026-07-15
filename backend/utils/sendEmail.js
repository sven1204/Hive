/* Fonction générique d'envoi d'email. Centralise tous les appels sortants via le transporteur Zoho.
   Vérifie la connexion SMTP avant chaque envoi pour détecter rapidement une configuration invalide. */
const transporter = require("./mailer");

async function sendEmail({ to, subject, html }) {
  await transporter.verify();
  return transporter.sendMail({
    from: `"Hive" <${process.env.MAIL_USER}>`,
    to,
    subject,
    html,
  });
}

module.exports = sendEmail;
