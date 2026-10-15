import { z } from 'zod';

export function isPersistedImageUrl(value: string): boolean {
  const candidate = value?.trim();
  if (!candidate) return false;

  if (candidate.startsWith('/')) {
    return !candidate.startsWith('//') && !candidate.startsWith('/blob') && !candidate.startsWith('/data:');
  }

  if (candidate.startsWith('blob:') || candidate.startsWith('data:')) {
    return false;
  }

  try {
    const parsed = new URL(candidate);
    return ['http:', 'https:'].includes(parsed.protocol) && !!parsed.hostname;
  } catch {
    return false;
  }
}

export const persistedImageUrlSchema = z
  .string()
  .trim()
  .min(1, 'URL تصویر نامعتبر است')
  .refine((value) => isPersistedImageUrl(value), {
    message: 'URL تصویر باید یک مسیر محلی /uploads/... یا یک URL معتبر http/https باشد',
  });
