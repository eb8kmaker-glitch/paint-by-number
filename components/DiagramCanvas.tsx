'use client';
import { useEffect, useRef } from 'react';

interface Props {
  canvas:             HTMLCanvasElement | null;
  isGenerating:       boolean;
  progress:           number;
  placeholder?:       string;
  imageAspectRatio?:  number; // width/height of the original uploaded image
}

export default function DiagramCanvas({ canvas, isGenerating, progress, placeholder, imageAspectRatio = 1 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const existing = el.querySelector('canvas');
    if (existing) el.removeChild(existing);
    if (canvas) {
      canvas.style.display = 'block';
      canvas.style.maxWidth = '100%';
      canvas.style.height = 'auto';
      el.appendChild(canvas);
    }
  }, [canvas]);

  return (
    <div className="relative w-full flex flex-col items-center justify-center"
      style={{ minHeight: '320px' }}>

      {/* Placeholder — frame preview with original aspect ratio */}
      {!canvas && !isGenerating && placeholder && (
        <div className="flex flex-col items-center w-full py-2">
          <div style={{
            position: 'relative',
            display: 'inline-block',
            border: '12px solid var(--color-frame)',
            outline: '2px solid var(--color-frame-dark)',
            boxShadow: '4px 8px 24px rgba(44, 34, 24, 0.25)',
          }}>
            <div style={{ position: 'absolute', inset: 0, boxShadow: 'inset 0 0 0 4px #D4B87A', zIndex: 2, pointerEvents: 'none' }} />
            <img
              src={placeholder}
              alt="원본 이미지"
              style={{
                display: 'block',
                aspectRatio: String(imageAspectRatio),
                maxWidth: imageAspectRatio >= 1 ? '540px' : '360px',
                maxHeight: imageAspectRatio < 1 ? '540px' : '400px',
                width: '100%',
                objectFit: 'cover',
                opacity: 0.55,
              }}
            />
          </div>
        </div>
      )}

      {/* Canvas output — gallery picture frame */}
      {!isGenerating && canvas && (
        <div className="flex flex-col items-center w-full py-2">
          {/* Frame */}
          <div style={{
            position: 'relative',
            display: 'inline-block',
            border: '12px solid var(--color-frame)',
            outline: '2px solid var(--color-frame-dark)',
            boxShadow: '4px 8px 24px rgba(44, 34, 24, 0.35)',
          }}>
            {/* Inner bevel overlay */}
            <div style={{
              position: 'absolute',
              inset: 0,
              boxShadow: 'inset 0 0 0 4px #D4B87A',
              zIndex: 2,
              pointerEvents: 'none',
            }} />
            <div ref={containerRef} style={{ lineHeight: 0, display: 'block' }} />
          </div>

          {/* Brass plate */}
          <div style={{
            marginTop: '10px',
            background: 'linear-gradient(135deg, #D4B87A 0%, #C8A96E 50%, #B8943E 100%)',
            color: 'var(--color-ink)',
            fontFamily: 'var(--font-playfair), Georgia, serif',
            fontSize: '0.7rem',
            fontStyle: 'italic',
            letterSpacing: '0.06em',
            padding: '5px 28px',
            boxShadow: '0 2px 4px rgba(44, 34, 24, 0.2)',
          }}>
            내 작품 / My Artwork
          </div>
        </div>
      )}

      {/* Empty state — watermark palette */}
      {!canvas && !isGenerating && !placeholder && (
        <div className="flex flex-col items-center gap-3 py-16"
          style={{ color: 'var(--color-muted)', opacity: 0.38 }}>
          <svg className="w-20 h-20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c1.1 0 2-.9 2-2 0-.53-.19-1.01-.49-1.38C13.22 18.22 13 17.63 13 17c0-1.1.9-2 2-2h2.2c2.65 0 4.8-2.15 4.8-4.8C22 5.78 17.52 2 12 2zm-5.5 11c-.83 0-1.5-.67-1.5-1.5S5.67 10 6.5 10 8 10.67 8 11.5 7.33 13 6.5 13zm3-4C8.67 9 8 8.33 8 7.5S8.67 6 9.5 6s1.5.67 1.5 1.5S10.33 9 9.5 9zm5 0c-.83 0-1.5-.67-1.5-1.5S13.67 6 14.5 6s1.5.67 1.5 1.5S15.33 9 14.5 9zm3 4c-.83 0-1.5-.67-1.5-1.5S16.67 10 17.5 10s1.5.67 1.5 1.5S18.33 13 17.5 13z"/>
          </svg>
          <p className="text-sm font-medium">도안이 여기에 표시됩니다</p>
          <p className="text-xs">Diagram will appear here</p>
        </div>
      )}

      {/* Progress overlay */}
      {isGenerating && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-5"
          style={{ background: 'rgba(248, 244, 238, 0.93)', backdropFilter: 'blur(4px)' }}>
          {placeholder && (
            <img
              src={placeholder}
              alt=""
              className="absolute inset-0 w-full h-full object-contain pointer-events-none"
              style={{ opacity: 0.1 }}
            />
          )}
          <div className="relative z-10 flex flex-col items-center gap-4">
            {/* Animated palette ring */}
            <div style={{ position: 'relative', width: '64px', height: '64px' }}>
              <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor"
                style={{ color: 'var(--color-frame)', opacity: 0.3 }}>
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c1.1 0 2-.9 2-2 0-.53-.19-1.01-.49-1.38C13.22 18.22 13 17.63 13 17c0-1.1.9-2 2-2h2.2c2.65 0 4.8-2.15 4.8-4.8C22 5.78 17.52 2 12 2z"/>
              </svg>
              <svg className="animate-spin" style={{
                position: 'absolute', inset: 0, width: '64px', height: '64px',
                animationDuration: '2s', color: 'var(--color-frame)',
              }}
                viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" strokeDasharray="16 48" strokeLinecap="round"/>
              </svg>
            </div>

            <div className="text-center">
              <p className="text-base font-semibold"
                style={{ fontFamily: 'var(--font-playfair), Georgia, serif', color: 'var(--color-ink)' }}>
                도안 생성 중...
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--color-muted)' }}>Generating diagram</p>
            </div>

            {/* Progress bar */}
            <div className="w-56 h-2 rounded-full overflow-hidden" style={{ background: '#DDD0BC' }}>
              <div
                className="h-full rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progress}%`, background: 'var(--color-frame)' }}
              />
            </div>
            <p className="text-sm font-bold tabular-nums" style={{ color: 'var(--color-frame-dark)' }}>
              {progress}%
            </p>

            <p className="text-xs text-center max-w-[200px]" style={{ color: 'var(--color-muted)' }}>
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
