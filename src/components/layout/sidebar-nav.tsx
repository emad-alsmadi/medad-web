import type { ReactNode } from 'react';
import { FileText, FolderTree, ListTree, Users } from 'lucide-react';
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

export const reportsGroup: SidebarGroup = {
  label: 'التقارير',
  icon: <FileText />,
  links: [
    { to: ROUTES.reports.list, label: 'كل التقارير', icon: <FileText />, end: true },
    { to: ROUTES.reports.create, label: 'تقرير جديد', icon: <FileText /> },
  ],
};

export const reportTypesGroup: SidebarGroup = {
  label: 'أنواع التقارير',
  icon: <FolderTree />,
  links: [
    { to: ROUTES.reportTypes.list, label: 'القائمة', icon: <ListTree />, end: true },
    { to: ROUTES.reportTypes.tree, label: 'العرض الشجري', icon: <FolderTree /> },
  ],
};

export const adminGroup: SidebarGroup = {
  label: 'إدارة النظام',
  icon: <Users />,
  links: [{ to: ROUTES.admin.users, label: 'المستخدمون', icon: <Users />, end: true }],
};
