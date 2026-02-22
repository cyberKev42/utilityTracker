import { useTranslation } from 'react-i18next';

export default function Statistics() {
  const { t } = useTranslation();

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">{t('statistics.title')}</h1>
      <p className="text-muted-foreground mt-2">
        {t('statistics.description')}
      </p>
    </div>
  );
}
