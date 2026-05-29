'use client';
import { DiagramSettings, DetailLevel, CanvasSize, Style, FitMode, ColorMode, FRAME_SPECS } from '@/lib/diagramRenderer';
import CropPreview from '@/components/CropPreview';

interface Props {
  settings:          DiagramSettings;
  onChange:          (s: DiagramSettings) => void;
  onGenerate:        () => void;
  isGenerating:      boolean;
  hasImage:          boolean;
  imageDataUrl?:     string;
  imagePixels?:      number;
  suggestedColors?:  number | null;
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

const SMALL_SIZES: CanvasSize[] = ['f4', 'f6', 'f8', 'f10'];
const LARGE_SIZES: CanvasSize[] = ['f12', 'f15', 'f20', 'f30', 'f50'];

function FrameSizeSelector({
  value, onChange,
}: {
  value: CanvasSize;
  onChange: (v: CanvasSize) => void;
}) {
  const selectedSpec = value !== 'square' ? FRAME_SPECS[value] : null;

  const renderGroup = (label: string, sizes: CanvasSize[]) => (
    <div>
      <p style={{ fontSize: '0.65rem', color: 'var(--color-muted)', marginBottom: '4px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
        {label}
      </p>
      <div className="flex gap-1.5 flex-wrap">
        {sizes.map(size => {
          const spec = FRAME_SPECS[size];
          if (!spec) return null;
          return (
            <button
              key={size}
              onClick={() => onChange(size)}
              className={`pill-btn${value === size ? ' active' : ''}`}
              style={{ fontSize: '0.7rem', padding: '4px 8px' }}
            >
              {spec.nameKo}
              <span style={{ display: 'block', fontSize: '0.55rem', opacity: 0.6, lineHeight: 1 }}>
                {spec.w}×{spec.h}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div>
      <p className="section-label mb-2">
        액자 규격 <span style={{ textTransform: 'none', letterSpacing: 'normal', opacity: 0.65 }}>/ Frame Size</span>
      </p>
      <div className="flex flex-col gap-2">
        {renderGroup('소형 / Small', SMALL_SIZES)}
        {renderGroup('대형 / Large', LARGE_SIZES)}
        {/* Square */}
        <div>
          <p style={{ fontSize: '0.65rem', color: 'var(--color-muted)', marginBottom: '4px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            기타 / Other
          </p>
          <button
            onClick={() => onChange('square')}
            className={`pill-btn${value === 'square' ? ' active' : ''}`}
            style={{ fontSize: '0.7rem', padding: '4px 8px' }}
          >
            정사각형
            <span style={{ display: 'block', fontSize: '0.55rem', opacity: 0.6, lineHeight: 1 }}>
              2480×2480
            </span>
          </button>
        </div>
      </div>

      {/* Info badge */}
      {selectedSpec && (
        <div style={{
          marginTop: '8px',
          padding: '6px 10px',
          background: '#F5F0E8',
          border: '1px solid #DDD0BC',
          borderRadius: '4px',
          fontSize: '0.7rem',
          color: 'var(--color-muted)',
        }}>
          권장 출력 크기: {selectedSpec.w} × {selectedSpec.h} mm
          <span style={{ opacity: 0.7, marginLeft: '4px' }}>({selectedSpec.nameEn})</span>
        </div>
      )}
    </div>
  );
}

type QualityState = 'good' | 'suggest' | 'warn';

function getQualityState(
  imagePixels: number,
  colorCount: number,
  detailLevel: DetailLevel,
): QualityState {
  if (imagePixels < 500_000) return 'warn';
  if (imagePixels >= 2_000_000 && colorCount >= 36 && detailLevel === 'high') return 'good';
  return 'suggest';
}

function QualityBadge({
  imagePixels,
  settings,
  onApplyOptimal,
}: {
  imagePixels: number;
  settings: DiagramSettings;
  onApplyOptimal: () => void;
}) {
  const state = getQualityState(imagePixels, settings.colorCount, settings.detailLevel);

  const badgeStyles: Record<QualityState, { bg: string; border: string; color: string; dot: string }> = {
    good:    { bg: '#F0FAF0', border: '#86C186', color: '#2D6A2D', dot: '#4CAF50' },
    suggest: { bg: '#FFFBF0', border: '#D4B86A', color: '#7A5C00', dot: '#F5A623' },
    warn:    { bg: '#FDF0F0', border: '#E08080', color: '#8B2020', dot: '#E53935' },
  };
  const s = badgeStyles[state];

  const messages: Record<QualityState, { ko: string; en: string }> = {
    good:    { ko: '현재 설정으로 원본 재현이 가능합니다', en: 'Settings are optimal for high-quality output' },
    suggest: { ko: '더 나은 품질을 위해 설정을 조정해보세요', en: 'Adjust settings for better quality' },
    warn:    { ko: '이미지 해상도가 낮아 세밀한 도안이 어렵습니다', en: 'Low resolution — fine detail may be limited' },
  };

  return (
    <div style={{
      padding: '8px 10px',
      background: s.bg,
      border: `1px solid ${s.border}`,
      borderRadius: '4px',
      fontSize: '0.72rem',
      color: s.color,
    }}>
      <div className="flex items-start gap-2">
        <div style={{
          width: 8, height: 8, borderRadius: '50%',
          background: s.dot, flexShrink: 0, marginTop: 3,
        }} />
        <div className="flex-1">
          <div style={{ fontWeight: 600 }}>{messages[state].ko}</div>
          <div style={{ opacity: 0.75, fontSize: '0.65rem' }}>{messages[state].en}</div>
        </div>
      </div>
      {state === 'suggest' && (
        <button
          onClick={onApplyOptimal}
          style={{
            marginTop: 6, display: 'block', width: '100%',
            padding: '4px 0',
            background: '#D4B86A22',
            border: `1px solid ${s.border}`,
            borderRadius: '3px',
            color: s.color,
            fontSize: '0.7rem',
            cursor: 'pointer',
          }}
        >
          최적 설정 적용 / Apply Optimal Settings
        </button>
      )}
    </div>
  );
}

export default function SettingsPanel({
  settings, onChange, onGenerate, isGenerating, hasImage, imageDataUrl, imagePixels, suggestedColors,
}: Props) {
  const set = <K extends keyof DiagramSettings>(k: K, v: DiagramSettings[K]) => {
    if (k === 'canvasSize') {
      onChange({ ...settings, [k]: v, cropRegion: null });
    } else {
      onChange({ ...settings, [k]: v });
    }
  };

  const applyOptimal = () => {
    onChange({ ...settings, colorCount: 36, detailLevel: 'high', style: 'detailed' });
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
          min={8} max={48} step={1}
          value={settings.colorCount}
          onChange={e => set('colorCount', Number(e.target.value))}
          className="w-full h-2 rounded-full appearance-none cursor-pointer"
          style={{ background: '#DDD0BC' }}
        />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', marginTop: '3px', fontSize: '0.6rem', color: 'var(--color-muted)' }}>
          <span>8<br/><span style={{opacity:0.65}}>입문</span></span>
          <span style={{textAlign:'center'}}>24<br/><span style={{opacity:0.65}}>기본</span></span>
          <span style={{textAlign:'center'}}>36<br/><span style={{opacity:0.65}}>중급</span></span>
          <span style={{textAlign:'right'}}>48<br/><span style={{opacity:0.65}}>고급</span></span>
        </div>

        {/* Color count suggestion badge */}
        {suggestedColors !== null && suggestedColors !== undefined && suggestedColors !== settings.colorCount && (
          <div style={{
            marginTop: 6,
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '5px 8px',
            background: '#F5F0E8',
            border: '1px solid #C8B88A',
            borderRadius: 4,
            fontSize: '0.68rem',
            color: 'var(--color-muted)',
          }}>
            <span style={{ flex: 1 }}>이 이미지에는 색상 수 <strong>{suggestedColors}</strong> 권장</span>
            <button
              onClick={() => onChange({ ...settings, colorCount: suggestedColors! })}
              style={{
                padding: '2px 8px',
                background: 'var(--color-frame)',
                color: '#fff',
                border: 'none',
                borderRadius: 3,
                fontSize: '0.65rem',
                cursor: 'pointer',
              }}
            >
              적용
            </button>
          </div>
        )}
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

      {/* Frame size */}
      <FrameSizeSelector
        value={settings.canvasSize}
        onChange={v => set('canvasSize', v)}
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

      {/* Color mode toggle */}
      <RadioGroup<ColorMode>
        label="색상 가이드" labelEn="Color Guide"
        value={settings.colorMode}
        onChange={v => set('colorMode', v)}
        options={[
          { value: 'outline', label: '선만',    labelEn: 'Outline' },
          { value: 'tint',    label: '색상 포함', labelEn: 'Tinted'  },
        ]}
      />

      {/* Quality recommendation badge */}
      {hasImage && imagePixels !== undefined && imagePixels > 0 && (
        <QualityBadge
          imagePixels={imagePixels}
          settings={settings}
          onApplyOptimal={applyOptimal}
        />
      )}

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
