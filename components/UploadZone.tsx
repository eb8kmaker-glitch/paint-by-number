'use client';
import { useRef, useState, useCallback, DragEvent, ChangeEvent } from 'react';

interface Props {
  onImageReady: (dataUrl: string) => void;
}

const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIDE = 1200; // downscale before storing

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
          className={`
            relative flex flex-col items-center justify-center gap-3
            min-h-[220px] rounded-2xl border-2 border-dashed cursor-pointer
            transition-all duration-200 select-none
            ${dragging
              ? 'border-blue-500 bg-blue-50 scale-[1.01]'
              : 'border-slate-300 bg-white hover:border-blue-400 hover:bg-blue-50/40'
            }
          `}
        >
          <svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <div className="text-center">
            <p className="text-base font-medium text-slate-700">
              이미지를 드래그하거나 클릭하여 업로드
            </p>
            <p className="text-sm text-slate-400 mt-1">Drag &amp; drop or click to upload</p>
            <p className="text-xs text-slate-400 mt-1">JPG · PNG · WEBP</p>
          </div>
          {dragging && (
            <div className="absolute inset-0 rounded-2xl bg-blue-500/10 flex items-center justify-center">
              <p className="text-blue-600 font-semibold text-lg">놓아서 업로드</p>
            </div>
          )}
        </div>
      ) : (
        <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-white">
          <img
            src={preview}
            alt="업로드된 이미지"
            className="w-full max-h-[340px] object-contain"
          />
          <div className="flex items-center justify-between px-4 py-2 bg-slate-50 border-t border-slate-100">
            <span className="text-sm text-slate-500 truncate max-w-[200px]">{fileName}</span>
            <button
              onClick={reset}
              className="text-sm text-red-500 hover:text-red-700 font-medium transition-colors"
            >
              다시 선택
            </button>
          </div>
        </div>
      )}

      {error && (
        <p className="mt-2 text-sm text-red-500 text-center">{error}</p>
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
