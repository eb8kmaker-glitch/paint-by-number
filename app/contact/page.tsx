import type { Metadata } from 'next';
import ContactForm from './ContactForm';
import Link from 'next/link';

export const metadata: Metadata = {
  title: '문의하기 / Contact',
  description: 'PaintKit에 대한 피드백, 버그 신고, 기능 제안을 보내주세요.',
};

export default function ContactPage() {
  return (
    <div className="min-h-screen flex flex-col">

      {/* Header */}
      <header className="sticky top-0 z-20 border-b backdrop-blur-md"
        style={{ borderColor: 'var(--color-frame)', background: 'rgba(248, 244, 238, 0.93)' }}>
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/"
            className="back-btn w-9 h-9 flex items-center justify-center"
            title="홈으로 / Home">
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
              style={{ color: 'var(--color-ink)' }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div className="w-9 h-9 flex items-center justify-center flex-shrink-0"
            style={{ background: 'var(--color-frame-dark)', borderRadius: '3px' }}>
            <svg width="20" height="20" fill="none" stroke="#FDF6E3" strokeWidth="1.8" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </div>
          <div>
            <p className="text-base font-semibold leading-tight"
              style={{ fontFamily: 'var(--font-playfair), Georgia, serif', color: 'var(--color-ink)' }}>
              PaintKit
            </p>
            <p className="text-xs leading-tight" style={{ color: 'var(--color-muted)' }}>
              문의하기 / Contact
            </p>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 max-w-xl mx-auto w-full px-4 py-12">
        <p style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-frame)', marginBottom: '4px' }}>
          Contact
        </p>
        <h1 style={{ fontFamily: 'var(--font-playfair), Georgia, serif', fontSize: '1.6rem', fontWeight: 600, color: 'var(--color-ink)', marginBottom: '6px' }}>
          문의하기
        </h1>
        <p className="text-sm mb-8" style={{ color: 'var(--color-muted)', lineHeight: 1.7 }}>
          버그 신고, 기능 제안, 피드백 등 무엇이든 보내주세요.
          <br />
          <span style={{ opacity: 0.7 }}>Bug reports, feature requests, or any feedback — we&apos;d love to hear from you.</span>
        </p>

        <ContactForm />
      </main>

      {/* Footer */}
      <footer className="py-5 text-center border-t" style={{ borderColor: '#DDD0BC' }}>
        <p className="text-xs italic"
          style={{ fontFamily: 'var(--font-playfair), Georgia, serif', color: 'var(--color-muted)' }}>
          모든 처리는 브라우저에서 실행됩니다 — 이미지는 서버로 전송되지 않습니다
        </p>
      </footer>
    </div>
  );
}
