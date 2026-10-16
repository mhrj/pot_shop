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
