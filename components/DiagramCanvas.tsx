'use client';
import { useEffect, useRef } from 'react';

interface Props {
  canvas:      HTMLCanvasElement | null;
  isGenerating: boolean;
  progress:    number;
  placeholder?: string; // src of preview image
}

export default function DiagramCanvas({ canvas, isGenerating, progress, placeholder }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    // Remove previous canvas child if present
    const existing = el.querySelector('canvas');
    if (existing) el.removeChild(existing);
    if (canvas) {
      canvas.className = 'max-w-full h-auto rounded-xl shadow-inner';
      el.appendChild(canvas);
    }
  }, [canvas]);

  return (
    <div className="relative w-full flex flex-col items-center justify-center
      min-h-[320px] rounded-2xl border border-slate-200 bg-white overflow-hidden">

      {/* Placeholder image */}
      {!canvas && !isGenerating && placeholder && (
        <img
          src={placeholder}
          alt="원본 이미지"
          className="max-w-full max-h-[480px] object-contain opacity-60"
        />
      )}

      {/* Canvas output */}
      {!isGenerating && canvas && (
        <div ref={containerRef} className="w-full flex justify-center p-2" />
      )}

      {/* Empty state */}
      {!canvas && !isGenerating && !placeholder && (
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <svg className="w-16 h-16 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
              d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414A1 1 0 0120 9.414V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-sm font-medium">도안이 여기에 표시됩니다</p>
          <p className="text-xs">Diagram will appear here</p>
        </div>
      )}

      {/* Progress overlay */}
      {isGenerating && (
        <div className="absolute inset-0 flex flex-col items-center justify-center
          bg-white/90 backdrop-blur-sm gap-5">
          {placeholder && (
            <img
              src={placeholder}
              alt=""
              className="absolute inset-0 w-full h-full object-contain opacity-15 pointer-events-none"
            />
          )}
          <div className="relative z-10 flex flex-col items-center gap-4">
            {/* Animated paint palette icon */}
            <div className="relative w-16 h-16">
              <svg className="w-16 h-16 text-blue-200" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c1.1 0 2-.9 2-2 0-.53-.19-1.01-.49-1.38C13.22 18.22 13 17.63 13 17c0-1.1.9-2 2-2h2.2c2.65 0 4.8-2.15 4.8-4.8C22 5.78 17.52 2 12 2z"/>
              </svg>
              <svg className="absolute inset-0 w-16 h-16 text-blue-600 animate-spin" style={{ animationDuration: '2s' }}
                viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" strokeDasharray="16 48" strokeLinecap="round"/>
              </svg>
            </div>

            <div className="text-center">
              <p className="text-base font-semibold text-slate-700">도안 생성 중...</p>
              <p className="text-xs text-slate-400 mt-0.5">Generating diagram</p>
            </div>

            {/* Progress bar */}
            <div className="w-56 h-2.5 rounded-full bg-slate-200 overflow-hidden">
              <div
                className="h-full bg-blue-600 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-sm font-bold text-blue-600 tabular-nums">{progress}%</p>

            <p className="text-xs text-slate-400 text-center max-w-[200px]">
              {progress < 15 && '이미지 분석 중...'}
              {progress >= 15 && progress < 45 && 'K-means 색상 클러스터링 중...'}
              {progress >= 45 && progress < 65 && '픽셀 할당 중...'}
              {progress >= 65 && progress < 80 && '영역 분석 중...'}
              {progress >= 80 && progress < 95 && '도안 렌더링 중...'}
              {progress >= 95 && '마무리 중...'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
