import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils/cn';
import { useUiStore } from '@/store/ui-store';
import { useAuthContext } from '@/contexts/auth-context';
import { useLogout } from '@/hooks/auth/use-logout';
import { Header } from '@/components/layout/header';
import { Sidebar, SidebarBackdrop } from '@/components/layout/sidebar';
import { Footer } from '@/components/layout/footer';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

export function AuthenticatedLayout() {
  const isSidebarCollapsed = useUiStore((state) => state.isSidebarCollapsed);
  const isSidebarOpen = useUiStore((state) => state.isSidebarOpen);
  const setSidebarOpen = useUiStore((state) => state.setSidebarOpen);
  const { pathname } = useLocation();
  const { user } = useAuthContext();
  const logout = useLogout();
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);

  // The mobile drawer covers the page, so it closes once a link has taken the user somewhere.
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname, setSidebarOpen]);

  const handleConfirmLogout = () => {
    setIsLogoutConfirmOpen(false);
    logout();
  };

  return (
    <div
      className={cn(
        'admin-shell',
        isSidebarCollapsed && 'admin-shell--collapsed',
        isSidebarOpen && 'admin-shell--mobile-open',
      )}
    >
      <Sidebar onLogout={() => setIsLogoutConfirmOpen(true)} />
      <SidebarBackdrop />
      <div className="admin-shell__main">
        <Header user={user} onLogout={() => setIsLogoutConfirmOpen(true)} />
        <main className="main-content flex-1 p-6" id="main-content">
          <Outlet />
        </main>
        <Footer />
      </div>

      <ConfirmDialog
        open={isLogoutConfirmOpen}
        onOpenChange={setIsLogoutConfirmOpen}
        title="تسجيل الخروج"
        message="هل أنت متأكد أنك تريد تسجيل الخروج؟"
        confirmLabel="تسجيل الخروج"
        onConfirm={handleConfirmLogout}
      />
    </div>
  );
}
