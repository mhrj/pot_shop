import { z } from 'zod';

export const registrationSchema = z.object({
  fullName: z.string().trim().min(2, 'نام کامل باید حداقل ۲ کاراکتر باشد').max(80, 'نام کامل بیش از حد مجاز است'),
  phone: z
    .string()
    .trim()
    .regex(/^09\d{9}$/, 'شماره موبایل نامعتبر است')
    .transform((value) => value.replace(/\s+/g, '')),
  email: z
    .string()
    .trim()
    .optional()
    .or(z.literal(''))
    .transform((value) => (value ? value.toLowerCase() : null)),
  password: z
    .string()
    .min(8, 'رمز عبور باید حداقل ۸ نویسه باشد')
    .max(128, 'رمز عبور بیش از حد مجاز است')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/,
      'رمز عبور باید شامل حرف بزرگ، حرف کوچک، عدد و نماد باشد',
    ),
});

export type RegistrationInput = z.infer<typeof registrationSchema> & {
  role: 'CUSTOMER';
};

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
