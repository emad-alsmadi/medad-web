import { z } from 'zod';

/** Shown under every field where a password is set, so the rule is known before submitting. */
export const PASSWORD_HINT = '10 أحرف على الأقل، فيها حرف ورقم، ولا تطابق البريد الإلكتروني.';

/**
 * The rule for a new password (plan D5). Signing in never applies it, so
 * existing accounts with older, weaker passwords can still log in.
 */
export const newPasswordSchema = z
  .string()
  .min(10, 'يجب ألا تقل كلمة المرور عن 10 أحرف')
  .regex(/\p{L}/u, 'يجب أن تحتوي كلمة المرور على حرف واحد على الأقل')
  .regex(/[0-9٠-٩۰-۹]/, 'يجب أن تحتوي كلمة المرور على رقم واحد على الأقل');

/** For a form with both fields: the password may not simply repeat the account's email. */
export function passwordNotEmail(
  values: { email: string; password: string },
  ctx: z.RefinementCtx,
): void {
  const email = values.email.trim().toLowerCase();
  if (email !== '' && values.password.trim().toLowerCase() === email) {
    ctx.addIssue({
      code: 'custom',
      path: ['password'],
      message: 'يجب ألا تطابق كلمة المرور البريد الإلكتروني',
    });
  }
}
