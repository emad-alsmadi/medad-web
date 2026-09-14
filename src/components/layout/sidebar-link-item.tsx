import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils/cn';
import type { SidebarLink } from '@/components/layout/sidebar-nav';

export function SidebarLinkItem({ link }: { link: SidebarLink }) {
  return (
    <NavLink
      to={link.to}
      end={link.end}
      className={({ isActive }) =>
        cn('app-sidebar__link', 'app-sidebar__link--standalone', isActive && 'active')
      }
    >
      {link.icon}
      <span className="app-sidebar__link-label">{link.label}</span>
    </NavLink>
  );
}
