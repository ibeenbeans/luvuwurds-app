import React, { useContext, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { CALIBRATION_PHRASE } from '../constants/compliments';
import { BG, CARD_BG, BORDER, TEXT_MUTED } from '../constants/colors';
import { SpeakIcon } from '../components/Icons';
import { VoiceContext } from '../hooks/VoiceContext';
import { ElevenLabsSettings, setVoiceSettings, getVoiceSettings } from '../services/elevenlabs';

type Props = NativeStackScreenProps<RootStackParamList, 'Tune'>;

const ACCENT = '#e8c4a0';

function SliderRow({ label, hint, value, min, max, onChange }: {
  label: string; hint: string; value: number;
  min: number; max: number; onChange: (v: number) => void;
}) {
  return (
    <View style={styles.sliderBlock}>
      <View style={styles.sliderRow}>
        <Text style={styles.sliderLabel}>{label}</Text>
        <Text style={[styles.sliderValue, { color: ACCENT }]}>{value.toFixed(2)}</Text>
      </View>
      <Text style={styles.sliderHint}>{hint}</Text>
      <input
        type="range" min={min} max={max} step={0.05} value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        style={{ width: '100%', accentColor: ACCENT, cursor: 'pointer', marginTop: 8 } as any}
      />
    </View>
  );
}

export default function TuneScreen({ navigation }: Props) {
  const { speaking, speak } = useContext(VoiceContext);
  const [settings, setSettings] = useState<ElevenLabsSettings>(getVoiceSettings());

  const update = (key: keyof ElevenLabsSettings, value: number) => {
    const next = { ...settings, [key]: value };
    setSettings(next);
    setVoiceSettings(next);
  };

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
          <SliderRow
            label="STABILITY"
            hint="Higher = more consistent. Lower = more expressive."
            value={settings.stability}
            min={0} max={1}
            onChange={v => update('stability', v)}
          />
          <SliderRow
            label="SIMILARITY"
            hint="How closely it matches your recorded voice."
            value={settings.similarity_boost}
            min={0} max={1}
            onChange={v => update('similarity_boost', v)}
          />
          <SliderRow
            label="STYLE"
            hint="How much natural expression and emotion."
            value={settings.style}
            min={0} max={1}
            onChange={v => update('style', v)}
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
  sliderBlock:    { marginBottom: 24 },
  sliderRow:      { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  sliderLabel:    { color: TEXT_MUTED, fontSize: 12, letterSpacing: 1.5, fontFamily: 'Georgia' },
  sliderValue:    { fontSize: 13, fontWeight: 'bold', fontFamily: 'Georgia' },
  sliderHint:     { color: '#7a6450', fontSize: 11, fontFamily: 'Georgia', fontStyle: 'italic' },
  previewBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: `${ACCENT}cc`, padding: 16, borderRadius: 12, marginBottom: 12 },
  previewBtnText: { color: '#0f0d0b', fontSize: 14, letterSpacing: 2, fontFamily: 'Georgia', fontWeight: 'bold' },
  saveBtn:        { backgroundColor: CARD_BG, borderWidth: 1, borderColor: BORDER, padding: 14, borderRadius: 12, alignItems: 'center' },
  saveBtnText:    { color: TEXT_MUTED, fontSize: 13, letterSpacing: 1.5, fontFamily: 'Georgia' },
});
