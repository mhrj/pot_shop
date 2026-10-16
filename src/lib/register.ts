import { z } from 'zod';
import { passwordSchema } from '@/lib/password-policy';

export const registrationSchema = z.object({
  fullName: z.string().trim().min(2, 'نام کامل باید حداقل ۲ کاراکتر باشد').max(80, 'نام کامل بیش از حد مجاز است'),
  phone: z
    .string()
    .trim()
    .min(1, 'شماره موبایل الزامی است')
    .regex(/^09\d{9}$/, 'شماره موبایل نامعتبر است')
    .transform((value) => value.replace(/\s+/g, '')),
  email: z
    .string()
    .trim()
    .min(1, 'ایمیل الزامی است')
    .email('ایمیل معتبر نیست')
    .transform((value) => value.toLowerCase()),
  password: passwordSchema,
});

export type RegistrationInput = z.infer<typeof registrationSchema> & {
  role: 'CUSTOMER';
};

export function getRegistrationConflict(
  phone: string,
  email: string,
  existing: { phone?: string | null; email?: string | null } | null,
) {
  if (!existing) return null;
  if (existing.phone === phone) return 'phone' as const;
  if (existing.email === email) return 'email' as const;
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
