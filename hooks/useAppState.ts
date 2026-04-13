import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type AppRole = 'his' | 'hers';

export interface AppState {
  role: AppRole | null;
  coupleId: string | null;
  inviteCode: string | null;
  hisPushToken: string | null;
  herPushToken: string | null;
}

const STORAGE_KEY = 'luvuwurds_app_state';

const defaultState: AppState = {
  role: null,
  coupleId: null,
  inviteCode: null,
  hisPushToken: null,
  herPushToken: null,
};

export function useAppState() {
  const [appState, setAppStateRaw] = useState<AppState>(defaultState);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(raw => {
      if (raw) setAppStateRaw(JSON.parse(raw));
      setLoading(false);
    });
  }, []);

  const saveAppState = async (update: Partial<AppState>) => {
    const next = { ...appState, ...update };
    setAppStateRaw(next);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const clearAppState = async () => {
    setAppStateRaw(defaultState);
    await AsyncStorage.removeItem(STORAGE_KEY);
  };

  return { appState, loading, saveAppState, clearAppState };
}
