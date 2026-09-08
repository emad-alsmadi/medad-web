import type { ReactNode } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { DirectionProvider } from '@radix-ui/react-direction';
import { Toaster } from 'sonner';
import { QueryProvider } from '@/providers/query-provider';
import { AuthProvider } from '@/providers/auth-provider';
import { ThemeProvider } from '@/providers/theme-provider';

/**
 * Single composition root for all app-wide providers. main.tsx renders
 * only <AppProviders><App /></AppProviders> — adding a new global
 * provider means editing this file only.
 */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <HelmetProvider>
      <QueryProvider>
        <ThemeProvider>
          {/* App is RTL-only (index.html sets dir="rtl") — this tells every
              Radix Popper-based primitive (dropdown menu, select, tooltip)
              to compute placement/alignment for RTL instead of defaulting
              to LTR. */}
          <DirectionProvider dir="rtl">
            <BrowserRouter>
              <AuthProvider>{children}</AuthProvider>
              <Toaster richColors closeButton position="top-center" />
            </BrowserRouter>
          </DirectionProvider>
        </ThemeProvider>
      </QueryProvider>
    </HelmetProvider>
  );
}
