'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import Link from 'next/link';
import UploadZone from '@/components/UploadZone';
import AdUnit from '@/components/AdUnit';
import faqData from '@/locales/en/faq.json';
import manualData from '@/locales/en/manual.json';

const STEPS = ['Upload', 'Settings', 'Generate', 'Export'];

const FEATURES = [
  { dot: '#4A7C6B', title: 'Private by Design',    desc: 'Images never leave your device — all processing runs in your browser' },
  { dot: '#C8A96E', title: '24–48 Acrylic Colors', desc: 'Matched to real acrylic paint colors for easy shopping' },
  { dot: '#C4622D', title: 'PNG & PDF Export',      desc: 'Print-ready A4/A3/canvas-size PDF layout included' },
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
    sessionStorage.setItem('lang', 'en');
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
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    isAccessibleForFree: true,
    inLanguage: ['en', 'ko', 'ja'],
    description: 'Turn any photo into a custom paint by numbers template. Free, runs in your browser.',
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
          <div className="flex items-center gap-3 flex-1 min-w-0">
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
                Paint by Numbers Generator
              </p>
            </div>
          </div>
          <nav className="flex items-center gap-1 sm:gap-3 flex-shrink-0">
            <Link href="/en/guide"
              className="hidden sm:block text-xs font-medium px-2 py-1 hover:underline"
              style={{ color: 'var(--color-ink)' }}>
              Guide
            </Link>
            <Link href="/en/faq"
              className="hidden sm:block text-xs font-medium px-2 py-1 hover:underline"
              style={{ color: 'var(--color-ink)' }}>
              FAQ
            </Link>
            <div className="flex items-center gap-0.5 text-xs">
              <Link href="/"   style={{ fontWeight: 700, color: 'var(--color-ink)',   padding: '2px 6px' }}>EN</Link>
              <Link href="/ko" style={{ fontWeight: 400, color: 'var(--color-muted)', padding: '2px 6px' }}>한국어</Link>
              <Link href="/ja" style={{ fontWeight: 400, color: 'var(--color-muted)', padding: '2px 6px' }}>日本語</Link>
            </div>
          </nav>
        </div>
      </header>

      {/* ── Step indicator ──────────────────────────────────── */}
      <div className="border-b" style={{ background: '#FDFAF5', borderColor: '#DDD0BC' }}>
        <div className="max-w-5xl mx-auto px-4 py-3">
          <div className="flex items-center">
            {STEPS.map((label, i) => (
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
                    {label}
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
              Turn Photos into Paintable Art
            </h1>
            <p className="text-base max-w-md mx-auto" style={{ color: 'var(--color-muted)' }}>
              Upload your photo — get a custom paint by numbers template with color-matched acrylic paints.
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
            <UploadZone onImageReady={handleImageReady} lang="en" />
            {ready && (
              <button
                onClick={() => router.push('/generate')}
                className="btn-gallery btn-gold mt-5 w-full py-3.5 text-base active:scale-[0.98]"
              >
                Next Step
                <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
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
                  <p className="text-sm font-medium" style={{ color: 'var(--color-ink)' }}>{f.title}</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--color-muted)', opacity: 0.85 }}>{f.desc}</p>
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
            <h2 style={headingStyle}>{manualData.title}</h2>
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
            <div className="mt-6 text-right">
              <Link href="/en/guide"
                className="text-sm font-medium hover:underline"
                style={{ color: 'var(--color-frame-dark)' }}>
                View Full Guide →
              </Link>
            </div>
          </div>
        </section>

        {/* ── Ad: Display ──────────────────────────────────── */}
        <AdUnit position="display" className="my-6" />

        {/* ── FAQ ──────────────────────────────────────────── */}
        <section className="py-10 border-t" style={{ borderColor: '#EDE5D8' }}>
          <div className="max-w-2xl mx-auto">
            <p style={sectionLabelStyle}>FAQ</p>
            <h2 style={headingStyle}>{faqData.title}</h2>

            <div className="flex flex-col mt-6" style={{ gap: '1px', border: '1px solid #DDD0BC', borderRadius: '3px', overflow: 'hidden' }}>
              {faqData.items.slice(0, 5).map((item, i) => (
                <div key={i} style={{ background: '#FDFAF5', borderBottom: i < 4 ? '1px solid #EDE5D8' : 'none' }}>
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
            <div className="mt-4 text-right">
              <Link href="/en/faq"
                className="text-sm font-medium hover:underline"
                style={{ color: 'var(--color-frame-dark)' }}>
                View All FAQs →
              </Link>
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
            All processing runs in your browser — images are never sent to a server
          </p>
          <div className="flex items-center gap-4">
            <Link href="/contact" className="text-xs hover:underline" style={{ color: 'var(--color-muted)', opacity: 0.7 }}>
              Contact
            </Link>
            <p className="text-xs" style={{ color: 'var(--color-muted)', opacity: 0.6 }}>© 2026 PaintKit</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
