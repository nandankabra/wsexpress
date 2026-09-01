const nodemailer = require('nodemailer');

let transporter = null;

/**
 * Real SMTP when SMTP_HOST is configured; otherwise nodemailer's built-in JSON transport,
 * which "sends" by resolving with the message contents instead of connecting anywhere - lets
 * the whole notification flow run and be demoed without needing real mail credentials.
 */
function getTransporter() {
  if (transporter) return transporter;

  if (process.env.SMTP_HOST) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD } : undefined,
    });
  } else {
    transporter = nodemailer.createTransport({ jsonTransport: true });
  }
  return transporter;
}

async function sendMail({ to, subject, text }) {
  const info = await getTransporter().sendMail({
    from: process.env.SMTP_FROM || 'ShipTrack <no-reply@shiptrack.local>',
    to,
    subject,
    text,
  });
  return info;
}

module.exports = { sendMail };
