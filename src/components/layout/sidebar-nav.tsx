import type { ReactNode } from 'react';
import { FileText, FolderTree, User, Users } from 'lucide-react';
import { ROUTES } from '@/constant/routes';

export interface SidebarLink {
  to: string;
  label: string;
  icon: ReactNode;
  end?: boolean;
}

export interface SidebarGroup {
  label: string;
  icon: ReactNode;
  links: SidebarLink[];
}

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
    { to: ROUTES.reports.list, label: 'كل الضبوط', icon: <FileText />, end: true },
    { to: ROUTES.reportTypes.list, label: 'أنواع الضبوط', icon: <FolderTree /> },
  ],
};

export const adminGroup: SidebarGroup = {
  label: 'إدارة النظام',
  icon: <Users />,
  links: [{ to: ROUTES.admin.users, label: 'المستخدمون', icon: <Users />, end: true }],
};
