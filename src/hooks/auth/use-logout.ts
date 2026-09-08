import { useQueryClient } from '@tanstack/react-query';
import { clearSession } from '@/lib/session/session';

/**
 * No /auth/logout endpoint exists — the backend is stateless (JWT), so
 * logging out is purely a client-side session clear. Navigation to the
 * login page is left to the caller to keep this hook routing-agnostic.
 */
export function useLogout() {
  const queryClient = useQueryClient();

  return () => {
    clearSession();
    queryClient.clear();
  };
}
