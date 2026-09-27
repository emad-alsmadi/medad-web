import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import type { SidebarGroup } from '@/components/layout/sidebar-nav';

export function SidebarGroupItem({ group }: { group: SidebarGroup }) {
  const location = useLocation();
  const hasActiveChild = group.links.some((link) => location.pathname.startsWith(link.to));
  const [open, setOpen] = useState(hasActiveChild);

  // Also open when navigation lands on one of the group's pages after mount
  // (a redirect, a link from elsewhere); closing it stays the user's choice.
  useEffect(() => {
    if (hasActiveChild) setOpen(true);
  }, [hasActiveChild]);

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
