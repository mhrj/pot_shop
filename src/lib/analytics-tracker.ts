import crypto from 'node:crypto';
import { prisma } from '@/lib/prisma';

/**
 * Creates a privacy-friendly daily visitor hash.
 * Hashing IP + User-Agent + daily salt prevents cross-day tracking
 * while still accurately measuring daily unique visitors.
 */
export function getVisitorHash(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  const ip = forwarded
    ? forwarded.split(',')[0].trim()
    : (req as any).ip || req.headers.get('x-real-ip') || '127.0.0.1';
  const userAgent = req.headers.get('user-agent') || 'unknown';
  const dailySalt = new Date().toISOString().split('T')[0];

  return crypto
    .createHash('sha256')
    .update(`${ip}:${userAgent}:${dailySalt}`)
    .digest('hex');
}

/**
 * Inserts a PageView record into the database.
 * Wrapped in try/catch to ensure analytics failures never break the page or API response.
 */
export async function trackPageView(path: string, req: Request): Promise<void> {
  try {
    if (
      !path ||
      path.startsWith('/admin') ||
      path.startsWith('/api') ||
      path.startsWith('/_next') ||
      path.includes('.')
    ) {
      return;
    }

    const ipHash = getVisitorHash(req);

    await prisma.pageView.create({
      data: {
        path,
        ipHash,
      },
    });
  } catch (error) {
    // Non-blocking catch to ensure requests never fail due to analytics
    console.error('Failed to log page view:', error);
  }
}
