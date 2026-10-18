import { z } from 'zod';

export const addressLabelSchema = z.enum(['HOME', 'WORK', 'OTHER']).default('HOME');

export const addressInputSchema = z
  .object({
    label: addressLabelSchema.optional(),
    fullName: z
      .string({ required_error: 'نام و نام خانوادگی الزامی است' })
      .trim()
      .min(2, 'نام و نام خانوادگی الزامی است')
      .max(80, 'نام کامل بیش از حد مجاز است'),
    phone: z
      .string({ required_error: 'شماره موبایل الزامی است' })
      .trim()
      .min(1, 'شماره موبایل الزامی است')
      .regex(/^09\d{9}$/, 'شماره موبایل معتبر نیست (۱۱ رقم با ۰۹)'),
    province: z
      .string({ required_error: 'نام استان الزامی است' })
      .trim()
      .min(2, 'نام استان الزامی است'),
    city: z
      .string({ required_error: 'نام شهر الزامی است' })
      .trim()
      .min(2, 'نام شهر الزامی است'),
    postalCode: z
      .string({ required_error: 'کد پستی الزامی است' })
      .trim()
      .min(1, 'کد پستی الزامی است')
      .regex(/^\d{5,10}$/, 'کد پستی فقط باید شامل اعداد باشد'),
    line1: z
      .string({ required_error: 'آدرس اصلی الزامی است' })
      .trim()
      .min(3, 'آدرس اصلی الزامی است'),
    line2: z.string().trim().max(200, 'آدرس تکمیلی بیش از حد مجاز است').optional().transform((value) => {
      if (!value) return null;
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : null;
    }),
    isDefault: z.boolean().optional().default(false),
  })
  .transform((value) => ({
    label: value.label ?? 'HOME',
    fullName: value.fullName.trim(),
    phone: value.phone.replace(/\s+/g, ''),
    province: value.province.trim(),
    city: value.city.trim(),
    postalCode: value.postalCode.replace(/\s+/g, ''),
    line1: value.line1.trim(),
    line2: value.line2 && value.line2.trim() ? value.line2.trim() : null,
    isDefault: !!value.isDefault,
  }));

export type AddressInput = z.infer<typeof addressInputSchema>;

export function normalizeAddressInput(input: unknown): AddressInput {
  return addressInputSchema.parse(input);
}
