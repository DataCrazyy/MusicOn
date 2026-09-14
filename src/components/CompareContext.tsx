import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { Artist } from '@/data';

const MAX_COMPARE = 3;

interface CompareContextValue {
  selected: Artist[];
  isSelected: (id: string) => boolean;
  toggle: (artist: Artist) => boolean;
  remove: (id: string) => void;
  clear: () => void;
  canAdd: boolean;
}

const CompareContext = createContext<CompareContextValue | null>(null);

export function CompareProvider({ children }: { children: ReactNode }) {
  const [selected, setSelected] = useState<Artist[]>([]);

  const isSelected = useCallback((id: string) => selected.some((a) => a.id === id), [selected]);

  const toggle = useCallback((artist: Artist): boolean => {
    let added = false;
    setSelected((prev) => {
      if (prev.some((a) => a.id === artist.id)) {
        return prev.filter((a) => a.id !== artist.id);
      }
      if (prev.length >= MAX_COMPARE) {
        return prev;
      }
      added = true;
      return [...prev, artist];
    });
    return added;
  }, []);

  const remove = useCallback((id: string) => {
    setSelected((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const clear = useCallback(() => setSelected([]), []);

  return (
    <CompareContext.Provider value={{ selected, isSelected, toggle, remove, clear, canAdd: selected.length < MAX_COMPARE }}>
      {children}
    </CompareContext.Provider>
  );
}

export function useCompare() {
  const ctx = useContext(CompareContext);
  if (!ctx) throw new Error('useCompare must be used within CompareProvider');
  return ctx;
}

export { MAX_COMPARE };
