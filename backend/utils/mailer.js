/* Transporteur Nodemailer configuré pour Zoho Mail via SMTP sécurisé (port 465 / SSL).
   Variables d'environnement requises : MAIL_USER (adresse expéditrice) et MAIL_PASS (mot de passe SMTP). */
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.zoho.eu",
  port: 465,
  secure: true,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

module.exports = transporter;
