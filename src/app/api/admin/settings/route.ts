import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getActiveAdmin } from '@/lib/auth';
import { resolveCityCode } from '@/lib/postex';

export const runtime = 'nodejs';

const schema = z.object({
  originProvince: z.string().trim().min(2, 'نام استان مبدا الزامی است'),
  originCity: z.string().trim().min(2, 'نام شهر مبدا الزامی است'),
});

export async function GET() {
  const admin = await getActiveAdmin();
  if (!admin) {
    return NextResponse.json({ message: 'دسترسی غیرمجاز' }, { status: 403 });
  }

  const settings = await prisma.storeSettings.upsert({
    where: { id: 'singleton' },
    update: {},
    create: {
      id: 'singleton',
      originProvince: 'تهران',
      originCity: 'تهران',
    },
  });

  return NextResponse.json({
    ok: true,
    settings,
    fromCityCode: resolveCityCode(settings.originCity),
  });
}

export async function POST(req: Request) {
  const admin = await getActiveAdmin();
  if (!admin) {
    return NextResponse.json({ message: 'دسترسی غیرمجاز است' }, { status: 403 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? 'اطلاعات نامعتبر است' },
      { status: 400 },
    );
  }

  const { originProvince, originCity } = parsed.data;

  const settings = await prisma.storeSettings.upsert({
    where: { id: 'singleton' },
    update: {
      originProvince,
      originCity,
      updatedAt: new Date(),
    },
    create: {
      id: 'singleton',
      originProvince,
      originCity,
    },
  });

  revalidatePath('/admin/settings');
  revalidatePath('/checkout');
  revalidatePath('/cart');

  return NextResponse.json({
    ok: true,
    settings,
    fromCityCode: resolveCityCode(settings.originCity),
  });
}
