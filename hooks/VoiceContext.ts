import { createContext } from 'react';

interface VoiceContextType {
  speaking: boolean;
  calibrated: boolean;
  setCalibrated: (v: boolean) => void;
  speak: (text: string) => Promise<void>;
  stopSpeaking: () => void;
}

export const VoiceContext = createContext<VoiceContextType>({
  speaking: false,
  calibrated: true,
  setCalibrated: () => {},
  speak: async () => {},
  stopSpeaking: () => {},
});
