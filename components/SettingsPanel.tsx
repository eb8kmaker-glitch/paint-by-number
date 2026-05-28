'use client';
import { DiagramSettings, DetailLevel, CanvasSize, Style, FitMode } from '@/lib/diagramRenderer';
import CropPreview from '@/components/CropPreview';

interface Props {
  settings:     DiagramSettings;
  onChange:     (s: DiagramSettings) => void;
  onGenerate:   () => void;
  isGenerating: boolean;
  hasImage:     boolean;
  imageDataUrl?: string;
}

function RadioGroup<T extends string>({
  label, labelEn, value, options, onChange,
}: {
  label: string; labelEn: string;
  value: T; options: { value: T; label: string; labelEn: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div>
      <p className="text-sm font-semibold text-slate-700 mb-1">
        {label} <span className="font-normal text-slate-400 text-xs">/ {labelEn}</span>
      </p>
      <div className="flex gap-2 flex-wrap">
        {options.map(opt => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
              value === opt.value
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:text-blue-600'
            }`}
          >
            {opt.label}
            <span className="text-xs opacity-70 ml-1">/ {opt.labelEn}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function SettingsPanel({
  settings, onChange, onGenerate, isGenerating, hasImage, imageDataUrl,
}: Props) {
  const set = <K extends keyof DiagramSettings>(k: K, v: DiagramSettings[K]) => {
    // Reset crop region when canvas size changes (aspect ratio may differ)
    if (k === 'canvasSize') {
      onChange({ ...settings, [k]: v, cropRegion: null });
    } else {
      onChange({ ...settings, [k]: v });
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Color count */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <p className="text-sm font-semibold text-slate-700">
            색상 수 <span className="font-normal text-slate-400 text-xs">/ Color Count</span>
          </p>
          <span className="text-sm font-bold text-blue-600 tabular-nums w-8 text-right">
            {settings.colorCount}
          </span>
        </div>
        <input
          type="range"
          min={8} max={40} step={1}
          value={settings.colorCount}
          onChange={e => set('colorCount', Number(e.target.value))}
          className="w-full h-2 rounded-full appearance-none cursor-pointer
            bg-slate-200 accent-blue-600"
        />
        <div className="flex justify-between text-xs text-slate-400 mt-0.5">
          <span>8</span><span>40</span>
        </div>
      </div>

      {/* Detail level */}
      <RadioGroup<DetailLevel>
        label="세부 수준" labelEn="Detail Level"
        value={settings.detailLevel}
        onChange={v => set('detailLevel', v)}
        options={[
          { value: 'low',    label: '낮음', labelEn: 'Low'  },
          { value: 'medium', label: '중간', labelEn: 'Med'  },
          { value: 'high',   label: '높음', labelEn: 'High' },
        ]}
      />

      {/* Canvas size */}
      <RadioGroup<CanvasSize>
        label="캔버스 크기" labelEn="Canvas Size"
        value={settings.canvasSize}
        onChange={v => set('canvasSize', v)}
        options={[
          { value: 'a4',     label: 'A4',       labelEn: 'A4'     },
          { value: 'a3',     label: 'A3',       labelEn: 'A3'     },
          { value: 'square', label: '정사각형', labelEn: 'Square' },
        ]}
      />

      {/* Fit mode */}
      <RadioGroup<FitMode>
        label="맞춤 방식" labelEn="Fit Mode"
        value={settings.fitMode}
        onChange={v => set('fitMode', v)}
        options={[
          { value: 'fit',  label: '맞춤', labelEn: 'Fit'  },
          { value: 'fill', label: '채움', labelEn: 'Fill' },
        ]}
      />

      {/* Crop preview — only visible in Fill mode */}
      {settings.fitMode === 'fill' && imageDataUrl && (
        <div className="-mt-2">
          <p className="text-xs text-slate-500 mb-0.5">
            크롭 미리보기 <span className="text-slate-400">/ Crop Preview</span>
          </p>
          <CropPreview
            imageDataUrl={imageDataUrl}
            canvasSize={settings.canvasSize}
            cropRegion={settings.cropRegion}
            onChange={crop => onChange({ ...settings, cropRegion: crop })}
            onReset={() => onChange({ ...settings, cropRegion: null })}
          />
        </div>
      )}

      {/* Style */}
      <RadioGroup<Style>
        label="스타일" labelEn="Style"
        value={settings.style}
        onChange={v => set('style', v)}
        options={[
          { value: 'clean',    label: '깔끔', labelEn: 'Clean'    },
          { value: 'detailed', label: '상세', labelEn: 'Detailed' },
        ]}
      />

      {/* Generate button */}
      <button
        onClick={onGenerate}
        disabled={!hasImage || isGenerating}
        className={`
          mt-2 w-full py-3 rounded-xl font-semibold text-base transition-all
          flex items-center justify-center gap-2
          ${hasImage && !isGenerating
            ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg active:scale-[0.98]'
            : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }
        `}
      >
        {isGenerating ? (
          <>
            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
            생성 중...
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            생성하기 <span className="font-normal text-sm opacity-75">/ Generate</span>
          </>
        )}
      </button>
    </div>
  );
}
