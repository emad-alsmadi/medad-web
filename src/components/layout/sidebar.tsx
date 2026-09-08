import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { ChevronDown, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useUiStore } from '@/store/ui-store';
import { ROUTES } from '@/constant/routes';
import { reportsGroup, reportTypesGroup, type SidebarGroup } from '@/components/layout/sidebar-nav';

function SidebarGroupItem({ group }: { group: SidebarGroup }) {
  const location = useLocation();
  const hasActiveChild = group.links.some((link) => location.pathname.startsWith(link.to));
  const [open, setOpen] = useState(hasActiveChild);

  return (
    <div
      className={cn(
        'app-sidebar__group',
        open && 'app-sidebar__group--open',
        hasActiveChild && 'app-sidebar__group--active',
      )}
    >
      <button
        type="button"
        className="app-sidebar__group-toggle"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
      >
        {group.icon}
        <span className="app-sidebar__link-label">{group.label}</span>
        <ChevronDown className="app-sidebar__chevron" />
      </button>
      <div className="app-sidebar__group-panel" hidden={!open}>
        {group.links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            className={({ isActive }) => cn('app-sidebar__link', isActive && 'active')}
          >
            {link.icon}
            <span className="app-sidebar__link-label">{link.label}</span>
          </NavLink>
        ))}
      </div>
    </div>
  );
}

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
              <span className="app-sidebar__title">نظام إدارة التقارير مداد</span>
              <small className="app-sidebar__subtitle">الجمهورية العربية السورية</small>
            </span>
          </NavLink>
        </div>
      </div>

      <nav className="app-sidebar__nav">
        <SidebarGroupItem group={reportsGroup} />
        <SidebarGroupItem group={reportTypesGroup} />
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
