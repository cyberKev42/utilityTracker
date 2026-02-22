import { useTranslation } from 'react-i18next';

export default function Dashboard() {
  const { t } = useTranslation();

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">{t('dashboard.title')}</h1>
      <p className="text-muted-foreground mt-2">
        {t('dashboard.description')}
      </p>
    </div>
  );
}
