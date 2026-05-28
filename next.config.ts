import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // jsPDF uses browser-only APIs — disable SSR for pages that use it
  // (handled via 'use client' directives in components)
};

export default nextConfig;
