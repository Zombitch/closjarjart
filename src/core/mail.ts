import nodemailer from 'nodemailer';
import { htmlToText } from 'html-to-text';
import env from './env';

type MailOptions = {
  to: string;
  replyTo: string;
  subject: string;
  html: string;
};

let transporter: nodemailer.Transporter | undefined;

if (env.mail.enabled) {
  if (!env.mail.user || !env.mail.password) {
    console.warn('SEND_MAIL is enabled but SMTP credentials are incomplete. Emails will not be sent.');
  } else {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: env.mail.user,
        pass: env.mail.password,
      },
    });
  }
}

export async function sendMail({ to, replyTo, subject, html }: MailOptions) {
  if (!env.mail.enabled || !transporter) {
    return;
  }

  const from = env.mail.from ?? env.mail.user;

  if (!from) {
    console.warn('Missing SMTP_FROM/SMTP_USER configuration. Email skipped.');
    return;
  }

  try {
    await transporter.sendMail({
      from,
      replyTo,
      to,
      subject,
      text: htmlToText(html),
      html,
      attachments: [],
    });
  } catch (error) {
    console.error("Erreur survenue pendant l'envoi de l'email :", error);
  }
}
