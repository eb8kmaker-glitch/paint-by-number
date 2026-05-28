import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Paint by Number | 페인트 바이 넘버 도안 생성기',
  description: '사진을 업로드하면 페인트 바이 넘버 도안으로 변환해 드립니다. Upload your photo and get a professional paint-by-number diagram.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="bg-slate-50 text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}
