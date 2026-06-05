import type { Metadata } from 'next';

type Lang = 'en' | 'ko' | 'ja';

const LANG_META: Record<Lang, {
  title: string;
  description: string;
  locale: string;
  ogTitle: string;
  ogDescription: string;
  keywords: string[];
}> = {
  en: {
    title: 'Paint by Number Pattern Maker — Free Custom PBN Generator',
    description: 'Turn any photo into a paint by number pattern — free, in your browser. Custom color counts, A4/A3/canvas sizes, instant PDF export. No sign-up required.',
    locale: 'en_US',
    ogTitle: 'Paint by Number Pattern Maker — Free Custom PBN Generator | PaintKit',
    ogDescription: 'Turn your photo into a paint by number pattern free. Choose colors, canvas size, export PDF. Browser-only — your image never leaves your device.',
    keywords: ['paint by number pattern maker', 'custom paint by number', 'photo to paint by number', 'PBN generator', 'paint by numbers from photo', 'free paint by number', 'DIY painting', 'acrylic paint by number'],
  },
  ko: {
    title: '페인트 바이 넘버 도안 생성기 — 사진으로 도안 만들기',
    description: '내 사진을 페인트 바이 넘버 도안으로 변환. 아크릴 물감 색상 자동 매핑, A4/A3/액자 규격 PDF 출력. 브라우저에서 바로 실행, 이미지 서버 전송 없음.',
    locale: 'ko_KR',
    ogTitle: '내 사진으로 페인트 바이 넘버 도안 만들기 — PaintKit',
    ogDescription: '사진 업로드 → 자동 도안 생성 → PDF 출력. 무료, 브라우저 처리.',
    keywords: ['페인트 바이 넘버', '명화 그리기', '번호 채색 도안', 'DIY 그림', '아크릴 물감'],
  },
  ja: {
    title: 'ペイントバイナンバー図案作成 — 写真から無料で作れる',
    description: '写真をアップロードするだけでペイントバイナンバー図案を作成。アクリル絵の具の色を自動マッピング、A4/A3/キャンバスサイズのPDF出力。ブラウザ内処理でサーバー送信なし。',
    locale: 'ja_JP',
    ogTitle: '写真からペイントバイナンバー図案を作成 — PaintKit',
    ogDescription: '写真アップロード → 図案生成 → PDFエクスポート。無料、ブラウザ処理のみ。',
    keywords: ['ペイントバイナンバー', '塗り絵', '写真から塗り絵', 'アクリル絵の具', 'DIY絵画'],
  },
};

const ALT_LOCALES: Record<Lang, string[]> = {
  en: ['ko_KR', 'ja_JP'],
  ko: ['en_US', 'ja_JP'],
  ja: ['en_US', 'ko_KR'],
};

export async function generateMetadata(
  { params }: { params: Promise<{ lang: string }> }
): Promise<Metadata> {
  const { lang } = await params;
  const l = (lang as Lang) in LANG_META ? (lang as Lang) : 'en';
  const meta = LANG_META[l];

  return {
    title: meta.title,
    description: meta.description,
    keywords: meta.keywords,
    openGraph: {
      url: l === 'en' ? 'https://paintkit.app' : `https://paintkit.app/${l}`,
      siteName: 'PaintKit',
      title: meta.ogTitle,
      description: meta.ogDescription,
      locale: meta.locale,
      alternateLocale: ALT_LOCALES[l],
      images: [{
        url: 'https://paintkit.app/og-image.png',
        width: 1200,
        height: 630,
        alt: 'PaintKit',
      }],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: meta.ogTitle,
      description: meta.ogDescription,
      images: ['https://paintkit.app/og-image.png'],
    },
    alternates: {
      canonical: l === 'en' ? 'https://paintkit.app' : `https://paintkit.app/${l}`,
      languages: {
        'en': 'https://paintkit.app',
        'ko': 'https://paintkit.app/ko',
        'ja': 'https://paintkit.app/ja',
        'x-default': 'https://paintkit.app',
      },
    },
  };
}

export default function LangLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
