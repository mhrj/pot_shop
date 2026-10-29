import { z } from 'zod';

export type SniffedImageType =
  | 'image/jpeg'
  | 'image/png'
  | 'image/webp'
  | 'image/avif'
  | 'image/gif';

/** The extension each sniffed type is allowed to be persisted under. */
export const IMAGE_EXTENSION_BY_TYPE: Record<SniffedImageType, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/avif': '.avif',
  'image/gif': '.gif',
};

function matchesAscii(bytes: Uint8Array, offset: number, signature: string): boolean {
  if (bytes.length < offset + signature.length) return false;
  for (let i = 0; i < signature.length; i += 1) {
    if (bytes[offset + i] !== signature.charCodeAt(i)) return false;
  }
  return true;
}

/**
 * Identifies an image from its leading bytes rather than from the name or the
 * `Content-Type` the client chose, both of which the uploader controls. An
 * upload is written into `public/uploads` and served from this site's own
 * origin, so a file whose *content* is not really an image (HTML, SVG, a
 * script) must be refused before it is persisted, however it was labelled.
 *
 * Returns null for anything that is not one of the five accepted formats.
 */
export function sniffImageType(bytes: Uint8Array | null | undefined): SniffedImageType | null {
  if (!bytes || bytes.length < 12) return null;

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (matchesAscii(bytes, 0, '\x89PNG\r\n\x1a\n')) return 'image/png';

  // JPEG: FF D8 FF
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg';

  // GIF: "GIF87a" or "GIF89a"
  if (matchesAscii(bytes, 0, 'GIF87a') || matchesAscii(bytes, 0, 'GIF89a')) return 'image/gif';

  // WebP: "RIFF" .... "WEBP"
  if (matchesAscii(bytes, 0, 'RIFF') && matchesAscii(bytes, 8, 'WEBP')) return 'image/webp';

  // AVIF: an ISO-BMFF box whose type is "ftyp" and whose major brand (or one of
  // its compatible brands) is "avif" / "avis". Brands are 4-byte ASCII entries.
  if (matchesAscii(bytes, 4, 'ftyp')) {
    const boxSize =
      ((bytes[0] << 24) | (bytes[1] << 16) | (bytes[2] << 8) | bytes[3]) >>> 0;
    const limit = Math.min(boxSize > 0 ? boxSize : bytes.length, bytes.length);
    for (let offset = 8; offset + 4 <= limit; offset += 4) {
      if (matchesAscii(bytes, offset, 'avif') || matchesAscii(bytes, offset, 'avis')) {
        return 'image/avif';
      }
    }
  }

  return null;
}

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

/**
 * Detects whether an image URL represents an SVG or an external SVG placeholder (such as placehold.co)
 * that must be served `unoptimized` by Next.js <Image> to avoid optimizer rejection when
 * `dangerouslyAllowSVG` is disabled.
 */
export function isUnoptimizedImage(url?: string | null): boolean {
  if (!url) return false;
  const trimmed = url.trim().toLowerCase();
  if (
    trimmed.endsWith('.svg') ||
    trimmed.includes('.svg?') ||
    trimmed.includes('.svg#') ||
    trimmed.startsWith('data:image/svg+xml')
  ) {
    return true;
  }
  // placehold.co serves SVG by default unless explicitly appended with an image raster extension
  if (trimmed.includes('placehold.co')) {
    const [pathPart] = trimmed.split('?', 1);
    if (
      !pathPart.endsWith('.png') &&
      !pathPart.endsWith('.webp') &&
      !pathPart.endsWith('.jpg') &&
      !pathPart.endsWith('.jpeg')
    ) {
      return true;
    }
  }
  return false;
}

