import { useState, useRef } from 'react';
import { Audio } from 'expo-av';
import { Platform } from 'react-native';
import { textToSpeech } from '../services/elevenlabs';

export function useVoice() {
  const [speaking, setSpeaking]     = useState(false);
  const [calibrated, setCalibrated] = useState(true); // voice is pre-configured via .env

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const speak = async (text: string) => {
    if (speaking) return;
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }

    setSpeaking(true);
    try {
      const url = await textToSpeech(text);

      if (Platform.OS === 'web') {
        const audio = new window.Audio(url);
        audioRef.current = audio;
        audio.onended = () => { setSpeaking(false); URL.revokeObjectURL(url); audioRef.current = null; };
        audio.onerror = () => { setSpeaking(false); audioRef.current = null; };
        await audio.play();
      } else {
        const { sound } = await Audio.Sound.createAsync({ uri: url });
        sound.setOnPlaybackStatusUpdate(status => {
          if (status.isLoaded && status.didJustFinish) {
            setSpeaking(false);
            sound.unloadAsync();
          }
        });
        await sound.playAsync();
      }
    } catch (e) {
      console.error('ElevenLabs speak error:', e);
      setSpeaking(false);
    }
  };

  const stopSpeaking = () => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    setSpeaking(false);
  };

  return { speaking, calibrated, setCalibrated, speak, stopSpeaking };
}
