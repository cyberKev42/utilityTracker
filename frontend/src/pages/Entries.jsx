import { useTranslation } from 'react-i18next';

export default function Entries() {
  const { t } = useTranslation();

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">{t('entries.title')}</h1>
      <p className="text-muted-foreground mt-2">
        {t('entries.description')}
      </p>
    </div>
  );
}
