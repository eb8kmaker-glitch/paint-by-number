'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import SettingsPanel from '@/components/SettingsPanel';
import DiagramCanvas from '@/components/DiagramCanvas';
import ColorLegend from '@/components/ColorLegend';
import ExportButtons from '@/components/ExportButtons';
import { generateDiagram, DiagramSettings, DiagramResult } from '@/lib/diagramRenderer';

const STEPS = [
  { ko: '업로드',   en: 'Upload'   },
  { ko: '설정',     en: 'Settings' },
  { ko: '생성',     en: 'Generate' },
  { ko: '내보내기', en: 'Export'   },
];

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="border-b" style={{ background: '#FDFAF5', borderColor: '#DDD0BC' }}>
      <div className="max-w-6xl mx-auto px-4 py-3">
        <div className="flex items-center">
          {STEPS.map((step, i) => (
            <div key={i} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-0.5">
                <div
                  className="w-7 h-7 flex items-center justify-center text-xs font-bold transition-all"
                  style={{
                    borderRadius: '4px',
                    background: i === current
                      ? 'var(--color-frame)'
                      : i < current
                        ? 'var(--color-accent)'
                        : '#E8DDD0',
                    color: i <= current ? '#fff' : 'var(--color-muted)',
                  }}
                >
                  {i < current ? '✓' : i + 1}
                </div>
                <span className="hidden sm:block text-[10px] font-medium"
                  style={{ color: i === current ? 'var(--color-frame-dark)' : 'var(--color-muted)' }}>
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
  );
}

export default function GeneratePage() {
  const router = useRouter();
  const imgRef = useRef<HTMLImageElement>(null);

  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [settings, setSettings] = useState<DiagramSettings>({
    colorCount:  24,
    detailLevel: 'medium',
    canvasSize:  'a4',
    fitMode:     'fit',
    cropRegion:  null,
    style:       'clean',
  });
  const [result,       setResult]       = useState<DiagramResult | null>(null);
  const [progress,     setProgress]     = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error,        setError]        = useState('');

  const currentStep = result ? 3 : 1;

  useEffect(() => {
    const stored = sessionStorage.getItem('uploadedImage');
    if (!stored) { router.replace('/'); return; }
    setImageDataUrl(stored);
  }, [router]);

  const handleGenerate = useCallback(async () => {
    const img = imgRef.current;
    if (!img || !img.complete || img.naturalWidth === 0) return;

    setIsGenerating(true);
    setProgress(0);
    setResult(null);
    setError('');

    try {
      await new Promise(r => setTimeout(r, 60));
      const res = await generateDiagram(img, settings, (pct) => {
        setProgress(pct);
      });
      setResult(res);
    } catch (err) {
      console.error('Diagram generation failed', err);
      setError('도안 생성 중 오류가 발생했습니다. 다시 시도해 주세요.');
    } finally {
      setIsGenerating(false);
    }
  }, [settings]);

  return (
    <div className="min-h-screen flex flex-col">

      {/* ── Header ──────────────────────────────────────────── */}
      <header className="sticky top-0 z-20 border-b backdrop-blur-md"
        style={{ borderColor: 'var(--color-frame)', background: 'rgba(248, 244, 238, 0.93)' }}>
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => router.push('/')}
            className="back-btn w-9 h-9 flex items-center justify-center"
            title="홈으로 / Home"
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
              style={{ color: 'var(--color-ink)' }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
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

      <StepIndicator current={currentStep} />

      {/* Hidden image element for processing */}
      {imageDataUrl && (
        <img
          ref={imgRef}
          src={imageDataUrl}
          alt=""
          className="hidden"
          onError={() => { router.replace('/'); }}
        />
      )}

      {/* ── Main layout ─────────────────────────────────────── */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_280px] gap-5">

          {/* ─── Left: Settings panel ──────────────────── */}
          <aside className="h-fit lg:sticky lg:top-20"
            style={{
              background: '#fff',
              borderLeft: '4px solid var(--color-frame)',
              borderTop: '1px solid #DDD0BC',
              borderRight: '1px solid #DDD0BC',
              borderBottom: '1px solid #DDD0BC',
              borderRadius: '0 3px 3px 0',
              boxShadow: '0 2px 12px rgba(44, 34, 24, 0.07)',
              padding: '20px',
            }}>
            <h2 style={{
              fontFamily: 'var(--font-playfair), Georgia, serif',
              fontSize: '1rem',
              fontWeight: 600,
              color: 'var(--color-ink)',
              marginBottom: '6px',
            }}>
              설정
              <span style={{
                fontFamily: 'var(--font-inter), Inter, sans-serif',
                fontSize: '0.7rem',
                fontWeight: 400,
                color: 'var(--color-muted)',
                marginLeft: '6px',
              }}>
                / Settings
              </span>
            </h2>
            <div style={{ height: '1px', background: 'var(--color-frame)', opacity: 0.35, marginBottom: '16px' }} />

            <SettingsPanel
              settings={settings}
              onChange={setSettings}
              onGenerate={handleGenerate}
              isGenerating={isGenerating}
              hasImage={!!imageDataUrl}
              imageDataUrl={imageDataUrl ?? undefined}
            />

            {imageDataUrl && (
              <div className="mt-5 pt-4" style={{ borderTop: '1px solid #EDE5D8' }}>
                <p className="section-label mb-2">원본 이미지 / Original</p>
                <img
                  src={imageDataUrl}
                  alt="원본"
                  className="w-full object-cover"
                  style={{ maxHeight: 120, border: '1px solid #DDD0BC' }}
                />
              </div>
            )}
          </aside>

          {/* ─── Center: Gallery wall + canvas ─────────── */}
          <section className="flex flex-col gap-4">
            <div style={{ background: '#E8E0D5', padding: '28px 24px', borderRadius: '3px' }}>
              <DiagramCanvas
                canvas={result?.canvas ?? null}
                isGenerating={isGenerating}
                progress={progress}
                placeholder={imageDataUrl ?? undefined}
              />
            </div>

            {error && (
              <div className="px-4 py-3 text-sm"
                style={{
                  background: '#FDF0EC',
                  border: '1px solid var(--color-accent-warm)',
                  color: 'var(--color-accent-warm)',
                  borderRadius: '3px',
                }}>
                {error}
              </div>
            )}

            {result && (
              <div style={{
                background: '#fff',
                border: '1px solid #DDD0BC',
                borderRadius: '3px',
                padding: '16px 20px',
              }}>
                <h3 style={{
                  fontFamily: 'var(--font-playfair), Georgia, serif',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  color: 'var(--color-ink)',
                  marginBottom: '12px',
                }}>
                  내보내기
                  <span style={{
                    fontFamily: 'var(--font-inter), Inter, sans-serif',
                    fontSize: '0.7rem',
                    fontWeight: 400,
                    color: 'var(--color-muted)',
                    marginLeft: '6px',
                  }}>
                    / Export
                  </span>
                </h3>
                <ExportButtons result={result} canvasSize={settings.canvasSize} />
              </div>
            )}
          </section>

          {/* ─── Right: Color legend ───────────────────── */}
          <aside
            className="h-fit lg:sticky lg:top-20 transition-opacity duration-300"
            style={{
              background: '#fff',
              border: '1px solid #DDD0BC',
              borderRadius: '3px',
              padding: '20px',
              opacity: result ? 1 : 0.4,
              pointerEvents: result ? undefined : 'none',
            }}
          >
            {result ? (
              <ColorLegend colorMap={result.colorMap} />
            ) : (
              <div className="flex flex-col items-center gap-3 py-10"
                style={{ color: 'var(--color-muted)' }}>
                <svg className="w-12 h-12 opacity-25" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c1.1 0 2-.9 2-2 0-.53-.19-1.01-.49-1.38C13.22 18.22 13 17.63 13 17c0-1.1.9-2 2-2h2.2c2.65 0 4.8-2.15 4.8-4.8C22 5.78 17.52 2 12 2z"/>
                </svg>
                <p className="text-xs text-center" style={{ color: 'var(--color-muted)' }}>
                  생성 후 색상 범례가<br />표시됩니다
                </p>
                <p className="text-center" style={{ fontSize: '10px', color: 'var(--color-muted)', opacity: 0.65 }}>
                  Color legend appears after generation
                </p>
              </div>
            )}
          </aside>

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
