import type { MetadataRoute } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://dreamthread.app'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Everything behind auth is per-user and pointless to crawl
      disallow: ['/journal', '/patterns', '/almanac', '/ask', '/account', '/auth'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
