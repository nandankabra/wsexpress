const nodemailer = require('nodemailer');

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  if (process.env.SMTP_HOST) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
        : undefined,
    });
  } else {
    // Fallback: log to console when no SMTP configured
    transporter = nodemailer.createTransport({ jsonTransport: true });
  }
  return transporter;
}

async function sendVerificationEmail(to, name, otp) {
  try {
    const info = await getTransporter().sendMail({
      from: process.env.SMTP_FROM || 'ShipTrack <no-reply@shiptrack.local>',
      to,
      subject: 'Verify your ShipTrack Email',
      text: `Hi ${name}, your 6-digit email verification code is: ${otp}\n\nThis code expires in 24 hours.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; padding: 20px;">
          <h2 style="color: #4F46E5;">ShipTrack Email Verification</h2>
          <p>Hi <strong>${name}</strong>,</p>
          <p>Your 6-digit verification code is:</p>
          <div style="background: #F3F4F6; padding: 16px; border-radius: 8px; text-align: center; margin: 16px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1F2937;">${otp}</span>
          </div>
          <p style="color: #6B7280; font-size: 14px;">This code expires in 24 hours.</p>
          <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 20px 0;" />
          <p style="color: #9CA3AF; font-size: 12px;">If you didn't create a ShipTrack account, please ignore this email.</p>
        </div>
      `,
    });

    if (!process.env.SMTP_HOST) {
      console.log(`[auth-mailer] SIMULATED verification email to ${to}, OTP: ${otp}`);
    } else {
      console.log(`[auth-mailer] Verification email sent to ${to}, messageId: ${info.messageId}`);
    }
    return info;
  } catch (err) {
    console.error(`[auth-mailer] Failed to send verification email to ${to}:`, err.message);
    throw err;
  }
}

async function sendPasswordResetEmail(to, name, otp) {
  try {
    const info = await getTransporter().sendMail({
      from: process.env.SMTP_FROM || 'ShipTrack <no-reply@shiptrack.local>',
      to,
      subject: 'Reset your ShipTrack Password',
      text: `Hi ${name}, you requested a password reset. Your 6-digit reset code is: ${otp}\n\nThis code expires in 1 hour.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; padding: 20px;">
          <h2 style="color: #4F46E5;">ShipTrack Password Reset</h2>
          <p>Hi <strong>${name}</strong>,</p>
          <p>You requested a password reset. Your 6-digit code is:</p>
          <div style="background: #FEF2F2; padding: 16px; border-radius: 8px; text-align: center; margin: 16px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #DC2626;">${otp}</span>
          </div>
          <p style="color: #6B7280; font-size: 14px;">This code expires in 1 hour.</p>
          <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 20px 0;" />
          <p style="color: #9CA3AF; font-size: 12px;">If you didn't request this, please ignore this email. Your password will not change.</p>
        </div>
      `,
    });

    if (!process.env.SMTP_HOST) {
      console.log(`[auth-mailer] SIMULATED password reset email to ${to}, OTP: ${otp}`);
    } else {
      console.log(`[auth-mailer] Password reset email sent to ${to}, messageId: ${info.messageId}`);
    }
    return info;
  } catch (err) {
    console.error(`[auth-mailer] Failed to send password reset email to ${to}:`, err.message);
    throw err;
  }
}

module.exports = { sendVerificationEmail, sendPasswordResetEmail };
