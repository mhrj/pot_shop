import { z } from 'zod';

export const addressLabelSchema = z.enum(['HOME', 'WORK', 'OTHER']).default('HOME');

export const addressInputSchema = z
  .object({
    label: addressLabelSchema.optional(),
    fullName: z
      .string()
      .trim()
      .min(2, 'fullName is required')
      .max(80, 'fullName is too long'),
    phone: z
      .string()
      .trim()
      .regex(/^09\d{9}$/, 'phone must be a valid mobile number'),
    province: z.string().trim().min(2, 'province is required'),
    city: z.string().trim().min(2, 'city is required'),
    postalCode: z
      .string()
      .trim()
      .regex(/^\d{5,10}$/, 'postalCode must contain only digits'),
    line1: z.string().trim().min(3, 'line1 is required'),
    line2: z.string().trim().max(200, 'line2 is too long').optional().transform((value) => {
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
