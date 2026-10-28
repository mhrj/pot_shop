"use client";

import { useEffect, useRef } from "react";
import type { MotionValue } from "framer-motion";

export type BotanicalVariant = "dust" | "flora" | "auto";

export type BotanicalCanvasProps = {
  active?: boolean;
  variant?: BotanicalVariant;
  progress?: MotionValue<number> | number;
};

type Particle = {
  x: number;
  y: number;
  r: number;
  vy: number;
  vx: number;
  rot: number;
  vr: number;
  hue: number;
  targetHue: number;
  alpha: number;
  targetAlpha: number;
  lightness: number;
  targetLightness: number;
  saturation: number;
  targetSaturation: number;
};

function getColorTargets(effectiveVariant: "dust" | "flora", isDark: boolean) {
  if (isDark) {
    // Dark Mode: Force lighter, glowing green particles (hue: 150, alpha: 0.3 to 0.6)
    return {
      hue: 150,
      alpha: 0.3 + Math.random() * 0.3,
      lightness: 68 + Math.random() * 8,
      saturation: 75 + Math.random() * 15,
    };
  }

  if (effectiveVariant === "dust") {
    // Warm colors (hue: 20 to 40, e.g. orange/brown terracotta)
    return {
      hue: 20 + Math.random() * 20,
      alpha: 0.22 + Math.random() * 0.32,
      lightness: 50 + Math.random() * 10,
      saturation: 58 + Math.random() * 18,
    };
  }

  // 'flora': Vibrant greens (hue: 130 to 150)
  return {
    hue: 130 + Math.random() * 20,
    alpha: 0.22 + Math.random() * 0.35,
    lightness: 46 + Math.random() * 12,
    saturation: 52 + Math.random() * 20,
  };
}

function resolveEffectiveVariant(
  variant: BotanicalVariant,
  progressVal: number | undefined,
): "dust" | "flora" {
  if (variant === "dust") return "dust";
  if (variant === "flora") return "flora";

  // 'auto'
  let p: number;
  if (typeof progressVal === "number") {
    p = progressVal;
  } else if (typeof window !== "undefined") {
    const scrollMax = Math.max(
      1,
      document.documentElement.scrollHeight - window.innerHeight,
    );
    p = window.scrollY / scrollMax;
  } else {
    p = 0;
  }
  return p > 0.3 ? "flora" : "dust";
}

/**
 * BotanicalCanvas:
 * Lightweight floating botanical particles with dynamic dust/flora palette shifting
 * and radiant glowing mint/emerald particles in Dark Mode.
 */
export default function BotanicalCanvas({
  active = true,
  variant = "auto",
  progress,
}: BotanicalCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const particlesRef = useRef<Particle[]>([]);

  const variantRef = useRef(variant);
  variantRef.current = variant;

  const progressRef = useRef(progress);
  progressRef.current = progress;

  const syncColorsRef = useRef<() => void>(() => {});

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !active) return;

    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduce) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    let w = 0;
    let h = 0;
    let visible = true;

    let isDark = document.documentElement.classList.contains("dark");
    let currentVariant = resolveEffectiveVariant(
      variantRef.current,
      typeof progressRef.current === "number"
        ? progressRef.current
        : progressRef.current?.get?.(),
    );

    const syncColors = () => {
      const nextDark = document.documentElement.classList.contains("dark");
      const nextVariant = resolveEffectiveVariant(
        variantRef.current,
        typeof progressRef.current === "number"
          ? progressRef.current
          : progressRef.current?.get?.(),
      );

      isDark = nextDark;
      currentVariant = nextVariant;

      for (const p of particlesRef.current) {
        const c = getColorTargets(currentVariant, isDark);
        p.targetHue = c.hue;
        p.targetAlpha = c.alpha;
        p.targetLightness = c.lightness;
        p.targetSaturation = c.saturation;
      }
    };
    syncColorsRef.current = syncColors;

    const isMobile = window.innerWidth < 768;
    const COUNT = isMobile ? 10 : 16;

    const seed = () => {
      isDark = document.documentElement.classList.contains("dark");
      currentVariant = resolveEffectiveVariant(
        variantRef.current,
        typeof progressRef.current === "number"
          ? progressRef.current
          : progressRef.current?.get?.(),
      );

      particlesRef.current = Array.from({ length: COUNT }, () => {
        const c = getColorTargets(currentVariant, isDark);
        return {
          x: Math.random() * w,
          y: Math.random() * h,
          r: 2 + Math.random() * 5,
          vy: -(0.05 + Math.random() * 0.15),
          vx: (Math.random() - 0.5) * 0.1,
          rot: Math.random() * Math.PI * 2,
          vr: (Math.random() - 0.5) * 0.012,
          hue: c.hue,
          targetHue: c.hue,
          alpha: c.alpha,
          targetAlpha: c.alpha,
          lightness: c.lightness,
          targetLightness: c.lightness,
          saturation: c.saturation,
          targetSaturation: c.saturation,
        };
      });
    };

    const resize = () => {
      w = canvas.clientWidth || window.innerWidth;
      h = canvas.clientHeight || window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
    };

    const drawLeaf = (p: Particle) => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.beginPath();
      ctx.ellipse(0, 0, p.r, p.r * 0.42, 0, 0, Math.PI * 2);

      if (isDark) {
        ctx.shadowColor = "hsla(150, 85%, 65%, 0.45)";
        ctx.shadowBlur = 8;
      }

      ctx.fillStyle = `hsla(${p.hue}, ${p.saturation}%, ${p.lightness}%, ${p.alpha})`;
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

        // Smooth color interpolation on scroll / dark mode change
        p.hue += (p.targetHue - p.hue) * 0.04;
        p.alpha += (p.targetAlpha - p.alpha) * 0.04;
        p.lightness += (p.targetLightness - p.lightness) * 0.04;
        p.saturation += (p.targetSaturation - p.saturation) * 0.04;

        if (p.y < -30) {
          p.y = h + 20;
          p.x = Math.random() * w;
          const c = getColorTargets(currentVariant, isDark);
          p.hue = c.hue;
          p.targetHue = c.hue;
          p.alpha = c.alpha;
          p.targetAlpha = c.alpha;
          p.lightness = c.lightness;
          p.targetLightness = c.lightness;
          p.saturation = c.saturation;
          p.targetSaturation = c.saturation;
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
      { rootMargin: "120px" },
    );

    const onVisibility = () => {
      visible = !document.hidden;
      if (visible && rafRef.current === null) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    // Dark Mode detection via MutationObserver
    const themeObserver = new MutationObserver(() => {
      syncColors();
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    // Window scroll handler for variant='auto' when no MotionValue is supplied
    const onScroll = () => {
      if (variantRef.current === "auto") {
        syncColors();
      }
    };

    resize();
    io.observe(canvas);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("resize", resize, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    rafRef.current = requestAnimationFrame(tick);

    // MotionValue listener if progress is a Framer Motion value
    let unsubscribeMotion: (() => void) | undefined;
    const p = progressRef.current;
    if (p && typeof (p as MotionValue<number>).on === "function") {
      unsubscribeMotion = (p as MotionValue<number>).on("change", () => {
        syncColors();
      });
    }

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      io.disconnect();
      themeObserver.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("resize", resize);
      window.removeEventListener("scroll", onScroll);
      if (unsubscribeMotion) unsubscribeMotion();
    };
  }, [active]);

  useEffect(() => {
    syncColorsRef.current();
  }, [variant, progress]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full [contain:strict]"
    />
  );
}
