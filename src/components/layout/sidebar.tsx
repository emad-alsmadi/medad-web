import { NavLink } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useUiStore } from '@/store/ui-store';
import { ROUTES } from '@/constant/routes';
import { profileLink, reportsGroup, type SidebarGroup } from '@/components/layout/sidebar-nav';
import { SidebarLinkItem } from '@/components/layout/sidebar-link-item';
import { SidebarGroupItem } from '@/components/layout/sidebar-group-item';

export function Sidebar({
  adminGroup,
  onLogout,
}: {
  adminGroup?: SidebarGroup;
  onLogout: () => void;
}) {
  const isSidebarOpen = useUiStore((state) => state.isSidebarOpen);

  return (
    <aside
      className={cn('app-sidebar', isSidebarOpen && 'app-sidebar--mobile-open')}
      aria-label="التنقل الرئيسي"
    >
      <div className="app-sidebar__brand">
        <div className="app-sidebar__brand-cluster">
          <NavLink to={ROUTES.home} className="app-sidebar__brand-link">
            <img
              src="/images/شعار_الهوية_البصرية_السورية.svg"
              alt="شعار الجمهورية العربية السورية"
              className="app-sidebar__logo"
            />
            <span className="app-sidebar__brand-text">
              <span className="app-sidebar__title">نظام إدارة الضبوط مداد</span>
              <small className="app-sidebar__subtitle">الجمهورية العربية السورية</small>
            </span>
          </NavLink>
        </div>
      </div>

      <nav className="app-sidebar__nav">
        <SidebarGroupItem group={reportsGroup} />
        <SidebarLinkItem link={profileLink} />
        {adminGroup && <SidebarGroupItem group={adminGroup} />}
      </nav>

      <div className="app-sidebar__footer">
        <button type="button" className="app-sidebar__logout-btn" onClick={onLogout}>
          <LogOut />
          <span className="app-sidebar__link-label">تسجيل الخروج</span>
        </button>
      </div>
    </aside>
  );
}

export function SidebarBackdrop() {
  const isSidebarOpen = useUiStore((state) => state.isSidebarOpen);
  const setSidebarOpen = useUiStore((state) => state.setSidebarOpen);

  if (!isSidebarOpen) return null;

  return (
    <button
      type="button"
      className="app-sidebar-backdrop"
      aria-label="إغلاق القائمة الجانبية"
      onClick={() => setSidebarOpen(false)}
    />
  );
}
