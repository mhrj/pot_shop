import type { MetadataRoute } from 'next';

const baseUrl = (process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000').replace(/\/+$/, '');

/**
 * robots.txt
 *
 * The disallowed paths are the ones that are either private or meaningless to a
 * crawler: the admin panel, the per-customer checkout and cart, and the JSON API.
 * Note that robots.txt is a request, not an access control — `/admin` is still
 * guarded server-side by `requireAdmin()`, and that is what actually protects it.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/checkout', '/cart', '/api'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
