import Image from 'next/image';
import Link from 'next/link';
import { formatToman, toFa } from '@/lib/format';
import { parseBundleItems, parseColorOptions, type ColorOption } from '@/lib/product-features';

export type ProductCardData = {
  id: string;
  name: string;
  slug: string;
  shortDesc?: string | null;
  material?: string | null;
  diameterCm?: number | null;
  basePriceToman: number;
  stock: number;
  bundleSize?: number | null;
  allowBatchDiscount?: boolean;
  bundleItems?: unknown;
  colorOptions?: unknown;
  images: Array<{ url: string; alt?: string | null }>;
  tiers?: Array<{ minQuantity: number; unitPriceToman: number; label?: string | null }>;
  tags?: Array<{ tag: { id: string; name: string } }>;
};

type Props = {
  product: ProductCardData;
  className?: string;
};

export default function ProductCard({ product, className = '' }: Props) {
  const soldOut = product.stock <= 0;
  const bundleSize = product.bundleSize && product.bundleSize > 1 ? product.bundleSize : 1;
  const isBundle = bundleSize > 1;

  // Tiers and pricing
  const tiers = product.tiers ?? [];
  const bestTier = tiers[0] ?? {
    minQuantity: 1,
    unitPriceToman: product.basePriceToman,
    label: 'خرده',
  };
  const hasTierDiscount =
    product.allowBatchDiscount !== false &&
    tiers.length > 1 &&
    tiers.some((t) => t.unitPriceToman < product.basePriceToman);

  // Extract color options (either on product root or collected from bundleItems)
  let colors: ColorOption[] = parseColorOptions(product.colorOptions, product.stock);
  if (colors.length === 0 && product.bundleItems) {
    const bItems = parseBundleItems(product.bundleItems);
    const seen = new Set<string>();
    for (const bi of bItems) {
      for (const c of bi.colorOptions ?? []) {
        if (c.hexCode && !seen.has(c.hexCode.toUpperCase())) {
          seen.add(c.hexCode.toUpperCase());
          colors.push(c);
        }
      }
    }
  }

  const visibleColors = colors.slice(0, 3);
  const remainingColors = colors.length - 3;

  return (
    <Link
      href={`/products/${product.slug}`}
      className={`group block overflow-hidden rounded-2xl md:rounded-3xl bg-white shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-soil-900/5 ${className}`}
    >
      {/* Product Image Wrapper */}
      <div className="relative aspect-square overflow-hidden bg-dust-100">
        {product.images[0] ? (
          <Image
            src={product.images[0].url}
            alt={product.images[0].alt ?? product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className={`object-cover transition-transform duration-500 group-hover:scale-105 ${
              soldOut ? 'grayscale opacity-70' : ''
            }`}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-dust-100 text-soil-700/30">
            <svg className="size-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}

        {/* Gradient Overlay for contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-black/5 pointer-events-none" />

        {/* Dynamic Badges (Start Corner) */}
        <div className="absolute top-2 start-2 md:top-3 md:start-3 flex flex-col gap-1 z-10">
          {isBundle && (
            <span className="rounded-lg md:rounded-xl bg-flora-900 text-white px-2 py-0.5 md:px-2.5 md:py-1 text-[10px] md:text-xs font-black shadow-xs">
              ست {toFa(bundleSize)} عددی
            </span>
          )}
          {hasTierDiscount && (
            <span className="rounded-lg md:rounded-xl bg-amber-600 text-white px-2 py-0.5 md:px-2.5 md:py-1 text-[10px] md:text-xs font-black shadow-xs">
              تخفیف عمده
            </span>
          )}
        </div>

        {/* Out of Stock Badge (End Corner) */}
        {soldOut && (
          <span className="absolute top-2 end-2 md:top-3 end-3 rounded-lg md:rounded-xl bg-soil-900/85 text-white px-2 py-0.5 md:px-2.5 md:py-1 text-[10px] md:text-xs font-black backdrop-blur-xs z-10">
            ناموجود
          </span>
        )}
      </div>

      {/* Product Details Content */}
      <div className="p-3 md:p-4.5">
        {/* Title */}
        <h3 className="text-sm md:text-base font-bold text-soil-900 transition-colors group-hover:text-flora-800 line-clamp-1 md:line-clamp-2">
          {product.name}
        </h3>

        {/* Description or Material specs */}
        {(product.shortDesc || product.material) && (
          <p className="mt-1 text-[11px] md:text-xs text-soil-700/70 line-clamp-1">
            {product.shortDesc || product.material}
            {product.diameterCm ? ` · قطر ${toFa(product.diameterCm)} سانتی‌متر` : ''}
          </p>
        )}

        {/* Color Swatches */}
        {visibleColors.length > 0 && (
          <div className="mt-2 flex items-center gap-1.5">
            <div className="flex items-center -space-x-1 space-x-reverse">
              {visibleColors.map((c, i) => (
                <span
                  key={i}
                  className="size-3 md:size-3.5 rounded-full border border-white shadow-2xs shrink-0 ring-1 ring-soil-900/10"
                  style={{ backgroundColor: c.hexCode }}
                  title={c.hexCode}
                />
              ))}
            </div>
            {remainingColors > 0 && (
              <span className="text-[10px] md:text-xs text-soil-700/60 font-medium">
                +{toFa(remainingColors)} رنگ
              </span>
            )}
          </div>
        )}

        {/* Price & Label Row */}
        <div className="mt-3 md:mt-4 flex items-end justify-between gap-2 border-t border-soil-900/5 pt-2 md:pt-3">
          <div>
            <div className="text-base md:text-lg font-black text-flora-900">
              {formatToman(bestTier.unitPriceToman)}
            </div>
            <div className="text-[10px] md:text-[11px] text-soil-700/60">
              {isBundle
                ? `قیمت هر ست`
                : bestTier.minQuantity > 1
                  ? `از ${toFa(bestTier.minQuantity)} عدد`
                  : '/ هر عدد'}
            </div>
          </div>

          {bestTier.label && (
            <span className="rounded-md md:rounded-lg bg-dust-100 px-2 py-0.5 md:px-2.5 md:py-1 text-[10px] md:text-xs font-bold text-soil-700">
              {bestTier.label}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
