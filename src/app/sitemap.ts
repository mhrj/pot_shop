import type { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';

// Trailing slashes are stripped: every route below already begins with "/", so
// a slash left on the configured origin would emit "https://host//products".
const baseUrl = (process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000').replace(/\/+$/, '');

// Rebuilt hourly instead of on every request — the catalogue changes rarely, and
// crawlers fetch this often.
export const revalidate = 3600;

/**
 * sitemap.xml
 *
 * Only active products are listed. A retired product's page 404s, and a sitemap
 * that points at 404s costs crawl budget and trust, so the same `isActive` filter
 * the catalogue uses is applied here.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    select: { slug: true, updatedAt: true },
    orderBy: { updatedAt: 'desc' },
  });

  return [
    {
      url: `${baseUrl}/`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${baseUrl}/products`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    ...products.map((product) => ({
      url: `${baseUrl}/products/${product.slug}`,
      lastModified: product.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
  ];
}
