import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCartTotals } from "@/lib/cart";
import { calculatePostexShipping, resolveCityCode } from "@/lib/postex";
import { calcShippingToman } from "@/lib/pricing";

export const runtime = "nodejs";

export type ShippingOption = {
  carrier: string;
  label: string;
  costToman: number;
  deliveryDays: string;
};

const schema = z.object({
  cityCode: z.union([z.number(), z.string()]).optional(),
  weightGrams: z.number().optional(),
  addressId: z.string().optional(),
  city: z.string().optional(),
  province: z.string().optional(),
});

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: "ابتدا وارد شوید" }, { status: 401 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { message: "اطلاعات نامعتبر است" },
      { status: 400 },
    );
  }

  const { cityCode, weightGrams, addressId, city, province } = parsed.data;

  // 1) Determine destination and numeric city code
  let destination = city || province || "";
  let resolvedCode: number | null = null;

  if (typeof cityCode === "number") {
    resolvedCode = cityCode;
  } else if (typeof cityCode === "string" && /^\d+$/.test(cityCode.trim())) {
    resolvedCode = parseInt(cityCode.trim(), 10);
  } else if (typeof cityCode === "string" && cityCode.trim()) {
    destination = cityCode.trim();
  }

  if (addressId && !destination) {
    const address = await prisma.address.findFirst({
      where: { id: addressId, userId: session.sub },
      select: { city: true, province: true },
    });
    if (address) {
      destination = address.city || address.province;
    }
  }

  if (!destination) {
    destination = "تهران";
  }

  if (resolvedCode === null) {
    resolvedCode = resolveCityCode(destination);
  }

  // 2) Get totals and weight
  const totals = await getCartTotals(session.sub);
  const effectiveWeight = weightGrams ?? totals.totalWeightGrams ?? 1000;

  // 3) Fetch store settings for origin city and from_city_code
  let originCity = "تهران";
  try {
    const settings = await prisma.storeSettings.findUnique({
      where: { id: "singleton" },
    });
    if (settings?.originCity) {
      originCity = settings.originCity;
    }
  } catch (err) {
    console.warn(
      "[shipping/calculate] Failed to read store settings, falling back to default:",
      err,
    );
  }
  const fromCityCode = resolveCityCode(originCity);

  let shippingToman: number;

  try {
    // 4) Call Postex API securely on the server
    shippingToman = await calculatePostexShipping({
      originCity,
      destinationCity: destination,
      weightGrams: effectiveWeight,
      fallbackTotals: totals,
      from_city_code: fromCityCode,
      to_city_code: resolvedCode,
    });
  } catch (error) {
    console.warn(
      "[shipping/calculate] Postex failed, falling back to pricing engine:",
      error,
    );
    shippingToman = calcShippingToman(totals, destination);
  }

  const isFree = totals.payableToman >= 5_000_000 || shippingToman === 0;
  const effectiveCost = isFree ? 0 : shippingToman;

  const options: ShippingOption[] = [
    {
      carrier: "پست پیشتاز",
      label: "پست پیشتاز (۳ روز کاری)",
      costToman: effectiveCost,
      deliveryDays: "۳ روز کاری",
    },
  ];

  return NextResponse.json({
    ok: true,
    shippingToman: effectiveCost,
    isFree,
    options,
    shippingOptions: options,
    destination,
    cityCode: resolvedCode,
  });
}
