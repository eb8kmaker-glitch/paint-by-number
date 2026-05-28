'use client';
import { useRef, useState, useCallback, useEffect } from 'react';
import { CropRegion, CANVAS_DIMS, CanvasSize } from '@/lib/diagramRenderer';

interface Props {
  imageDataUrl: string;
  canvasSize:   CanvasSize;
  cropRegion:   CropRegion | null;
  onChange:     (crop: CropRegion) => void;
  onReset:      () => void;
}

interface ImgDisplayInfo {
  offX: number;  // left offset of rendered image inside container
  offY: number;  // top offset
  rendW: number;
  rendH: number;
  scaleX: number; // source px per display px
  scaleY: number;
}

export default function CropPreview({ imageDataUrl, canvasSize, cropRegion, onChange, onReset }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef       = useRef<HTMLImageElement>(null);

  const [naturalSize, setNaturalSize]     = useState<{ w: number; h: number } | null>(null);
  const [containerSize, setContainerSize] = useState<{ w: number; h: number } | null>(null);

  const dragging = useRef<{
    startMouseX: number;
    startMouseY: number;
    startCropX:  number;
    startCropY:  number;
  } | null>(null);

  // Track container dimensions
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setContainerSize({ w: el.clientWidth, h: el.clientHeight });
    update();
    const obs = new ResizeObserver(update);
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const dims     = CANVAS_DIMS[canvasSize];
  const targetAR = dims.w / dims.h;

  // Build the auto-center crop when cropRegion is null
  const getDefaultCrop = useCallback((natW: number, natH: number): CropRegion => {
    const imgAR = natW / natH;
    if (imgAR > targetAR) {
      const h = natH, w = h * targetAR, x = (natW - w) / 2;
      return { x, y: 0, w, h };
    } else {
      const w = natW, h = w / targetAR, y = (natH - h) / 2;
      return { x: 0, y, w, h };
    }
  }, [targetAR]);

  const effectiveCrop = naturalSize
    ? (cropRegion ?? getDefaultCrop(naturalSize.w, naturalSize.h))
    : null;

  // Compute where the image is rendered inside the container (object-fit: contain)
  const getImgDisplay = useCallback((): ImgDisplayInfo | null => {
    if (!naturalSize || !containerSize) return null;
    const imgAR = naturalSize.w / naturalSize.h;
    let rendW = containerSize.w, rendH = containerSize.w / imgAR;
    if (rendH > containerSize.h) { rendH = containerSize.h; rendW = rendH * imgAR; }
    const offX = (containerSize.w - rendW) / 2;
    const offY = (containerSize.h - rendH) / 2;
    return { offX, offY, rendW, rendH, scaleX: naturalSize.w / rendW, scaleY: naturalSize.h / rendH };
  }, [naturalSize, containerSize]);

  // Crop rect position in display space
  const getCropDisplay = useCallback(() => {
    if (!effectiveCrop) return null;
    const info = getImgDisplay();
    if (!info) return null;
    return {
      x: info.offX + effectiveCrop.x / info.scaleX,
      y: info.offY + effectiveCrop.y / info.scaleY,
      w: effectiveCrop.w / info.scaleX,
      h: effectiveCrop.h / info.scaleY,
    };
  }, [effectiveCrop, getImgDisplay]);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if (!effectiveCrop) return;
    e.preventDefault();
    const cRect = containerRef.current!.getBoundingClientRect();
    dragging.current = {
      startMouseX: e.clientX - cRect.left,
      startMouseY: e.clientY - cRect.top,
      startCropX:  effectiveCrop.x,
      startCropY:  effectiveCrop.y,
    };
  }, [effectiveCrop]);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging.current || !naturalSize) return;
    const info = getImgDisplay();
    if (!info) return;
    const cRect = containerRef.current!.getBoundingClientRect();
    const mouseX = e.clientX - cRect.left;
    const mouseY = e.clientY - cRect.top;
    const dx = (mouseX - dragging.current.startMouseX) * info.scaleX;
    const dy = (mouseY - dragging.current.startMouseY) * info.scaleY;

    const crop = effectiveCrop!;
    const newX = Math.max(0, Math.min(naturalSize.w - crop.w, dragging.current.startCropX + dx));
    const newY = Math.max(0, Math.min(naturalSize.h - crop.h, dragging.current.startCropY + dy));
    onChange({ ...crop, x: newX, y: newY });
  }, [naturalSize, getImgDisplay, effectiveCrop, onChange]);

  const stopDrag = useCallback(() => { dragging.current = null; }, []);

  const cropDisplay = getCropDisplay();

  return (
    <div className="mt-3">
      {/* Crop canvas */}
      <div
        ref={containerRef}
        className="relative w-full rounded-lg border border-slate-200 bg-slate-100 overflow-hidden select-none"
        style={{ height: 190 }}
        onMouseMove={onMouseMove}
        onMouseUp={stopDrag}
        onMouseLeave={stopDrag}
      >
        {/* Image */}
        <img
          ref={imgRef}
          src={imageDataUrl}
          alt="crop preview"
          className="absolute inset-0 w-full h-full object-contain pointer-events-none"
          draggable={false}
          onLoad={() => {
            const img = imgRef.current;
            if (img) setNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });
          }}
        />

        {/* Overlay + draggable crop frame */}
        {cropDisplay && (
          <>
            {/* Top */}
            <div className="absolute bg-black/50 pointer-events-none"
              style={{ inset: 0, bottom: 'auto', height: cropDisplay.y }} />
            {/* Bottom */}
            <div className="absolute bg-black/50 pointer-events-none"
              style={{ inset: 0, top: cropDisplay.y + cropDisplay.h }} />
            {/* Left */}
            <div className="absolute bg-black/50 pointer-events-none"
              style={{ top: cropDisplay.y, left: 0, width: cropDisplay.x, height: cropDisplay.h }} />
            {/* Right */}
            <div className="absolute bg-black/50 pointer-events-none"
              style={{ top: cropDisplay.y, left: cropDisplay.x + cropDisplay.w, right: 0, height: cropDisplay.h }} />

            {/* Draggable crop frame */}
            <div
              className="absolute border-2 border-white cursor-move"
              style={{ left: cropDisplay.x, top: cropDisplay.y, width: cropDisplay.w, height: cropDisplay.h }}
              onMouseDown={onMouseDown}
            >
              {/* Corner handles */}
              {([['left','top'],['right','top'],['left','bottom'],['right','bottom']] as const).map(([hx, hy]) => (
                <div
                  key={`${hx}${hy}`}
                  className="absolute w-3 h-3 bg-white border border-slate-400 rounded-sm pointer-events-none"
                  style={{ [hx]: -5, [hy]: -5 }}
                />
              ))}
              {/* Rule-of-thirds grid lines */}
              <div className="absolute inset-0 pointer-events-none" style={{ border: 'none' }}>
                {[1/3, 2/3].map(f => (
                  <div key={`v${f}`} className="absolute top-0 bottom-0 w-px bg-white/30"
                    style={{ left: `${f*100}%` }} />
                ))}
                {[1/3, 2/3].map(f => (
                  <div key={`h${f}`} className="absolute left-0 right-0 h-px bg-white/30"
                    style={{ top: `${f*100}%` }} />
                ))}
              </div>
              {/* Dimensions label */}
              {effectiveCrop && (
                <div className="absolute bottom-1 right-1 bg-black/60 text-white text-[9px] px-1 rounded leading-tight pointer-events-none">
                  {Math.round(effectiveCrop.w)}×{Math.round(effectiveCrop.h)}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Reset button */}
      <div className="flex items-center justify-between mt-1.5">
        <p className="text-[10px] text-slate-400">프레임을 드래그하여 위치 조정</p>
        <button
          onClick={onReset}
          className="text-xs text-slate-500 hover:text-blue-600 transition-colors underline underline-offset-2"
        >
          재설정 / Reset
        </button>
      </div>
    </div>
  );
}
