import React, { useState, useRef, useContext } from 'react';
import {
  View, Text, TouchableOpacity, TextInput,
  StyleSheet, Alert, ActivityIndicator, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Audio } from 'expo-av';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { BG, CARD_BG, BORDER, TEXT_PRIMARY, TEXT_MUTED } from '../constants/colors';
import { compliments } from '../constants/compliments';
import { saveRecording, readAsBase64 } from '../services/storage';
import { sendMessage, fetchMessages, markDelivered } from '../services/supabase';
import { sendPush } from '../services/notifications';
import { AppStateContext } from '../hooks/AppStateContext';

type Props = NativeStackScreenProps<RootStackParamList, 'Record'> & {
  route: { params: { complimentIndex?: number } };
};

const ACCENT = '#e8c4a0';

export default function RecordScreen({ navigation, route }: Props) {
  const { appState } = useContext(AppStateContext);
  const idx = route.params?.complimentIndex ?? Math.floor(Math.random() * compliments.length);
  const compliment = compliments[idx];

  const [text, setText]             = useState(compliment.text);
  const [recording, setRecording]   = useState(false);
  const [recordingTime, setTime]    = useState(0);
  const [audioUri, setAudioUri]     = useState<string | null>(null);
  const [playing, setPlaying]       = useState(false);
  const [sending, setSending]       = useState(false);

  const recordingRef = useRef<Audio.Recording | null>(null);
  const soundRef     = useRef<Audio.Sound | null>(null);
  const timerRef     = useRef<ReturnType<typeof setInterval> | null>(null);

  const startRecording = async () => {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      recordingRef.current = recording;
      setRecording(true);
      setTime(0);
      timerRef.current = setInterval(() => setTime(t => t + 1), 1000);
    } catch {
      Alert.alert('Microphone needed', 'Allow microphone access to record.');
    }
  };

  const stopRecording = async () => {
    clearInterval(timerRef.current!);
    setRecording(false);
    if (!recordingRef.current) return;
    await recordingRef.current.stopAndUnloadAsync();
    const uri = recordingRef.current.getURI();
    recordingRef.current = null;
    if (uri) {
      const saved = await saveRecording(uri, `compliment-${Date.now()}.m4a`);
      setAudioUri(saved);
    }
  };

  const playback = async () => {
    if (!audioUri || playing) return;
    setPlaying(true);
    const { sound } = await Audio.Sound.createAsync({ uri: audioUri });
    soundRef.current = sound;
    await sound.playAsync();
    sound.setOnPlaybackStatusUpdate(s => {
      if (s.isLoaded && s.didJustFinish) { setPlaying(false); sound.unloadAsync(); }
    });
  };

  const send = async () => {
    if (!audioUri || !appState.coupleId) return;
    setSending(true);
    try {
      const base64 = await readAsBase64(audioUri);
      const msg = await sendMessage(appState.coupleId, 'recording', {
        text,
        audio_base64: base64,
        compliment_index: idx,
      });

      // Notify her
      if (appState.herPushToken) {
        await sendPush(
          appState.herPushToken,
          '♡ He recorded something for you',
          text.slice(0, 80) + (text.length > 80 ? '…' : ''),
          { messageId: msg.id },
        );
      }

      Alert.alert('Sent ♡', 'She\'ll hear it in your voice.', [
        { text: 'Done', onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      Alert.alert('Send failed', 'Check your connection and try again.');
      console.error(e);
    } finally {
      setSending(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: BG }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Record for Her</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backTxt}>← Back</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Inspiration */}
        <View style={styles.card}>
          <Text style={styles.label}>INSPIRATION — make it yours</Text>
          <TextInput
            style={styles.textInput}
            value={text}
            onChangeText={setText}
            multiline
            scrollEnabled={false}
          />
          <Text style={styles.hint}>Edit freely. This is just a starting point.</Text>
        </View>

        {/* Record */}
        <View style={styles.recordSection}>
          <TouchableOpacity
            style={[styles.micBtn, recording && styles.micBtnActive]}
            onPress={recording ? stopRecording : startRecording}
            activeOpacity={0.85}
          >
            <Text style={styles.micIcon}>{recording ? '⏹' : '🎙'}</Text>
            <Text style={styles.micLabel}>
              {recording ? `${recordingTime}s — tap to stop` : audioUri ? 'Re-record' : 'Tap to record'}
            </Text>
          </TouchableOpacity>

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

        {/* Send */}
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

const ACCENT_COLOR = '#e8c4a0';
const styles = StyleSheet.create({
  container:    { flex: 1 },
  header:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 16, paddingBottom: 8 },
  title:        { color: ACCENT_COLOR, fontSize: 20, fontStyle: 'italic', fontFamily: 'Georgia' },
  backBtn:      { borderWidth: 1, borderColor: BORDER, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7 },
  backTxt:      { color: TEXT_MUTED, fontSize: 12, fontFamily: 'Georgia' },
  content:      { paddingHorizontal: 24, paddingBottom: 40 },
  card:         { backgroundColor: CARD_BG, borderWidth: 1, borderColor: BORDER, borderRadius: 16, padding: 24, marginBottom: 24 },
  label:        { color: TEXT_MUTED, fontSize: 11, letterSpacing: 2.5, fontFamily: 'Georgia', marginBottom: 12 },
  textInput:    { color: TEXT_PRIMARY, fontSize: 17, fontStyle: 'italic', fontFamily: 'Georgia', lineHeight: 28, marginBottom: 12 },
  hint:         { color: '#3a2e24', fontSize: 11, fontFamily: 'Georgia', fontStyle: 'italic' },
  recordSection:{ alignItems: 'center', gap: 16, marginBottom: 24 },
  micBtn:       { width: 110, height: 110, borderRadius: 55, backgroundColor: `${ACCENT_COLOR}cc`, alignItems: 'center', justifyContent: 'center', gap: 6 },
  micBtnActive: { backgroundColor: '#c0392b', borderWidth: 3, borderColor: '#e74c3c' },
  micIcon:      { fontSize: 28 },
  micLabel:     { color: '#0f0d0b', fontSize: 11, letterSpacing: 1, fontFamily: 'Georgia', textAlign: 'center' },
  playBtn:      { backgroundColor: CARD_BG, borderWidth: 1, borderColor: `${ACCENT_COLOR}40`, paddingVertical: 12, paddingHorizontal: 28, borderRadius: 12 },
  playBtnTxt:   { color: ACCENT_COLOR, fontSize: 14, fontFamily: 'Georgia', letterSpacing: 1 },
  sendBtn:      { backgroundColor: `${ACCENT_COLOR}cc`, padding: 18, borderRadius: 14, alignItems: 'center' },
  sendBtnTxt:   { color: '#0f0d0b', fontSize: 15, letterSpacing: 2, fontFamily: 'Georgia', fontWeight: 'bold' },
});
