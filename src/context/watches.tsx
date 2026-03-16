import { createContext, useContext, useState, type ReactNode } from 'react';
import type { Watch, WatchPhoto } from '#/types';
import { MOCK_WATCHES } from '#/lib/mocks/mock_watches';

type WatchesContextValue = {
  watches: Watch[];
  selectedWatch: Watch | null;
  selectWatch: (w: Watch) => void;
  closeWatch: () => void;
  updatePhotos: (id: number, photos: WatchPhoto[]) => void;
};

const WatchesContext = createContext<WatchesContextValue | null>(null);

export function WatchesProvider({ children }: { children: ReactNode }) {
  const [watches, setWatches] = useState<Watch[]>(MOCK_WATCHES);
  const [selectedWatch, setSelectedWatch] = useState<Watch | null>(null);

  const selectWatch = (w: Watch) => {
    // Always use fresh watch data from state
    setSelectedWatch(watches.find((x) => x.id === w.id) ?? w);
  };

  const closeWatch = () => setSelectedWatch(null);

  const updatePhotos = (id: number, photos: WatchPhoto[]) => {
    setWatches((ws) => ws.map((w) => (w.id === id ? { ...w, photos } : w)));
    setSelectedWatch((sw) => (sw?.id === id ? { ...sw, photos } : sw));
  };

  return (
    <WatchesContext.Provider value={{ watches, selectedWatch, selectWatch, closeWatch, updatePhotos }}>
      {children}
    </WatchesContext.Provider>
  );
}

export function useWatches(): WatchesContextValue {
  const ctx = useContext(WatchesContext);
  if (!ctx) throw new Error('useWatches must be used inside WatchesProvider');
  return ctx;
}
