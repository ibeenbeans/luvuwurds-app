import { createContext } from 'react';
import { AppState } from './useAppState';

interface AppStateContextType {
  appState: AppState;
  loading: boolean;
  saveAppState: (update: Partial<AppState>) => Promise<void>;
  clearAppState: () => Promise<void>;
}

export const AppStateContext = createContext<AppStateContextType>({
  appState: {
    role: null,
    coupleId: null,
    inviteCode: null,
    hisPushToken: null,
    herPushToken: null,
  },
  loading: true,
  saveAppState: async () => {},
  clearAppState: async () => {},
});
