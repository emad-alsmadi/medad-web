import type { ReactNode } from 'react';
import { FileText, FolderTree, Gavel, LayoutDashboard, User, Users } from 'lucide-react';
import { ROUTES } from '@/constant/routes';
import { FEATURES } from '@/constant/features';

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

export const dashboardLink: SidebarLink = {
  to: ROUTES.admin.dashboard,
  label: 'نظرة عامة',
  icon: <LayoutDashboard />,
  end: true,
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
    { to: ROUTES.reports.list, label: 'كل الضبوط', icon: <FileText />, end: true },
    { to: ROUTES.formTypes.list, label: 'نماذج الضبوط', icon: <FolderTree /> },
    { to: ROUTES.crimeTypes.list, label: 'أنواع الجرم', icon: <Gavel />, end: true },
  ],
};

export const adminGroup: SidebarGroup = {
  label: 'إدارة النظام',
  icon: <Users />,
  links: FEATURES.usersPage
    ? [{ to: ROUTES.admin.users, label: 'المستخدمون', icon: <Users />, end: true }]
    : [],
};
