import { Bell, ChevronDown, LogOut, Menu, Moon, Settings, Sun, User } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useUiStore } from '@/store/ui-store';
import { useTheme } from '@/contexts/theme-context';
import type { AuthUser } from '@/types/auth';

const ROLE_LABELS: Record<AuthUser['role'], string> = {
  ADMIN: 'مدير النظام',
  USER: 'مستخدم',
};

export function Header({ user, onLogout }: { user: AuthUser | null; onLogout: () => void }) {
  const toggleSidebar = useUiStore((state) => state.toggleSidebar);
  const { theme, setTheme } = useTheme();

  return (
    <header className="app-top-header" id="app-top-header">
      <div className="app-top-header__shell">
        <div className="app-top-header__backdrop" aria-hidden="true" />
        <div className="app-top-header__inner">
          <div className="app-top-header__start">
            <button
              type="button"
              className="app-top-header__menu-btn"
              aria-label="فتح القائمة الجانبية"
              onClick={toggleSidebar}
            >
              <Menu />
            </button>
            <div className="app-top-header__brand">
              <span className="app-top-header__brand-text">
                <span className="app-top-header__brand-title">  نظام إدارة التقارير</span>
                <span className="app-top-header__brand-subtitle">الجمهورية العربية السورية</span>
              </span>
            </div>
          </div>

          <div className="app-top-header__end">
            <div className="app-top-header__tool-cluster">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="app-top-header__tool-btn"
                    aria-label="الإشعارات"
                  >
                    <Bell />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-72">
                  <DropdownMenuLabel>الإشعارات</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <div className="px-2.5 py-6 text-center text-sm text-muted-foreground">
                    لا توجد إشعارات حالياً
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              <span className="app-top-header__tool-divider" aria-hidden="true" />

              <button
                type="button"
                className="app-top-header__tool-btn theme-toggle-btn"
                aria-label="تبديل الوضع الليلي والنهاري"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              >
                {theme === 'dark' ? <Sun /> : <Moon />}
              </button>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button type="button" className="app-top-header__user-btn">
                  <span className="app-top-header__user-avatar">
                    <User />
                  </span>
                  <span className="app-top-header__user-meta">
                    <span className="app-top-header__user-name">{user?.fullName}</span>
                    <span className="app-top-header__user-role">
                      {user ? ROLE_LABELS[user.role] : ''}
                    </span>
                  </span>
                  <ChevronDown className="app-top-header__user-caret" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <div className="flex flex-col gap-0.5 px-2.5 py-2">
                  <span className="text-sm font-semibold text-foreground">{user?.fullName}</span>
                  <span className="text-xs text-muted-foreground">
                    {user ? ROLE_LABELS[user.role] : ''}
                  </span>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <User />
                  <span>الملف الشخصي</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings />
                  <span>الإعدادات</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onSelect={onLogout}>
                  <LogOut />
                  <span>تسجيل الخروج</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <div className="app-top-header__accent" aria-hidden="true" />
      </div>
    </header>
  );
}
