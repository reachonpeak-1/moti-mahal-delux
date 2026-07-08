import React, { createContext, useContext, useState, useEffect } from 'react';
import { getSettings } from '../services/settingsService';
import type { RestaurantSettings } from '../types';
import { isFirebaseConfigured } from '../firebase';

interface SettingsContextType {
  settings: RestaurantSettings | null;
  loading: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<RestaurantSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setSettings(null);
      setLoading(false);
      return;
    }

    const unsubscribe = getSettings((data) => {
      setSettings(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, loading }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
