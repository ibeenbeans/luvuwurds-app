import { createContext } from 'react';
import { VoiceParams } from './useVoice';

interface VoiceContextType {
  speaking: boolean;
  voiceParams: VoiceParams;
  setVoiceParams: (params: VoiceParams | ((prev: VoiceParams) => VoiceParams)) => void;
  calibrated: boolean;
  recording: boolean;
  analyzing: boolean;
  recordingDone: boolean;
  recordingTime: number;
  speak: (text: string) => Promise<void>;
  stopSpeaking: () => void;
  startRecording: () => Promise<boolean>;
  stopRecording: () => Promise<void>;
  resetRecording: () => void;
}

export const VoiceContext = createContext<VoiceContextType>({
  speaking: false,
  voiceParams: { pitch: 0.92, rate: 0.80 },
  setVoiceParams: () => {},
  calibrated: false,
  recording: false,
  analyzing: false,
  recordingDone: false,
  recordingTime: 0,
  speak: async () => {},
  stopSpeaking: () => {},
  startRecording: async () => false,
  stopRecording: async () => {},
  resetRecording: () => {},
});
