'use client';

import { useEffect, useRef } from 'react';

type Particle = {
  x: number;
  y: number;
  r: number;
  vy: number;
  vx: number;
  rot: number;
  vr: number;
  hue: number;
  alpha: number;
};

/**
 * Lightweight floating leaf particles -- no library, auto-pauses off-screen.
 * Reduces particle count on mobile and caps DPR for older devices.
 */
export default function BotanicalCanvas({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const particlesRef = useRef<Particle[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !active) return;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    let w = 0;
    let h = 0;
    let visible = true;

    const resize = () => {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
    };

    const isMobile = window.innerWidth < 768;
    const COUNT = isMobile ? 16 : 34;

    const seed = () => {
      particlesRef.current = Array.from({ length: COUNT }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: 3 + Math.random() * 9,
        vy: -(0.12 + Math.random() * 0.4),
        vx: (Math.random() - 0.5) * 0.25,
        rot: Math.random() * Math.PI * 2,
        vr: (Math.random() - 0.5) * 0.012,
        hue: 130 + Math.random() * 45,
        alpha: 0.18 + Math.random() * 0.4,
      }));
    };

    const drawLeaf = (p: Particle) => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.beginPath();
      ctx.ellipse(0, 0, p.r, p.r * 0.42, 0, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${p.hue}, 42%, 58%, ${p.alpha})`;
      ctx.fill();
      ctx.restore();
    };

    const tick = () => {
      if (!visible) {
        rafRef.current = null;
        return;
      }
      ctx.clearRect(0, 0, w, h);
      for (const p of particlesRef.current) {
        p.y += p.vy;
        p.x += p.vx + Math.sin((p.y + p.r * 10) * 0.01) * 0.22;
        p.rot += p.vr;
        if (p.y < -30) {
          p.y = h + 20;
          p.x = Math.random() * w;
        }
        if (p.x < -30) p.x = w + 20;
        if (p.x > w + 30) p.x = -20;
        drawLeaf(p);
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible && rafRef.current === null) {
          rafRef.current = requestAnimationFrame(tick);
        }
      },
      { rootMargin: '120px' },
    );

    const onVisibility = () => {
      visible = !document.hidden;
      if (visible && rafRef.current === null) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    resize();
    io.observe(canvas);
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('resize', resize, { passive: true });
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      io.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('resize', resize);
    };
  }, [active]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full [contain:strict]"
    />
  );
}
