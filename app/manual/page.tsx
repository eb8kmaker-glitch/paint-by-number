import type { Metadata } from 'next';
import Link from 'next/link';
import manualKo from '@/locales/ko/manual.json';
import manualEn from '@/locales/en/manual.json';

export const metadata: Metadata = {
  title: '사용 가이드 / Settings Guide',
  description: 'PaintKit 설정 가이드 — 색상 수, 세부 수준, 캔버스 크기, 스타일 선택 방법. PaintKit settings guide for color count, detail level, canvas size, and style.',
};

export default function ManualPage() {
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
              사용 가이드 / Settings Guide
            </p>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-10">

        {/* Korean section */}
        <section className="mb-14">
          <p style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-frame)', marginBottom: '4px' }}>
            {manualKo.title}
          </p>
          <h1 style={{ fontFamily: 'var(--font-playfair), Georgia, serif', fontSize: '1.6rem', fontWeight: 600, color: 'var(--color-ink)', marginBottom: '4px' }}>
            {manualKo.title}
          </h1>
          <p className="text-sm mb-8" style={{ color: 'var(--color-muted)' }}>{manualKo.subtitle}</p>

          <div className="grid sm:grid-cols-2 gap-5">
            {manualKo.sections.map((section, i) => (
              <div key={i} style={{
                background: '#FDFAF5',
                border: '1px solid #DDD0BC',
                borderLeft: '3px solid var(--color-frame)',
                borderRadius: '0 3px 3px 0',
                padding: '16px',
              }}>
                <p className="text-sm font-semibold mb-2"
                  style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-playfair), Georgia, serif' }}>
                  {section.title}
                </p>
                <p className="text-xs mb-3" style={{ color: 'var(--color-muted)' }}>{section.content}</p>
                <ul className="flex flex-col gap-1.5">
                  {section.options.map((opt, j) => (
                    <li key={j} className="flex gap-2 text-xs">
                      <span style={{ color: 'var(--color-frame-dark)', fontWeight: 600, flexShrink: 0 }}>{opt.label}</span>
                      <span style={{ color: 'var(--color-muted)', opacity: 0.85 }}>— {opt.effect}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* English section */}
        <section className="border-t pt-10" style={{ borderColor: '#EDE5D8' }}>
          <p style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-frame)', marginBottom: '4px' }}>
            {manualEn.title}
          </p>
          <h2 style={{ fontFamily: 'var(--font-playfair), Georgia, serif', fontSize: '1.4rem', fontWeight: 600, color: 'var(--color-ink)', marginBottom: '4px' }}>
            {manualEn.title}
          </h2>
          <p className="text-sm mb-8" style={{ color: 'var(--color-muted)' }}>{manualEn.subtitle}</p>

          <div className="grid sm:grid-cols-2 gap-5">
            {manualEn.sections.map((section, i) => (
              <div key={i} style={{
                background: '#FDFAF5',
                border: '1px solid #DDD0BC',
                borderLeft: '3px solid var(--color-frame)',
                borderRadius: '0 3px 3px 0',
                padding: '16px',
              }}>
                <p className="text-sm font-semibold mb-2"
                  style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-playfair), Georgia, serif' }}>
                  {section.title}
                </p>
                <p className="text-xs mb-3" style={{ color: 'var(--color-muted)' }}>{section.content}</p>
                <ul className="flex flex-col gap-1.5">
                  {section.options.map((opt, j) => (
                    <li key={j} className="flex gap-2 text-xs">
                      <span style={{ color: 'var(--color-frame-dark)', fontWeight: 600, flexShrink: 0 }}>{opt.label}</span>
                      <span style={{ color: 'var(--color-muted)', opacity: 0.85 }}>— {opt.effect}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <div className="mt-12 text-center">
          <Link href="/"
            className="btn-gallery btn-gold inline-flex items-center gap-2 py-3 px-6">
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            도안 만들기 / Start Creating
          </Link>
        </div>
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
