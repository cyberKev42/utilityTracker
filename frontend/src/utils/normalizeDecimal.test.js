import { describe, it, expect } from 'vitest';
import { normalizeDecimal } from './normalizeDecimal';

describe('normalizeDecimal', () => {
  it('converts comma to dot', () => {
    expect(normalizeDecimal('1,5')).toBe('1.5');
  });

  it('passes through dot decimal unchanged', () => {
    expect(normalizeDecimal('1.5')).toBe('1.5');
  });

  it('handles integer strings', () => {
    expect(normalizeDecimal('42')).toBe('42');
  });

  it('handles empty string', () => {
    expect(normalizeDecimal('')).toBe('');
  });

  it('handles non-string input (number)', () => {
    expect(normalizeDecimal(42)).toBe('42');
  });

  it('handles null/undefined', () => {
    expect(normalizeDecimal(null)).toBe('');
    expect(normalizeDecimal(undefined)).toBe('');
  });
});
