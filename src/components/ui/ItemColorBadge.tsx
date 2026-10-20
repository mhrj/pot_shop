import { toFa } from '@/lib/format';

type Props = {
  colorData?: unknown;
  className?: string;
};

export default function ItemColorBadge({ colorData, className = '' }: Props) {
  if (!colorData) return null;

  let singleColor: string | null = null;
  let bundleColors: Record<string, string> | null = null;

  if (typeof colorData === 'string') {
    singleColor = colorData;
  } else if (typeof colorData === 'object' && colorData !== null) {
    const data = colorData as Record<string, unknown>;
    if (typeof data.color === 'string') {
      singleColor = data.color;
    }
    if (typeof data.bundleColors === 'object' && data.bundleColors !== null) {
      bundleColors = data.bundleColors as Record<string, string>;
    }
  }

  if (bundleColors && Object.keys(bundleColors).length > 0) {
    return (
      <div className={`flex flex-wrap items-center gap-1.5 text-[11px] text-soil-700 ${className}`}>
        <span className="text-[10px] text-soil-700/60 font-medium">رنگ‌ها:</span>
        {Object.entries(bundleColors).map(([idx, hex]) => {
          const num = Number(idx);
          const label = !isNaN(num) ? `گلدان ${toFa(num + 1)}` : idx;
          return (
            <span
              key={idx}
              className="inline-flex items-center gap-1 rounded-md border border-soil-900/10 bg-dust-50 px-1.5 py-0.5"
            >
              <span className="text-[10px]">{label}:</span>
              <span
                className="size-2.5 rounded-full border border-soil-900/20 shadow-2xs shrink-0"
                style={{ backgroundColor: hex }}
                title={hex}
              />
            </span>
          );
        })}
      </div>
    );
  }

  if (singleColor) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 text-xs text-soil-700/80 ${className}`}
      >
        <span
          className="size-3.5 rounded-full border border-soil-900/20 shadow-2xs shrink-0"
          style={{ backgroundColor: singleColor }}
          title={singleColor}
        />
        <span className="font-mono text-[11px] dir-ltr font-bold text-soil-800">
          {singleColor}
        </span>
      </span>
    );
  }

  return null;
}
