import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://memoria-dusky.vercel.app'
  return [
    { url: base, lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/mentions-legales`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    { url: `${base}/politique-de-confidentialite`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    { url: `${base}/rgpd`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
  ]
}
