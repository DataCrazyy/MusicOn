import { useRef, useEffect, useState, useCallback } from 'react';

interface SignaturePadProps {
  onChange?: (hasSignature: boolean) => void;
  disabled?: boolean;
}

export default function SignaturePad({ onChange, disabled = false }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawing = useRef(false);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);
  const [hasInk, setHasInk] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#1A1A1A';
      ctx.lineWidth = 2;
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  const getPos = (e: React.PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const start = (e: React.PointerEvent) => {
    if (disabled) return;
    e.preventDefault();
    isDrawing.current = true;
    lastPoint.current = getPos(e);
    canvasRef.current?.setPointerCapture(e.pointerId);
  };

  const move = (e: React.PointerEvent) => {
    if (!isDrawing.current || disabled) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || !lastPoint.current) return;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(lastPoint.current.x, lastPoint.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    lastPoint.current = pos;
    if (!hasInk) {
      setHasInk(true);
      onChange?.(true);
    }
  };

  const end = (e: React.PointerEvent) => {
    isDrawing.current = false;
    lastPoint.current = null;
    canvasRef.current?.releasePointerCapture(e.pointerId);
  };

  const clear = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const dpr = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    setHasInk(false);
    onChange?.(false);
  }, [onChange]);

  return (
    <div>
      <div className="relative rounded-lg border-2 border-dashed border-gray-300 bg-white">
        <canvas
          ref={canvasRef}
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={end}
          onPointerLeave={end}
          className="h-32 w-full touch-none rounded-lg"
          style={{ cursor: disabled ? 'not-allowed' : 'crosshair' }}
        />
        {!hasInk && !disabled && (
          <p className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-gray-400">
            Firmá acá con el mouse o touch
          </p>
        )}
      </div>
      <button
        onClick={clear}
        disabled={disabled || !hasInk}
        className="mt-1.5 text-xs font-medium text-gray-400 transition hover:text-gray-600 disabled:opacity-40"
      >
        Limpiar firma
      </button>
    </div>
  );
}
