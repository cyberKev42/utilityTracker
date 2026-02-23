import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/button';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
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
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-[100dvh] bg-background">
      <aside className="hidden lg:fixed lg:inset-y-0 lg:z-40 lg:flex lg:w-[280px] lg:flex-col">
        <div className="flex grow flex-col border-r border-border/60 bg-card">
          <div className="flex items-center h-16 px-6 border-b border-border/60">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-sm font-bold text-primary-foreground">U</span>
              </div>
              <span className="text-base font-semibold text-foreground tracking-tight">
                {t('app.name')}
              </span>
            </div>
          </div>

          <nav className="flex flex-1 flex-col gap-1 px-3 pt-6">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `group flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  }`
                }
              >
                <item.icon className="h-[18px] w-[18px] shrink-0" />
                {t(item.labelKey)}
              </NavLink>
            ))}
          </nav>

          <div className="px-3 pb-4 space-y-3">
            <div className="border-t border-border/60 pt-4">
              <div className="flex items-center justify-between px-3 mb-3">
                <LanguageSwitcher />
              </div>
            </div>
            <div className="rounded-lg bg-secondary/50 p-3">
              <p className="text-[11px] text-muted-foreground truncate mb-2.5">
                {user?.email}
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="w-full justify-start gap-2.5 h-9 text-[13px] text-muted-foreground hover:text-foreground px-2"
              >
                <HiOutlineArrowRightOnRectangle className="h-4 w-4 shrink-0" />
                {t('nav.logout')}
              </Button>
            </div>
          </div>
        </div>
      </aside>

      <div className="lg:pl-[280px] flex flex-col min-h-[100dvh]">
        <header
          className="sticky top-0 z-30 flex items-center justify-between border-b border-border/60 bg-background/80 backdrop-blur-xl px-4 sm:px-6 lg:hidden"
          style={{ height: 'calc(3.5rem + var(--safe-top, 0px))', paddingTop: 'var(--safe-top, 0px)' }}
        >
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-md bg-primary flex items-center justify-center">
              <span className="text-xs font-bold text-primary-foreground">U</span>
            </div>
            <span className="text-base font-semibold text-foreground tracking-tight">
              {t('app.name')}
            </span>
          </div>
          <LanguageSwitcher />
        </header>

        <main className="flex-1 mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8 py-5 sm:py-6 lg:py-8 pb-[calc(5.5rem+var(--safe-bottom,0px))] lg:pb-8">
          <Outlet />
        </main>
      </div>

      <nav
        className="fixed bottom-0 inset-x-0 z-40 border-t border-border/60 bg-card/80 backdrop-blur-xl lg:hidden"
        style={{ paddingBottom: 'var(--safe-bottom, 0px)' }}
      >
        <div className="flex items-stretch justify-around h-[62px]">
          {NAV_ITEMS.map((item) => {
            const isActive = item.to === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.to);
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className="flex flex-col items-center justify-center gap-1 flex-1 min-h-[48px] relative transition-colors duration-200"
              >
                {isActive && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[2px] rounded-full bg-primary" />
                )}
                <item.icon className={`h-[22px] w-[22px] transition-colors duration-200 ${
                  isActive ? 'text-primary' : 'text-muted-foreground'
                }`} />
                <span className={`text-[10px] font-medium leading-none transition-colors duration-200 ${
                  isActive ? 'text-primary' : 'text-muted-foreground'
                }`}>
                  {t(item.labelKey)}
                </span>
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
