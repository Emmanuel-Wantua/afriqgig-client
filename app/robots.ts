import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',           // Allow everything by default
      disallow: [
          '/dashboard/',    // ⛔ Block Google from indexing private dashboards
          '/api/',          // ⛔ Block API routes
          '/admin/'         // ⛔ Block Admin panel
      ], 
    },
    sitemap: 'https://afriqgig.com/sitemap.xml', // Link to the sitemap we just made
  };
}