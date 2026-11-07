import nodemailer from 'nodemailer';
import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';

let transporter;

/** Creates a reusable SMTP transport only when email delivery is configured. */
function getTransporter() {
  if (!env.SMTP_HOST || !env.SMTP_FROM) {
    throw new AppError('Email delivery is not configured. Set SMTP_HOST and SMTP_FROM.', 503);
  }
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      ...(env.SMTP_USER ? { auth: { user: env.SMTP_USER, pass: env.SMTP_PASS } } : {})
    });
  }
  return transporter;
}

/** Sends plain-text email and returns the SMTP delivery result. */
export async function sendEmail({ to, subject, text }) {
  try {
    return await getTransporter().sendMail({
      from: env.SMTP_FROM,
      to,
      subject,
      text
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error('Email delivery failed:', error);
    throw new AppError('Email delivery failed. Check SMTP configuration and try again.', 502);
  }
}
