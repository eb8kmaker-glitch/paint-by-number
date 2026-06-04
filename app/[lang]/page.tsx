'use client';
import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Script from 'next/script';
import Link from 'next/link';
import UploadZone from '@/components/UploadZone';
import AdUnit from '@/components/AdUnit';

import koFaq from '@/locales/ko/faq.json';
import enFaq from '@/locales/en/faq.json';
import jaFaq from '@/locales/ja/faq.json';
import koManual from '@/locales/ko/manual.json';
import enManual from '@/locales/en/manual.json';
import jaManual from '@/locales/ja/manual.json';

type Lang = 'en' | 'ko' | 'ja';

const HERO: Record<Lang, { h1: string; sub: string; subAlt: string }> = {
  en: {
    h1: 'Paint by Number Pattern Maker — Free & Custom',
    sub: 'Upload your photo — get a professional numbered painting diagram.',
    subAlt: '사진을 업로드하면 번호가 표시된 채색 도안으로 변환해 드립니다.',
  },
  ko: {
    h1: '사진을 페인트 바이 넘버 도안으로',
    sub: '사진을 업로드하면 번호가 표시된 채색 도안으로 변환해 드립니다.',
    subAlt: 'Upload your photo — get a professional numbered painting diagram.',
  },
  ja: {
    h1: '写真をペイントバイナンバー図案に変換',
    sub: '写真をアップロードするだけで、番号付きの塗り絵図案を自動生成します。',
    subAlt: 'Upload your photo — get a professional numbered painting diagram.',
  },
};

const FEATURES: Record<Lang, { dot: string; title: string; titleSub: string; desc: string }[]> = {
  en: [
    { dot: '#4A7C6B', title: 'Client-Side Only', titleSub: '클라이언트 처리', desc: 'Images never leave your device' },
    { dot: '#C8A96E', title: '24–48 Acrylic Colors', titleSub: '전문 물감 색상', desc: '24 to 48 acrylic paint colors' },
    { dot: '#C4622D', title: 'PNG & PDF Export', titleSub: 'PNG / PDF 출력', desc: 'A4 print-ready PDF layout included' },
  ],
  ko: [
    { dot: '#4A7C6B', title: '클라이언트 처리', titleSub: 'Client-Side Only', desc: '이미지가 서버로 전송되지 않습니다' },
    { dot: '#C8A96E', title: '전문 물감 색상', titleSub: '24–48 Acrylic Colors', desc: '24~48가지 아크릴 물감 색상' },
    { dot: '#C4622D', title: 'PNG / PDF 출력', titleSub: 'PNG & PDF Export', desc: '인쇄용 A4 PDF 레이아웃 포함' },
  ],
  ja: [
    { dot: '#4A7C6B', title: 'ブラウザ内処理', titleSub: 'Client-Side Only', desc: '画像はサーバーに送信されません' },
    { dot: '#C8A96E', title: '24〜48色のアクリル絵の具', titleSub: '24–48 Acrylic Colors', desc: '24〜48色のアクリル絵の具に対応' },
    { dot: '#C4622D', title: 'PNG / PDF エクスポート', titleSub: 'PNG & PDF Export', desc: 'A4印刷対応PDFレイアウト含む' },
  ],
};

const NAV_TEXT: Record<Lang, { guide: string; faq: string; nextStep: string; contact: string }> = {
  en: { guide: 'Guide', faq: 'FAQ', nextStep: 'Next Step', contact: 'Contact' },
  ko: { guide: '사용 가이드', faq: 'FAQ', nextStep: '다음 단계로', contact: '문의하기' },
  ja: { guide: 'ガイド', faq: 'FAQ', nextStep: '次のステップ', contact: 'お問い合わせ' },
};

const SECTION_TEXT: Record<Lang, {
  guideLink: string;
  faqLink: string;
  privacyNote: string;
  copyright: string;
}> = {
  en: {
    guideLink: 'View Full Guide →',
    faqLink: 'View All FAQs →',
    privacyNote: 'All processing runs in your browser — images are never sent to a server',
    copyright: '© 2026 PaintKit',
  },
  ko: {
    guideLink: '자세한 가이드 보기 →',
    faqLink: '전체 FAQ 보기 →',
    privacyNote: '모든 처리는 브라우저에서 실행됩니다 — 이미지는 서버로 전송되지 않습니다',
    copyright: '© 2026 PaintKit',
  },
  ja: {
    guideLink: '詳細ガイドを見る →',
    faqLink: 'よくある質問をすべて見る →',
    privacyNote: 'すべての処理はブラウザで実行されます — 画像はサーバーに送信されません',
    copyright: '© 2026 PaintKit',
  },
};

const STEPS: Record<Lang, { ko: string; en: string }[]> = {
  en: [
    { ko: 'Upload',   en: 'Upload'   },
    { ko: 'Settings', en: 'Settings' },
    { ko: 'Generate', en: 'Generate' },
    { ko: 'Export',   en: 'Export'   },
  ],
  ko: [
    { ko: '업로드',   en: 'Upload'   },
    { ko: '설정',     en: 'Settings' },
    { ko: '생성',     en: 'Generate' },
    { ko: '내보내기', en: 'Export'   },
  ],
  ja: [
    { ko: 'アップロード', en: 'Upload'   },
    { ko: '設定',         en: 'Settings' },
    { ko: '生成',         en: 'Generate' },
    { ko: 'エクスポート', en: 'Export'   },
  ],
};

const LANG_LABELS: { code: Lang; label: string }[] = [
  { code: 'en', label: 'EN' },
  { code: 'ko', label: '한국어' },
  { code: 'ja', label: '日本語' },
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

export default function LangHomePage() {
  const router = useRouter();
  const params = useParams();
  const rawLang = (params?.lang as string) ?? 'en';
  const lang: Lang = rawLang === 'ko' ? 'ko' : rawLang === 'ja' ? 'ja' : 'en';

  const [ready, setReady] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqData = lang === 'ko' ? koFaq : lang === 'ja' ? jaFaq : enFaq;
  const manualData = lang === 'ko' ? koManual : lang === 'ja' ? jaManual : enManual;
  const hero = HERO[lang];
  const features = FEATURES[lang];
  const nav = NAV_TEXT[lang];
  const sec = SECTION_TEXT[lang];
  const steps = STEPS[lang];

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

  return (
    <div className="min-h-screen flex flex-col">
      <Script
        id="ld-faq-lang"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      {/* ── Header ──────────────────────────────────────────── */}
      <header className="sticky top-0 z-20 border-b backdrop-blur-md"
        style={{ borderColor: 'var(--color-frame)', background: 'rgba(248, 244, 238, 0.93)' }}>
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href={`/${lang}`} className="flex items-center gap-3 flex-1 min-w-0">
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
                Paint by Number Generator
              </p>
            </div>
          </Link>

          <nav className="flex items-center gap-1 sm:gap-3 flex-shrink-0">
            <Link href={`/${lang}/guide`}
              className="hidden sm:block text-xs font-medium px-2 py-1 rounded hover:underline"
              style={{ color: 'var(--color-ink)' }}>
              {nav.guide}
            </Link>
            <Link href={`/${lang}/faq`}
              className="hidden sm:block text-xs font-medium px-2 py-1 rounded hover:underline"
              style={{ color: 'var(--color-ink)' }}>
              {nav.faq}
            </Link>
            <div className="flex items-center gap-0.5 text-xs" style={{ color: 'var(--color-muted)' }}>
              {LANG_LABELS.map(({ code, label }) => (
                <Link
                  key={code}
                  href={`/${code}`}
                  className="px-1.5 py-0.5 rounded"
                  style={{
                    fontWeight: code === lang ? 700 : 400,
                    color: code === lang ? 'var(--color-ink)' : 'var(--color-muted)',
                    textDecoration: 'none',
                  }}
                >
                  {label}
                </Link>
              ))}
            </div>
          </nav>
        </div>
      </header>

      {/* ── Step indicator ──────────────────────────────────── */}
      <div className="border-b" style={{ background: '#FDFAF5', borderColor: '#DDD0BC' }}>
        <div className="max-w-5xl mx-auto px-4 py-3">
          <div className="flex items-center">
            {steps.map((step, i) => (
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
                {i < steps.length - 1 && (
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
              {hero.h1}
            </h1>
            <p className="text-base max-w-md mx-auto mb-1" style={{ color: 'var(--color-muted)' }}>
              {hero.sub}
            </p>
            <p className="text-sm" style={{ color: 'var(--color-muted)', opacity: 0.7 }}>
              {hero.subAlt}
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
                {nav.nextStep}
                <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
          </div>

          {/* Feature badges */}
          <div className="grid sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
            {features.map((f, i) => (
              <div key={i} className="flex items-start gap-3 px-4 py-3"
                style={{ background: 'var(--color-canvas)', border: '1px solid var(--color-frame)', borderRadius: '3px' }}>
                <div className="w-4 h-4 rounded-full flex-shrink-0 mt-0.5" style={{ background: f.dot }} />
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--color-ink)' }}>{f.title}</p>
                  <p className="text-[10px]" style={{ color: 'var(--color-muted)' }}>{f.titleSub}</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--color-muted)', opacity: 0.85 }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Ad: In-Article ───────────────────────────────── */}
        <AdUnit position="in-article" className="my-6" />

        {/* ── Settings Guide ───────────────────────────────── */}
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

            <div className="mt-6 text-right">
              <Link href={`/${lang}/guide`}
                className="text-sm font-medium hover:underline"
                style={{ color: 'var(--color-frame-dark)' }}>
                {sec.guideLink}
              </Link>
            </div>
          </div>
        </section>

        {/* ── Ad: Display ──────────────────────────────────── */}
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
              <Link href={`/${lang}/faq`}
                className="text-sm font-medium hover:underline"
                style={{ color: 'var(--color-frame-dark)' }}>
                {sec.faqLink}
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
            {sec.privacyNote}
          </p>
          <div className="flex items-center gap-4">
            <Link href="/contact" className="text-xs hover:underline" style={{ color: 'var(--color-muted)', opacity: 0.7 }}>
              {nav.contact}
            </Link>
            <p className="text-xs" style={{ color: 'var(--color-muted)', opacity: 0.6 }}>{sec.copyright}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
