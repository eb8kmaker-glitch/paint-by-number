import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: 'https://paintkit.app',         priority: 1.0, changeFrequency: 'weekly'  },
    { url: 'https://paintkit.app/en',       priority: 1.0, changeFrequency: 'weekly'  },
    { url: 'https://paintkit.app/ko',       priority: 0.9, changeFrequency: 'weekly'  },
    { url: 'https://paintkit.app/ja',       priority: 0.9, changeFrequency: 'weekly'  },
    { url: 'https://paintkit.app/en/guide', priority: 0.8, changeFrequency: 'monthly' },
    { url: 'https://paintkit.app/ko/guide', priority: 0.8, changeFrequency: 'monthly' },
    { url: 'https://paintkit.app/ja/guide', priority: 0.8, changeFrequency: 'monthly' },
    { url: 'https://paintkit.app/en/faq',   priority: 0.8, changeFrequency: 'monthly' },
    { url: 'https://paintkit.app/ko/faq',   priority: 0.8, changeFrequency: 'monthly' },
    { url: 'https://paintkit.app/ja/faq',   priority: 0.8, changeFrequency: 'monthly' },
    { url: 'https://paintkit.app/generate', priority: 0.7, changeFrequency: 'monthly' },
    { url: 'https://paintkit.app/manual',   priority: 0.6, changeFrequency: 'monthly' },
    { url: 'https://paintkit.app/contact',  priority: 0.5, changeFrequency: 'yearly'  },
  ];
}
