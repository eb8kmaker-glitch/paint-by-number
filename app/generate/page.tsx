'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import SettingsPanel from '@/components/SettingsPanel';
import DiagramCanvas from '@/components/DiagramCanvas';
import ColorLegend from '@/components/ColorLegend';
import ExportButtons from '@/components/ExportButtons';
import { generateDiagram, DiagramSettings, DiagramResult } from '@/lib/diagramRenderer';

const STEPS = [
  { ko: '업로드',  en: 'Upload'   },
  { ko: '설정',    en: 'Settings' },
  { ko: '생성',    en: 'Generate' },
  { ko: '내보내기',en: 'Export'   },
];

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

  // Current step index for stepper
  const currentStep = result ? 3 : 1;

  // Load image from sessionStorage
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
      // Allow React to paint the loading state before heavy computation starts
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
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => router.push('/')}
            className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
            title="홈으로 / Home"
          >
            <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
            </svg>
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 leading-tight">Paint by Number</h1>
            <p className="text-xs text-slate-400 leading-tight">페인트 바이 넘버 도안 생성기</p>
          </div>
        </div>
      </header>

      {/* Step indicator */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center gap-0">
            {STEPS.map((step, i) => (
              <div key={i} className="flex items-center">
                <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium
                  ${i === currentStep
                    ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-200'
                    : i < currentStep
                      ? 'text-green-600'
                      : 'text-slate-400'
                  }`}
                >
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0
                    ${i === currentStep
                      ? 'bg-blue-600 text-white'
                      : i < currentStep
                        ? 'bg-green-500 text-white'
                        : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    {i < currentStep ? '✓' : i + 1}
                  </span>
                  <span className="hidden sm:inline">{step.ko}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`w-6 h-px mx-1 ${i < currentStep ? 'bg-green-300' : 'bg-slate-200'}`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

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

      {/* Main layout */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_280px] gap-5">

          {/* ─── Left: Settings ──────────────────────────── */}
          <aside className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 h-fit lg:sticky lg:top-20">
            <h2 className="text-sm font-bold text-slate-700 mb-4">
              설정 <span className="font-normal text-slate-400 text-xs">/ Settings</span>
            </h2>
            <SettingsPanel
              settings={settings}
              onChange={setSettings}
              onGenerate={handleGenerate}
              isGenerating={isGenerating}
              hasImage={!!imageDataUrl}
              imageDataUrl={imageDataUrl ?? undefined}
            />

            {/* Original image thumbnail */}
            {imageDataUrl && (
              <div className="mt-5 pt-4 border-t border-slate-100">
                <p className="text-xs text-slate-400 mb-2">원본 이미지 / Original</p>
                <img
                  src={imageDataUrl}
                  alt="원본"
                  className="w-full rounded-lg border border-slate-200 object-cover"
                  style={{ maxHeight: 120 }}
                />
              </div>
            )}
          </aside>

          {/* ─── Center: Diagram canvas ───────────────────── */}
          <section className="flex flex-col gap-4">
            <DiagramCanvas
              canvas={result?.canvas ?? null}
              isGenerating={isGenerating}
              progress={progress}
              placeholder={imageDataUrl ?? undefined}
            />

            {/* Error */}
            {error && (
              <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            {/* Export buttons (shown below diagram) */}
            {result && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
                <h3 className="text-sm font-semibold text-slate-700 mb-3">
                  내보내기 <span className="font-normal text-slate-400 text-xs">/ Export</span>
                </h3>
                <ExportButtons result={result} canvasSize={settings.canvasSize} />
              </div>
            )}
          </section>

          {/* ─── Right: Color legend ─────────────────────── */}
          <aside className={`bg-white rounded-2xl border border-slate-200 shadow-sm p-5 h-fit
            lg:sticky lg:top-20 transition-opacity duration-300
            ${result ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}
          >
            {result ? (
              <ColorLegend colorMap={result.colorMap} />
            ) : (
              <div className="flex flex-col items-center gap-2 py-8 text-slate-400">
                <svg className="w-10 h-10 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p className="text-xs text-center">생성 후 색상 범례가<br />표시됩니다</p>
                <p className="text-[10px] text-center text-slate-300">Color legend appears after generation</p>
              </div>
            )}
          </aside>
        </div>
      </main>

      <footer className="text-center py-4 text-xs text-slate-400 border-t border-slate-100">
        모든 처리는 브라우저에서 실행됩니다 — 이미지는 서버로 전송되지 않습니다
      </footer>
    </div>
  );
}
