import { Outlet } from 'react-router-dom';
import { cn } from '@/lib/utils/cn';
import { useUiStore } from '@/store/ui-store';

/**
 * Shell layout for the admin role. Role-specific navigation/sidebar
 * content can be filled in once real modules are defined — this is
 * intentionally minimal.
 */
export function AdminLayout() {
  const isSidebarOpen = useUiStore((state) => state.isSidebarOpen);

  return (
    <div className="flex min-h-screen bg-background">
      <aside
        className={cn(
          'shrink-0 border-e bg-card transition-all',
          isSidebarOpen ? 'w-64' : 'w-0 overflow-hidden',
        )}
        aria-label="Admin navigation"
      >
        {/* Role-specific nav goes here */}
      </aside>
      <div className="flex flex-1 flex-col">
        <header className="flex h-14 items-center border-b px-4">
          {/* Topbar: user menu, language switcher, etc. */}
        </header>
        <main className="flex-1 p-6" id="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
