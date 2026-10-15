import crypto from 'node:crypto';
import { getEnv } from '@/lib/env';

export type ResetEmailPayload = {
  to: string;
  resetUrl: string;
};

export async function createResetToken() {
  return crypto.randomBytes(32).toString('hex');
}

export function hashToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function isPasswordResetTokenValid(tokenEntry: {
  usedAt: Date | null;
  expiresAt: Date;
} | null) {
  return !!tokenEntry && !tokenEntry.usedAt && tokenEntry.expiresAt.getTime() > Date.now();
}

export function getRecoverySupportMessage() {
  const contact = getEnv('SUPPORT_CONTACT');
  const supportUrl = getEnv('SUPPORT_URL');

  if (contact) {
    return `برای بازیابی رمز عبور، لطفاً از ${contact} استفاده کنید.`;
  }

  if (supportUrl) {
    return `برای بازیابی رمز عبور، لطفاً از مسیر پشتیبانی فروشگاه (${supportUrl}) استفاده کنید.`;
  }

  return 'برای بازیابی رمز عبور، لطفاً با پشتیبانی فروشگاه تماس بگیرید.';
}

export async function sendPasswordResetEmail(payload: ResetEmailPayload) {
  const apiKey = getEnv('RESEND_API_KEY');
  const from = getEnv('EMAIL_FROM', 'no-reply@localhost');
  if (!apiKey) {
    console.info('[password-reset] email provider not configured; skipping outbound message');
    return { queued: false, reason: 'not-configured' } as const;
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [payload.to],
      subject: 'بازیابی رمز عبور پات شاپ',
      html: `<p>برای بازیابی رمز عبور خود روی لینک زیر کلیک کنید:</p><p><a href="${payload.resetUrl}">${payload.resetUrl}</a></p>`,
      text: `برای بازیابی رمز عبور خود این لینک را باز کنید: ${payload.resetUrl}`,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || 'ارسال ایمیل با شکست مواجه شد');
  }

  return { queued: true, reason: 'sent' } as const;
}
