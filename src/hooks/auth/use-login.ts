import { useMutation, useQueryClient } from '@tanstack/react-query';
import { login } from '@/lib/auth/api';
import { persistSession } from '@/lib/session/session';
import { queryKeys } from '@/lib/query/query-keys';
import { notify } from '@/lib/notifications/toast';
import { ApiError, isAccountDisabledError } from '@/lib/api/client';
import type { AuthUser } from '@/types/auth';

function getLoginErrorMessage(error: unknown): string {
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
      const user: AuthUser = {
        id: data.id,
        fullName: data.fullName,
        email: data.email,
        role: data.role,
        permissions: data.permissions,
      };
      persistSession({ user, token: data.token, refreshToken: data.refreshToken });
      queryClient.setQueryData(queryKeys.auth.session, user);
      notify.success(`مرحبًا بك، ${user.fullName}`);
    },
    onError: (error) => {
      notify.error(getLoginErrorMessage(error));
    },
  });
}
