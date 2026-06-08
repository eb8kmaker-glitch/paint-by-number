import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: '/en', destination: '/', permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: '/ko/guide',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "frame-src 'self' https://coupa.ng;",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
