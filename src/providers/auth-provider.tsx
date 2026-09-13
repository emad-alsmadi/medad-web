import { useMemo } from 'react';
import type { ReactNode } from 'react';
import { useSession } from '@/hooks/auth/use-session';
import { AuthContext } from '@/contexts/auth-context';

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: user, isLoading } = useSession();

  // Memoized so consumers (RequireAuth, GuestOnlyRoute) only re-render when
  // the auth state actually changes. Without this, every AuthProvider
  // render (e.g. from an unrelated parent re-render) created a brand new
  // context value object, which each guard's <Navigate state={{ from }}>
  // picked up as a "changed" state and re-navigated on — an infinite
  // render loop ("Maximum update depth exceeded") between / and /login.
  const value = useMemo(
    () => ({
      user: user ?? null,
      isLoading,
      isAuthenticated: Boolean(user),
    }),
    [user, isLoading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
