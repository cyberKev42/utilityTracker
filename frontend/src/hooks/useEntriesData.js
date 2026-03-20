import { useContext } from 'react';
import { EntriesDataContext } from '../context/EntriesDataContext';

export function useEntriesData() {
  const context = useContext(EntriesDataContext);
  if (!context) {
    throw new Error('useEntriesData must be used within EntriesDataProvider');
  }
  return context;
}
