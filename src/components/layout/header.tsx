import { useRef, useSyncExternalStore } from 'react';
import { ChevronDown, KeyRound, LogOut, Menu, Moon, Sun, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useUiStore } from '@/store/ui-store';
import { useTheme } from '@/contexts/theme-context';
import { ROUTES } from '@/constant/routes';
import { roleLabel } from '@/lib/auth/permissions';
import { DESKTOP_SIDEBAR_QUERY } from '@/components/layout/sidebar-nav';
import { CHANGE_PASSWORD_ANCHOR } from '@/components/profile/change-password-card';
import type { AuthUser } from '@/types/auth';

function subscribeToDesktop(onChange: () => void) {
  const query = window.matchMedia(DESKTOP_SIDEBAR_QUERY);
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
}

const isDesktopNow = () => window.matchMedia(DESKTOP_SIDEBAR_QUERY).matches;

export function Header({ user, onLogout }: { user: AuthUser | null; onLogout: () => void }) {
  const isSidebarOpen = useUiStore((state) => state.isSidebarOpen);
  const toggleSidebar = useUiStore((state) => state.toggleSidebar);
  const isSidebarCollapsed = useUiStore((state) => state.isSidebarCollapsed);
  const toggleSidebarCollapsed = useUiStore((state) => state.toggleSidebarCollapsed);
  const isDesktop = useSyncExternalStore(subscribeToDesktop, isDesktopNow);
  // One button: collapses the sidebar to its icon rail on desktop, slides the drawer on mobile.
  const isSidebarShown = isDesktop ? !isSidebarCollapsed : isSidebarOpen;
  const { theme, setTheme } = useTheme();
  // Set by the password item: the card it opens takes focus, so the menu mustn't hand it back.
  const keepFocusOnPage = useRef(false);
  const navigate = useNavigate();

  return (
    <header className="app-top-header" id="app-top-header">
      <div className="app-top-header__shell">
        <div className="app-top-header__backdrop" aria-hidden="true" />
        <div className="app-top-header__inner">
          <div className="app-top-header__start">
            <button
              type="button"
              className="app-top-header__menu-btn"
              aria-label={isSidebarShown ? 'طي القائمة الجانبية' : 'إظهار القائمة الجانبية'}
              aria-expanded={isSidebarShown}
              onClick={isDesktop ? toggleSidebarCollapsed : toggleSidebar}
            >
              <Menu />
            </button>
            <div className="app-top-header__brand">
              <span className="app-top-header__brand-text">
                <span className="app-top-header__brand-title">  نظام إدارة الضبوط</span>
                <span className="app-top-header__brand-subtitle">الجمهورية العربية السورية</span>
              </span>
            </div>
          </div>

          <div className="app-top-header__end">
            <div className="app-top-header__tool-cluster">
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
                      {user ? roleLabel(user.role) : ''}
                    </span>
                  </span>
                  <ChevronDown className="app-top-header__user-caret" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-64"
                onCloseAutoFocus={(e) => {
                  if (!keepFocusOnPage.current) return;
                  keepFocusOnPage.current = false;
                  e.preventDefault();
                }}
              >
                <div className="flex flex-col gap-0.5 px-2.5 py-2">
                  <span className="text-sm font-semibold text-foreground">{user?.fullName}</span>
                  <span className="text-xs text-muted-foreground">
                    {user ? roleLabel(user.role) : ''}
                  </span>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => void navigate(ROUTES.profile)}>
                  <User />
                  <span>الملف الشخصي</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => {
                    keepFocusOnPage.current = true;
                    void navigate(`${ROUTES.profile}#${CHANGE_PASSWORD_ANCHOR}`);
                  }}
                >
                  <KeyRound />
                  <span>تغيير كلمة المرور</span>
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
