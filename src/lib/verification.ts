import crypto from 'node:crypto';

export const OTP_EXPIRATION_SECONDS = 120; // 2 minutes
export const OTP_MAX_ATTEMPTS = 5;
export const OTP_RATE_LIMIT_SECONDS = 120; // 1 request per 2 minutes

export function generateOtpCode(): string {
  // Generate a cryptographically secure 5-digit number: 10000 to 99999
  return crypto.randomInt(10000, 100000).toString();
}

export function hashOtpCode(code: string): string {
  return crypto.createHash('sha256').update(code.trim()).digest('hex');
}

export function isVerificationCodeValid(entry: {
  usedAt: Date | null;
  expiresAt: Date;
  attempts: number;
} | null): boolean {
  if (!entry) return false;
  if (entry.usedAt) return false;
  if (entry.attempts >= OTP_MAX_ATTEMPTS) return false;
  return entry.expiresAt.getTime() > Date.now();
}
