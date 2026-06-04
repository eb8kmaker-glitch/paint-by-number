import type { Metadata } from 'next';
import Link from 'next/link';

import enGuide from '@/locales/en/guide.json';
import koGuide from '@/locales/ko/guide.json';
import jaGuide from '@/locales/ja/guide.json';

type Lang = 'en' | 'ko' | 'ja';
type GuideData = typeof enGuide;

const GUIDES: Record<Lang, GuideData> = { en: enGuide, ko: koGuide, ja: jaGuide };

const BACK_LABEL: Record<Lang, string> = { en: 'Home', ko: '홈', ja: 'ホーム' };
const CTA_LABEL: Record<Lang, string> = {
  en: 'Start Creating Now →',
  ko: '지금 만들어보기 →',
  ja: '今すぐ作成する →',
};
const META_TITLE: Record<Lang, string> = {
  en: 'Paint by Number Guide — How to Use PaintKit',
  ko: '페인트 바이 넘버 사용 가이드 — PaintKit 사용법',
  ja: 'ペイントバイナンバー図案作成ガイド — PaintKitの使い方',
};

export async function generateMetadata(
  { params }: { params: Promise<{ lang: string }> }
): Promise<Metadata> {
  const { lang } = await params;
  const l = (lang as Lang) in GUIDES ? (lang as Lang) : 'en';
  const guide = GUIDES[l];
  return {
    title: META_TITLE[l],
    description: guide.metaDescription,
    alternates: {
      canonical: `https://paintkit.app/${l}/guide`,
      languages: {
        'en': 'https://paintkit.app/en/guide',
        'ko': 'https://paintkit.app/ko/guide',
        'ja': 'https://paintkit.app/ja/guide',
        'x-default': 'https://paintkit.app/en/guide',
      },
    },
  };
}

export default async function GuidePage(
  { params }: { params: Promise<{ lang: string }> }
) {
  const { lang } = await params;
  const l = (lang as Lang) in GUIDES ? (lang as Lang) : 'en';
  const guide = GUIDES[l];
  const s = guide.sections;

  const sectionLabelStyle: React.CSSProperties = {
    fontSize: '0.6rem',
    fontWeight: 700,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: 'var(--color-frame)',
    marginBottom: '4px',
  };

  const cardStyle: React.CSSProperties = {
    background: '#FDFAF5',
    border: '1px solid #DDD0BC',
    borderLeft: '3px solid var(--color-frame)',
    borderRadius: '0 3px 3px 0',
    padding: '16px',
  };

  return (
    <div className="min-h-screen flex flex-col">

      {/* Header */}
      <header className="sticky top-0 z-20 border-b backdrop-blur-md"
        style={{ borderColor: 'var(--color-frame)', background: 'rgba(248, 244, 238, 0.93)' }}>
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href={`/${l}`}
            className="back-btn w-9 h-9 flex items-center justify-center"
            title={BACK_LABEL[l]}>
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
          <div className="flex-1">
            <p className="text-base font-semibold leading-tight"
              style={{ fontFamily: 'var(--font-playfair), Georgia, serif', color: 'var(--color-ink)' }}>
              PaintKit
            </p>
            <p className="text-xs leading-tight" style={{ color: 'var(--color-muted)' }}>
              {guide.title}
            </p>
          </div>
          <nav className="flex items-center gap-1 text-xs" style={{ color: 'var(--color-muted)' }}>
            {(['en', 'ko', 'ja'] as Lang[]).map(code => (
              <Link key={code} href={`/${code}/guide`}
                style={{ fontWeight: code === l ? 700 : 400, color: code === l ? 'var(--color-ink)' : 'var(--color-muted)', padding: '2px 6px' }}>
                {code === 'en' ? 'EN' : code === 'ko' ? '한국어' : '日本語'}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-12">
        <p style={sectionLabelStyle}>Guide</p>
        <h1 style={{ fontFamily: 'var(--font-playfair), Georgia, serif', fontSize: '1.6rem', fontWeight: 600, color: 'var(--color-ink)', marginBottom: '6px' }}>
          {guide.title}
        </h1>
        <p className="text-sm mb-10" style={{ color: 'var(--color-muted)', lineHeight: 1.7 }}>
          {guide.metaDescription}
        </p>

        {/* Getting Started */}
        <section className="mb-10">
          <h2 className="text-base font-semibold mb-3"
            style={{ fontFamily: 'var(--font-playfair), Georgia, serif', color: 'var(--color-ink)' }}>
            {s.gettingStarted.title}
          </h2>
          <p className="text-sm mb-4" style={{ color: 'var(--color-muted)' }}>{s.gettingStarted.content}</p>
          <div className="grid sm:grid-cols-2 gap-3">
            {s.gettingStarted.steps.map((step, i) => (
              <div key={i} className="flex gap-3 p-4"
                style={{ background: '#FDFAF5', border: '1px solid #DDD0BC', borderRadius: '3px' }}>
                <div className="w-7 h-7 flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{ background: 'var(--color-frame)', color: '#fff', borderRadius: '4px' }}>
                  {i + 1}
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--color-ink)' }}>{step.step}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--color-muted)' }}>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Settings sections */}
        <section className="mb-10">
          <h2 className="text-base font-semibold mb-5"
            style={{ fontFamily: 'var(--font-playfair), Georgia, serif', color: 'var(--color-ink)' }}>
            Settings
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {[s.colorCount, s.detailLevel, s.canvasSize, s.colorGuide, s.style, s.fitMode].map((sec, i) => (
              <div key={i} style={cardStyle}>
                <p className="text-sm font-semibold mb-1" style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-playfair), Georgia, serif' }}>
                  {sec.title}
                </p>
                <p className="text-xs mb-3" style={{ color: 'var(--color-muted)' }}>{sec.content}</p>
                <ul className="flex flex-col gap-1.5">
                  {sec.options.map((opt, j) => (
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

        {/* Tips */}
        <section className="mb-10">
          <h2 className="text-base font-semibold mb-4"
            style={{ fontFamily: 'var(--font-playfair), Georgia, serif', color: 'var(--color-ink)' }}>
            {s.tips.title}
          </h2>
          <ul className="flex flex-col gap-2">
            {s.tips.items.map((tip, i) => (
              <li key={i} className="flex gap-3 text-sm" style={{ color: 'var(--color-muted)' }}>
                <span style={{ color: 'var(--color-frame)', fontWeight: 700, flexShrink: 0 }}>✓</span>
                {tip}
              </li>
            ))}
          </ul>
        </section>

        {/* CTA */}
        <Link href={`/${l}`}
          className="btn-gallery btn-gold py-3 px-6 inline-flex items-center gap-2 text-base">
          {CTA_LABEL[l]}
        </Link>
      </main>

      {/* Footer */}
      <footer className="py-5 text-center border-t" style={{ borderColor: '#DDD0BC' }}>
        <p className="text-xs italic"
          style={{ fontFamily: 'var(--font-playfair), Georgia, serif', color: 'var(--color-muted)' }}>
          {l === 'ko'
            ? '모든 처리는 브라우저에서 실행됩니다 — 이미지는 서버로 전송되지 않습니다'
            : l === 'ja'
            ? 'すべての処理はブラウザで実行されます — 画像はサーバーに送信されません'
            : 'All processing runs in your browser — images are never sent to a server'}
        </p>
      </footer>
    </div>
  );
}
