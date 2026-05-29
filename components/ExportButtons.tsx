'use client';
import { useState } from 'react';
import { DiagramResult, CanvasSize, DiagramSettings } from '@/lib/diagramRenderer';
import { exportToPng, exportToPdf } from '@/lib/pdfExport';

interface Props {
  result:          DiagramResult | null;
  canvasSize:      CanvasSize;
  settings:        DiagramSettings;
  originalImageDataUrl?: string;
}

export default function ExportButtons({ result, canvasSize, settings, originalImageDataUrl }: Props) {
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError,   setPdfError]   = useState('');

  const handlePng = () => {
    if (!result) return;
    exportToPng(result.canvas);
  };

  const handlePdf = async () => {
    if (!result) return;
    setPdfLoading(true);
    setPdfError('');
    try {
      await exportToPdf(
        result.canvas,
        result.colorMap,
        canvasSize,
        originalImageDataUrl,
        {
          date: new Date().toLocaleDateString('ko-KR'),
          colorCount: settings.colorCount,
          detailLevel: settings.detailLevel === 'low' ? 'Low' : settings.detailLevel === 'medium' ? 'Medium' : 'High',
        },
      );
    } catch (err) {
      console.error('PDF export failed', err);
      setPdfError(err instanceof Error ? err.message : 'PDF 생성 실패');
    } finally {
      setPdfLoading(false);
    }
  };

  const disabled = !result;

  return (
    <div className="flex flex-col gap-3">
    {pdfError && (
      <div style={{ fontSize: '0.75rem', color: '#c0392b', background: '#fdf0ec', border: '1px solid #e08070', borderRadius: 3, padding: '6px 10px' }}>
        PDF 오류: {pdfError}
      </div>
    )}
    <div className="flex flex-col sm:flex-row gap-3">
      {/* PNG — gold outline */}
      <button
        onClick={handlePng}
        disabled={disabled}
        className="btn-gallery btn-outline-gold flex-1 py-3 px-5"
      >
        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        PNG 저장
        <span style={{ fontSize: '0.7rem', fontWeight: 400, opacity: 0.65 }}>/ Save PNG</span>
      </button>

      {/* PDF — sage green */}
      <button
        onClick={handlePdf}
        disabled={disabled || pdfLoading}
        className="btn-gallery btn-sage flex-1 py-3 px-5"
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
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            PDF 내보내기
            <span style={{ fontSize: '0.7rem', fontWeight: 400, opacity: 0.75 }}>/ Export PDF</span>
          </>
        )}
      </button>
    </div>
    </div>
  );
}
