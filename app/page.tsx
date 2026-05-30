'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import UploadZone from '@/components/UploadZone';
import AdUnit from '@/components/AdUnit';
import faqData from '@/locales/ko/faq.json';
import manualData from '@/locales/ko/manual.json';

const STEPS = [
  { ko: '업로드',   en: 'Upload'   },
  { ko: '설정',     en: 'Settings' },
  { ko: '생성',     en: 'Generate' },
  { ko: '내보내기', en: 'Export'   },
];

const FEATURES = [
  {
    dot: '#4A7C6B',
    titleKo: '클라이언트 처리',
    titleEn: 'Client-Side Only',
    descKo:  '이미지가 서버로 전송되지 않습니다',
  },
  {
    dot: '#C8A96E',
    titleKo: '전문 물감 색상',
    titleEn: '24–48 Acrylic Colors',
    descKo:  '24~48가지 아크릴 물감 색상',
  },
  {
    dot: '#C4622D',
    titleKo: 'PNG / PDF 출력',
    titleEn: 'PNG & PDF Export',
    descKo:  '인쇄용 A4 PDF 레이아웃 포함',
  },
];

const sectionLabelStyle: React.CSSProperties = {
  fontSize: '0.6rem',
  fontWeight: 700,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: 'var(--color-frame)',
  marginBottom: '6px',
};

const headingStyle: React.CSSProperties = {
  fontFamily: 'var(--font-playfair), Georgia, serif',
  fontSize: '1.5rem',
  fontWeight: 600,
  color: 'var(--color-ink)',
  marginBottom: '6px',
};

export default function HomePage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const handleImageReady = (dataUrl: string) => {
    sessionStorage.setItem('uploadedImage', dataUrl);
    setReady(true);
  };

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqData.items.map(item => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  };

  const appJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'PaintKit',
    url: 'https://paintkit.app',
    applicationCategory: 'UtilitiesApplication',
    operatingSystem: 'Web Browser',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'KRW' },
    isAccessibleForFree: true,
    inLanguage: ['ko', 'en'],
    description: '사진을 페인트 바이 넘버 도안으로 변환하는 무료 브라우저 앱',
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Script
        id="ld-faq"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <Script
        id="ld-app"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(appJsonLd) }}
      />

      {/* ── Header ──────────────────────────────────────────── */}
      <header className="sticky top-0 z-20 border-b backdrop-blur-md"
        style={{ borderColor: 'var(--color-frame)', background: 'rgba(248, 244, 238, 0.93)' }}>
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
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
              페인트 바이 넘버 도안 생성기
            </p>
          </div>
        </div>
      </header>

      {/* ── Step indicator ──────────────────────────────────── */}
      <div className="border-b" style={{ background: '#FDFAF5', borderColor: '#DDD0BC' }}>
        <div className="max-w-5xl mx-auto px-4 py-3">
          <div className="flex items-center">
            {STEPS.map((step, i) => (
              <div key={i} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center gap-0.5">
                  <div
                    className="w-7 h-7 flex items-center justify-center text-xs font-bold transition-all"
                    style={{
                      borderRadius: '4px',
                      background: i === 0 ? 'var(--color-frame)' : '#E8DDD0',
                      color: i === 0 ? '#fff' : 'var(--color-muted)',
                    }}
                  >
                    {i + 1}
                  </div>
                  <span className="hidden sm:block text-[10px] font-medium"
                    style={{ color: i === 0 ? 'var(--color-frame-dark)' : 'var(--color-muted)' }}>
                    {step.ko}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="flex-1 h-px mx-2" style={{ background: '#D4C4AE' }} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Main ─────────────────────────────────────────────── */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4">

        {/* ── Hero ─────────────────────────────────────────── */}
        <section className="py-12">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-semibold italic mb-3"
              style={{ fontFamily: 'var(--font-playfair), Georgia, serif', color: 'var(--color-ink)' }}>
              사진을 명화 도안으로
            </h1>
            <p className="text-base max-w-md mx-auto mb-1" style={{ color: 'var(--color-muted)' }}>
              사진을 업로드하면 번호가 표시된 채색 도안으로 변환해 드립니다.
            </p>
            <p className="text-sm" style={{ color: 'var(--color-muted)', opacity: 0.7 }}>
              Upload your photo — get a professional numbered painting diagram.
            </p>
          </div>

          {/* Upload card */}
          <div className="max-w-xl mx-auto mb-10"
            style={{
              background: '#FDFAF5',
              border: '12px solid var(--color-frame)',
              outline: '2px solid var(--color-frame-dark)',
              boxShadow: 'inset 0 0 0 4px #D4B87A, 4px 8px 28px rgba(44, 34, 24, 0.18)',
              padding: '24px',
            }}>
            <UploadZone onImageReady={handleImageReady} />
            {ready && (
              <button
                onClick={() => router.push('/generate')}
                className="btn-gallery btn-gold mt-5 w-full py-3.5 text-base active:scale-[0.98]"
              >
                다음 단계로
                <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <span className="text-sm font-normal opacity-75">/ Next Step</span>
              </button>
            )}
          </div>

          {/* Feature badges */}
          <div className="grid sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
            {FEATURES.map((f, i) => (
              <div key={i} className="flex items-start gap-3 px-4 py-3"
                style={{ background: 'var(--color-canvas)', border: '1px solid var(--color-frame)', borderRadius: '3px' }}>
                <div className="w-4 h-4 rounded-full flex-shrink-0 mt-0.5" style={{ background: f.dot }} />
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--color-ink)' }}>{f.titleKo}</p>
                  <p className="text-[10px]" style={{ color: 'var(--color-muted)' }}>{f.titleEn}</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--color-muted)', opacity: 0.85 }}>{f.descKo}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Ad: In-Article ───────────────────────────────── */}
        <AdUnit position="in-article" className="my-6" />

        {/* ── Settings Guide (Manual) ──────────────────────── */}
        <section className="py-10 border-t" style={{ borderColor: '#EDE5D8' }}>
          <div className="max-w-3xl mx-auto">
            <p style={sectionLabelStyle}>{manualData.title}</p>
            <h2 style={headingStyle}>
              {manualData.title}
              <span style={{ fontFamily: 'var(--font-inter)', fontSize: '0.75rem', fontWeight: 400, color: 'var(--color-muted)', marginLeft: '8px' }}>
                / Settings Guide
              </span>
            </h2>
            <p className="text-sm mb-8" style={{ color: 'var(--color-muted)' }}>{manualData.subtitle}</p>

            <div className="grid sm:grid-cols-2 gap-5">
              {manualData.sections.map((section, i) => (
                <div key={i} style={{
                  background: '#FDFAF5',
                  border: '1px solid #DDD0BC',
                  borderLeft: '3px solid var(--color-frame)',
                  borderRadius: '0 3px 3px 0',
                  padding: '16px',
                }}>
                  <p className="text-sm font-semibold mb-2" style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-playfair), Georgia, serif' }}>
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
          </div>
        </section>

        {/* ── Ad: Multiplex ────────────────────────────────── */}
        <AdUnit position="display" className="my-6" />

        {/* ── FAQ ──────────────────────────────────────────── */}
        <section className="py-10 border-t" style={{ borderColor: '#EDE5D8' }}>
          <div className="max-w-2xl mx-auto">
            <p style={sectionLabelStyle}>{faqData.titleEn}</p>
            <h2 style={headingStyle}>
              {faqData.title}
              <span style={{ fontFamily: 'var(--font-inter)', fontSize: '0.75rem', fontWeight: 400, color: 'var(--color-muted)', marginLeft: '8px' }}>
                / FAQ
              </span>
            </h2>

            <div className="flex flex-col mt-6" style={{ gap: '1px', border: '1px solid #DDD0BC', borderRadius: '3px', overflow: 'hidden' }}>
              {faqData.items.map((item, i) => (
                <div key={i} style={{ background: '#FDFAF5', borderBottom: i < faqData.items.length - 1 ? '1px solid #EDE5D8' : 'none' }}>
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between gap-3 text-left px-5 py-4"
                    style={{ cursor: 'pointer', background: 'none', border: 'none' }}
                  >
                    <span className="text-sm font-medium" style={{ color: 'var(--color-ink)' }}>
                      {item.question}
                    </span>
                    <svg
                      width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                      style={{ color: 'var(--color-muted)', flexShrink: 0, transition: 'transform 0.2s', transform: openFaq === i ? 'rotate(180deg)' : 'rotate(0deg)' }}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {openFaq === i && (
                    <p className="px-5 pb-4 text-sm" style={{ color: 'var(--color-muted)', lineHeight: 1.7 }}>
                      {item.answer}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Ad: Display ──────────────────────────────────── */}
        <AdUnit position="display" className="my-6" />

      </main>

      {/* ── Footer ──────────────────────────────────────────── */}
      <footer className="py-6 border-t" style={{ borderColor: '#DDD0BC', background: '#FDFAF5' }}>
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs italic text-center sm:text-left"
            style={{ fontFamily: 'var(--font-playfair), Georgia, serif', color: 'var(--color-muted)' }}>
            모든 처리는 브라우저에서 실행됩니다 — 이미지는 서버로 전송되지 않습니다
          </p>
          <p className="text-xs" style={{ color: 'var(--color-muted)', opacity: 0.6 }}>© 2025 PaintKit</p>
        </div>
      </footer>
    </div>
  );
}
