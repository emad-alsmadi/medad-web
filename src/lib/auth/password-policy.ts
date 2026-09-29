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

export const PASSWORD_MATCHES_EMAIL = 'يجب ألا تطابق كلمة المرور البريد الإلكتروني';

/** A password that simply repeats the account's email, ignoring case and outer spaces. */
export function matchesEmail(password: string, email: string): boolean {
  const normalizedEmail = email.trim().toLowerCase();
  return normalizedEmail !== '' && password.trim().toLowerCase() === normalizedEmail;
}

/** For a form with both fields: the password may not simply repeat the account's email. */
export function passwordNotEmail(
  values: { email: string; password: string },
  ctx: z.RefinementCtx,
): void {
  if (matchesEmail(values.password, values.email)) {
    ctx.addIssue({ code: 'custom', path: ['password'], message: PASSWORD_MATCHES_EMAIL });
  }
}
