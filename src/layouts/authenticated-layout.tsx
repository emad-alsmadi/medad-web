import { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils/cn';
import { useUiStore } from '@/store/ui-store';
import { useAuthContext } from '@/contexts/auth-context';
import { useLogout } from '@/hooks/auth/use-logout';
import { Header } from '@/components/layout/header';
import { Sidebar, SidebarBackdrop } from '@/components/layout/sidebar';
import type { SidebarGroup } from '@/components/layout/sidebar-nav';
import { Footer } from '@/components/layout/footer';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { ROUTES } from '@/constant/routes';

export function AuthenticatedLayout({ adminGroup }: { adminGroup?: SidebarGroup }) {
  const isSidebarCollapsed = useUiStore((state) => state.isSidebarCollapsed);
  const isSidebarOpen = useUiStore((state) => state.isSidebarOpen);
  const { user } = useAuthContext();
  const logout = useLogout();
  const navigate = useNavigate();
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);

  const handleConfirmLogout = () => {
    logout();
    setIsLogoutConfirmOpen(false);
    void navigate(ROUTES.login, { replace: true });
  };

  return (
    <div
      className={cn(
        'admin-shell',
        isSidebarCollapsed && 'admin-shell--collapsed',
        isSidebarOpen && 'admin-shell--mobile-open',
      )}
    >
      <Sidebar adminGroup={adminGroup} onLogout={() => setIsLogoutConfirmOpen(true)} />
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
