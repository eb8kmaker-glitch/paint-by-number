'use client';
import { useState } from 'react';
import { DiagramResult, CanvasSize, DiagramSettings } from '@/lib/diagramRenderer';
import { exportToPng, exportToPdf } from '@/lib/pdfExport';

type Lang = 'en' | 'ko' | 'ja';

interface Props {
  result:          DiagramResult | null;
  canvasSize:      CanvasSize;
  settings:        DiagramSettings;
  originalImageDataUrl?: string;
  lang?:           Lang;
}

const EXPORT_TEXT: Record<Lang, {
  savePng:      string;
  exportPdf:    string;
  generating:   string;
  pdfError:     string;
  pdfFail:      string;
}> = {
  ko: { savePng: 'PNG 저장', exportPdf: 'PDF 내보내기', generating: 'PDF 생성 중...', pdfError: 'PDF 오류:', pdfFail: 'PDF 생성 실패' },
  en: { savePng: 'Save PNG', exportPdf: 'Export PDF',   generating: 'Generating PDF...', pdfError: 'PDF error:', pdfFail: 'PDF generation failed' },
  ja: { savePng: 'PNG 保存', exportPdf: 'PDF 出力',     generating: 'PDFを生成中...', pdfError: 'PDFエラー:', pdfFail: 'PDF生成失敗' },
};

export default function ExportButtons({ result, canvasSize, settings, originalImageDataUrl, lang = 'ko' }: Props) {
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError,   setPdfError]   = useState('');

  const t = EXPORT_TEXT[lang];

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
          colorMode: settings.colorMode,
        },
      );
    } catch (err) {
      console.error('PDF export failed', err);
      setPdfError(err instanceof Error ? err.message : t.pdfFail);
    } finally {
      setPdfLoading(false);
    }
  };

  const disabled = !result;

  return (
    <div className="flex flex-col gap-3">
    {pdfError && (
      <div style={{ fontSize: '0.75rem', color: '#c0392b', background: '#fdf0ec', border: '1px solid #e08070', borderRadius: 3, padding: '6px 10px' }}>
        {t.pdfError} {pdfError}
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
        {t.savePng}
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
            {t.generating}
          </>
        ) : (
          <>
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            {t.exportPdf}
          </>
        )}
      </button>
    </div>
    </div>
  );
}
