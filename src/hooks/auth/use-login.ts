import { useMutation, useQueryClient } from '@tanstack/react-query';
import { login, toAuthUser } from '@/lib/auth/api';
import { persistSession } from '@/lib/session/session';
import { queryKeys } from '@/lib/query/query-keys';
import { notify } from '@/lib/notifications/toast';
import { ApiError, isAccountDisabledError } from '@/lib/api/client';
import { tooManyAttemptsMessage } from '@/lib/api/errors';

function getLoginErrorMessage(error: unknown): string {
  const throttled = tooManyAttemptsMessage(error);
  if (throttled) return throttled;
  if (isAccountDisabledError(error)) {
    return 'تم تعطيل هذا الحساب. يرجى مراجعة مدير النظام.';
  }
  if (error instanceof ApiError && error.status === 401) {
    return 'البريد الإلكتروني أو كلمة المرور غير صحيحة.';
  }
  return 'حدث خطأ أثناء تسجيل الدخول. يرجى المحاولة مرة أخرى.';
}

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      const user = toAuthUser(data);
      persistSession({ user, token: data.token, refreshToken: data.refreshToken });
      queryClient.setQueryData(queryKeys.auth.session, user);
      notify.success(`مرحبًا بك، ${user.fullName}`);
    },
    onError: (error) => {
      notify.error(getLoginErrorMessage(error));
    },
  });
}
