import React, { useState, useRef, useContext } from 'react';
import {
  View, Text, TouchableOpacity, TextInput,
  StyleSheet, Alert, ActivityIndicator, ScrollView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Audio } from 'expo-av';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { BG, CARD_BG, BORDER, TEXT_PRIMARY, TEXT_MUTED } from '../constants/colors';
import { compliments } from '../constants/compliments';
import { sendMessage } from '../services/supabase';
import { sendPush } from '../services/notifications';
import { AppStateContext } from '../hooks/AppStateContext';

type Props = NativeStackScreenProps<RootStackParamList, 'Record'>;

const ACCENT = '#e8c4a0';

// ── Web helpers ──────────────────────────────────────────────────────────────

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]); // strip data:...;base64,
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// ── Component ────────────────────────────────────────────────────────────────

export default function RecordScreen({ navigation, route }: Props) {
  const { appState } = useContext(AppStateContext);
  const idx = (route.params as any)?.complimentIndex ?? Math.floor(Math.random() * compliments.length);
  const compliment = compliments[idx];

  const [text, setText]           = useState(compliment.text);
  const [recording, setRecording] = useState(false);
  const [recordingTime, setTime]  = useState(0);
  const [audioUri, setAudioUri]   = useState<string | null>(null);  // native URI or web blob URL
  const [audioB64, setAudioB64]   = useState<string | null>(null);  // base64 for sending
  const [playing, setPlaying]     = useState(false);
  const [sending, setSending]     = useState(false);

  // Native refs
  const nativeRecRef = useRef<Audio.Recording | null>(null);
  const soundRef     = useRef<Audio.Sound | null>(null);
  // Web refs
  const mediaRecRef  = useRef<MediaRecorder | null>(null);
  const chunksRef    = useRef<Blob[]>([]);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Start recording ───────────────────────────────────────────────────────

  const startRecording = async () => {
    setTime(0);
    timerRef.current = setInterval(() => setTime(t => t + 1), 1000);

    if (Platform.OS === 'web') {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        chunksRef.current = [];
        const mr = new MediaRecorder(stream);
        mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
        mediaRecRef.current = mr;
        mr.start();
        setRecording(true);
      } catch {
        clearInterval(timerRef.current!);
        Alert.alert('Microphone needed', 'Allow microphone access to record.');
      }
    } else {
      try {
        await Audio.requestPermissionsAsync();
        await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
        const { recording } = await Audio.Recording.createAsync(
          Audio.RecordingOptionsPresets.HIGH_QUALITY
        );
        nativeRecRef.current = recording;
        setRecording(true);
      } catch {
        clearInterval(timerRef.current!);
        Alert.alert('Microphone needed', 'Allow microphone access to record.');
      }
    }
  };

  // ── Stop recording ────────────────────────────────────────────────────────

  const stopRecording = async () => {
    clearInterval(timerRef.current!);
    setRecording(false);

    if (Platform.OS === 'web') {
      const mr = mediaRecRef.current;
      if (!mr) return;
      await new Promise<void>(resolve => {
        mr.onstop = async () => {
          const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
          mr.stream?.getTracks().forEach(t => t.stop());
          const url = URL.createObjectURL(blob);
          const b64 = await blobToBase64(blob);
          setAudioUri(url);
          setAudioB64(b64);
          resolve();
        };
        mr.stop();
      });
    } else {
      const rec = nativeRecRef.current;
      if (!rec) return;
      await rec.stopAndUnloadAsync();
      const uri = rec.getURI();
      nativeRecRef.current = null;
      if (uri) {
        setAudioUri(uri);
        // base64 read happens at send time on native
      }
    }
  };

  // ── Playback ──────────────────────────────────────────────────────────────

  const playback = async () => {
    if (!audioUri || playing) return;
    setPlaying(true);

    if (Platform.OS === 'web') {
      const audio = new window.Audio(audioUri);
      audio.onended = () => setPlaying(false);
      audio.onerror = () => setPlaying(false);
      audio.play();
    } else {
      const { sound } = await Audio.Sound.createAsync({ uri: audioUri });
      soundRef.current = sound;
      await sound.playAsync();
      sound.setOnPlaybackStatusUpdate(s => {
        if (s.isLoaded && s.didJustFinish) { setPlaying(false); sound.unloadAsync(); }
      });
    }
  };

  // ── Send ──────────────────────────────────────────────────────────────────

  const send = async () => {
    if (!audioUri || !appState.coupleId) return;
    setSending(true);
    try {
      let b64 = audioB64;

      // Native: read file as base64 now
      if (Platform.OS !== 'web' && !b64) {
        const { readAsBase64 } = await import('../services/storage');
        b64 = await readAsBase64(audioUri);
      }

      if (!b64) throw new Error('No audio data');

      const msg = await sendMessage(appState.coupleId, 'recording', {
        text,
        audio_base64: b64,
        audio_type: Platform.OS === 'web' ? 'audio/webm' : 'audio/m4a',
        compliment_index: idx,
      });

      if (appState.hisPushToken) {
        await sendPush(
          appState.hisPushToken,
          '♡ He recorded something for you',
          text.slice(0, 80) + (text.length > 80 ? '…' : ''),
          { messageId: msg.id },
        );
      }

      Alert.alert('Sent ♡', "She'll hear it in your voice.", [
        { text: 'Done', onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      Alert.alert('Send failed', 'Check your connection and try again.');
      console.error(e);
    } finally {
      setSending(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: BG }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Record for Her</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backTxt}>← Back</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Inspiration text — editable */}
        <View style={styles.card}>
          <Text style={styles.label}>INSPIRATION — make it yours</Text>
          <TextInput
            style={styles.textInput}
            value={text}
            onChangeText={setText}
            multiline
            scrollEnabled={false}
          />
          <Text style={styles.hint}>Edit freely. Speak from the heart.</Text>
        </View>

        {/* Mic button */}
        <View style={styles.recordSection}>
          <TouchableOpacity
            style={[styles.micBtn, recording && styles.micBtnActive]}
            onPress={recording ? stopRecording : startRecording}
            activeOpacity={0.85}
          >
            <Text style={styles.micIcon}>{recording ? '⏹' : '🎙'}</Text>
            <Text style={styles.micLabel}>
              {recording
                ? `${recordingTime}s — tap to stop`
                : audioUri ? 'Re-record' : 'Tap to record'}
            </Text>
          </TouchableOpacity>

          {recording && recordingTime < 5 && (
            <Text style={styles.recordingTip}>Speak naturally — take your time</Text>
          )}

          {audioUri && !recording && (
            <TouchableOpacity
              style={[styles.playBtn, playing && { opacity: 0.6 }]}
              onPress={playback}
              disabled={playing}
              activeOpacity={0.85}
            >
              <Text style={styles.playBtnTxt}>{playing ? 'Playing…' : '▶  Play it back'}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Send button */}
        {audioUri && !recording && (
          <TouchableOpacity
            style={[styles.sendBtn, sending && { opacity: 0.6 }]}
            onPress={send}
            disabled={sending}
            activeOpacity={0.85}
          >
            {sending
              ? <ActivityIndicator color="#0f0d0b" />
              : <Text style={styles.sendBtnTxt}>Send to Her ♡</Text>
            }
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1 },
  header:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 16, paddingBottom: 8 },
  title:        { color: ACCENT, fontSize: 20, fontStyle: 'italic', fontFamily: 'Georgia' },
  backBtn:      { borderWidth: 1, borderColor: BORDER, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7 },
  backTxt:      { color: TEXT_MUTED, fontSize: 12, fontFamily: 'Georgia' },
  content:      { paddingHorizontal: 24, paddingBottom: 40, gap: 20 },
  card:         { backgroundColor: CARD_BG, borderWidth: 1, borderColor: BORDER, borderRadius: 16, padding: 24 },
  label:        { color: TEXT_MUTED, fontSize: 11, letterSpacing: 2.5, fontFamily: 'Georgia', marginBottom: 12 },
  textInput:    { color: TEXT_PRIMARY, fontSize: 17, fontStyle: 'italic', fontFamily: 'Georgia', lineHeight: 28, marginBottom: 12 },
  hint:         { color: '#3a2e24', fontSize: 11, fontFamily: 'Georgia', fontStyle: 'italic' },
  recordSection:{ alignItems: 'center', gap: 16 },
  micBtn:       { width: 110, height: 110, borderRadius: 55, backgroundColor: `${ACCENT}cc`, alignItems: 'center', justifyContent: 'center', gap: 6 },
  micBtnActive: { backgroundColor: '#c0392b', borderWidth: 3, borderColor: '#e74c3c' },
  micIcon:      { fontSize: 28 },
  micLabel:     { color: '#0f0d0b', fontSize: 11, letterSpacing: 1, fontFamily: 'Georgia', textAlign: 'center', paddingHorizontal: 10 },
  recordingTip: { color: '#7a6a58', fontSize: 12, fontFamily: 'Georgia', fontStyle: 'italic' },
  playBtn:      { backgroundColor: CARD_BG, borderWidth: 1, borderColor: `${ACCENT}40`, paddingVertical: 12, paddingHorizontal: 28, borderRadius: 12 },
  playBtnTxt:   { color: ACCENT, fontSize: 14, fontFamily: 'Georgia', letterSpacing: 1 },
  sendBtn:      { backgroundColor: `${ACCENT}cc`, padding: 18, borderRadius: 14, alignItems: 'center' },
  sendBtnTxt:   { color: '#0f0d0b', fontSize: 15, letterSpacing: 2, fontFamily: 'Georgia', fontWeight: 'bold' },
});
