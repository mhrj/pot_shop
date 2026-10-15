import { z } from 'zod';

export const addressLabelSchema = z.enum(['HOME', 'WORK', 'OTHER']).default('HOME');

export const addressInputSchema = z
  .object({
    label: addressLabelSchema.optional(),
    fullName: z
      .string()
      .trim()
      .min(2, 'نام کامل الزامی است')
      .max(80, 'نام کامل بیش از حد مجاز است'),
    phone: z
      .string()
      .trim()
      .regex(/^09\d{9}$/, 'شماره موبایل معتبر نیست'),
    province: z.string().trim().min(2, 'نام استان الزامی است'),
    city: z.string().trim().min(2, 'نام شهر الزامی است'),
    postalCode: z
      .string()
      .trim()
      .regex(/^\d{5,10}$/, 'کد پستی فقط باید شامل اعداد باشد'),
    line1: z.string().trim().min(3, 'آدرس اصلی الزامی است'),
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
