'use client';
import { useRef, useState, useCallback, DragEvent, ChangeEvent } from 'react';

interface Props {
  onImageReady: (dataUrl: string) => void;
}

const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIDE = 1200;

function resizeToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, MAX_SIDE / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d')!.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.9));
      };
      img.onerror = reject;
      img.src = e.target!.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function UploadZone({ onImageReady }: Props) {
  const inputRef   = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [preview,  setPreview]  = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [error,    setError]    = useState<string>('');

  const process = useCallback(async (file: File) => {
    setError('');
    if (!ACCEPTED.includes(file.type)) {
      setError('JPG, PNG 또는 WEBP 파일만 지원됩니다.');
      return;
    }
    try {
      const dataUrl = await resizeToDataUrl(file);
      setPreview(dataUrl);
      setFileName(file.name);
      onImageReady(dataUrl);
    } catch {
      setError('이미지를 처리하는 중 오류가 발생했습니다.');
    }
  }, [onImageReady]);

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) process(file);
  };

  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) process(file);
  };

  const reset = () => {
    setPreview(null);
    setFileName('');
    setError('');
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="w-full">
      {!preview ? (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={`upload-zone${dragging ? ' dragging' : ''}`}
          style={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            minHeight: '200px',
            padding: '28px',
            userSelect: 'none',
          }}
        >
          {/* Palette icon */}
          <svg width="52" height="52" viewBox="0 0 24 24" fill="currentColor"
            style={{ color: 'var(--color-frame)', opacity: dragging ? 0.9 : 0.55 }}>
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c1.1 0 2-.9 2-2 0-.53-.19-1.01-.49-1.38C13.22 18.22 13 17.63 13 17c0-1.1.9-2 2-2h2.2c2.65 0 4.8-2.15 4.8-4.8C22 5.78 17.52 2 12 2zm-5.5 11c-.83 0-1.5-.67-1.5-1.5S5.67 10 6.5 10 8 10.67 8 11.5 7.33 13 6.5 13zm3-4C8.67 9 8 8.33 8 7.5S8.67 6 9.5 6s1.5.67 1.5 1.5S10.33 9 9.5 9zm5 0c-.83 0-1.5-.67-1.5-1.5S13.67 6 14.5 6s1.5.67 1.5 1.5S15.33 9 14.5 9zm3 4c-.83 0-1.5-.67-1.5-1.5S16.67 10 17.5 10s1.5.67 1.5 1.5S18.33 13 17.5 13z"/>
          </svg>
          <div className="text-center">
            <p className="text-base font-medium" style={{ color: 'var(--color-ink)' }}>
              이미지를 드래그하거나 클릭하여 업로드
            </p>
            <p className="text-sm mt-1" style={{ color: 'var(--color-muted)' }}>
              Drag &amp; drop or click to upload
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--color-muted)', opacity: 0.65 }}>
              JPG · PNG · WEBP
            </p>
          </div>
          {dragging && (
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(74, 124, 107, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <p style={{ color: 'var(--color-accent)', fontWeight: 600, fontSize: '1.1rem' }}>
                놓아서 업로드
              </p>
            </div>
          )}
        </div>
      ) : (
        <div style={{
          border: '1px solid #DDD0BC',
          background: '#FDFAF5',
          overflow: 'hidden',
        }}>
          <img
            src={preview}
            alt="업로드된 이미지"
            className="w-full object-contain"
            style={{ maxHeight: '320px' }}
          />
          <div className="flex items-center justify-between px-4 py-2"
            style={{ background: '#F5EFE4', borderTop: '1px solid #DDD0BC' }}>
            <span className="text-sm truncate max-w-[200px]" style={{ color: 'var(--color-muted)' }}>
              {fileName}
            </span>
            <button
              onClick={reset}
              className="text-sm font-medium transition-colors"
              style={{ color: 'var(--color-accent-warm)' }}
            >
              다시 선택
            </button>
          </div>
        </div>
      )}

      {error && (
        <p className="mt-2 text-sm text-center" style={{ color: 'var(--color-accent-warm)' }}>
          {error}
        </p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED.join(',')}
        onChange={onFileChange}
        className="hidden"
      />
    </div>
  );
}
