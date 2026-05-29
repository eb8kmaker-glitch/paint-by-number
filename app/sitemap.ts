import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: 'https://paintkit.app',         priority: 1.0, changeFrequency: 'weekly'  },
    { url: 'https://paintkit.app/en',       priority: 0.9, changeFrequency: 'weekly'  },
    { url: 'https://paintkit.app/generate', priority: 0.8, changeFrequency: 'monthly' },
  ];
}
