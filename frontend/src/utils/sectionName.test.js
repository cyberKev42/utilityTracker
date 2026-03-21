import { describe, it, expect } from 'vitest';
import { getSectionDisplayName } from './sectionName';

describe('getSectionDisplayName', () => {
  const mockT = (key, options) => {
    const translations = {
      'sectionNames.water': 'Wasser',
      'sectionNames.power': 'Strom',
      'sectionNames.fuel': 'Brennstoff',
    };
    return translations[key] || options?.defaultValue || key;
  };

  it('returns translated name when translation_key exists', () => {
    const section = { name: 'Water', translation_key: 'water' };
    expect(getSectionDisplayName(section, mockT)).toBe('Wasser');
  });

  it('returns raw name when translation_key is null', () => {
    const section = { name: 'My Custom Section', translation_key: null };
    expect(getSectionDisplayName(section, mockT)).toBe('My Custom Section');
  });

  it('returns empty string for null/undefined section', () => {
    expect(getSectionDisplayName(null, mockT)).toBe('');
    expect(getSectionDisplayName(undefined, mockT)).toBe('');
  });

  it('returns raw name when translation_key is empty string', () => {
    const section = { name: 'Test', translation_key: '' };
    expect(getSectionDisplayName(section, mockT)).toBe('Test');
  });
});
