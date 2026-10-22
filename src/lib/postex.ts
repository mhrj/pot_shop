import { calcShippingToman, type CartTotals } from '@/lib/pricing';

export type PostexCalculationParams = {
  originCity: string;
  destinationCity: string;
  weightGrams: number;
  fallbackTotals?: CartTotals;
};

/**
 * Extracts shipping cost in Toman from various Postex response formats.
 */
function extractTomanPrice(data: any): number | null {
  if (!data || typeof data !== 'object') return null;

  // Direct Toman fields
  if (typeof data.price_toman === 'number' && data.price_toman > 0) return data.price_toman;
  if (typeof data.data?.price_toman === 'number' && data.data.price_toman > 0) return data.data.price_toman;

  const candidatePrices: number[] = [];

  const inspect = (item: any) => {
    if (!item || typeof item !== 'object') return;
    if (typeof item.price === 'number') candidatePrices.push(item.price);
    if (typeof item.cost === 'number') candidatePrices.push(item.cost);
    if (typeof item.total_cost === 'number') candidatePrices.push(item.total_cost);
    if (typeof item.total_price === 'number') candidatePrices.push(item.total_price);
    if (typeof item.shipping_rate === 'number') candidatePrices.push(item.shipping_rate);
    if (Array.isArray(item.services)) {
      for (const s of item.services) {
        if (s?.service === 'pishtaz' || s?.name === 'pishtaz' || s?.type === 'pishtaz') {
          if (typeof s.price === 'number') candidatePrices.unshift(s.price);
          if (typeof s.cost === 'number') candidatePrices.unshift(s.cost);
        } else {
          if (typeof s?.price === 'number') candidatePrices.push(s.price);
          if (typeof s?.cost === 'number') candidatePrices.push(s.cost);
        }
      }
    }
  };

  inspect(data);
  inspect(data.data);

  if (candidatePrices.length === 0) return null;

  const raw = candidatePrices[0];
  if (raw <= 0) return null;

  // Iranian APIs return Rials by default. If the amount is >= 200,000 or currency is IRR,
  // convert to Toman (divide by 10).
  const isRials =
    data.currency === 'IRR' ||
    data.currency === 'rial' ||
    data.data?.currency === 'IRR' ||
    raw >= 250_000;

  return isRials ? Math.round(raw / 10) : raw;
}

/**
 * Calculate dynamic shipping cost using Postex API with fallback to built-in pricing engine.
 *
 * @param originCity Shop origin city (e.g. 'تهران')
 * @param destinationCity Customer city/province
 * @param weightGrams Total package weight in grams
 * @param fallbackTotals Optional CartTotals used for fallback calculation and free-shipping rule
 */
export async function calculateShippingCost(
  originCity: string,
  destinationCity: string,
  weightGrams: number,
  fallbackTotals?: CartTotals,
): Promise<number> {
  const defaultFallbackTotals: CartTotals = fallbackTotals ?? {
    lines: [],
    totalQuantity: 1,
    subtotalToman: 0,
    payableToman: 0,
    discountToman: 0,
    totalWeightGrams: weightGrams,
    totalCartons: 1,
    channel: 'RETAIL',
  };

  // Free shipping rule check if cart totals are known
  if (fallbackTotals && fallbackTotals.payableToman >= 5000000) {
    return 0;
  }

  const apiKey = process.env.POSTEX_API_KEY;

  // If API key is not configured or is a placeholder, immediately use the fallback
  if (!apiKey || apiKey === 'your-postex-api-key') {
    return calcShippingToman(defaultFallbackTotals, destinationCity);
  }

  try {
    const endpoint =
      process.env.POSTEX_API_URL ||
      'https://api.postex.ir/api/v1/shipping/calculate';

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'x-api-key': apiKey,
      },
      body: JSON.stringify({
        origin: originCity,
        destination: destinationCity,
        from_city: originCity,
        to_city: destinationCity,
        weight: weightGrams,
        weight_grams: weightGrams,
        service: 'pishtaz',
        service_type: 'pishtaz',
      }),
      signal: AbortSignal.timeout(6000), // 6-second timeout
    });

    if (!response.ok) {
      console.warn(
        `[postex] API returned HTTP ${response.status}, falling back to calcShippingToman`,
      );
      return calcShippingToman(defaultFallbackTotals, destinationCity);
    }

    const data = await response.json().catch(() => null);
    const parsedCostToman = extractTomanPrice(data);

    if (parsedCostToman !== null && parsedCostToman > 0) {
      return parsedCostToman;
    }

    console.warn(
      '[postex] Could not parse valid shipping price from response, falling back to calcShippingToman',
    );
    return calcShippingToman(defaultFallbackTotals, destinationCity);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.warn(`[postex] Failed to calculate shipping rate: ${message}. Using fallback.`);
    return calcShippingToman(defaultFallbackTotals, destinationCity);
  }
}
