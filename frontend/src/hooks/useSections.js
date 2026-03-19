import { useContext } from 'react';
import { SectionsContext } from '../context/SectionsContext';

export function useSections() {
  const context = useContext(SectionsContext);
  if (!context) {
    throw new Error('useSections must be used within a SectionsProvider');
  }
  return context;
}
