import { Outlet } from 'react-router-dom';

/**
 * Shell layout for public/citizen-facing pages.
 */
export function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        Skip to main content
      </a>
      <header className="border-b p-4">{/* Public header/nav */}</header>
      <main className="flex-1 p-6" id="main-content">
        <Outlet />
      </main>
      <footer className="border-t p-4 text-sm text-muted-foreground">{/* Footer */}</footer>
    </div>
  );
}
