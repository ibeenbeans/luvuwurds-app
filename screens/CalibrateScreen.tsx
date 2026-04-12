import React, { useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { CALIBRATION_PHRASE } from '../constants/compliments';
import { BG, CARD_BG, BORDER, TEXT_PRIMARY, TEXT_MUTED } from '../constants/colors';
import { MicIcon, SpeakIcon } from '../components/Icons';
import { VoiceContext } from '../hooks/VoiceContext';

type Props = NativeStackScreenProps<RootStackParamList, 'Calibrate'>;

const ACCENT = '#e8c4a0';

export default function CalibrateScreen({ navigation }: Props) {
  const {
    speaking, voiceParams,
    recording, analyzing, recordingDone, recordingTime,
    speak, startRecording, stopRecording, resetRecording,
  } = useContext(VoiceContext);

  const handleMicPress = async () => {
    if (recording) {
      await stopRecording();
    } else {
      const ok = await startRecording();
      if (!ok) Alert.alert('Permission needed', 'Microphone access is required to calibrate your voice.');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: BG }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Voice Calibration</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* Phrase card */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>READ THIS ALOUD — naturally, like you'd say it to her</Text>
          <Text style={styles.phrase}>"{CALIBRATION_PHRASE}"</Text>
          <Text style={styles.cardHint}>Don't perform it. Just say it.</Text>
        </View>

        {/* Record area */}
        {!recordingDone && !analyzing && (
          <View style={styles.recordArea}>
            <TouchableOpacity
              style={[styles.micBtn, recording && styles.micBtnActive]}
              onPress={handleMicPress}
              activeOpacity={0.85}
            >
              <MicIcon color="#0f0d0b" size={28} active={recording} />
              <Text style={styles.micLabel}>{recording ? `${recordingTime}s` : 'TAP'}</Text>
            </TouchableOpacity>
            <Text style={styles.recordHint}>
              {recording ? 'Recording… tap to stop' : 'Tap to start recording.\nTap again when finished.'}
            </Text>
          </View>
        )}

        {analyzing && (
          <View style={styles.analyzing}>
            <Text style={styles.analyzingTitle}>Analyzing your voice…</Text>
            <Text style={styles.analyzingHint}>Measuring pitch and tempo</Text>
          </View>
        )}

        {recordingDone && !analyzing && (
          <View style={[styles.card, styles.doneCard]}>
            <Text style={styles.doneTitle}>✓ Voice profile saved</Text>
            <Text style={styles.doneParams}>
              Pitch: {voiceParams.pitch} · Rate: {voiceParams.rate}
            </Text>
            <TouchableOpacity
              style={[styles.previewBtn, speaking && { opacity: 0.5 }]}
              onPress={() => speak(CALIBRATION_PHRASE)}
              disabled={speaking}
            >
              <SpeakIcon color="#0f0d0b" size={18} />
              <Text style={styles.previewBtnText}>{speaking ? 'Playing…' : 'Preview Your Voice'}</Text>
            </TouchableOpacity>
          </View>
        )}

        {recordingDone && (
          <View style={styles.doneRow}>
            <TouchableOpacity style={styles.rerecordBtn} onPress={resetRecording}>
              <Text style={styles.rerecordBtnText}>Re-record</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.doneBtn} onPress={() => navigation.goBack()}>
              <Text style={styles.doneBtnText}>Done ✓</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1 },
  header:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 16, paddingBottom: 12 },
  title:           { color: ACCENT, fontSize: 20, fontStyle: 'italic', fontFamily: 'Georgia' },
  backBtn:         { borderWidth: 1, borderColor: BORDER, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8 },
  backBtnText:     { color: TEXT_MUTED, fontSize: 12, fontFamily: 'Georgia', letterSpacing: 1 },
  content:         { paddingHorizontal: 24, paddingBottom: 40 },
  card:            { backgroundColor: CARD_BG, borderWidth: 1, borderColor: BORDER, borderRadius: 16, padding: 28, marginBottom: 20 },
  cardLabel:       { color: TEXT_MUTED, fontSize: 11, letterSpacing: 3, marginBottom: 14, fontFamily: 'Georgia' },
  phrase:          { color: TEXT_PRIMARY, fontSize: 18, fontStyle: 'italic', lineHeight: 32, marginBottom: 12, fontFamily: 'Georgia' },
  cardHint:        { color: '#3a2e24', fontSize: 12, fontFamily: 'Georgia' },
  recordArea:      { alignItems: 'center', gap: 20, marginBottom: 24 },
  micBtn:          { width: 96, height: 96, borderRadius: 48, backgroundColor: `${ACCENT}cc`, alignItems: 'center', justifyContent: 'center', gap: 6 },
  micBtnActive:    { backgroundColor: '#c0392b', borderWidth: 3, borderColor: '#e74c3c' },
  micLabel:        { fontSize: 10, letterSpacing: 1.5, color: '#0f0d0b', fontFamily: 'Georgia' },
  recordHint:      { color: '#4a3e32', fontSize: 12, textAlign: 'center', lineHeight: 20, fontFamily: 'Georgia' },
  analyzing:       { alignItems: 'center', padding: 20, marginBottom: 20 },
  analyzingTitle:  { color: ACCENT, fontSize: 16, fontStyle: 'italic', marginBottom: 8, fontFamily: 'Georgia' },
  analyzingHint:   { color: '#4a3e32', fontSize: 13, fontFamily: 'Georgia' },
  doneCard:        { borderColor: `${ACCENT}30` },
  doneTitle:       { color: ACCENT, fontSize: 16, marginBottom: 8, fontFamily: 'Georgia' },
  doneParams:      { color: TEXT_MUTED, fontSize: 12, letterSpacing: 1, marginBottom: 20, fontFamily: 'Georgia' },
  previewBtn:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: `${ACCENT}cc`, padding: 14, borderRadius: 12 },
  previewBtnText:  { color: '#0f0d0b', fontSize: 14, letterSpacing: 2, fontFamily: 'Georgia', fontWeight: 'bold' },
  doneRow:         { flexDirection: 'row', gap: 10 },
  rerecordBtn:     { flex: 1, backgroundColor: CARD_BG, borderWidth: 1, borderColor: BORDER, padding: 14, borderRadius: 12, alignItems: 'center' },
  rerecordBtnText: { color: TEXT_MUTED, fontSize: 13, letterSpacing: 1.5, fontFamily: 'Georgia' },
  doneBtn:         { flex: 1, backgroundColor: `${ACCENT}cc`, padding: 14, borderRadius: 12, alignItems: 'center' },
  doneBtnText:     { color: '#0f0d0b', fontSize: 13, letterSpacing: 1.5, fontFamily: 'Georgia', fontWeight: 'bold' },
});
