import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type WheelEvent as ReactWheelEvent } from 'react';
import { Check, Loader2, X, ZoomIn, ZoomOut } from 'lucide-react';

const OUTPUT_SIZE = 800;

type Props = {
  /** URL o data-URL de la imagen original a recortar (aspecto libre, se recorta a 1:1). */
  imageSrc: string;
  /** Se llama con el blob final (JPEG) cuando el usuario confirma el recorte. */
  onConfirm: (blob: Blob) => void;
  onCancel: () => void;
  /** Texto del botón de confirmar mientras se procesa (ej. "Guardando..."). */
  processing?: boolean;
};

/**
 * Modal de recorte de foto estilo Airbnb: zoom, reposicionar arrastrando y
 * vista previa circular, todo con canvas nativo (sin dependencias externas).
 * Funciona con mouse y touch (pointer events), responsive en celular y desktop.
 */
export default function PhotoCropModal({ imageSrc, onConfirm, onCancel, processing }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [minZoom, setMinZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragState = useRef<{ startX: number; startY: number; origin: { x: number; y: number } } | null>(null);

  const VIEWPORT = 280;

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imgRef.current = img;
      const scale = Math.max(VIEWPORT / img.width, VIEWPORT / img.height);
      setMinZoom(scale);
      setZoom(scale);
      setOffset({ x: 0, y: 0 });
      setImgLoaded(true);
    };
    img.src = imageSrc;
  }, [imageSrc]);

  function clampOffset(nextOffset: { x: number; y: number }, currentZoom: number) {
    const img = imgRef.current;
    if (!img) return nextOffset;
    const scaledW = img.width * currentZoom;
    const scaledH = img.height * currentZoom;
    const maxX = Math.max(0, (scaledW - VIEWPORT) / 2);
    const maxY = Math.max(0, (scaledH - VIEWPORT) / 2);
    return {
      x: Math.min(maxX, Math.max(-maxX, nextOffset.x)),
      y: Math.min(maxY, Math.max(-maxY, nextOffset.y)),
    };
  }

  function handlePointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragState.current = { startX: e.clientX, startY: e.clientY, origin: offset };
  }

  function handlePointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (!dragState.current) return;
    const dx = e.clientX - dragState.current.startX;
    const dy = e.clientY - dragState.current.startY;
    setOffset(clampOffset({ x: dragState.current.origin.x + dx, y: dragState.current.origin.y + dy }, zoom));
  }

  function handlePointerUp() {
    dragState.current = null;
  }

  function handleWheel(e: ReactWheelEvent<HTMLDivElement>) {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.05 : 0.05;
    changeZoom(zoom + delta);
  }

  function changeZoom(nextZoom: number) {
    const clamped = Math.min(minZoom * 3, Math.max(minZoom, nextZoom));
    setZoom(clamped);
    setOffset((prev) => clampOffset(prev, clamped));
  }

  function handleConfirm() {
    const img = imgRef.current;
    if (!img) return;
    const canvas = document.createElement('canvas');
    canvas.width = OUTPUT_SIZE;
    canvas.height = OUTPUT_SIZE;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const scaledW = img.width * zoom;
    const scaledH = img.height * zoom;
    const factor = OUTPUT_SIZE / VIEWPORT;

    const drawW = scaledW * factor;
    const drawH = scaledH * factor;
    const drawX = OUTPUT_SIZE / 2 - drawW / 2 + offset.x * factor;
    const drawY = OUTPUT_SIZE / 2 - drawH / 2 + offset.y * factor;

    ctx.drawImage(img, drawX, drawY, drawW, drawH);
    canvas.toBlob(
      (blob) => {
        if (blob) onConfirm(blob);
      },
      'image/jpeg',
      0.92
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-base/90 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-card border border-line bg-bg-surface p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-ink-primary">Ajustar foto</h2>
          <button
            type="button"
            onClick={onCancel}
            className="flex h-8 w-8 items-center justify-center rounded-full text-ink-muted hover:bg-bg-raised"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div
          ref={containerRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onWheel={handleWheel}
          className="relative mx-auto flex touch-none items-center justify-center overflow-hidden rounded-full bg-bg-raised"
          style={{ width: VIEWPORT, height: VIEWPORT, cursor: 'grab' }}
        >
          {!imgLoaded ? (
            <Loader2 className="h-6 w-6 animate-spin text-ink-muted" />
          ) : (
            <img
              src={imageSrc}
              alt="Recorte de foto"
              draggable={false}
              style={{
                width: imgRef.current!.width * zoom,
                height: imgRef.current!.height * zoom,
                transform: `translate(${offset.x}px, ${offset.y}px)`,
                maxWidth: 'none',
                userSelect: 'none',
              }}
            />
          )}
          {/* Máscara circular con borde para simular la vista previa final */}
          <div className="pointer-events-none absolute inset-0 rounded-full ring-2 ring-inset ring-bg-surface/80" />
        </div>

        <div className="mt-4 flex items-center gap-3">
          <ZoomOut className="h-4 w-4 flex-shrink-0 text-ink-muted" />
          <input
            type="range"
            min={minZoom}
            max={minZoom * 3}
            step={0.01}
            value={zoom}
            onChange={(e) => changeZoom(Number(e.target.value))}
            className="w-full accent-lime"
          />
          <ZoomIn className="h-4 w-4 flex-shrink-0 text-ink-muted" />
        </div>

        <p className="mt-2 text-center text-xs text-ink-muted">Arrastra para reposicionar y usa el control para hacer zoom.</p>

        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-pill border border-line px-4 py-3 text-sm font-bold text-ink-primary hover:border-lime/40"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!imgLoaded || processing}
            className="flex flex-1 items-center justify-center gap-2 rounded-pill bg-lime px-4 py-3 text-sm font-bold text-bg-base transition hover:bg-lime-dark disabled:opacity-60"
          >
            {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            Usar foto
          </button>
        </div>
      </div>
    </div>
  );
}
