import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/button';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { Separator } from '../components/ui/separator';
import {
  HiOutlineHome,
  HiOutlinePlusCircle,
  HiOutlineChartBar,
  HiOutlineCog6Tooth,
  HiOutlineArrowRightOnRectangle,
} from 'react-icons/hi2';

const NAV_ITEMS = [
  { to: '/', icon: HiOutlineHome, labelKey: 'nav.dashboard' },
  { to: '/add-entry', icon: HiOutlinePlusCircle, labelKey: 'nav.addEntry' },
  { to: '/statistics', icon: HiOutlineChartBar, labelKey: 'nav.statistics' },
  { to: '/settings', icon: HiOutlineCog6Tooth, labelKey: 'nav.settings' },
];

export function MainLayout() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-background">
      <aside className="hidden lg:fixed lg:inset-y-0 lg:z-40 lg:flex lg:w-64 lg:flex-col">
        <div className="flex grow flex-col border-r border-border bg-card px-4 py-6">
          <div className="px-2 mb-8">
            <span className="text-xl font-bold text-foreground tracking-tight">
              {t('app.name')}
            </span>
          </div>

          <nav className="flex flex-1 flex-col gap-1">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-200 ${
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  }`
                }
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {t(item.labelKey)}
              </NavLink>
            ))}
          </nav>

          <div className="mt-auto space-y-4">
            <Separator />
            <div className="flex items-center justify-between px-2">
              <LanguageSwitcher />
            </div>
            <div className="px-2">
              <p className="text-xs text-muted-foreground truncate mb-3">
                {user?.email}
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground"
              >
                <HiOutlineArrowRightOnRectangle className="h-5 w-5 shrink-0" />
                {t('nav.logout')}
              </Button>
            </div>
          </div>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 lg:hidden">
          <span className="text-lg font-bold text-foreground tracking-tight">
            {t('app.name')}
          </span>
          <LanguageSwitcher />
        </header>

        <main className="px-4 py-6 pb-24 lg:pb-6 lg:px-8">
          <Outlet />
        </main>
      </div>

      <nav className="fixed bottom-0 inset-x-0 z-40 border-t border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 lg:hidden">
        <div className="flex items-center justify-around h-16 px-2">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-0.5 min-w-[64px] min-h-[48px] rounded-lg px-2 py-1.5 transition-colors duration-200 ${
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground active:text-foreground'
                }`
              }
            >
              <item.icon className="h-6 w-6" />
              <span className="text-[10px] font-medium leading-tight">
                {t(item.labelKey)}
              </span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
