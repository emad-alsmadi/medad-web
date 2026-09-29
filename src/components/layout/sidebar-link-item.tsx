import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils/cn';
import { useUiStore } from '@/store/ui-store';
import type { SidebarLink } from '@/components/layout/sidebar-nav';

export function SidebarLinkItem({ link }: { link: SidebarLink }) {
  const isCollapsed = useUiStore((state) => state.isSidebarCollapsed);
  return (
    <NavLink
      to={link.to}
      end={link.end}
      // On the icon rail the label is hidden, so it still names the link and shows on hover.
      aria-label={link.label}
      title={isCollapsed ? link.label : undefined}
      className={({ isActive }) =>
        cn('app-sidebar__link', 'app-sidebar__link--standalone', isActive && 'active')
      }
    >
      {link.icon}
      <span className="app-sidebar__link-label">{link.label}</span>
    </NavLink>
  );
}
