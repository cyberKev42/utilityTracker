export function getSectionDisplayName(section, t) {
  if (!section) return '';
  if (section.translation_key) {
    return t(`sectionNames.${section.translation_key}`, { defaultValue: section.name });
  }
  return section.name;
}
