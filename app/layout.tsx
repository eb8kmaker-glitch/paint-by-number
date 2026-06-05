import type { Metadata } from 'next';
import { Playfair_Display, Inter } from 'next/font/google';
import './globals.css';

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  style: ['normal', 'italic'],
  weight: ['400', '600'],
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  weight: ['400', '500'],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://paintkit.app'),
  title: {
    default: 'Free Paint by Numbers Generator — Photo to Custom Template | PaintKit',
    template: '%s | PaintKit',
  },
  description: 'Turn any photo into a custom paint by numbers template. Acrylic color matching, A4/A3/canvas-size PDF export. Free, runs in your browser — your photo never leaves your device.',
  keywords: ['paint by numbers generator', 'custom paint by number', 'photo to paint by numbers', 'paint by numbers template', 'free paint by numbers', 'acrylic painting'],
  authors: [{ name: 'PaintKit' }],
  openGraph: {
    url: 'https://paintkit.app',
    siteName: 'PaintKit',
    title: 'Free Paint by Numbers Generator — Photo to Custom Template | PaintKit',
    description: 'Turn any photo into a custom paint by numbers template. Free, runs entirely in your browser — your photo never leaves your device.',
    images: [{
      url: 'https://paintkit.app/og-image.png',
      width: 1200,
      height: 630,
      alt: 'PaintKit — Photo to Paint by Numbers',
    }],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Free Paint by Numbers Generator — PaintKit',
    description: 'Turn any photo into a custom paint by numbers template. Free, runs entirely in your browser.',
    images: ['https://paintkit.app/og-image.png'],
  },
  robots: { index: true, follow: true },
  alternates: {
    canonical: 'https://paintkit.app',
    languages: {
      'en': 'https://paintkit.app',
      'ko': 'https://paintkit.app/ko',
      'ja': 'https://paintkit.app/ja',
      'x-default': 'https://paintkit.app',
    },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${playfair.variable} ${inter.variable} antialiased`}
        style={{ fontFamily: 'var(--font-inter), Inter, sans-serif' }}>
        {children}
      </body>
    </html>
  );
}
