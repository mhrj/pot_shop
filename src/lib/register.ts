import { z } from 'zod';
import { passwordSchema } from '@/lib/password-policy';

export const registrationSchema = z.object({
  fullName: z
    .string({ required_error: 'نام کامل الزامی است' })
    .trim()
    .min(2, 'نام کامل باید حداقل ۲ کاراکتر باشد')
    .max(80, 'نام کامل بیش از حد مجاز است'),
  phone: z
    .string({ required_error: 'شماره موبایل الزامی است' })
    .trim()
    .min(1, 'شماره موبایل الزامی است')
    .regex(/^09\d{9}$/, 'شماره موبایل نامعتبر است (باید ۱۱ رقم و با ۰۹ شروع شود)')
    .transform((value) => value.replace(/\s+/g, '')),
  email: z
    .string()
    .trim()
    .email('ایمیل معتبر نیست')
    .optional()
    .or(z.literal(''))
    .transform((value) => (value && value.trim() ? value.trim().toLowerCase() : null)),
  password: passwordSchema,
});

export type RegistrationInput = {
  fullName: string;
  phone: string;
  email: string | null;
  password: string;
  role: 'CUSTOMER';
};

export function getRegistrationConflict(
  phone: string,
  email: string | null | undefined,
  existing: { phone?: string | null; email?: string | null } | null,
) {
  if (!existing) return null;
  if (existing.phone === phone) return 'phone' as const;
  if (email && existing.email && existing.email.toLowerCase() === email.toLowerCase()) {
    return 'email' as const;
  }
  return null;
}

export function normalizeRegistrationInput(input: unknown): RegistrationInput {
  const parsed = registrationSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? 'اطلاعات نامعتبر است');
  }

  return {
    ...parsed.data,
    role: 'CUSTOMER',
  };
}
