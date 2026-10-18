import { z } from 'zod';

/**
 * The one password rule for the app.
 *
 * Registration and password reset both use this. Reset previously accepted any
 * 8-character string, so an account created under the strong registration policy
 * could be reset to a weaker password than the one it replaced — the strength of
 * an account was only as good as its weakest entry point.
 *
 * Login deliberately does *not* use this: it must still accept a password that
 * predates the policy, so it only enforces a length floor.
 */
export const passwordSchema = z
  .string({ required_error: 'رمز عبور الزامی است' })
  .min(8, 'رمز عبور باید حداقل ۸ نویسه باشد')
  .max(128, 'رمز عبور بیش از حد مجاز است')
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/,
    'رمز عبور باید شامل حرف بزرگ، حرف کوچک، عدد و نماد باشد',
  );
