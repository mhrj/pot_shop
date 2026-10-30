'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getActiveAdmin } from '@/lib/auth';
import { resolveCityCode } from '@/lib/postex';

const settingsSchema = z.object({
  originProvince: z.string().trim().min(2, 'نام استان مبدا الزامی است'),
  originCity: z.string().trim().min(2, 'نام شهر مبدا الزامی است'),
});

export type UpdateSettingsInput = z.infer<typeof settingsSchema>;

export async function updateStoreSettingsAction(input: UpdateSettingsInput) {
  const admin = await getActiveAdmin();
  if (!admin) {
    return { success: false as const, error: 'دسترسی غیرمجاز است' };
  }

  const parsed = settingsSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false as const,
      error: parsed.error.issues[0]?.message ?? 'اطلاعات نامعتبر است',
    };
  }

  const { originProvince, originCity } = parsed.data;

  try {
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

    return {
      success: true as const,
      settings,
      fromCityCode: resolveCityCode(settings.originCity),
    };
  } catch (error) {
    console.error('[updateStoreSettingsAction] error:', error);
    return {
      success: false as const,
      error: 'خطا در ذخیره تنظیمات در پایگاه داده',
    };
  }
}
