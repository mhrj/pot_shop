import { getEnv } from '@/lib/env';

const faDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
const arDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];

export function normalizeIranianPhoneNumber(raw: string): string {
  if (!raw) return '';

  let cleaned = raw.trim();

  // Convert Persian and Arabic digits to English digits
  for (let i = 0; i < 10; i++) {
    cleaned = cleaned.replaceAll(faDigits[i], String(i)).replaceAll(arDigits[i], String(i));
  }

  // Remove spaces, hyphens, parentheses, and any non-digit characters except leading plus
  cleaned = cleaned.replace(/[^\d+]/g, '');

  if (cleaned.startsWith('+98')) {
    cleaned = '0' + cleaned.slice(3);
  } else if (cleaned.startsWith('0098')) {
    cleaned = '0' + cleaned.slice(4);
  } else if (cleaned.startsWith('98') && cleaned.length === 12) {
    cleaned = '0' + cleaned.slice(2);
  } else if (cleaned.length === 10 && cleaned.startsWith('9')) {
    cleaned = '0' + cleaned;
  }

  return cleaned;
}

export function isValidIranianMobile(phone: string): boolean {
  return /^09\d{9}$/.test(phone);
}

export function isSmsConfigured(): boolean {
  return !!getEnv('KAVENEGAR_API_KEY');
}

export type SmsSendResult = {
  success: boolean;
  mock?: boolean;
  messageId?: number;
  error?: string;
};

export async function sendVerificationSms(
  phone: string,
  code: string,
): Promise<SmsSendResult> {
  const apiKey = getEnv('KAVENEGAR_API_KEY');
  const sender = getEnv('KAVENEGAR_SENDER');
  const template = getEnv('KAVENEGAR_TEMPLATE');

  if (!apiKey) {
    console.info(`[sms-mock] OTP code for ${phone}: ${code}`);
    return { success: true, mock: true };
  }

  try {
    let url: string;
    let body: URLSearchParams;

    if (template) {
      // Use Kavenegar verify lookup (pattern-based, works even on blacklisted numbers)
      url = `https://api.kavenegar.com/v1/${apiKey}/verify/lookup.json`;
      body = new URLSearchParams({
        receptor: phone,
        token: code,
        template,
      });
    } else {
      // Standard SMS send
      url = `https://api.kavenegar.com/v1/${apiKey}/sms/send.json`;
      const message = `پات استور\nکد تایید شما: ${code}\nاعتبار: ۲ دقیقه`;
      body = new URLSearchParams({
        receptor: phone,
        sender: sender || '',
        message,
      });
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
      },
      body: body.toString(),
      // 10-second timeout to avoid hung requests
      signal: AbortSignal.timeout(10000),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok || (data && data.return && data.return.status !== 200)) {
      const errMsg = data?.return?.message || `HTTP ${response.status}`;
      console.error(`[sms] Kavenegar error: ${errMsg}`);
      return { success: false, error: errMsg };
    }

    const messageId = Array.isArray(data?.entries) && data.entries[0]?.messageid
      ? data.entries[0].messageid
      : undefined;

    return { success: true, messageId };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error(`[sms] Network error communicating with Kavenegar: ${message}`);
    return { success: false, error: message };
  }
}
