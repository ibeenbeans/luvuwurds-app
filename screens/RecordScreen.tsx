import React, { useState, useRef, useContext, useEffect } from 'react';
import {
  View, Text, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, ScrollView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { BG, CARD_BG, BORDER, TEXT_PRIMARY, TEXT_MUTED } from '../constants/colors';
import { compliments } from '../constants/compliments';
import { sendMessage } from '../services/supabase';
import { sendPush } from '../services/notifications';
import { saveRecordingLocally } from '../services/savedRecordings';
import { AppStateContext } from '../hooks/AppStateContext';

type Props = NativeStackScreenProps<RootStackParamList, 'Record'>;

const ACCENT = '#e8c4a0';

type Stage = 'compose' | 'recording' | 'review' | 'sending';

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export default function RecordScreen({ navigation, route }: Props) {
  const { appState } = useContext(AppStateContext);
  const idx = (route.params as any)?.complimentIndex ?? 0;
  const original = compliments[idx]?.text ?? '';

  const [text, setText]   = useState(original);
  const [stage, setStage] = useState<Stage>('compose');
  const [recordingTime, setTime]  = useState(0);
  const [audioUri, setAudioUri]   = useState<string | null>(null);
  const [audioB64, setAudioB64]   = useState<string | null>(null);
  const [playing, setPlaying]     = useState(false);
  const [saving, setSaving]       = useState(false);

  // Native refs
  const nativeRecRef = useRef<Audio.Recording | null>(null);
  const soundRef     = useRef<Audio.Sound | null>(null);
  // Web refs
  const mediaRecRef  = useRef<MediaRecorder | null>(null);
  const chunksRef    = useRef<Blob[]>([]);
  const timerRef     = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Load saved (possibly edited) text for this compliment ────────────────
  useEffect(() => {
    AsyncStorage.getItem(`compliment_text_${idx}`).then(saved => {
      if (saved) setText(saved);
    });
  }, [idx]);

  // ── Recording ─────────────────────────────────────────────────────────────
  const startRecording = async () => {
    setAudioUri(null);
    setAudioB64(null);
    setTime(0);
    timerRef.current = setInterval(() => setTime(t => t + 1), 1000);
    setStage('recording');

    if (Platform.OS === 'web') {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        chunksRef.current = [];
        const mr = new MediaRecorder(stream);
        mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
        mediaRecRef.current = mr;
        mr.start();
      } catch {
        clearInterval(timerRef.current!);
        setStage('compose');
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
      } catch {
        clearInterval(timerRef.current!);
        setStage('compose');
        Alert.alert('Microphone needed', 'Allow microphone access to record.');
      }
    }
  };

  const stopRecording = async () => {
    clearInterval(timerRef.current!);

    if (Platform.OS === 'web') {
      const mr = mediaRecRef.current;
      if (!mr) { setStage('compose'); return; }
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
      if (!rec) { setStage('compose'); return; }
      await rec.stopAndUnloadAsync();
      const uri = rec.getURI();
      nativeRecRef.current = null;
      if (uri) setAudioUri(uri);
    }

    setStage('review');
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

  // ── Save for later ───────────────────────────────────────────────────────
  const saveForLater = async () => {
    if (!audioUri) return;
    setSaving(true);
    try {
      let b64 = audioB64;
      if (Platform.OS !== 'web' && !b64) {
        const { readAsBase64 } = await import('../services/storage');
        b64 = await readAsBase64(audioUri);
      }
      if (!b64) throw new Error('No audio data');
      await saveRecordingLocally({
        text,
        audio_base64: b64,
        audio_type: Platform.OS === 'web' ? 'audio/webm' : 'audio/m4a',
        compliment_index: idx,
      });
      Alert.alert('Saved ✓', 'Find it in My Recordings whenever you\'re ready to send.', [
        { text: 'Record another', onPress: () => { setStage('compose'); setAudioUri(null); setAudioB64(null); } },
        { text: 'Done', onPress: () => navigation.goBack() },
      ]);
    } catch {
      Alert.alert('Save failed', 'Something went wrong. Try again.');
    } finally {
      setSaving(false);
    }
  };

  // ── Send ──────────────────────────────────────────────────────────────────
  const send = async () => {
    if (!audioUri || !appState.coupleId) return;
    setStage('sending');
    try {
      let b64 = audioB64;
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
      setStage('review');
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: BG }]}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {stage === 'review' ? 'Review Recording' :
           stage === 'recording' ? 'Recording…' : 'Record for Her'}
        </Text>
        {stage !== 'recording' && stage !== 'sending' && (
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backTxt}>← Back</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        {/* ── COMPOSE / RECORDING stage — read-only words ── */}
        {(stage === 'compose' || stage === 'recording') && (
          <View style={styles.card}>
            <Text style={styles.label}>YOUR WORDS</Text>
            <Text style={styles.textDisplay}>"{text}"</Text>
            {stage === 'compose' && (
              <Text style={styles.hint}>Read these words as you record.</Text>
            )}
          </View>
        )}

        {/* ── REVIEW stage — show the text he recorded ── */}
        {(stage === 'review' || stage === 'sending') && (
          <View style={[styles.card, { borderColor: `${ACCENT}30` }]}>
            <Text style={styles.label}>YOU SAID</Text>
            <Text style={styles.reviewText}>"{text}"</Text>
          </View>
        )}

        {/* ── COMPOSE: mic button ── */}
        {stage === 'compose' && (
          <View style={styles.centeredSection}>
            <TouchableOpacity
              style={styles.micBtn}
              onPress={startRecording}
              activeOpacity={0.85}
            >
              <Text style={styles.micIcon}>🎙</Text>
              <Text style={styles.micLabel}>Tap to record</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── RECORDING: live timer + stop ── */}
        {stage === 'recording' && (
          <View style={styles.centeredSection}>
            <TouchableOpacity
              style={[styles.micBtn, styles.micBtnActive]}
              onPress={stopRecording}
              activeOpacity={0.85}
            >
              <Text style={styles.micIcon}>⏹</Text>
              <Text style={[styles.micLabel, { color: '#fff' }]}>
                {recordingTime}s — tap to stop
              </Text>
            </TouchableOpacity>
            <Text style={styles.recordingTip}>
              {recordingTime < 3 ? 'Speak naturally…' :
               recordingTime < 10 ? 'Keep going…' :
               'Tap to stop when ready'}
            </Text>
          </View>
        )}

        {/* ── REVIEW: play / try again / send ── */}
        {stage === 'review' && (
          <View style={styles.reviewActions}>
            {/* Play */}
            <TouchableOpacity
              style={[styles.playBtn, playing && { opacity: 0.6 }]}
              onPress={playback}
              disabled={playing}
              activeOpacity={0.85}
            >
              <Text style={styles.playBtnTxt}>
                {playing ? '▶  Playing…' : '▶  Play it back'}
              </Text>
            </TouchableOpacity>

            {/* Try again */}
            <TouchableOpacity
              style={styles.tryAgainBtn}
              onPress={() => { setStage('compose'); setAudioUri(null); setAudioB64(null); }}
              activeOpacity={0.85}
            >
              <Text style={styles.tryAgainTxt}>🎙  Try again</Text>
            </TouchableOpacity>

            {/* Save for later */}
            <TouchableOpacity
              style={[styles.saveBtn, saving && { opacity: 0.6 }]}
              onPress={saveForLater}
              disabled={saving}
              activeOpacity={0.85}
            >
              {saving
                ? <ActivityIndicator color={ACCENT} size="small" />
                : <Text style={styles.saveBtnTxt}>Save for Later</Text>
              }
            </TouchableOpacity>

            {/* Send now */}
            <TouchableOpacity
              style={styles.sendBtn}
              onPress={send}
              activeOpacity={0.85}
            >
              <Text style={styles.sendBtnTxt}>Send to Her Now ♡</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── SENDING ── */}
        {stage === 'sending' && (
          <View style={styles.centeredSection}>
            <ActivityIndicator color={ACCENT} size="large" />
            <Text style={styles.sendingTxt}>Sending…</Text>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1 },
  header:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 16, paddingBottom: 12 },
  title:          { color: ACCENT, fontSize: 20, fontStyle: 'italic', fontFamily: 'Georgia' },
  backBtn:        { borderWidth: 1, borderColor: BORDER, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7 },
  backTxt:        { color: TEXT_MUTED, fontSize: 12, fontFamily: 'Georgia' },
  content:        { paddingHorizontal: 24, paddingBottom: 60, gap: 24 },
  card:           { backgroundColor: CARD_BG, borderWidth: 1, borderColor: BORDER, borderRadius: 16, padding: 24 },
  label:       { color: TEXT_MUTED, fontSize: 11, letterSpacing: 2.5, fontFamily: 'Georgia', marginBottom: 10 },
  textDisplay: { color: TEXT_PRIMARY, fontSize: 17, fontStyle: 'italic', fontFamily: 'Georgia', lineHeight: 28, marginBottom: 8 },
  hint:        { color: '#b89f84', fontSize: 11, fontFamily: 'Georgia', fontStyle: 'italic' },
  reviewText:     { color: TEXT_PRIMARY, fontSize: 17, fontStyle: 'italic', fontFamily: 'Georgia', lineHeight: 28, marginTop: 4 },
  centeredSection:{ alignItems: 'center', gap: 16, paddingVertical: 8 },
  micBtn:         { width: 120, height: 120, borderRadius: 60, backgroundColor: `${ACCENT}cc`, alignItems: 'center', justifyContent: 'center', gap: 8 },
  micBtnActive:   { backgroundColor: '#c0392b', borderWidth: 3, borderColor: '#e74c3c' },
  micIcon:        { fontSize: 30 },
  micLabel:       { color: '#0f0d0b', fontSize: 11, letterSpacing: 1, fontFamily: 'Georgia', textAlign: 'center', paddingHorizontal: 8 },
  recordingTip:   { color: '#b89f84', fontSize: 13, fontFamily: 'Georgia', fontStyle: 'italic' },
  reviewActions:  { gap: 14 },
  playBtn:        { backgroundColor: CARD_BG, borderWidth: 1, borderColor: `${ACCENT}50`, padding: 16, borderRadius: 12, alignItems: 'center' },
  playBtnTxt:     { color: ACCENT, fontSize: 14, fontFamily: 'Georgia', letterSpacing: 1 },
  tryAgainBtn:    { backgroundColor: CARD_BG, borderWidth: 1, borderColor: BORDER, padding: 16, borderRadius: 12, alignItems: 'center' },
  tryAgainTxt:    { color: TEXT_MUTED, fontSize: 14, fontFamily: 'Georgia', letterSpacing: 1 },
  saveBtn:        { backgroundColor: CARD_BG, borderWidth: 1, borderColor: `${ACCENT}50`, padding: 16, borderRadius: 12, alignItems: 'center' },
  saveBtnTxt:     { color: ACCENT, fontSize: 14, fontFamily: 'Georgia', letterSpacing: 1 },
  sendBtn:        { backgroundColor: `${ACCENT}cc`, padding: 20, borderRadius: 14, alignItems: 'center' },
  sendBtnTxt:     { color: '#0f0d0b', fontSize: 15, letterSpacing: 2, fontFamily: 'Georgia', fontWeight: 'bold' },
  sendingTxt:     { color: TEXT_MUTED, fontSize: 14, fontFamily: 'Georgia', fontStyle: 'italic', marginTop: 12 },
});
