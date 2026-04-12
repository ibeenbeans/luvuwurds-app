import React, { useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Slider from '@react-native-community/slider';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { CALIBRATION_PHRASE } from '../constants/compliments';
import { BG, CARD_BG, BORDER, TEXT_MUTED } from '../constants/colors';
import { SpeakIcon } from '../components/Icons';
import { VoiceContext } from '../hooks/VoiceContext';

type Props = NativeStackScreenProps<RootStackParamList, 'Tune'>;

const ACCENT = '#e8c4a0';

export default function TuneScreen({ navigation }: Props) {
  const { speaking, voiceParams, setVoiceParams, speak } = useContext(VoiceContext);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: BG }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Fine-Tune Voice</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          {/* Pitch */}
          <View style={styles.sliderRow}>
            <Text style={styles.sliderLabel}>PITCH</Text>
            <Text style={[styles.sliderValue, { color: ACCENT }]}>{voiceParams.pitch}</Text>
          </View>
          <Slider
            style={styles.slider}
            minimumValue={0.5}
            maximumValue={1.5}
            step={0.05}
            value={voiceParams.pitch}
            onValueChange={v => setVoiceParams(p => ({ ...p, pitch: parseFloat(v.toFixed(2)) }))}
            minimumTrackTintColor={ACCENT}
            maximumTrackTintColor={BORDER}
            thumbTintColor={ACCENT}
          />

          {/* Rate */}
          <View style={[styles.sliderRow, { marginTop: 24 }]}>
            <Text style={styles.sliderLabel}>SPEAKING RATE</Text>
            <Text style={[styles.sliderValue, { color: ACCENT }]}>{voiceParams.rate}</Text>
          </View>
          <Slider
            style={styles.slider}
            minimumValue={0.5}
            maximumValue={1.2}
            step={0.05}
            value={voiceParams.rate}
            onValueChange={v => setVoiceParams(p => ({ ...p, rate: parseFloat(v.toFixed(2)) }))}
            minimumTrackTintColor={ACCENT}
            maximumTrackTintColor={BORDER}
            thumbTintColor={ACCENT}
          />
        </View>

        <TouchableOpacity
          style={[styles.previewBtn, speaking && { opacity: 0.5 }]}
          onPress={() => speak(CALIBRATION_PHRASE)}
          disabled={speaking}
          activeOpacity={0.85}
        >
          <SpeakIcon color="#0f0d0b" size={18} />
          <Text style={styles.previewBtnText}>{speaking ? 'Playing…' : 'Preview'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.saveBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.saveBtnText}>Save & Return</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1 },
  header:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 16, paddingBottom: 12 },
  title:          { color: ACCENT, fontSize: 20, fontStyle: 'italic', fontFamily: 'Georgia' },
  backBtn:        { borderWidth: 1, borderColor: BORDER, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8 },
  backBtnText:    { color: TEXT_MUTED, fontSize: 12, fontFamily: 'Georgia', letterSpacing: 1 },
  content:        { paddingHorizontal: 24, paddingBottom: 40 },
  card:           { backgroundColor: CARD_BG, borderWidth: 1, borderColor: BORDER, borderRadius: 16, padding: 28, marginBottom: 20 },
  sliderRow:      { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  sliderLabel:    { color: TEXT_MUTED, fontSize: 12, letterSpacing: 1.5, fontFamily: 'Georgia' },
  sliderValue:    { fontSize: 13, fontWeight: 'bold', fontFamily: 'Georgia' },
  slider:         { width: '100%', height: 40 },
  previewBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: `${ACCENT}cc`, padding: 16, borderRadius: 12, marginBottom: 12 },
  previewBtnText: { color: '#0f0d0b', fontSize: 14, letterSpacing: 2, fontFamily: 'Georgia', fontWeight: 'bold' },
  saveBtn:        { backgroundColor: CARD_BG, borderWidth: 1, borderColor: BORDER, padding: 14, borderRadius: 12, alignItems: 'center' },
  saveBtnText:    { color: TEXT_MUTED, fontSize: 13, letterSpacing: 1.5, fontFamily: 'Georgia' },
});
