'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import UploadZone from '@/components/UploadZone';

const STEPS = [
  { ko: '업로드',  en: 'Upload'   },
  { ko: '설정',    en: 'Settings' },
  { ko: '생성',    en: 'Generate' },
  { ko: '내보내기',en: 'Export'   },
];

export default function HomePage() {
  const router  = useRouter();
  const [ready, setReady] = useState(false);

  const handleImageReady = (dataUrl: string) => {
    sessionStorage.setItem('uploadedImage', dataUrl);
    setReady(true);
  };

  const handleNext = () => {
    if (ready) router.push('/generate');
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
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
        <div className="max-w-5xl mx-auto px-4 py-3">
          <div className="flex items-center gap-0">
            {STEPS.map((step, i) => (
              <div key={i} className="flex items-center">
                <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium
                  ${i === 0
                    ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-200'
                    : 'text-slate-400'
                  }`}
                >
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0
                    ${i === 0
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    {i + 1}
                  </span>
                  <span className="hidden sm:inline">{step.ko}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="w-6 h-px bg-slate-200 mx-1" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-10">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-extrabold text-slate-900 mb-3">
            나만의 페인트 바이 넘버 만들기
          </h2>
          <p className="text-slate-500 text-base max-w-lg mx-auto">
            사진을 업로드하면 번호가 표시된 채색 도안으로 변환해 드립니다.
          </p>
          <p className="text-slate-400 text-sm mt-1">
            Upload your photo — get a professional numbered painting diagram.
          </p>
        </div>

        {/* Upload card */}
        <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <UploadZone onImageReady={handleImageReady} />

          {ready && (
            <button
              onClick={handleNext}
              className="mt-5 w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700
                text-white font-semibold text-base flex items-center justify-center gap-2
                shadow-md hover:shadow-lg transition-all active:scale-[0.98]"
            >
              다음 단계로
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <span className="text-sm font-normal opacity-75">/ Next Step</span>
            </button>
          )}
        </div>

        {/* Feature highlights */}
        <div className="grid sm:grid-cols-3 gap-4 mt-12 max-w-3xl mx-auto">
          {[
            {
              icon: (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
              ),
              titleKo: '클라이언트 처리',
              titleEn: 'Client-Side Only',
              descKo:  '이미지가 서버로 전송되지 않습니다',
              descEn:  'Images never leave your device',
            },
            {
              icon: (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
              ),
              titleKo: '전문 물감 색상',
              titleEn: 'Pro Acrylic Colors',
              descKo:  '24가지 표준 아크릴 물감 기준',
              descEn:  '24 standard acrylic paint colors',
            },
            {
              icon: (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              ),
              titleKo: 'PNG / PDF 출력',
              titleEn: 'PNG & PDF Export',
              descKo:  '인쇄용 A4 PDF 레이아웃 포함',
              descEn:  'Print-ready A4 PDF with legend',
            },
          ].map((f, i) => (
            <div key={i} className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
              <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center mb-3">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {f.icon}
                </svg>
              </div>
              <p className="text-sm font-semibold text-slate-800">{f.titleKo}</p>
              <p className="text-xs text-slate-400">{f.titleEn}</p>
              <p className="text-xs text-slate-500 mt-1">{f.descKo}</p>
              <p className="text-[10px] text-slate-400">{f.descEn}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="text-center py-4 text-xs text-slate-400 border-t border-slate-100">
        Paint by Number Generator — 모든 처리는 브라우저에서 실행됩니다 / All processing runs in-browser
      </footer>
    </div>
  );
}
