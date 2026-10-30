import { type CartTotals } from "@/lib/pricing";

export type PostexCalculationParams = {
  originCity?: string;
  destinationCity?: string;
  weightGrams?: number;
  fallbackTotals?: CartTotals;
  collection_type?: string;
  from_city_code?: number | string;
  to_city_code?: number | string;
  courier?: unknown;
  parcels?: unknown[];
};

const CITY_CODE_MAP: Record<string, number> = {
  تهران: 1,
  اصفهان: 175,
  شیراز: 409,
  فارس: 409,
  مشهد: 264,
  "خراسان رضوی": 264,
  تبریز: 619,
  "آذربایجان شرقی": 619,
  ارومیه: 68,
  "آذربایجان غربی": 68,
  اردبیل: 87,
  کرج: 65,
  البرز: 65,
  ایلام: 95,
  بوشهر: 140,
  شهرکرد: 160,
  "چهارمحال و بختیاری": 160,
  بیرجند: 100,
  "خراسان جنوبی": 100,
  بجنورد: 126,
  "خراسان شمالی": 126,
  اهواز: 200,
  خوزستان: 200,
  زنجان: 234,
  سمنان: 245,
  زاهدان: 396,
  "سیستان و بلوچستان": 396,
  قزوین: 357,
  قم: 376,
  سنندج: 300,
  کردستان: 300,
  کرمان: 335,
  کرمانشاه: 348,
  یاسوج: 560,
  "کهگیلویه و بویراحمد": 560,
  گرگان: 450,
  گلستان: 450,
  رشت: 324,
  گیلان: 324,
  خرم‌آباد: 429,
  "خرم آباد": 429,
  لرستان: 429,
  ساری: 280,
  مازندران: 280,
  اراک: 461,
  مرکزی: 461,
  بندرعباس: 572,
  "بندر عباس": 572,
  هرمزگان: 572,
  همدان: 545,
  یزد: 585,
};

export function resolveCityCode(cityName?: string | number): number {
  if (cityName === undefined || cityName === null) return 1;
  if (typeof cityName === "number") {
    return !isNaN(cityName) && cityName > 0 ? Math.round(cityName) : 1;
  }
  const trimmed = String(cityName).trim();
  if (!trimmed) return 1;
  if (/^\d+$/.test(trimmed)) {
    const parsed = parseInt(trimmed, 10);
    return parsed > 0 ? parsed : 1;
  }
  for (const [key, code] of Object.entries(CITY_CODE_MAP)) {
    if (trimmed.includes(key) || key.includes(trimmed)) {
      return code;
    }
  }
  return 1;
}

/**
 * Extracts shipping cost in Toman from various Postex response formats.
 */
function extractTomanPrice(data: unknown): number | null {
  if (!data || typeof data !== "object") return null;

  const record = data as Record<string, unknown>;

  // Direct Toman fields
  if (typeof record.price_toman === "number" && record.price_toman > 0)
    return record.price_toman;
  const innerData = record.data as Record<string, unknown> | undefined;
  if (typeof innerData?.price_toman === "number" && innerData.price_toman > 0)
    return innerData.price_toman;

  // Filter for courier_code IR_POST and service_type EXPRESS if quotes or courier array exists
  const quotesList = Array.isArray(data)
    ? data
    : Array.isArray(record.data)
      ? record.data
      : Array.isArray(record.quotes)
        ? record.quotes
        : Array.isArray(record.couriers)
          ? record.couriers
          : null;

  if (quotesList && quotesList.length > 0) {
    const expressQuote = quotesList.find((q: unknown) => {
      const qRec = (q && typeof q === 'object' ? q : {}) as Record<string, unknown>;
      const courierRec = (qRec.courier && typeof qRec.courier === 'object' ? qRec.courier : {}) as Record<string, unknown>;
      return (
        (qRec.courier_code === "IR_POST" ||
          qRec.courier === "IR_POST" ||
          courierRec.courier_code === "IR_POST") &&
        (qRec.service_type === "EXPRESS" ||
          qRec.service === "EXPRESS" ||
          courierRec.service_type === "EXPRESS")
      );
    });
    if (expressQuote) {
      const price = extractTomanPrice(expressQuote);
      if (price !== null && price > 0) return price;
    }
  }

  const candidatePrices: number[] = [];

  const inspect = (item: unknown) => {
    if (!item || typeof item !== "object") return;
    const it = item as Record<string, unknown>;
    if (typeof it.price === "number") candidatePrices.push(it.price);
    if (typeof it.cost === "number") candidatePrices.push(it.cost);
    if (typeof it.amount === "number") candidatePrices.push(it.amount);
    if (typeof it.total_cost === "number")
      candidatePrices.push(it.total_cost);
    if (typeof it.total_price === "number")
      candidatePrices.push(it.total_price);
    if (typeof it.totalPrice === "number")
      candidatePrices.push(it.totalPrice);
    if (typeof it.total_amount === "number")
      candidatePrices.push(it.total_amount);
    if (typeof it.shipping_price === "number")
      candidatePrices.push(it.shipping_price);
    if (typeof it.shipping_rate === "number")
      candidatePrices.push(it.shipping_rate);

    if (Array.isArray(it.shipping_prices)) {
      for (const sp of it.shipping_prices) {
        const spRec = (sp && typeof sp === 'object' ? sp : {}) as Record<string, unknown>;
        if (typeof spRec.total_shipping_price === "number")
          candidatePrices.push(spRec.total_shipping_price);
        if (typeof spRec.shipping_price === "number")
          candidatePrices.push(spRec.shipping_price);
        if (Array.isArray(spRec.service_price)) {
          for (const s of spRec.service_price) {
            const sRec = (s && typeof s === 'object' ? s : {}) as Record<string, unknown>;
            if (typeof sRec.totalPrice === "number")
              candidatePrices.push(sRec.totalPrice);
            if (typeof sRec.initPrice === "number")
              candidatePrices.push(sRec.initPrice);
          }
        }
      }
    }

    if (Array.isArray(it.services)) {
      for (const s of it.services) {
        const sRec = (s && typeof s === 'object' ? s : {}) as Record<string, unknown>;
        if (
          sRec.service === "pishtaz" ||
          sRec.name === "pishtaz" ||
          sRec.type === "pishtaz"
        ) {
          if (typeof sRec.price === "number") candidatePrices.unshift(sRec.price);
          if (typeof sRec.cost === "number") candidatePrices.unshift(sRec.cost);
        } else {
          if (typeof sRec.price === "number") candidatePrices.push(sRec.price);
          if (typeof sRec.cost === "number") candidatePrices.push(sRec.cost);
        }
      }
    }
  };

  inspect(data);
  inspect(record.data);

  if (candidatePrices.length === 0) return null;

  const raw = candidatePrices[0];
  if (raw <= 0) return null;

  // Iranian APIs return Rials by default. If the amount is >= 200,000 or currency is IRR,
  // convert to Toman (divide by 10).
  const isRials =
    record.currency === "IRR" ||
    record.currency === "rial" ||
    innerData?.currency === "IRR" ||
    raw >= 250_000;

  return isRials ? Math.round(raw / 10) : raw;
}

/**
 * Diagnostic call to fetch available shipping methods from Postex.
 */
export async function getPostexShippingMethods(apiKey: string): Promise<
  Array<{
    courierCode: string;
    courierServiceCode: string;
    courierServiceName?: string;
    isActive: boolean;
  }>
> {
  try {
    const res = await fetch("https://api.postex.ir/api/v1/shipping-methods", {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${apiKey}`,
        "x-api-key": apiKey,
      },
      signal: AbortSignal.timeout(5000),
    });

    if (res.ok) {
      const json = await res.json();
      console.log(
        "[postex] Diagnostic GET /api/v1/shipping-methods response:",
        JSON.stringify(json, null, 2),
      );
      if (Array.isArray(json?.data)) {
        return json.data;
      }
    } else {
      console.warn(
        `[postex] Diagnostic GET /api/v1/shipping-methods failed with HTTP ${res.status}`,
      );
    }
  } catch (err) {
    console.warn("[postex] Error fetching diagnostic shipping-methods:", err);
  }
  return [];
}

export async function getStoreOrigin(): Promise<{
  originProvince: string;
  originCity: string;
  from_city_code: number;
}> {
  try {
    if (typeof window === "undefined") {
      const { prisma } = await import("@/lib/prisma");
      const settings = await prisma.storeSettings.findUnique({
        where: { id: "singleton" },
      });
      if (settings?.originCity) {
        return {
          originProvince: settings.originProvince || "تهران",
          originCity: settings.originCity,
          from_city_code: resolveCityCode(settings.originCity),
        };
      }
    }
  } catch {
    // fallback if DB unreachable or in client bundle
  }

  const fallbackCity = process.env.POSTEX_ORIGIN_CITY || "تهران";
  return {
    originProvince: "تهران",
    originCity: fallbackCity,
    from_city_code: resolveCityCode(fallbackCity),
  };
}

/**
 * Calculate dynamic shipping cost using Postex Quotes API with fallback to built-in pricing engine.
 *
 * @param originCity Shop origin city (e.g. 'تهران') or options object
 * @param destinationCity Customer city/province
 * @param weightGrams Total package weight in grams
 * @param fallbackTotals Optional CartTotals used for fallback calculation and free-shipping rule
 */
export type PostexCalculationResult = number | { ok: false };

export async function calculatePostexShipping(
  originCityOrParams: string | PostexCalculationParams,
  destinationCity?: string,
  weightGrams?: number,
  fallbackTotals?: CartTotals,
): Promise<PostexCalculationResult> {
  let originCity = "";
  let destination = destinationCity ?? "تهران";
  let weight = weightGrams ?? 1000;
  let totals = fallbackTotals;
  let explicitFromCityCode: number | string | undefined;

  if (typeof originCityOrParams === "object" && originCityOrParams !== null) {
    originCity = originCityOrParams.originCity ?? "";
    destination = originCityOrParams.destinationCity ?? destination;
    weight = originCityOrParams.weightGrams ?? weight;
    totals = originCityOrParams.fallbackTotals ?? totals;
    explicitFromCityCode = originCityOrParams.from_city_code;
  } else if (
    typeof originCityOrParams === "string" &&
    originCityOrParams.trim()
  ) {
    originCity = originCityOrParams.trim();
  }

  // If origin is not provided, fetch from StoreSettings (defaulting to Tehran / 1)
  if (!originCity) {
    const origin = await getStoreOrigin();
    originCity = origin.originCity;
    if (!explicitFromCityCode) {
      explicitFromCityCode = origin.from_city_code;
    }
  }

  // Free shipping rule check if cart totals are known
  if (totals && totals.payableToman >= 5000000) {
    return 0;
  }

  const apiKey = process.env.POSTEX_API_KEY;

  // If API key is not configured or is a placeholder, return { ok: false } so caller uses fallback
  if (!apiKey || apiKey === "your-postex-api-key") {
    return { ok: false };
  }

  try {
    const endpoint =
      process.env.POSTEX_API_URL ||
      "https://api.postex.ir/api/v1/shipping/quotes";

    // Optional diagnostic call to inspect available shipping methods
    // await getPostexShippingMethods(apiKey);

    const rawFrom =
      explicitFromCityCode ??
      (typeof originCityOrParams === "object" && originCityOrParams !== null
        ? originCityOrParams.from_city_code
        : undefined) ??
      originCity;

    const rawTo =
      (typeof originCityOrParams === "object" && originCityOrParams !== null
        ? originCityOrParams.to_city_code
        : undefined) ??
      destination;

    const fromCityCode = resolveCityCode(rawFrom);
    const toCityCode = resolveCityCode(rawTo);

    // Ensure weight is an integer in grams (Postex API expects System.Int64 in grams, e.g. 8700 for 8.7kg)
    const totalWeightGrams = Math.round(
      weight < 25 && weight > 0 ? weight * 1000 : weight,
    );

    // Clean, flat request body without duplicate fields or wrapper
    const requestBody = {
      collection_type: "courier_drop_off",
      from_city_code: fromCityCode,
      courier: {
        courier_code: "IR_POST",
        service_type: "EXPRESS",
      },
      parcels: [
        {
          custom_parcel_id: `cart_${Date.now()}`,
          to_city_code: toCityCode,
          payment_type: "SENDER",
          parcel_properties: {
            length: 20,
            width: 20,
            height: 20,
            total_weight: totalWeightGrams,
            is_fragile: true,
            is_liquid: false,
            total_value: totals?.payableToman
              ? totals.payableToman * 10
              : 5_000_000,
            pre_paid_amount: 0,
            total_value_currency: "IRR",
            box_type_id: 1,
          },
        },
      ],
      value_added_service: {
        request_label: false,
        request_packaging: false,
        request_sms_notification: false,
      },
    };

    const payloadString = JSON.stringify(requestBody);
    console.log("[postex] Outgoing request payload:", payloadString);

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${apiKey}`,
        "x-api-key": apiKey,
      },
      body: payloadString,
      signal: AbortSignal.timeout(6000), // 6-second timeout
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      let parsedError: unknown = null;
      try {
        parsedError = JSON.parse(errorText);
      } catch {
        // Not JSON
      }

      console.warn(
        `[postex] API returned HTTP ${response.status} response:`,
        parsedError ? JSON.stringify(parsedError) : errorText || "(empty response)",
      );
      return { ok: false };
    }

    const data = await response.json().catch(() => null);
    const parsedCostToman = extractTomanPrice(data);

    if (parsedCostToman !== null && parsedCostToman > 0) {
      return parsedCostToman;
    }

    console.warn(
      "[postex] Could not parse valid shipping price from response, returning { ok: false }",
    );
    return { ok: false };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.warn(
      `[postex] Failed to calculate shipping rate: ${message}`,
    );
    return { ok: false };
  }
}

/** Alias for backward compatibility */
export const calculateShippingCost = calculatePostexShipping;
