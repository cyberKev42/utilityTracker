import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../hooks/useLanguage';
import { useCurrency } from '../hooks/useCurrency';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { motion } from 'framer-motion';
import {
  HiOutlineEnvelope,
  HiOutlineGlobeAlt,
  HiOutlineArrowRightOnRectangle,
  HiOutlineCurrencyDollar,
} from 'react-icons/hi2';

const LANGUAGE_FLAGS = {
  en: 'GB',
  de: 'DE',
};

const stagger = {
  animate: { transition: { staggerChildren: 0.06 } },
};

const fadeUp = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.25, ease: [0.25, 0.1, 0.25, 1] } },
};

export default function Settings() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { language, changeLanguage, supportedLanguages } = useLanguage();
  const { currency, changeCurrency, supportedCurrencies } = useCurrency();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <motion.div variants={stagger} initial="initial" animate="animate" className="max-w-2xl space-y-4">
      <motion.div variants={fadeUp}>
        <h1 className="text-xl font-semibold text-foreground tracking-tight">{t('settings.title')}</h1>
        <p className="text-[13px] text-muted-foreground mt-1">{t('settings.description')}</p>
      </motion.div>

      <motion.div variants={fadeUp}>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <HiOutlineEnvelope className="h-[18px] w-[18px] text-primary" />
              </div>
              <div>
                <h2 className="text-sm font-medium text-foreground">{t('settings.account')}</h2>
                <p className="text-xs text-muted-foreground">{t('settings.email')}</p>
              </div>
            </div>
            <div className="rounded-lg bg-accent/40 border border-border/30 px-4 py-3">
              <p className="text-sm text-foreground break-all">{user?.email}</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={fadeUp}>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <HiOutlineGlobeAlt className="h-[18px] w-[18px] text-primary" />
              </div>
              <div>
                <h2 className="text-sm font-medium text-foreground">{t('settings.language')}</h2>
                <p className="text-xs text-muted-foreground">{t('settings.languageDescription')}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {supportedLanguages.map((lang) => {
                const isActive = language === lang.code;
                const flag = LANGUAGE_FLAGS[lang.code];
                return (
                  <motion.button
                    key={lang.code}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => changeLanguage(lang.code)}
                    className={`
                      flex items-center gap-3 rounded-xl border px-4 py-3 min-h-[48px]
                      transition-colors duration-150
                      ${isActive
                        ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                        : 'border-border/40 bg-card active:bg-accent sm:hover:border-border/60'
                      }
                    `}
                  >
                    <span className="text-lg leading-none" role="img" aria-label={lang.label}>
                      {flag === 'GB' ? '\u{1F1EC}\u{1F1E7}' : '\u{1F1E9}\u{1F1EA}'}
                    </span>
                    <div className="text-left">
                      <p className={`text-sm font-medium ${isActive ? 'text-primary' : 'text-foreground'}`}>
                        {t(`settings.${lang.code === 'en' ? 'english' : 'german'}`)}
                      </p>
                      <p className="text-[11px] text-muted-foreground">{lang.label}</p>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={fadeUp}>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <HiOutlineCurrencyDollar className="h-[18px] w-[18px] text-primary" />
              </div>
              <div>
                <h2 className="text-sm font-medium text-foreground">{t('settings.currency')}</h2>
                <p className="text-xs text-muted-foreground">{t('settings.currencyDescription')}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {supportedCurrencies.map((cur) => {
                const isActive = currency === cur.code;
                return (
                  <motion.button
                    key={cur.code}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => changeCurrency(cur.code)}
                    className={`
                      flex items-center gap-3 rounded-xl border px-4 py-3 min-h-[48px]
                      transition-colors duration-150
                      ${isActive
                        ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                        : 'border-border/40 bg-card active:bg-accent sm:hover:border-border/60'
                      }
                    `}
                  >
                    <span className="text-base font-medium leading-none text-muted-foreground">
                      {cur.symbol}
                    </span>
                    <div className="text-left">
                      <p className={`text-sm font-medium ${isActive ? 'text-primary' : 'text-foreground'}`}>
                        {cur.code}
                      </p>
                      <p className="text-[11px] text-muted-foreground">{cur.label}</p>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={fadeUp}>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-9 w-9 rounded-lg bg-destructive/10 flex items-center justify-center shrink-0">
                <HiOutlineArrowRightOnRectangle className="h-[18px] w-[18px] text-destructive" />
              </div>
              <div>
                <h2 className="text-sm font-medium text-foreground">{t('settings.logoutTitle')}</h2>
                <p className="text-xs text-muted-foreground">{t('settings.logoutDescription')}</p>
              </div>
            </div>
            <motion.div whileTap={{ scale: 0.98 }}>
              <Button
                variant="destructive"
                onClick={handleLogout}
                className="w-full h-11 sm:w-auto"
              >
                <HiOutlineArrowRightOnRectangle className="h-4 w-4 mr-2" />
                {t('settings.logoutButton')}
              </Button>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
