import { AuthenticatedLayout } from '@/layouts/authenticated-layout';
import { adminGroup } from '@/components/layout/sidebar-nav';

export function AdminLayout() {
  return <AuthenticatedLayout adminGroup={adminGroup} />;
}
