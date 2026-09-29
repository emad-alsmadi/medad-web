import type { ReactNode } from 'react';
import {
  FileText,
  FolderTree,
  Gavel,
  LayoutDashboard,
  ShieldCheck,
  User,
  Users,
} from 'lucide-react';
import { ROUTES } from '@/constant/routes';
import type { Action, Resource } from '@/types/role';

/** Where the sidebar stops being a mobile drawer (globals.css switches at 991.98px). */
export const DESKTOP_SIDEBAR_QUERY = '(min-width: 992px)';
export interface SidebarLink {
  to: string;
  label: string;
  icon: ReactNode;
  end?: boolean;
  /** Shown only when the user's role grants it; no permission means always shown. */
  permission?: { resource: Resource; action: Action };
}

export interface SidebarGroup {
  label: string;
  icon: ReactNode;
  links: SidebarLink[];
}

export const dashboardLink: SidebarLink = {
  to: ROUTES.admin.dashboard,
  label: 'نظرة عامة',
  icon: <LayoutDashboard />,
  end: true,
  permission: { resource: 'REPORTS', action: 'VIEW' },
};

export const profileLink: SidebarLink = {
  to: ROUTES.profile,
  label: 'الملف الشخصي',
  icon: <User />,
  end: true,
};

export const reportsGroup: SidebarGroup = {
  label: 'الضبوط',
  icon: <FileText />,
  links: [
    {
      to: ROUTES.reports.list,
      label: 'كل الضبوط',
      icon: <FileText />,
      // Not `end`: a report's edit page (/reports/:id/edit) belongs here too.
      permission: { resource: 'REPORTS', action: 'VIEW' },
    },
    {
      to: ROUTES.formTypes.list,
      label: 'نماذج الضبوط',
      icon: <FolderTree />,
      permission: { resource: 'FORM_TYPES', action: 'VIEW' },
    },
    {
      to: ROUTES.crimeTypes.list,
      label: 'أنواع الجرم',
      icon: <Gavel />,
      end: true,
      permission: { resource: 'CRIME_TYPES', action: 'VIEW' },
    },
  ],
};

export const adminGroup: SidebarGroup = {
  label: 'إدارة النظام',
  icon: <Users />,
  links: [
    {
      to: ROUTES.admin.users,
      label: 'المستخدمون',
      icon: <Users />,
      end: true,
      permission: { resource: 'USERS', action: 'VIEW' },
    },
    {
      to: ROUTES.admin.roles,
      label: 'الأدوار والصلاحيات',
      icon: <ShieldCheck />,
      end: true,
      permission: { resource: 'ROLES', action: 'VIEW' },
    },
  ],
};
