import type { Metadata } from 'next';
import Link from 'next/link';
import Script from 'next/script';

import enFaq from '@/locales/en/faq.json';
import koFaq from '@/locales/ko/faq.json';
import jaFaq from '@/locales/ja/faq.json';

type Lang = 'en' | 'ko' | 'ja';
type FaqData = typeof enFaq;

const FAQS: Record<Lang, FaqData> = { en: enFaq, ko: koFaq, ja: jaFaq };

const META_TITLE: Record<Lang, string> = {
  en: 'Frequently Asked Questions — PaintKit Paint by Number Generator',
  ko: '자주 묻는 질문 — PaintKit 페인트 바이 넘버 생성기',
  ja: 'よくある質問 — PaintKit ペイントバイナンバー図案作成',
};
const META_DESC: Record<Lang, string> = {
  en: 'Answers to common questions about PaintKit — the free paint by number pattern generator. Learn about pricing, image safety, output sizes, and color options.',
  ko: 'PaintKit에 대한 자주 묻는 질문 — 무료 페인트 바이 넘버 도안 생성기. 가격, 이미지 보안, 출력 크기, 색상 옵션에 대해 알아보세요.',
  ja: 'PaintKitに関するよくある質問 — 無料のペイントバイナンバー図案作成ツール。料金、画像のプライバシー、出力サイズ、色数についてご説明します。',
};
const BACK_LABEL: Record<Lang, string> = { en: 'Home', ko: '홈', ja: 'ホーム' };

export async function generateMetadata(
  { params }: { params: Promise<{ lang: string }> }
): Promise<Metadata> {
  const { lang } = await params;
  const l = (lang as Lang) in FAQS ? (lang as Lang) : 'en';
  return {
    title: META_TITLE[l],
    description: META_DESC[l],
    alternates: {
      canonical: `https://paintkit.app/${l}/faq`,
      languages: {
        'en': 'https://paintkit.app/en/faq',
        'ko': 'https://paintkit.app/ko/faq',
        'ja': 'https://paintkit.app/ja/faq',
        'x-default': 'https://paintkit.app/en/faq',
      },
    },
  };
}

export default async function FaqPage(
  { params }: { params: Promise<{ lang: string }> }
) {
  const { lang } = await params;
  const l = (lang as Lang) in FAQS ? (lang as Lang) : 'en';
  const faqData = FAQS[l];

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqData.items.map(item => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  };

  const sectionLabelStyle: React.CSSProperties = {
    fontSize: '0.6rem',
    fontWeight: 700,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: 'var(--color-frame)',
    marginBottom: '4px',
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Script
        id="ld-faq-page"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

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
              {faqData.title}
            </p>
          </div>
          <nav className="flex items-center gap-1 text-xs" style={{ color: 'var(--color-muted)' }}>
            {(['en', 'ko', 'ja'] as Lang[]).map(code => (
              <Link key={code} href={`/${code}/faq`}
                style={{ fontWeight: code === l ? 700 : 400, color: code === l ? 'var(--color-ink)' : 'var(--color-muted)', padding: '2px 6px' }}>
                {code === 'en' ? 'EN' : code === 'ko' ? '한국어' : '日本語'}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-12">
        <p style={sectionLabelStyle}>FAQ</p>
        <h1 style={{ fontFamily: 'var(--font-playfair), Georgia, serif', fontSize: '1.6rem', fontWeight: 600, color: 'var(--color-ink)', marginBottom: '6px' }}>
          {faqData.title}
        </h1>
        <p className="text-sm mb-8" style={{ color: 'var(--color-muted)', lineHeight: 1.7 }}>
          {META_DESC[l]}
        </p>

        <div className="flex flex-col" style={{ gap: '1px', border: '1px solid #DDD0BC', borderRadius: '3px', overflow: 'hidden' }}>
          {faqData.items.map((item, i) => (
            <details key={i}
              style={{ background: '#FDFAF5', borderBottom: i < faqData.items.length - 1 ? '1px solid #EDE5D8' : 'none' }}>
              <summary className="w-full flex items-center justify-between gap-3 text-left px-5 py-4 cursor-pointer select-none list-none"
                style={{ background: 'none' }}>
                <span className="text-sm font-medium" style={{ color: 'var(--color-ink)' }}>
                  {item.question}
                </span>
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  style={{ color: 'var(--color-muted)', flexShrink: 0 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p className="px-5 pb-4 text-sm" style={{ color: 'var(--color-muted)', lineHeight: 1.7 }}>
                {item.answer}
              </p>
            </details>
          ))}
        </div>

        <div className="mt-8">
          <Link href={`/${l}`}
            className="btn-gallery btn-gold py-2.5 px-5 inline-flex items-center gap-2 text-sm">
            {l === 'ko' ? '← 홈으로' : l === 'ja' ? '← ホームへ' : '← Back to Home'}
          </Link>
        </div>
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
