import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../hooks/useLanguage';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import {
  HiOutlineEnvelope,
  HiOutlineGlobeAlt,
  HiOutlineArrowRightOnRectangle,
} from 'react-icons/hi2';

const LANGUAGE_FLAGS = {
  en: 'GB',
  de: 'DE',
};

export default function Settings() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { language, changeLanguage, supportedLanguages } = useLanguage();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="max-w-2xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">{t('settings.title')}</h1>
        <p className="text-sm text-muted-foreground mt-1.5">{t('settings.description')}</p>
      </div>

      <Card>
        <CardContent className="p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <HiOutlineEnvelope className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground">{t('settings.account')}</h2>
              <p className="text-xs text-muted-foreground">{t('settings.email')}</p>
            </div>
          </div>
          <div className="rounded-lg bg-secondary/80 border border-border/40 px-4 py-3">
            <p className="text-sm text-foreground break-all">{user?.email}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <HiOutlineGlobeAlt className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground">{t('settings.language')}</h2>
              <p className="text-xs text-muted-foreground">{t('settings.languageDescription')}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {supportedLanguages.map((lang) => {
              const isActive = language === lang.code;
              const flag = LANGUAGE_FLAGS[lang.code];
              return (
                <button
                  key={lang.code}
                  onClick={() => changeLanguage(lang.code)}
                  className={`
                    flex items-center gap-3 rounded-xl border px-4 py-3.5
                    transition-all duration-200
                    ${isActive
                      ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                      : 'border-border/50 bg-secondary hover:border-border hover:bg-accent'
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
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          <div className="flex items-center gap-3 mb-5">
            <div className="h-10 w-10 rounded-xl bg-destructive/10 flex items-center justify-center shrink-0">
              <HiOutlineArrowRightOnRectangle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground">{t('settings.logoutTitle')}</h2>
              <p className="text-xs text-muted-foreground">{t('settings.logoutDescription')}</p>
            </div>
          </div>
          <Button
            variant="destructive"
            onClick={handleLogout}
            className="w-full sm:w-auto h-11"
          >
            <HiOutlineArrowRightOnRectangle className="h-4 w-4 mr-2" />
            {t('settings.logoutButton')}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
