import type { BundleItem } from './product-features';
import { toFa } from './format';

/**
 * Tiered pricing engine -- the single source of truth for price.
 * Never trust a price sent from the client.
 */

export type Tier = {
  minQuantity: number;
  unitPriceToman: number;
  label?: string | null;
};

export type PricedLine = {
  productId: string;
  slug: string;
  sku?: string | null;
  name: string;
  imageUrl?: string | null;
  quantity: number;
  bundleSize: number;
  bundleLabel?: string | null;
  bundleItems?: BundleItem[] | null;

  listUnitToman: number;
  unitToman: number;
  lineTotalToman: number;
  lineSavingsToman: number;
  savingsPercent: number;

  weightGrams: number;
  lineWeightGrams: number;

  unitsPerCarton: number;
  cartons: number;

  tierLabel: string;
  nextTier?: {
    minQuantity: number;
    unitPriceToman: number;
    saveMoreToman: number;
  } | null;
  colorData?: unknown;
};

export type CartTotals = {
  lines: PricedLine[];
  totalQuantity: number;
  subtotalToman: number;
  payableToman: number;
  discountToman: number;
  totalWeightGrams: number;
  totalCartons: number;
  channel: 'RETAIL' | 'BATCH' | 'WHOLESALE';
};

const CHANNEL_LABEL: Record<string, string> = {
  RETAIL: 'خرده‌فروشی',
  BATCH: 'بسته‌ای',
  WHOLESALE: 'عمده',
};

export const DEFAULT_TIERS: Tier[] = [
  { minQuantity: 1, unitPriceToman: 150000, label: 'خرده' },
  { minQuantity: 5, unitPriceToman: 127500, label: 'بسته‌ای' },
  { minQuantity: 20, unitPriceToman: 105000, label: 'عمده' },
];

export function resolveTier(
  tiers: Tier[] | null | undefined,
  qty: number,
  fallbackUnitPrice: number = 0,
): Tier {
  if (!tiers || !tiers.length) {
    return { minQuantity: 1, unitPriceToman: fallbackUnitPrice, label: 'تک‌فروشی' };
  }
  const sorted = [...tiers].sort((a, b) => a.minQuantity - b.minQuantity);
  let active = sorted[0];
  for (const t of sorted) if (qty >= t.minQuantity) active = t;
  return active;
}

export function resolveUnitPrice(tiers: Tier[] | null | undefined, qty: number, fallbackUnitPrice = 0): number {
  return resolveTier(tiers, qty, fallbackUnitPrice).unitPriceToman;
}

export function nextTierHint(tiers: Tier[] | null | undefined, qty: number) {
  if (!tiers || !tiers.length) return null;
  const sorted = [...tiers].sort((a, b) => a.minQuantity - b.minQuantity);
  const current = resolveTier(sorted, qty);
  const next = sorted.find((t) => t.minQuantity > qty);
  if (!next) return null;
  return {
    minQuantity: next.minQuantity,
    unitPriceToman: next.unitPriceToman,
    saveMoreToman: (current.unitPriceToman - next.unitPriceToman) * next.minQuantity,
  };
}

export function resolveChannel(totalQty: number): CartTotals['channel'] {
  if (totalQty >= 20) return 'WHOLESALE';
  if (totalQty >= 5) return 'BATCH';
  return 'RETAIL';
}

type PriceInput = {
  product: {
    id: string;
    slug: string;
    sku?: string | null;
    name: string;
    basePriceToman: number;
    salePriceToman?: number | null;
    weightGrams: number;
    unitsPerCarton?: number;
    bundleSize?: number;
    bundleItems?: BundleItem[] | null;
    images?: { url: string }[];
    allowBatchDiscount?: boolean;
  };
  tiers: Tier[];
  quantity: number;
  colorData?: unknown;
};

export function priceLine({ product, tiers, quantity, colorData }: PriceInput): PricedLine {
  const bundleSize = Math.max(1, product.bundleSize ?? 1);
  const isBundle = bundleSize > 1;
  const qty = Math.max(bundleSize, Math.floor(quantity));
  const allowBatch = product.allowBatchDiscount !== false;

  const hasSale =
    typeof product.salePriceToman === 'number' &&
    product.salePriceToman > 0 &&
    product.salePriceToman < product.basePriceToman;
  const effectiveBasePrice = hasSale ? product.salePriceToman! : product.basePriceToman;

  const bundleCount = isBundle ? Math.max(1, Math.round(qty / bundleSize)) : qty;
  const baseUnitPrice = Math.round(product.basePriceToman / bundleSize);
  const listUnitToman = baseUnitPrice;
  const singleBundleWeight = isBundle && product.bundleItems && product.bundleItems.length > 0
    ? (product.bundleItems.reduce((sum, item) => sum + (item.weightGrams || 0), 0) || product.weightGrams)
    : product.weightGrams;
  const lineWeightGrams = isBundle ? singleBundleWeight * bundleCount : product.weightGrams * qty;
  const cartons = Math.ceil(qty / Math.max(1, product.unitsPerCarton ?? 1));
  const bundleLabel = isBundle ? `ست ${toFa(bundleSize)} عددی` : null;

  // If allowBatchDiscount is false, unit price is based on effectiveBasePrice
  if (!allowBatch) {
    const unitToman = isBundle ? Math.round(effectiveBasePrice / bundleSize) : effectiveBasePrice;
    const lineTotalToman = isBundle
      ? Math.round(effectiveBasePrice * (qty / bundleSize))
      : unitToman * qty;
    const lineSavingsToman = Math.max(0, (listUnitToman - unitToman) * qty);
    const savingsPercent =
      listUnitToman > 0 ? Math.round(((listUnitToman - unitToman) / listUnitToman) * 100) : 0;

    return {
      productId: product.id,
      slug: product.slug,
      name: product.name,
      imageUrl: product.images?.[0]?.url ?? null,
      quantity: qty,
      bundleSize,
      bundleLabel,
      bundleItems: product.bundleItems ?? null,
      listUnitToman,
      unitToman,
      lineTotalToman,
      lineSavingsToman,
      savingsPercent,
      weightGrams: singleBundleWeight,
      lineWeightGrams,
      unitsPerCarton: product.unitsPerCarton ?? 1,
      cartons,
      tierLabel: hasSale ? 'تخفیف ویژه' : 'تک‌فروشی',
      nextTier: null,
      colorData: colorData ?? null,
    };
  }

  // With allowBatchDiscount enabled:
  if (isBundle) {
    const tier = resolveTier(tiers, bundleCount, effectiveBasePrice);
    const packagePrice = Math.min(tier.unitPriceToman, effectiveBasePrice);
    const lineTotalToman = packagePrice * bundleCount;
    const unitToman = Math.round(packagePrice / bundleSize);
    const fullListTotal = product.basePriceToman * bundleCount;
    const lineSavingsToman = Math.max(0, fullListTotal - lineTotalToman);
    const savingsPercent =
      fullListTotal > 0 ? Math.round((lineSavingsToman / fullListTotal) * 100) : 0;

    return {
      productId: product.id,
      slug: product.slug,
      name: product.name,
      imageUrl: product.images?.[0]?.url ?? null,
      quantity: qty,
      bundleSize,
      bundleLabel,
      bundleItems: product.bundleItems ?? null,
      listUnitToman,
      unitToman,
      lineTotalToman,
      lineSavingsToman,
      savingsPercent,
      weightGrams: singleBundleWeight,
      lineWeightGrams,
      unitsPerCarton: product.unitsPerCarton ?? 1,
      cartons,
      tierLabel: tier.label ?? (hasSale ? 'تخفیف ویژه' : CHANNEL_LABEL[resolveChannel(qty)]),
      nextTier: nextTierHint(tiers, bundleCount),
      colorData: colorData ?? null,
    };
  }

  const tier = resolveTier(tiers, qty, effectiveBasePrice);
  const unitToman = Math.min(tier.unitPriceToman, effectiveBasePrice);
  const lineTotalToman = unitToman * qty;
  const lineSavingsToman = Math.max(0, (listUnitToman - unitToman) * qty);
  const savingsPercent =
    listUnitToman > 0
      ? Math.round(((listUnitToman - unitToman) / listUnitToman) * 100)
      : 0;

  return {
    productId: product.id,
    slug: product.slug,
    sku: product.sku ?? null,
    name: product.name,
    imageUrl: product.images?.[0]?.url ?? null,
    quantity: qty,
    bundleSize,
    bundleLabel,
    bundleItems: product.bundleItems ?? null,
    listUnitToman,
    unitToman,
    lineTotalToman,
    lineSavingsToman,
    savingsPercent,
    weightGrams: singleBundleWeight,
    lineWeightGrams,
    unitsPerCarton: product.unitsPerCarton ?? 1,
    cartons,
    tierLabel: tier.label ?? (hasSale ? 'تخفیف ویژه' : CHANNEL_LABEL[resolveChannel(qty)]),
    nextTier: nextTierHint(tiers, qty),
    colorData: colorData ?? null,
  };
}

export function priceCart(inputs: PriceInput[]): CartTotals {
  const lines = inputs.map(priceLine);

  const totalQuantity = lines.reduce((s, l) => s + l.quantity, 0);
  const subtotalToman = lines.reduce(
    (s, l) => s + l.listUnitToman * l.quantity,
    0,
  );
  const payableToman = lines.reduce((s, l) => s + l.lineTotalToman, 0);
  const totalWeightGrams = lines.reduce((s, l) => s + l.lineWeightGrams, 0);
  const totalCartons = lines.reduce((s, l) => s + l.cartons, 0);

  return {
    lines,
    totalQuantity,
    subtotalToman,
    payableToman,
    discountToman: Math.max(0, subtotalToman - payableToman),
    totalWeightGrams,
    totalCartons,
    channel: resolveChannel(totalQuantity),
  };
}

/**
 * Shipping cost based on weight and province.
 * Free shipping above 5,000,000 Toman.
 */
export function calcShippingToman(totals: CartTotals, province: string): number {
  if (totals.payableToman >= 5000000) return 0;

  const kg = totals.totalWeightGrams / 1000;
  const base = 65000;
  const perKg = 18000;
  const remote = [
    'سیستان و بلوچستان',
    'هرمزگان',
    'کردستان',
    'آذربایجان غربی',
  ].includes(province)
    ? 1.35
    : 1;

  const freight = Math.ceil(((base + kg * perKg) * remote) / 10000) * 10000;
  const wholesaleDiscount = totals.channel === 'WHOLESALE' ? 0.6 : 1;

  return Math.max(0, Math.round(freight * wholesaleDiscount));
}
