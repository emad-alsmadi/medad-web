import { Helmet } from 'react-helmet-async';
import { useAuthContext } from '@/contexts/auth-context';
import { ThemeCard } from '@/components/settings/theme-card';
import { FontSizeCard } from '@/components/settings/font-size-card';
import { ChangePasswordCard } from '@/components/settings/change-password-card';

/** The signed-in user's own preferences (theme, text size) and password. Open to everyone. */
export function SettingsPage() {
  const { user } = useAuthContext();

  return (
    <>
      <Helmet>
        <title>الإعدادات</title>
      </Helmet>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold">الإعدادات</h1>
          <p className="text-sm text-muted-foreground">مظهر الموقع وحجم الخط وكلمة المرور.</p>
        </div>
        <ThemeCard />
        <FontSizeCard />
        {user && <ChangePasswordCard email={user.email} />}
      </div>
    </>
  );
}
