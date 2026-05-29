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
    default: 'PaintKit | 페인트 바이 넘버 도안 생성기',
    template: '%s | PaintKit',
  },
  description: '내 사진을 페인트 바이 넘버 도안으로 변환. 아크릴 물감 색상 자동 매핑, A4/A3/액자 규격 PDF 출력. 브라우저에서 바로 실행, 이미지 서버 전송 없음.',
  keywords: ['페인트 바이 넘버', '명화 그리기', '번호 채색 도안', 'DIY 그림', '아크릴 물감', 'paint by number', 'custom paint by number', 'photo to painting'],
  authors: [{ name: 'PaintKit' }],
  openGraph: {
    url: 'https://paintkit.app',
    siteName: 'PaintKit',
    title: '내 사진으로 페인트 바이 넘버 도안 만들기 — PaintKit',
    description: '사진 업로드 → 자동 도안 생성 → PDF 출력. 무료, 브라우저 처리.',
    images: [{
      url: 'https://paintkit.app/og-image.png',
      width: 1200,
      height: 630,
      alt: 'PaintKit — 사진을 페인트 바이 넘버 도안으로 변환',
    }],
    locale: 'ko_KR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: '내 사진으로 페인트 바이 넘버 도안 만들기 — PaintKit',
    description: '사진 업로드 → 자동 도안 생성 → PDF 출력. 무료, 브라우저 처리.',
    images: ['https://paintkit.app/og-image.png'],
  },
  robots: { index: true, follow: true },
  alternates: {
    canonical: 'https://paintkit.app',
    languages: {
      'ko': 'https://paintkit.app',
      'en': 'https://paintkit.app/en',
    },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className={`${playfair.variable} ${inter.variable} antialiased`}
        style={{ fontFamily: 'var(--font-inter), Inter, sans-serif' }}>
        {children}
      </body>
    </html>
  );
}
