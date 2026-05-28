'use client';
import { useState } from 'react';
import { DiagramResult, CanvasSize } from '@/lib/diagramRenderer';
import { exportToPng, exportToPdf } from '@/lib/pdfExport';

interface Props {
  result:     DiagramResult | null;
  canvasSize: CanvasSize;
}

export default function ExportButtons({ result, canvasSize }: Props) {
  const [pdfLoading, setPdfLoading] = useState(false);

  const handlePng = () => {
    if (!result) return;
    exportToPng(result.canvas);
  };

  const handlePdf = async () => {
    if (!result) return;
    setPdfLoading(true);
    try {
      await exportToPdf(result.canvas, result.colorMap, canvasSize);
    } catch (err) {
      console.error('PDF export failed', err);
    } finally {
      setPdfLoading(false);
    }
  };

  const disabled = !result;

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      {/* PNG */}
      <button
        onClick={handlePng}
        disabled={disabled}
        className={`
          flex-1 flex items-center justify-center gap-2
          py-3 px-5 rounded-xl font-semibold text-sm transition-all
          ${disabled
            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
            : 'bg-white border-2 border-blue-600 text-blue-600 hover:bg-blue-50 active:scale-[0.98] shadow-sm'
          }
        `}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        PNG 저장
        <span className="text-xs font-normal opacity-60">/ Save PNG</span>
      </button>

      {/* PDF */}
      <button
        onClick={handlePdf}
        disabled={disabled || pdfLoading}
        className={`
          flex-1 flex items-center justify-center gap-2
          py-3 px-5 rounded-xl font-semibold text-sm transition-all
          ${disabled || pdfLoading
            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98] shadow-md'
          }
        `}
      >
        {pdfLoading ? (
          <>
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
            PDF 생성 중...
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            PDF 내보내기
            <span className="text-xs font-normal opacity-70">/ Export PDF</span>
          </>
        )}
      </button>
    </div>
  );
}
