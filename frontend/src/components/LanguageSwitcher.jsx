import { useLanguage } from '../hooks/useLanguage';
import { Button } from './ui/button';

export function LanguageSwitcher() {
  const { language, changeLanguage, supportedLanguages } = useLanguage();

  return (
    <div className="flex items-center gap-1">
      {supportedLanguages.map((lang) => (
        <Button
          key={lang.code}
          variant={language === lang.code ? 'default' : 'ghost'}
          size="sm"
          onClick={() => changeLanguage(lang.code)}
          className="h-7 px-2 text-xs font-medium"
        >
          {lang.code.toUpperCase()}
        </Button>
      ))}
    </div>
  );
}
