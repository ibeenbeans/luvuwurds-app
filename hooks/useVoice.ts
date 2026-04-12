import { useState, useRef } from 'react';
import * as Speech from 'expo-speech';
import { Audio } from 'expo-av';

export interface VoiceParams {
  pitch: number;
  rate: number;
}

const DEFAULT_PARAMS: VoiceParams = { pitch: 0.92, rate: 0.80 };

export function useVoice() {
  const [speaking, setSpeaking] = useState(false);
  const [voiceParams, setVoiceParams] = useState<VoiceParams>(DEFAULT_PARAMS);
  const [calibrated, setCalibrated] = useState(false);
  const [recording, setRecording] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [recordingDone, setRecordingDone] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  const recordingRef = useRef<Audio.Recording | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const speak = async (text: string) => {
    Speech.stop();
    setSpeaking(true);
    Speech.speak(text, {
      pitch: voiceParams.pitch,
      rate: voiceParams.rate,
      onDone: () => setSpeaking(false),
      onError: () => setSpeaking(false),
    });
  };

  const stopSpeaking = () => {
    Speech.stop();
    setSpeaking(false);
  };

  const startRecording = async () => {
    try {
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) return false;

      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      recordingRef.current = recording;
      setRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000);
      return true;
    } catch {
      return false;
    }
  };

  const stopRecording = async () => {
    if (!recordingRef.current) return;
    clearInterval(timerRef.current!);
    setRecording(false);
    setAnalyzing(true);

    try {
      await recordingRef.current.stopAndUnloadAsync();
      const status = await recordingRef.current.getStatusAsync();

      // Simple heuristic: derive pitch/rate from duration as a proxy
      // (Full audio analysis requires native modules beyond expo-av)
      const durationSec = (status.durationMillis ?? 5000) / 1000;
      const estimatedSyllables = Math.round(durationSec * 3.5);
      const rate = Math.max(0.7, Math.min(1.1, estimatedSyllables / (durationSec * 4.5)));
      const pitch = 0.9; // neutral default; full pitch detection needs native DSP

      setVoiceParams({ pitch: parseFloat(pitch.toFixed(2)), rate: parseFloat(rate.toFixed(2)) });
      setCalibrated(true);
    } catch {
      // keep defaults on error
    }

    recordingRef.current = null;
    setAnalyzing(false);
    setRecordingDone(true);
  };

  const resetRecording = () => {
    setRecordingDone(false);
    setRecording(false);
    setRecordingTime(0);
  };

  return {
    speaking, voiceParams, setVoiceParams,
    calibrated,
    recording, analyzing, recordingDone,
    recordingTime,
    speak, stopSpeaking,
    startRecording, stopRecording, resetRecording,
  };
}
