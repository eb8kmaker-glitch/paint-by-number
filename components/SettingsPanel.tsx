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
      <p className="section-label mb-2">
        {label} <span style={{ textTransform: 'none', letterSpacing: 'normal', opacity: 0.65 }}>/ {labelEn}</span>
      </p>
      <div className="flex gap-2 flex-wrap">
        {options.map(opt => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`pill-btn${value === opt.value ? ' active' : ''}`}
          >
            {opt.label}
            <span style={{ fontSize: '0.65rem', opacity: 0.65, marginLeft: '3px' }}>
              / {opt.labelEn}
            </span>
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
        <div className="flex items-center justify-between mb-2">
          <p className="section-label">
            색상 수 <span style={{ textTransform: 'none', letterSpacing: 'normal', opacity: 0.65 }}>/ Color Count</span>
          </p>
          <span className="text-sm font-bold tabular-nums"
            style={{ color: 'var(--color-frame-dark)', minWidth: '28px', textAlign: 'right' }}>
            {settings.colorCount}
          </span>
        </div>
        <input
          type="range"
          min={8} max={40} step={1}
          value={settings.colorCount}
          onChange={e => set('colorCount', Number(e.target.value))}
          className="w-full h-2 rounded-full appearance-none cursor-pointer"
          style={{ background: '#DDD0BC' }}
        />
        <div className="flex justify-between mt-0.5" style={{ fontSize: '0.65rem', color: 'var(--color-muted)' }}>
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

      {/* Crop preview — fill mode only */}
      {settings.fitMode === 'fill' && imageDataUrl && (
        <div className="-mt-2">
          <p className="section-label mb-1">
            크롭 미리보기 <span style={{ textTransform: 'none', letterSpacing: 'normal', opacity: 0.65 }}>/ Crop Preview</span>
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
        className="btn-gallery btn-gold mt-2 w-full py-3 text-base active:scale-[0.98]"
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
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            생성하기
            <span style={{ fontSize: '0.875rem', fontFamily: 'var(--font-inter), sans-serif', opacity: 0.72 }}>
              / Generate
            </span>
          </>
        )}
      </button>
    </div>
  );
}
