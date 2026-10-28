import { toFa, formatToman } from '@/lib/format';
import { parseBundleItems, type BundleItem } from '@/lib/product-features';

type Props = {
  bundleSize: number;
  bundleCount?: number;
  colorData?: unknown;
  productBundleItems?: unknown;
  className?: string;
};

const DEFAULT_COLOR_NAMES: Record<string, string> = {
  '#000000': 'مشکی',
  '#1F1F1F': 'مشکی',
  '#111111': 'مشکی',
  '#222222': 'مشکی',
  '#FFFFFF': 'سفید',
  '#FAFAFA': 'سفید',
  '#F5F5F5': 'سفید',
  '#C86A4B': 'تراکوتا',
  '#D3D3D3': 'طوسی روشن',
  '#808080': 'طوسی',
  '#8B8B8B': 'طوسی',
  '#A9A9A9': 'طوسی تیره',
  '#E8D8C8': 'خاکی / کرم',
  '#F5F5DC': 'کرم',
  '#7A8B7B': 'سبز صدری',
  '#4A3525': 'قهوه‌ای سوخته',
  '#8D5B4C': 'قهوه‌ای',
  '#8B4513': 'قهوه‌ای',
  '#A52A2A': 'قهوه‌ای',
  '#E0A899': 'گلبهی',
  '#F5EBE6': 'استخوانی',
  '#FF0000': 'قرمز',
  '#0000FF': 'آبی',
  '#008000': 'سبز',
  '#FFFF00': 'زرد',
  '#FFA500': 'نارنجی',
  '#800080': 'بنفش',
  '#FFC0CB': 'صورتی',
  '#D4AF37': 'طلایی',
  '#C0C0C0': 'نقره‌ای',
};

function getColorName(hex: string, explicitName?: string): string {
  if (explicitName && explicitName.trim()) return explicitName.trim();
  const normalized = hex.trim().toUpperCase();
  return DEFAULT_COLOR_NAMES[normalized] || '';
}

function parseItemColorData(raw: unknown): {
  color?: string;
  selectedColor?: { hexCode: string; name?: string };
  bundleColors?: Record<string, string | { hexCode?: string; name?: string }>;
  bundleItems?: unknown;
} {
  if (!raw) return {};
  let parsed = raw;
  if (typeof raw === 'string') {
    try {
      parsed = JSON.parse(raw);
    } catch {
      return { color: raw };
    }
  }
  if (typeof parsed !== 'object' || parsed === null) return {};
  return parsed as any;
}

export default function BundleDetailsAccordion({
  bundleSize,
  bundleCount = 1,
  colorData,
  productBundleItems,
  className = '',
}: Props) {
  if (bundleSize <= 1) return null;

  const count = Math.max(1, bundleCount);

  const parsedColorData = parseItemColorData(colorData);

  // 1. Get bundle items from snapshot inside colorData or fallback to productBundleItems
  let itemsList: BundleItem[] = [];
  if (parsedColorData.bundleItems) {
    itemsList = parseBundleItems(parsedColorData.bundleItems);
  }
  if (itemsList.length === 0 && productBundleItems) {
    itemsList = parseBundleItems(productBundleItems);
  }

  // 2. If still empty, construct placeholders matching bundleSize
  if (itemsList.length === 0) {
    itemsList = Array.from({ length: bundleSize }, (_, idx) => ({
      title: `گلدان شماره ${toFa(idx + 1)}`,
      material: '',
      diameterCm: 0,
      heightCm: 0,
      weightGrams: 0,
    }));
  }

  // 3. Extract selected bundle colors map
  const rawBundleColors = parsedColorData.bundleColors ?? {};
  const bundleColors: Record<string, { hex: string; name?: string }> = {};
  for (const [k, v] of Object.entries(rawBundleColors)) {
    if (typeof v === 'string' && v.trim()) {
      bundleColors[k] = { hex: v.trim() };
    } else if (v && typeof v === 'object') {
      const hex = typeof (v as any).hexCode === 'string' ? (v as any).hexCode.trim() : '';
      const name = typeof (v as any).name === 'string' ? (v as any).name.trim() : undefined;
      if (hex) {
        bundleColors[k] = { hex, name };
      }
    }
  }

  return (
    <details className={`group mt-2 rounded-xl border border-soil-900/10 bg-dust-50/60 p-2.5 text-xs transition dark:border-dust-50/10 dark:bg-flora-950/60 print:mt-0.5 print:p-0 print:border-none print:bg-transparent print:text-[9px] ${className}`}>
      <summary className="flex cursor-pointer select-none items-center justify-between font-bold text-soil-800 hover:text-flora-800 dark:text-dust-200 dark:hover:text-flora-300 list-none [&::-webkit-details-marker]:hidden print:text-[9px]">
        <span className="flex items-center gap-1.5">
          <svg
            className="size-3.5 text-soil-500 transition-transform duration-200 group-open:rotate-180 dark:text-dust-400 print:hidden"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
          </svg>
          <span className="text-xs print:text-[9px]">مشاهده جزئیات این بسته</span>
        </span>
        <span className="text-[11px] font-normal text-soil-700/60 group-open:hidden dark:text-dust-200/60 print:inline print:text-[9px]">
          ({toFa(itemsList.length)} قلم)
        </span>
      </summary>

      <div className="mt-2.5 space-y-1.5 border-t border-soil-900/10 pt-2.5 dark:border-dust-50/10 print:hidden">
        {itemsList.map((bItem, idx) => {
          const chosen = bundleColors[idx] ?? bundleColors[String(idx)];
          const hex = chosen?.hex || null;
          const explicitName = chosen?.name;
          const colorName = hex ? getColorName(hex, explicitName) : '';

          const dimParts: string[] = [];
          if (bItem.diameterCm) dimParts.push(`قطر ${toFa(bItem.diameterCm)}`);
          if (bItem.heightCm) dimParts.push(`ارتفاع ${toFa(bItem.heightCm)}`);
          const dimsText = dimParts.length > 0 ? `(${dimParts.join(' × ')} سانتی‌متر)` : null;

          const effectiveWeight = (bItem.weightGrams || 0) * count;
          const rawPrice = bItem.price ?? bItem.priceToman ?? 0;
          const effectivePrice = rawPrice * count;

          return (
            <div
              key={idx}
              className="flex items-center justify-between gap-3 rounded-lg border border-soil-900/5 bg-white/90 px-2.5 py-1.5 dark:border-dust-50/10 dark:bg-flora-900/90"
            >
              <div className="flex items-center gap-2 flex-wrap min-w-0">
                <span className="flex size-4.5 items-center justify-center rounded-full bg-soil-100 text-[10px] font-bold text-soil-700 shrink-0 dark:bg-flora-900 dark:text-dust-300 border border-transparent dark:border-dust-50/10">
                  {toFa(idx + 1)}
                </span>
                <span className="font-bold text-soil-900 truncate dark:text-dust-50">
                  {bItem.title || `گلدان شماره ${toFa(idx + 1)}`}
                </span>
                {dimsText && (
                  <span className="text-[11px] text-soil-700/60 dark:text-dust-200/60">
                    {dimsText}
                  </span>
                )}
                {bItem.material && (
                  <span className="text-[11px] text-soil-700/60 dark:text-dust-200/60">
                    · جنس: {bItem.material}
                  </span>
                )}
                {effectiveWeight > 0 && (
                  <span className="text-[11px] text-soil-700/60 dark:text-dust-200/60">
                    · وزن: {toFa(effectiveWeight)} گرم{count > 1 ? ` (${toFa(count)} بسته)` : ''}
                  </span>
                )}
                {effectivePrice > 0 && (
                  <span className="text-[11px] text-soil-700/60 dark:text-dust-200/60">
                    · ارزش: {formatToman(effectivePrice)}{count > 1 ? ` (${toFa(count)} بسته)` : ''}
                  </span>
                )}
              </div>

              {hex ? (
                <div className="flex items-center gap-1.5 shrink-0 bg-dust-50 px-2 py-0.5 rounded-md border border-soil-900/10 dark:bg-flora-950 dark:border-dust-50/10">
                  <span className="text-[11px] text-soil-700/70 dark:text-dust-200/70">رنگ:</span>
                  <span
                    className="size-3.5 rounded-full border border-soil-900/20 shadow-2xs shrink-0 dark:border-dust-50/20"
                    style={{ backgroundColor: hex }}
                    title={colorName ? `${colorName} (${hex})` : hex}
                  />
                  {colorName ? (
                    <span className="text-xs font-bold text-soil-900 dark:text-dust-50">
                      {colorName}
                    </span>
                  ) : null}
                  <span className="font-mono text-[11px] font-bold text-soil-700 dark:text-dust-200" dir="ltr">
                    {hex}
                  </span>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </details>
  );
}
