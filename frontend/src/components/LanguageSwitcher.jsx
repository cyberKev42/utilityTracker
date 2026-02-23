import { useLanguage } from '../hooks/useLanguage';

export function LanguageSwitcher() {
  const { language, changeLanguage, supportedLanguages } = useLanguage();

  return (
    <div className="flex items-center gap-0.5 rounded-md bg-secondary p-0.5">
      {supportedLanguages.map((lang) => {
        const isActive = language === lang.code;
        return (
          <button
            key={lang.code}
            onClick={() => changeLanguage(lang.code)}
            className={`h-7 px-2.5 rounded text-xs font-medium transition-colors duration-150 ${
              isActive
                ? 'bg-accent text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {lang.code.toUpperCase()}
          </button>
        );
      })}
    </div>
  );
}
