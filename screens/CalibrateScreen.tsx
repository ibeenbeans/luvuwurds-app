import React, { useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { CALIBRATION_PHRASE } from '../constants/compliments';
import { BG, CARD_BG, BORDER, TEXT_PRIMARY, TEXT_MUTED } from '../constants/colors';
import { SpeakIcon } from '../components/Icons';
import { VoiceContext } from '../hooks/VoiceContext';

type Props = NativeStackScreenProps<RootStackParamList, 'Calibrate'>;

const ACCENT = '#e8c4a0';

export default function CalibrateScreen({ navigation }: Props) {
  const { speaking, speak } = useContext(VoiceContext);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: BG }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Voice</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.doneTitle}>✓ Voice ready</Text>
          <Text style={styles.cardHint}>
            Your cloned voice is set up and ready to use.{'\n\n'}
            Tap below to hear how it sounds.
          </Text>
        </View>

        <View style={styles.previewCard}>
          <Text style={styles.phraseLabel}>SAMPLE PHRASE</Text>
          <Text style={styles.phrase}>"{CALIBRATION_PHRASE}"</Text>
          <TouchableOpacity
            style={[styles.previewBtn, speaking && { opacity: 0.5 }]}
            onPress={() => speak(CALIBRATION_PHRASE)}
            disabled={speaking}
            activeOpacity={0.85}
          >
            <SpeakIcon color="#0f0d0b" size={18} />
            <Text style={styles.previewBtnText}>{speaking ? 'Playing…' : 'Preview Voice'}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.doneBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.doneBtnText}>Done ✓</Text>
        </TouchableOpacity>
      </View>
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
  card:           { backgroundColor: CARD_BG, borderWidth: 1, borderColor: `${ACCENT}30`, borderRadius: 16, padding: 28, marginBottom: 20 },
  doneTitle:      { color: ACCENT, fontSize: 18, marginBottom: 12, fontFamily: 'Georgia' },
  cardHint:       { color: TEXT_MUTED, fontSize: 14, fontFamily: 'Georgia', lineHeight: 22 },
  previewCard:    { backgroundColor: CARD_BG, borderWidth: 1, borderColor: BORDER, borderRadius: 16, padding: 28, marginBottom: 20 },
  phraseLabel:    { color: TEXT_MUTED, fontSize: 11, letterSpacing: 3, marginBottom: 12, fontFamily: 'Georgia' },
  phrase:         { color: TEXT_PRIMARY, fontSize: 15, fontStyle: 'italic', lineHeight: 26, marginBottom: 20, fontFamily: 'Georgia' },
  previewBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: `${ACCENT}cc`, padding: 14, borderRadius: 12 },
  previewBtnText: { color: '#0f0d0b', fontSize: 14, letterSpacing: 2, fontFamily: 'Georgia', fontWeight: 'bold' },
  doneBtn:        { backgroundColor: CARD_BG, borderWidth: 1, borderColor: BORDER, padding: 14, borderRadius: 12, alignItems: 'center' },
  doneBtnText:    { color: TEXT_MUTED, fontSize: 13, letterSpacing: 1.5, fontFamily: 'Georgia' },
});
