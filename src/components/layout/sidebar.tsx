import { NavLink } from 'react-router-dom';
import { LogOut, X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useUiStore } from '@/store/ui-store';
import { useCan } from '@/hooks/auth/use-can';
import { ROUTES } from '@/constant/routes';
import {
  adminGroup,
  dashboardLink,
  profileLink,
  settingsLink,
  reportsGroup,
  type SidebarGroup,
  type SidebarLink,
} from '@/components/layout/sidebar-nav';
import { SidebarLinkItem } from '@/components/layout/sidebar-link-item';
import { SidebarGroupItem } from '@/components/layout/sidebar-group-item';

export function Sidebar({ onLogout }: { onLogout: () => void }) {
  const isSidebarOpen = useUiStore((state) => state.isSidebarOpen);
  const setSidebarOpen = useUiStore((state) => state.setSidebarOpen);
  const can = useCan();

  const isVisible = (link: SidebarLink) =>
    !link.permission || can(link.permission.resource, link.permission.action);
  const visibleGroup = (group: SidebarGroup): SidebarGroup => ({
    ...group,
    links: group.links.filter(isVisible),
  });
  const reports = visibleGroup(reportsGroup);
  const admin = visibleGroup(adminGroup);

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
              <span className="app-sidebar__title">نظام إدارة الضبوط </span>
              <small className="app-sidebar__subtitle">الجمهورية العربية السورية</small>
            </span>
          </NavLink>
        </div>
        <button
          type="button"
          className="app-sidebar__close-btn"
          aria-label="إغلاق القائمة الجانبية"
          onClick={() => setSidebarOpen(false)}
        >
          <X />
        </button>
      </div>

      <nav className="app-sidebar__nav">
        {isVisible(dashboardLink) && <SidebarLinkItem link={dashboardLink} />}
        {reports.links.length > 0 && <SidebarGroupItem group={reports} />}
        <SidebarLinkItem link={profileLink} />
        {admin.links.length > 0 && <SidebarGroupItem group={admin} />}
        <SidebarLinkItem link={settingsLink} />
      </nav>

      <div className="app-sidebar__footer">
        <button
          type="button"
          className="app-sidebar__logout-btn"
          aria-label="تسجيل الخروج"
          onClick={onLogout}
        >
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
