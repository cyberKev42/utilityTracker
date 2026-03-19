import { useTranslation } from 'react-i18next';
import {
  HiOutlineBolt,
  HiOutlineBeaker,
  HiOutlineFire,
  HiOutlineHomeModern,
  HiOutlineWrenchScrewdriver,
  HiOutlineSun,
  HiOutlineMoon,
  HiOutlineCloud,
  HiOutlineSnowflake,
  HiOutlineDroplets,
  HiOutlineTruck,
  HiOutlineGlobeAlt,
  HiOutlineChartBar,
  HiOutlineCog6Tooth,
  HiOutlineCpuChip,
  HiOutlineBuildingOffice,
  HiOutlineBuildingStorefront,
  HiOutlineShoppingCart,
  HiOutlineCurrencyEuro,
  HiOutlineLeaf,
  HiOutlineArrowsRightLeft,
  HiOutlineSignal,
  HiOutlineWifi,
  HiOutlineComputerDesktop,
  HiOutlineDevicePhoneMobile,
  HiOutlineCamera,
  HiOutlineSpeakerWave,
  HiOutlinePaperAirplane,
  HiOutlineRocketLaunch,
  HiOutlineSparkles,
} from 'react-icons/hi2';

export const ICON_MAP = {
  HiOutlineBolt,
  HiOutlineBeaker,
  HiOutlineFire,
  HiOutlineHomeModern,
  HiOutlineWrenchScrewdriver,
  HiOutlineSun,
  HiOutlineMoon,
  HiOutlineCloud,
  HiOutlineSnowflake,
  HiOutlineDroplets,
  HiOutlineTruck,
  HiOutlineGlobeAlt,
  HiOutlineChartBar,
  HiOutlineCog6Tooth,
  HiOutlineCpuChip,
  HiOutlineBuildingOffice,
  HiOutlineBuildingStorefront,
  HiOutlineShoppingCart,
  HiOutlineCurrencyEuro,
  HiOutlineLeaf,
  HiOutlineArrowsRightLeft,
  HiOutlineSignal,
  HiOutlineWifi,
  HiOutlineComputerDesktop,
  HiOutlineDevicePhoneMobile,
  HiOutlineCamera,
  HiOutlineSpeakerWave,
  HiOutlinePaperAirplane,
  HiOutlineRocketLaunch,
  HiOutlineSparkles,
};

const ICON_NAMES = Object.keys(ICON_MAP);

export default function IconPickerGrid({ selectedIcon, onSelect }) {
  const { t } = useTranslation();

  return (
    <div>
      <p className="text-sm font-normal text-foreground mb-2">{t('settings.sections.icon')}</p>
      <div className="grid grid-cols-5 gap-2">
        {ICON_NAMES.map((iconName) => {
          const IconComponent = ICON_MAP[iconName];
          const isSelected = selectedIcon === iconName;
          return (
            <button
              key={iconName}
              type="button"
              onClick={() => onSelect(iconName)}
              className={[
                'w-10 h-10 rounded-md flex items-center justify-center transition-colors',
                isSelected
                  ? 'ring-2 ring-primary bg-primary/10 text-primary'
                  : 'bg-muted text-muted-foreground hover:bg-accent',
              ].join(' ')}
            >
              <IconComponent className="h-5 w-5" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
