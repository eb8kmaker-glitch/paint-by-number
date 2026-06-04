'use client';
import React from 'react';
import { DiagramSettings, DetailLevel, CanvasSize, Style, FitMode, ColorMode, FRAME_SPECS } from '@/lib/diagramRenderer';
import CropPreview from '@/components/CropPreview';

type Lang = 'en' | 'ko' | 'ja';

interface Props {
  settings:          DiagramSettings;
  onChange:          (s: DiagramSettings) => void;
  onGenerate:        () => void;
  isGenerating:      boolean;
  hasImage:          boolean;
  imageDataUrl?:     string;
  imagePixels?:      number;
  suggestedColors?:  number | null;
  lang?:             Lang;
}

type T = {
  colorCount: string;
  detailLevel: string;
  canvasSize: string;
  fitMode: string;
  style: string;
  colorGuide: string;
  generating: string;
  generate: string;
  low: string; medium: string; high: string;
  fit: string; fill: string;
  clean: string; detailed: string;
  outline: string; tint: string;
  print: string; frameS: string; frameL: string; other: string; square: string;
  sizeInfo: (w: number, h: number, name: string) => string;
  sizeInfoFrame: (w: number, h: number, name: string) => string;
  colorSuggest: (n: number) => string;
  apply: string;
  qualityGood: string; qualitySuggest: string; qualityWarn: string;
  applyOptimal: string;
  cropPreview: string;
};

const SETTINGS_TEXT: Record<Lang, T> = {
  ko: {
    colorCount: '색상 수', detailLevel: '세부 수준', canvasSize: '캔버스 크기',
    fitMode: '맞춤 방식', style: '스타일', colorGuide: '색상 가이드',
    generating: '생성 중...', generate: '생성하기',
    low: '낮음', medium: '중간', high: '높음',
    fit: '맞춤', fill: '채움',
    clean: '깔끔', detailed: '상세',
    outline: '선만', tint: '색상 포함',
    print: '인쇄 규격', frameS: '액자 소형', frameL: '액자 대형', other: '기타', square: '정사각형',
    sizeInfo: (w, h, name) => `인쇄 크기: ${w} × ${h} mm (${name})`,
    sizeInfoFrame: (w, h, name) => `권장 출력 크기: ${w} × ${h} mm (${name})`,
    colorSuggest: (n) => `이 이미지에는 색상 수 ${n} 권장`,
    apply: '적용',
    qualityGood: '현재 설정으로 원본 재현이 가능합니다',
    qualitySuggest: '더 나은 품질을 위해 설정을 조정해보세요',
    qualityWarn: '이미지 해상도가 낮아 세밀한 도안이 어렵습니다',
    applyOptimal: '최적 설정 적용',
    cropPreview: '크롭 미리보기',
  },
  en: {
    colorCount: 'Color Count', detailLevel: 'Detail Level', canvasSize: 'Canvas Size',
    fitMode: 'Fit Mode', style: 'Style', colorGuide: 'Color Guide',
    generating: 'Generating...', generate: 'Generate',
    low: 'Low', medium: 'Med', high: 'High',
    fit: 'Fit', fill: 'Fill',
    clean: 'Clean', detailed: 'Detailed',
    outline: 'Outline', tint: 'Tinted',
    print: 'Print', frameS: 'Frame S', frameL: 'Frame L', other: 'Other', square: 'Square',
    sizeInfo: (w, h, name) => `Print size: ${w} × ${h} mm (${name})`,
    sizeInfoFrame: (w, h, name) => `Canvas size: ${w} × ${h} mm (${name})`,
    colorSuggest: (n) => `Recommended color count: ${n}`,
    apply: 'Apply',
    qualityGood: 'Settings are optimal for high-quality output',
    qualitySuggest: 'Adjust settings for better quality',
    qualityWarn: 'Low resolution — fine detail may be limited',
    applyOptimal: 'Apply Optimal Settings',
    cropPreview: 'Crop Preview',
  },
  ja: {
    colorCount: '色数', detailLevel: '詳細レベル', canvasSize: 'キャンバスサイズ',
    fitMode: 'フィットモード', style: 'スタイル', colorGuide: 'カラーガイド',
    generating: '生成中...', generate: '生成する',
    low: '低', medium: '中', high: '高',
    fit: 'フィット', fill: 'フィル',
    clean: 'クリーン', detailed: '詳細',
    outline: 'アウトライン', tint: 'ティント',
    print: '印刷サイズ', frameS: 'フレーム S', frameL: 'フレーム L', other: 'その他', square: '正方形',
    sizeInfo: (w, h, name) => `印刷サイズ: ${w} × ${h} mm (${name})`,
    sizeInfoFrame: (w, h, name) => `キャンバスサイズ: ${w} × ${h} mm (${name})`,
    colorSuggest: (n) => `推奨色数: ${n}`,
    apply: '適用',
    qualityGood: '現在の設定で最高品質の出力が可能です',
    qualitySuggest: 'より良い品質のために設定を調整してください',
    qualityWarn: '解像度が低いため、細かいディテールが制限される場合があります',
    applyOptimal: '最適設定を適用',
    cropPreview: 'クロッププレビュー',
  },
};

function RadioGroup<T extends string>({
  label, value, options, onChange,
}: {
  label: string;
  value: T; options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div>
      <p className="section-label mb-2">{label}</p>
      <div className="flex gap-2 flex-wrap">
        {options.map(opt => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`pill-btn${value === opt.value ? ' active' : ''}`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

const PRINT_SIZES:  CanvasSize[] = ['a5', 'a4', 'a3'];
const SMALL_SIZES:  CanvasSize[] = ['f4', 'f6', 'f8', 'f10'];
const LARGE_SIZES:  CanvasSize[] = ['f12', 'f15', 'f20', 'f30', 'f50'];

function SizeSelector({
  value, onChange, t,
}: {
  value: CanvasSize;
  onChange: (v: CanvasSize) => void;
  t: T;
}) {
  const selectedSpec = FRAME_SPECS[value];
  const groupLabelStyle: React.CSSProperties = {
    fontSize: '0.65rem', color: 'var(--color-muted)',
    marginBottom: '4px', letterSpacing: '0.05em', textTransform: 'uppercase',
  };
  const btnStyle: React.CSSProperties = { fontSize: '0.7rem', padding: '4px 8px' };

  const renderGroup = (label: string, sizes: CanvasSize[]) => (
    <div>
      <p style={groupLabelStyle}>{label}</p>
      <div className="flex gap-1.5 flex-wrap">
        {sizes.map(size => {
          const spec = FRAME_SPECS[size];
          if (!spec) return null;
          return (
            <button key={size} onClick={() => onChange(size)}
              className={`pill-btn${value === size ? ' active' : ''}`} style={btnStyle}>
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
      <p className="section-label mb-2">{t.canvasSize}</p>
      <div className="flex flex-col gap-2">
        {renderGroup(t.print, PRINT_SIZES)}
        {renderGroup(t.frameS, SMALL_SIZES)}
        {renderGroup(t.frameL, LARGE_SIZES)}
        <div>
          <p style={groupLabelStyle}>{t.other}</p>
          <button onClick={() => onChange('square')}
            className={`pill-btn${value === 'square' ? ' active' : ''}`} style={btnStyle}>
            {t.square}
            <span style={{ display: 'block', fontSize: '0.55rem', opacity: 0.6, lineHeight: 1 }}>
              2480×2480
            </span>
          </button>
        </div>
      </div>

      {selectedSpec && (
        <div style={{
          marginTop: '8px', padding: '6px 10px',
          background: '#F5F0E8', border: '1px solid #DDD0BC',
          borderRadius: '4px', fontSize: '0.7rem', color: 'var(--color-muted)',
        }}>
          {selectedSpec.group === 'print'
            ? t.sizeInfo(selectedSpec.w, selectedSpec.h, selectedSpec.nameEn)
            : t.sizeInfoFrame(selectedSpec.w, selectedSpec.h, selectedSpec.nameEn)
          }
        </div>
      )}
    </div>
  );
}

type QualityState = 'good' | 'suggest' | 'warn';

const OPTIMAL_COLOR_COUNT: Partial<Record<CanvasSize, number>> = {
  a5: 24, a4: 28, a3: 36,
  f8: 32, f20: 40, f50: 48,
};

function getOptimalColorCount(canvasSize: CanvasSize): number {
  return OPTIMAL_COLOR_COUNT[canvasSize] ?? 36;
}

function getQualityState(
  imagePixels: number,
  colorCount: number,
  detailLevel: DetailLevel,
  canvasSize: CanvasSize,
): QualityState {
  if (imagePixels < 500_000) return 'warn';
  const optimal = getOptimalColorCount(canvasSize);
  if (imagePixels >= 2_000_000 && colorCount >= optimal && detailLevel === 'high') return 'good';
  return 'suggest';
}

function QualityBadge({
  imagePixels, settings, onApplyOptimal, t,
}: {
  imagePixels: number;
  settings: DiagramSettings;
  onApplyOptimal: () => void;
  t: T;
}) {
  const state = getQualityState(imagePixels, settings.colorCount, settings.detailLevel, settings.canvasSize);

  const badgeStyles: Record<QualityState, { bg: string; border: string; color: string; dot: string }> = {
    good:    { bg: '#F0FAF0', border: '#86C186', color: '#2D6A2D', dot: '#4CAF50' },
    suggest: { bg: '#FFFBF0', border: '#D4B86A', color: '#7A5C00', dot: '#F5A623' },
    warn:    { bg: '#FDF0F0', border: '#E08080', color: '#8B2020', dot: '#E53935' },
  };
  const s = badgeStyles[state];

  const message = state === 'good' ? t.qualityGood : state === 'suggest' ? t.qualitySuggest : t.qualityWarn;

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
          <div style={{ fontWeight: 600 }}>{message}</div>
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
          {t.applyOptimal}
        </button>
      )}
    </div>
  );
}

export default function SettingsPanel({
  settings, onChange, onGenerate, isGenerating, hasImage, imageDataUrl, imagePixels, suggestedColors,
  lang = 'ko',
}: Props) {
  const t = SETTINGS_TEXT[lang];

  const set = <K extends keyof DiagramSettings>(k: K, v: DiagramSettings[K]) => {
    if (k === 'canvasSize') {
      onChange({ ...settings, [k]: v, cropRegion: null });
    } else {
      onChange({ ...settings, [k]: v });
    }
  };

  const applyOptimal = () => {
    onChange({ ...settings, colorCount: getOptimalColorCount(settings.canvasSize), detailLevel: 'high', style: 'detailed' });
  };

  return (
    <div className="flex flex-col gap-5">

      {/* Color count */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="section-label">{t.colorCount}</p>
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
          <span>8<br/><span style={{opacity:0.65}}>{lang === 'en' ? 'Beg' : lang === 'ja' ? '初' : '입문'}</span></span>
          <span style={{textAlign:'center'}}>24<br/><span style={{opacity:0.65}}>{lang === 'en' ? 'Std' : lang === 'ja' ? '標準' : '기본'}</span></span>
          <span style={{textAlign:'center'}}>36<br/><span style={{opacity:0.65}}>{lang === 'en' ? 'Int' : lang === 'ja' ? '中級' : '중급'}</span></span>
          <span style={{textAlign:'right'}}>48<br/><span style={{opacity:0.65}}>{lang === 'en' ? 'Adv' : lang === 'ja' ? '上級' : '고급'}</span></span>
        </div>

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
            <span style={{ flex: 1 }}>{t.colorSuggest(suggestedColors)}</span>
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
              {t.apply}
            </button>
          </div>
        )}
      </div>

      {/* Detail level */}
      <RadioGroup<DetailLevel>
        label={t.detailLevel}
        value={settings.detailLevel}
        onChange={v => set('detailLevel', v)}
        options={[
          { value: 'low',    label: t.low    },
          { value: 'medium', label: t.medium },
          { value: 'high',   label: t.high   },
        ]}
      />

      {/* Canvas size */}
      <SizeSelector value={settings.canvasSize} onChange={v => set('canvasSize', v)} t={t} />

      {/* Fit mode */}
      <RadioGroup<FitMode>
        label={t.fitMode}
        value={settings.fitMode}
        onChange={v => set('fitMode', v)}
        options={[
          { value: 'fit',  label: t.fit  },
          { value: 'fill', label: t.fill },
        ]}
      />

      {/* Crop preview — fill mode only */}
      {settings.fitMode === 'fill' && imageDataUrl && (
        <div className="-mt-2">
          <p className="section-label mb-1">{t.cropPreview}</p>
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
        label={t.style}
        value={settings.style}
        onChange={v => set('style', v)}
        options={[
          { value: 'clean',    label: t.clean    },
          { value: 'detailed', label: t.detailed },
        ]}
      />

      {/* Color mode toggle */}
      <RadioGroup<ColorMode>
        label={t.colorGuide}
        value={settings.colorMode}
        onChange={v => set('colorMode', v)}
        options={[
          { value: 'outline', label: t.outline },
          { value: 'tint',    label: t.tint    },
        ]}
      />

      {/* Quality recommendation badge */}
      {hasImage && imagePixels !== undefined && imagePixels > 0 && (
        <QualityBadge
          imagePixels={imagePixels}
          settings={settings}
          onApplyOptimal={applyOptimal}
          t={t}
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
            {t.generating}
          </>
        ) : (
          <>
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            {t.generate}
          </>
        )}
      </button>
    </div>
  );
}
