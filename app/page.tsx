'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import UploadZone from '@/components/UploadZone';

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
    titleEn: '24 Pro Acrylic Colors',
    descKo:  '24가지 표준 아크릴 물감 기준',
  },
  {
    dot: '#C4622D',
    titleKo: 'PNG / PDF 출력',
    titleEn: 'PNG & PDF Export',
    descKo:  '인쇄용 A4 PDF 레이아웃 포함',
  },
];

export default function HomePage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  const handleImageReady = (dataUrl: string) => {
    sessionStorage.setItem('uploadedImage', dataUrl);
    setReady(true);
  };

  return (
    <div className="min-h-screen flex flex-col">

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
            <h1 className="text-base font-semibold leading-tight"
              style={{ fontFamily: 'var(--font-playfair), Georgia, serif', color: 'var(--color-ink)' }}>
              Paint by Number
            </h1>
            <p className="text-xs leading-tight" style={{ color: 'var(--color-muted)' }}>
              페인트 바이 넘버 도안 생성기
            </p>
          </div>
        </div>
      </header>

      {/* ── Step indicator — painter's rule ─────────────────── */}
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
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-12">

        {/* Hero */}
        <div className="text-center mb-10">
          <h2 className="text-4xl font-semibold italic mb-3"
            style={{ fontFamily: 'var(--font-playfair), Georgia, serif', color: 'var(--color-ink)' }}>
            사진을 명화 도안으로
          </h2>
          <p className="text-base max-w-md mx-auto mb-1" style={{ color: 'var(--color-muted)' }}>
            사진을 업로드하면 번호가 표시된 채색 도안으로 변환해 드립니다.
          </p>
          <p className="text-sm" style={{ color: 'var(--color-muted)', opacity: 0.7 }}>
            Upload your photo — get a professional numbered painting diagram.
          </p>
        </div>

        {/* Upload card — gold picture frame */}
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

        {/* Feature badges — palette chip style */}
        <div className="grid sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
          {FEATURES.map((f, i) => (
            <div key={i} className="flex items-start gap-3 px-4 py-3"
              style={{
                background: 'var(--color-canvas)',
                border: '1px solid var(--color-frame)',
                borderRadius: '3px',
              }}>
              <div className="w-4 h-4 rounded-full flex-shrink-0 mt-0.5"
                style={{ background: f.dot }} />
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--color-ink)' }}>
                  {f.titleKo}
                </p>
                <p className="text-[10px]" style={{ color: 'var(--color-muted)' }}>
                  {f.titleEn}
                </p>
                <p className="text-xs mt-1" style={{ color: 'var(--color-muted)', opacity: 0.85 }}>
                  {f.descKo}
                </p>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* ── Footer ──────────────────────────────────────────── */}
      <footer className="py-5 text-center border-t" style={{ borderColor: '#DDD0BC' }}>
        <p className="text-xs italic"
          style={{ fontFamily: 'var(--font-playfair), Georgia, serif', color: 'var(--color-muted)' }}>
          모든 처리는 브라우저에서 실행됩니다 — 이미지는 서버로 전송되지 않습니다
        </p>
      </footer>
    </div>
  );
}
