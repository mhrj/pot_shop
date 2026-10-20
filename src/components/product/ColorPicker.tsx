'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { toFa } from '@/lib/format';
import { useProductColor } from './ProductColorContext';
import type { BundleItem } from '@/lib/product-features';

type Props = {
  product: {
    id: string;
    name: string;
    colorOptions?: string[] | null;
    bundleSize?: number;
  };
  bundleItems?: BundleItem[] | null;
};

// Check if color is light to show dark checkmark or darker border
function isLightColor(hex: string): boolean {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16) || 0;
  const g = parseInt(clean.substring(2, 4), 16) || 0;
  const b = parseInt(clean.substring(4, 6), 16) || 0;
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 180;
}

function ColorSwatchRow({
  label,
  colors,
  selectedColor,
  onSelect,
  required = false,
}: {
  label: string;
  colors: string[];
  selectedColor: string | null;
  onSelect: (color: string) => void;
  required?: boolean;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollStart, setCanScrollStart] = useState(false);
  const [canScrollEnd, setCanScrollEnd] = useState(false);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;

    const maxScroll = el.scrollWidth - el.clientWidth;
    if (maxScroll <= 1) {
      setCanScrollStart(false);
      setCanScrollEnd(false);
      return;
    }

    // In RTL containers:
    // Some browsers have scrollLeft = 0 at initial right-aligned start, and negative values when scrolling left.
    // Others have positive values or inverted numbers.
    const scrollVal = Math.abs(el.scrollLeft);
    setCanScrollStart(scrollVal > 5);
    setCanScrollEnd(scrollVal < maxScroll - 5);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    checkScroll();
    el.addEventListener('scroll', checkScroll, { passive: true });
    window.addEventListener('resize', checkScroll);

    return () => {
      el.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [checkScroll, colors]);

  const handleScroll = (direction: 'next' | 'prev') => {
    const el = scrollRef.current;
    if (!el) return;

    // In RTL: "next" (further in Persian reading direction) moves towards the left (negative delta)
    const step = 140;
    const delta = direction === 'next' ? -step : step;
    el.scrollBy({ left: delta, behavior: 'smooth' });
  };

  if (!colors.length) return null;

  return (
    <div className="rounded-2xl border border-soil-900/10 bg-white p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-soil-900">{label}</span>
          {required && !selectedColor && (
            <span className="text-[11px] font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
              انتخاب الزامی است
            </span>
          )}
        </div>
        {selectedColor && (
          <div className="flex items-center gap-1.5 text-xs text-soil-700/80">
            <span>انتخاب:</span>
            <span
              className="inline-block size-3.5 rounded-full border border-soil-900/20 shadow-2xs"
              style={{ backgroundColor: selectedColor }}
            />
            <span className="font-mono text-[11px] dir-ltr text-soil-900 font-bold">
              {selectedColor}
            </span>
          </div>
        )}
      </div>

      <div className="relative flex items-center gap-2">
        {/* Right Arrow (Scroll towards previous/start in RTL) */}
        <button
          type="button"
          onClick={() => handleScroll('prev')}
          disabled={!canScrollStart}
          aria-label="رنگ‌های قبلی"
          className="size-8 shrink-0 rounded-full border border-soil-900/15 bg-white grid place-items-center text-soil-700 shadow-2xs transition hover:bg-dust-100 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Scrollable Swatches Container */}
        <div
          ref={scrollRef}
          className="flex flex-1 items-center gap-3 overflow-x-auto py-1.5 px-1 scroll-smooth no-scrollbar"
        >
          {colors.map((hex) => {
            const isSelected = selectedColor?.toUpperCase() === hex.toUpperCase();
            const light = isLightColor(hex);

            return (
              <button
                key={hex}
                type="button"
                onClick={() => onSelect(hex)}
                title={hex}
                aria-label={`رنگ ${hex}`}
                aria-pressed={isSelected}
                className={`group relative size-9 sm:size-10 shrink-0 rounded-full transition-all duration-150 focus:outline-none ${
                  isSelected
                    ? 'ring-2 ring-flora-700 ring-offset-2 scale-110 shadow-md'
                    : 'hover:scale-105 border border-soil-900/20 hover:border-soil-900/40 shadow-xs'
                }`}
                style={{ backgroundColor: hex }}
              >
                {/* Subtle border for very light colors so they are distinct against white background */}
                {light && !isSelected && (
                  <span className="absolute inset-0 rounded-full border border-soil-900/25 pointer-events-none" />
                )}

                {/* Checkmark indicator when selected */}
                {isSelected && (
                  <span
                    className={`absolute inset-0 flex items-center justify-center font-bold text-xs ${
                      light ? 'text-soil-900' : 'text-white'
                    }`}
                  >
                    ✓
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Left Arrow (Scroll towards next/end in RTL) */}
        <button
          type="button"
          onClick={() => handleScroll('next')}
          disabled={!canScrollEnd}
          aria-label="رنگ‌های بعدی"
          className="size-8 shrink-0 rounded-full border border-soil-900/15 bg-white grid place-items-center text-soil-700 shadow-2xs transition hover:bg-dust-100 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default function ColorPicker({ product, bundleItems }: Props) {
  const colorContext = useProductColor();
  const isBundle = (product.bundleSize ?? 1) > 1 || (bundleItems && bundleItems.length > 0);

  // If Context isn't wrapping this component, keep internal fallback
  const [internalSingleColor, setInternalSingleColor] = useState<string | null>(null);
  const [internalBundleColors, setInternalBundleColors] = useState<Record<number, string>>({});

  const selectedColor = colorContext ? colorContext.selectedColor : internalSingleColor;
  const setSelectedColor = colorContext ? colorContext.setSelectedColor : setInternalSingleColor;

  const selectedBundleColors = colorContext
    ? colorContext.selectedBundleColors
    : internalBundleColors;
  const setSelectedBundleColor = colorContext
    ? colorContext.setSelectedBundleColor
    : (idx: number, c: string) => setInternalBundleColors((prev) => ({ ...prev, [idx]: c }));

  const singleColors = product.colorOptions ?? [];
  const items = bundleItems ?? [];

  // TASK 3: If the product is a bundle, do NOT show a single row of swatches.
  // Instead, map through bundleItems and render a separate row of color swatches for each item.
  if (isBundle) {
    if (items.length === 0) return null;

    // Check if any bundle item has colorOptions
    const hasAnyColors = items.some(
      (it) => (it.colorOptions && it.colorOptions.length > 0) || singleColors.length > 0,
    );
    if (!hasAnyColors) return null;

    return (
      <section className="mt-6 space-y-3">
        <h3 className="text-sm font-black text-soil-900">
          انتخاب رنگ اقلام بسته ({toFa(items.length)} آیتم)
        </h3>
        <p className="text-xs text-soil-700/70">
          برای هر گلدان موجود در این بسته، رنگ مورد نظر خود را مشخص کنید:
        </p>

        <div className="space-y-3">
          {items.map((item, idx) => {
            // Use item's specific colorOptions, or fall back to package-level colorOptions
            const itemColors =
              item.colorOptions && item.colorOptions.length > 0
                ? item.colorOptions
                : singleColors;

            if (itemColors.length === 0) {
              return (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-xl border border-soil-900/10 bg-dust-50/60 p-3 text-xs"
                >
                  <span className="font-bold text-soil-900">
                    رنگ گلدان {toFa(idx + 1)}{item.title ? `: ${item.title}` : ''}
                  </span>
                  <span className="text-soil-700/60">تک‌رنگ استاندارد (پیش‌فرض)</span>
                </div>
              );
            }

            return (
              <ColorSwatchRow
                key={idx}
                label={`رنگ گلدان ${toFa(idx + 1)}${item.title ? `: ${item.title}` : ''}`}
                colors={itemColors}
                selectedColor={selectedBundleColors[idx] ?? null}
                onSelect={(hex) => setSelectedBundleColor(idx, hex)}
                required
              />
            );
          })}
        </div>
      </section>
    );
  }

  // TASK 2: Frontend UI (Single Product)
  if (!singleColors.length) return null;

  return (
    <section className="mt-6">
      <ColorSwatchRow
        label="انتخاب رنگ گلدان"
        colors={singleColors}
        selectedColor={selectedColor}
        onSelect={setSelectedColor}
      />
    </section>
  );
}
