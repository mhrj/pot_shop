/**
 * Admin-defined display features for a product.
 *
 * These live in `Product.features` as free-form JSON, so anything at all can be
 * in that column — rows written before this existed, rows written by a future
 * version of the form, or a hand-edited row. Every read therefore goes through
 * `parseFeatures`, which keeps only the entries that actually look like a
 * feature and drops the rest, instead of trusting the column's shape.
 */
export type ProductFeature = { label: string; enabled: boolean };

export function parseFeatures(raw: unknown): ProductFeature[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (f): f is ProductFeature =>
      typeof f === 'object' && f !== null &&
      typeof (f as ProductFeature).label === 'string' &&
      typeof (f as ProductFeature).enabled === 'boolean'
  );
}

export type BundleItem = {
  title: string;
  material: string;
  diameterCm: number;
  heightCm: number;
  weightGrams: number;
  priceToman?: number;
  productId?: string;
};

export function parseBundleItems(raw: unknown): BundleItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (it): it is Record<string, unknown> =>
        typeof it === 'object' &&
        it !== null &&
        typeof (it as Record<string, unknown>).title === 'string'
    )
    .map((it) => ({
      title: String(it.title),
      material: typeof it.material === 'string' ? it.material : '',
      diameterCm:
        typeof it.diameterCm === 'number' && Number.isFinite(it.diameterCm)
          ? it.diameterCm
          : 0,
      heightCm:
        typeof it.heightCm === 'number' && Number.isFinite(it.heightCm)
          ? it.heightCm
          : 0,
      weightGrams:
        typeof it.weightGrams === 'number' && Number.isFinite(it.weightGrams)
          ? Math.floor(it.weightGrams)
          : 0,
      priceToman:
        typeof it.priceToman === 'number' && Number.isFinite(it.priceToman) && it.priceToman > 0
          ? Math.floor(it.priceToman)
          : undefined,
      productId: typeof it.productId === 'string' && it.productId.trim() ? it.productId.trim() : undefined,
    }));
}

