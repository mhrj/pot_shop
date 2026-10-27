'use client';

import Link from 'next/link';

import type { ColorOption } from '@/lib/product-features';
import { toFa } from '@/lib/format';

export type GlobalColorOption = {
  id: string;
  name: string;
  hexCode: string;
};

type Props = {
  globalColors: GlobalColorOption[];
  selectedColors?: ColorOption[];
  selectedHexes?: string[];
  onToggleColor: (hexCode: string) => void;
  onRemoveColor: (hexCode: string) => void;
  onUpdateStock?: (hexCode: string, stock: number) => void;
  compact?: boolean;
};

// Determine whether a color is light to show a dark border/checkmark
function isLightColor(hex: string): boolean {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16) || 0;
  const g = parseInt(clean.substring(2, 4), 16) || 0;
  const b = parseInt(clean.substring(4, 6), 16) || 0;
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 180;
}

export default function GlobalColorPicker({
  globalColors,
  selectedColors,
  selectedHexes,
  onToggleColor,
  onRemoveColor,
  onUpdateStock,
  compact = false,
}: Props) {
  if (globalColors.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-soil-900/15 bg-dust-50/50 p-4 text-xs text-soil-700/70">
        <span>هنوز رنگی در پالت سیستم ثبت نشده است. </span>
        <Link
          href="/admin/colors"
          target="_blank"
          className="font-bold text-flora-700 underline hover:text-flora-900 transition mr-1"
        >
          مدیریت و ثبت رنگ‌ها در پنل
        </Link>
      </div>
    );
  }

  const colorsList: ColorOption[] = selectedColors
    ? selectedColors
    : (selectedHexes ?? []).map((h) => ({ hexCode: h, stock: 0 }));

  // Find color name for each selected hex
  const hexMap = new Map<string, string>();
  for (const c of globalColors) {
    hexMap.set(c.hexCode.toUpperCase(), c.name);
  }

  return (
    <div className="space-y-3">
      {/* Clickable Swatch Palette */}
      <div>
        <span className="block text-[11px] font-medium text-soil-700/70 mb-2">
          برای فعال‌سازی یا حذف رنگ، روی آن کلیک کنید:
        </span>
        <div className="flex flex-wrap gap-2">
          {globalColors.map((color) => {
            const normalizedHex = color.hexCode.toUpperCase();
            const isSelected = colorsList.some(
              (c) => c.hexCode.toUpperCase() === normalizedHex,
            );
            const light = isLightColor(color.hexCode);

            return (
              <button
                key={color.id}
                type="button"
                onClick={() => onToggleColor(color.hexCode)}
                title={`${color.name} (${color.hexCode})`}
                aria-pressed={isSelected}
                className={`group flex items-center gap-2 rounded-xl border transition-all duration-150 cursor-pointer ${
                  compact ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-xs'
                } ${
                  isSelected
                    ? 'border-flora-600 bg-flora-50/80 text-flora-900 font-bold shadow-xs ring-2 ring-flora-600/30'
                    : 'border-soil-900/15 bg-white text-soil-800 hover:border-soil-900/30 hover:bg-dust-50'
                }`}
              >
                <span
                  className="relative size-4 sm:size-4.5 rounded-full border border-soil-900/20 shrink-0 shadow-2xs flex items-center justify-center"
                  style={{ backgroundColor: color.hexCode }}
                >
                  {light && (
                    <span className="absolute inset-0 rounded-full border border-soil-900/20 pointer-events-none" />
                  )}
                  {isSelected && (
                    <span
                      className={`text-[9px] font-black leading-none ${
                        light ? 'text-soil-900' : 'text-white'
                      }`}
                    >
                      ✓
                    </span>
                  )}
                </span>
                <span>{color.name}</span>
                <span className="font-mono text-[10px] text-soil-700/50 dir-ltr">
                  {color.hexCode}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Color Chips */}
      {colorsList.length > 0 && (
        <div className="pt-1">
          <span className="block text-[11px] font-bold text-soil-900 mb-1.5">
            رنگ‌های انتخاب‌شده ({toFa(colorsList.length)}):
          </span>
          <div className="flex flex-wrap gap-2">
            {colorsList.map((color, i) => {
              const name = hexMap.get(color.hexCode.toUpperCase()) || color.hexCode;
              return (
                <div
                  key={i}
                  className="flex flex-wrap items-center gap-2 rounded-xl border border-soil-900/10 bg-white px-3 py-1.5 text-xs shadow-2xs"
                >
                  <span
                    className="size-3.5 rounded-full border border-soil-900/20 shadow-xs shrink-0"
                    style={{ backgroundColor: color.hexCode }}
                  />
                  <span className="font-bold text-soil-900">{name}</span>
                  <span className="font-mono text-[10px] text-soil-700/60 dir-ltr">{color.hexCode}</span>

                  <div className="flex items-center gap-1.5 text-[11px] text-soil-700 font-medium border-r border-soil-900/10 pr-2 mr-1">
                    <label htmlFor={`color-stock-${color.hexCode.replace('#', '')}`}>
                      موجودی:
                    </label>
                    <input
                      id={`color-stock-${color.hexCode.replace('#', '')}`}
                      name={`colorStock_${color.hexCode.replace('#', '')}`}
                      type="number"
                      min={0}
                      value={color.stock}
                      onChange={(e) => {
                        const val = Math.max(0, Math.floor(Number(e.target.value) || 0));
                        onUpdateStock?.(color.hexCode, val);
                      }}
                      className="w-16 rounded-lg border border-soil-900/15 bg-dust-50/70 px-1.5 py-0.5 text-center text-xs font-bold text-soil-900 outline-none focus:border-flora-500 focus:bg-white focus:ring-1 focus:ring-flora-500"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => onRemoveColor(color.hexCode)}
                    className="text-red-500 hover:text-red-700 text-sm font-bold leading-none p-1 hover:bg-red-50 rounded"
                    title="حذف رنگ"
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
