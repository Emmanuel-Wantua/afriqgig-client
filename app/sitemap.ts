import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://afriqgig.com';

  // List of all static public pages you want indexed
  const routes = [
    '',             // Landing Page
    '/about',
    '/contact',
    '/faq',
    '/login',
    '/signup',
    '/terms',
    '/privacy',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: route === '' ? 1 : 0.8, // Landing page has highest priority
  }));

  // Note: If you want to index public freelancer profiles, 
  // you would fetch them from the DB here and add them to the array.

  return routes;
}