import type { ReactNode } from 'react';
import { useSession } from '@/hooks/auth/use-session';
import { AuthContext } from '@/contexts/auth-context';

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: user, isLoading } = useSession();

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        isAuthenticated: Boolean(user),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
