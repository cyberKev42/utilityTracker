import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { LanguageSwitcher } from '../components/LanguageSwitcher';

export function AuthLayout() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background" style={{ paddingTop: 'var(--safe-top, 0px)', paddingBottom: 'var(--safe-bottom, 0px)' }}>
      <div className="flex justify-end px-4 pt-4 sm:px-6 sm:pt-6">
        <LanguageSwitcher />
      </div>
      <div className="flex flex-1 flex-col items-center justify-center px-5 pb-8 sm:px-6">
        <div className="w-full max-w-sm">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
