import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  vr: number;
  w: number;
  h: number;
  color: string;
  life: number;
  round: boolean;
}

const COLORS = ['#0E7F8A', '#43B7C2', '#E8A64B', '#D98A24', '#F3F6F6'];
const MAX_MS = 6000;

/** Canvas burst that runs once on mount. Skipped under reduced-motion. */
export function Confetti() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const { innerWidth: w, innerHeight: h } = window;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    const particles: Particle[] = [];
    const burst = (x: number, y: number, dir: number) => {
      for (let i = 0; i < 90; i++) {
        const angle = -Math.PI / 2 + dir * (Math.random() * 0.7) + (Math.random() - 0.5) * 0.5;
        const speed = 7 + Math.random() * 8;
        particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          rot: Math.random() * Math.PI,
          vr: (Math.random() - 0.5) * 0.3,
          w: 5 + Math.random() * 6,
          h: 8 + Math.random() * 8,
          color: COLORS[i % COLORS.length]!,
          life: 150 + Math.random() * 80,
          round: Math.random() < 0.3,
        });
      }
    };

    let running = true;
    let raf = 0;
    burst(20, h * 0.9, 1);
    burst(w - 20, h * 0.9, -1);
    const third = window.setTimeout(() => {
      if (running) burst(w / 2, h * 0.85, Math.random() < 0.5 ? 1 : -1);
    }, 400);

    const start = performance.now();
    const frame = (t: number) => {
      if (!running) return;
      ctx.clearRect(0, 0, w, h);
      let alive = false;
      for (const p of particles) {
        if (p.life <= 0) continue;
        alive = true;
        p.vy += 0.16;
        p.vx *= 0.99;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vr;
        p.life--;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.globalAlpha = Math.min(1, p.life / 50);
        ctx.fillStyle = p.color;
        if (p.round) {
          ctx.beginPath();
          ctx.arc(0, 0, p.w / 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        }
        ctx.restore();
      }
      if (alive && t - start < MAX_MS) raf = requestAnimationFrame(frame);
      else running = false;
    };
    raf = requestAnimationFrame(frame);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.clearTimeout(third);
      ctx.clearRect(0, 0, w, h);
    };
  }, []);

  return <canvas id="cfx" ref={canvasRef} />;
}
