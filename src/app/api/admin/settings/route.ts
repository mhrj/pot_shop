import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { getActiveAdmin } from '@/lib/auth';
import { resolveCityCode } from '@/lib/postex';
import { updateStoreSettingsAction } from '@/features/admin/actions/settings-actions';

export const runtime = 'nodejs';

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
  const body = await req.json().catch(() => ({}));
  const res = await updateStoreSettingsAction(body);

  if (!res.success) {
    const status = res.error === 'دسترسی غیرمجاز است' ? 403 : 400;
    return NextResponse.json({ message: res.error }, { status });
  }

  revalidatePath('/cart');

  return NextResponse.json({
    ok: true,
    settings: res.settings,
    fromCityCode: res.fromCityCode,
  });
}
