import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { motion, AnimatePresence } from 'framer-motion';
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

const pageVariants = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0 },
};

const pageTransition = {
  duration: 0.2,
  ease: [0.25, 0.1, 0.25, 1],
};

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
      <aside className="hidden lg:fixed lg:inset-y-0 lg:z-40 lg:flex lg:w-[260px] lg:flex-col">
        <div className="flex grow flex-col border-r border-border/40 bg-card/50">
          <div className="flex items-center h-14 px-5">
            <div className="flex items-center gap-2.5">
              <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-xs font-bold text-primary-foreground">U</span>
              </div>
              <span className="text-sm font-semibold text-foreground">
                {t('app.name')}
              </span>
            </div>
          </div>

          <nav className="flex flex-1 flex-col gap-0.5 px-3 pt-4">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `group flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors duration-150 ${
                    isActive
                      ? 'bg-accent text-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                  }`
                }
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {t(item.labelKey)}
              </NavLink>
            ))}
          </nav>

          <div className="px-3 pb-3 space-y-2">
            <div className="border-t border-border/40 pt-3">
              <div className="flex items-center justify-between px-3 mb-2">
                <LanguageSwitcher />
              </div>
            </div>
            <div className="rounded-lg bg-accent/30 px-3 py-2.5">
              <p className="text-[11px] text-muted-foreground truncate mb-2">
                {user?.email}
              </p>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 w-full rounded-md px-2 py-1.5 text-[13px] text-muted-foreground hover:text-foreground transition-colors duration-150"
              >
                <HiOutlineArrowRightOnRectangle className="h-3.5 w-3.5 shrink-0" />
                {t('nav.logout')}
              </button>
            </div>
          </div>
        </div>
      </aside>

      <div className="lg:pl-[260px] flex flex-col min-h-[100dvh]">
        <header
          className="sticky top-0 z-30 flex items-center justify-between border-b border-border/40 bg-background/90 backdrop-blur-xl px-4 sm:px-6 lg:hidden"
          style={{ height: 'calc(3.25rem + var(--safe-top, 0px))', paddingTop: 'var(--safe-top, 0px)' }}
        >
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-primary flex items-center justify-center">
              <span className="text-[10px] font-bold text-primary-foreground">U</span>
            </div>
            <span className="text-sm font-semibold text-foreground">
              {t('app.name')}
            </span>
          </div>
          <LanguageSwitcher />
        </header>

        <main className="flex-1 mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8 py-5 sm:py-6 lg:py-8 pb-[calc(4.5rem+var(--safe-bottom,0px))] lg:pb-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={pageTransition}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <nav
        className="fixed bottom-0 inset-x-0 z-40 border-t border-border/40 bg-background/90 backdrop-blur-xl lg:hidden"
        style={{ paddingBottom: 'var(--safe-bottom, 0px)' }}
      >
        <div className="flex items-stretch justify-around h-[56px]">
          {NAV_ITEMS.map((item) => {
            const isActive = item.to === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.to);
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className="flex flex-col items-center justify-center gap-0.5 flex-1 min-h-[48px] relative transition-colors duration-150"
              >
                {isActive && (
                  <motion.span
                    layoutId="bottomNavIndicator"
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-[2px] rounded-full bg-primary"
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
                <item.icon className={`h-5 w-5 transition-colors duration-150 ${
                  isActive ? 'text-foreground' : 'text-muted-foreground'
                }`} />
                <span className={`text-[10px] font-medium leading-none transition-colors duration-150 ${
                  isActive ? 'text-foreground' : 'text-muted-foreground'
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
