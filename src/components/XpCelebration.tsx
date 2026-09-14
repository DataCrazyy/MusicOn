import { useEffect, useRef, useState } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;
}

const CONFETTI_COLORS = ['#CAFF00', '#FFD700', '#FF6B9D', '#00D9FF', '#C0C0C0', '#CD7F32'];

export function useConfetti() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [active, setActive] = useState(false);
  const rafRef = useRef<ReturnType<typeof requestAnimationFrame> | null>(null);

  const fire = () => {
    setActive(true);
  };

  useEffect(() => {
    if (!active || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: Particle[] = [];
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    for (let i = 0; i < 150; i++) {
      const angle = (Math.PI * 2 * i) / 150;
      const speed = 4 + Math.random() * 8;
      particles.push({
        x: centerX,
        y: centerY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 3,
        size: 4 + Math.random() * 6,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        life: 1,
      });
    }

    const startTime = performance.now();
    const DURATION = 3000;

    const animate = (now: number) => {
      const elapsed = now - startTime;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => {
        p.vy += 0.15;
        p.x += p.vx;
        p.y += p.vy;
        p.life = Math.max(0, 1 - elapsed / DURATION);

        ctx.save();
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
        ctx.restore();
      });

      if (elapsed < DURATION) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setActive(false);
      }
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [active]);

  return { canvasRef, active, fire };
}

interface LevelUpOverlayProps {
  levelName: string;
  levelEmoji: string;
  rewards: string[];
  onClose: () => void;
}

export function LevelUpOverlay({ levelName, levelEmoji, rewards, onClose }: LevelUpOverlayProps) {
  const { canvasRef, active, fire } = useConfetti();

  useEffect(() => {
    fire();
  }, []);

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-bg-base/90 p-4 backdrop-blur-md">
      {active && (
        <canvas
          ref={canvasRef}
          className="pointer-events-none fixed inset-0 z-[301]"
        />
      )}
      <div className="animate-slide-up relative z-[302] w-full max-w-md rounded-card border border-lime/40 bg-bg-surface p-8 text-center shadow-2xl">
        <div className="mx-auto mb-4 flex h-28 w-28 items-center justify-center rounded-full bg-lime/10 text-6xl animate-pulse-ring">
          {levelEmoji}
        </div>
        <h2 className="font-display text-2xl font-bold text-ink-primary">
          Subiste a nivel <span className="text-lime">{levelName}</span>
        </h2>
        <p className="mt-2 text-sm text-ink-muted">¡Felicitaciones! Desbloqueaste nuevas recompensas:</p>
        <div className="mt-4 space-y-2">
          {rewards.map((r) => (
            <div key={r} className="flex items-center gap-2 rounded-lg bg-lime/5 px-4 py-2 text-left">
              <span className="text-lime">✓</span>
              <span className="text-sm text-ink-primary">{r}</span>
            </div>
          ))}
        </div>
        <button
          onClick={onClose}
          className="mt-6 w-full rounded-pill bg-lime py-3 font-bold text-bg-base transition hover:bg-lime-dark"
        >
          ¡A seguir creciendo!
        </button>
      </div>
    </div>
  );
}

interface XpBurstProps {
  amount: number;
  onDone: () => void;
}

export function XpBurst({ amount, onDone }: XpBurstProps) {
  const { canvasRef, active, fire } = useConfetti();

  useEffect(() => {
    fire();
    const timer = setTimeout(onDone, 2500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {active && (
        <canvas
          ref={canvasRef}
          className="pointer-events-none fixed inset-0 z-[290]"
        />
      )}
      <div className="pointer-events-none fixed bottom-1/3 left-1/2 z-[291] -translate-x-1/2 animate-xp-fly">
        <span className="font-display text-4xl font-extrabold text-lime drop-shadow-[0_0_20px_rgba(202,255,0,0.6)]">
          +{amount} XP
        </span>
      </div>
    </>
  );
}
