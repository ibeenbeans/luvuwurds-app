import React, { useState, useEffect, useContext } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Animated, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { compliments, Compliment } from '../constants/compliments';
import { categoryColors, BG, CARD_BG, BORDER, TEXT_PRIMARY, TEXT_MUTED, TEXT_DIM } from '../constants/colors';
import { HeartIcon, RefreshIcon, SpeakIcon, MicIcon, TuneIcon } from '../components/Icons';
import { VoiceContext } from '../hooks/VoiceContext';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
  const [current, setCurrent] = useState<Compliment | null>(null);
  const [favorites, setFavorites] = useState<Compliment[]>([]);
  const [justSpoken, setJustSpoken] = useState(false);
  const fadeAnim = useState(new Animated.Value(1))[0];

  const { speaking, calibrated, speak } = useContext(VoiceContext);

  useEffect(() => { pickRandom(); }, []);

  const pickRandom = () => {
    Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
      const pool = compliments.filter(c => c.text !== current?.text);
      setCurrent(pool[Math.floor(Math.random() * pool.length)]);
      setJustSpoken(false);
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    });
  };

  const toggleFavorite = () => {
    if (!current) return;
    const already = favorites.find(f => f.text === current.text);
    setFavorites(already ? favorites.filter(f => f.text !== current.text) : [...favorites, current]);
  };

  const isFavorited = current && favorites.find(f => f.text === current.text);
  const accent = current ? categoryColors[current.category] : '#e8c4a0';

  const handleSpeak = async () => {
    if (!current) return;
    await speak(current.text);
    setJustSpoken(true);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: BG }]}>
      <StatusBar barStyle="light-content" backgroundColor={BG} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSub}>FOR HER</Text>
          <Text style={[styles.headerTitle, { color: accent }]}>Words of Love</Text>
        </View>
        <TouchableOpacity
          style={styles.favBtn}
          onPress={() => navigation.navigate('Favorites', { favorites, setFavorites })}
        >
          <Text style={styles.favBtnText}>♥ {favorites.length}</Text>
        </TouchableOpacity>
      </View>

      {/* Voice bar */}
      <View style={styles.voiceBar}>
        <TouchableOpacity
          style={[styles.calibrateBtn, calibrated && styles.calibrateBtnDone]}
          onPress={() => navigation.navigate('Calibrate')}
        >
          <MicIcon color={calibrated ? '#c4a870' : '#e8c090'} size={16} />
          <Text style={[styles.calibrateBtnText, calibrated && { color: '#c4a870' }]}>
            {calibrated ? '✓ Voice Calibrated' : 'Calibrate My Voice'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tuneBtn} onPress={() => navigation.navigate('Tune')}>
          <TuneIcon color="#5a4a3a" size={18} />
        </TouchableOpacity>
      </View>

      {/* Card */}
      <Animated.View style={[styles.card, { borderColor: `${accent}35`, opacity: fadeAnim }]}>
        <View style={[styles.cardTopLine, { backgroundColor: accent }]} />
        <Text style={styles.cardCategory}>{current?.category?.toUpperCase()}</Text>
        <Text style={styles.cardText}>"{current?.text}"</Text>
      </Animated.View>

      {/* Speak button */}
      <TouchableOpacity
        style={[styles.speakBtn, { backgroundColor: speaking ? `${accent}50` : `${accent}cc` }]}
        onPress={handleSpeak}
        disabled={speaking}
        activeOpacity={0.85}
      >
        <SpeakIcon color="#0f0d0b" size={20} />
        <Text style={styles.speakBtnText}>
          {speaking ? 'Speaking…' : calibrated ? 'Speak in My Voice' : 'Speak It Aloud'}
        </Text>
      </TouchableOpacity>

      {justSpoken && (
        <Text style={[styles.nowSayIt, { color: accent }]}>✦ Now say it to her</Text>
      )}

      {/* Row */}
      <View style={styles.row}>
        <TouchableOpacity style={styles.rowBtn} onPress={pickRandom} activeOpacity={0.75}>
          <RefreshIcon color={TEXT_MUTED} size={16} />
          <Text style={styles.rowBtnText}>New One</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.rowBtn, isFavorited && { borderColor: `${accent}60`, backgroundColor: `${accent}15` }]}
          onPress={toggleFavorite}
          activeOpacity={0.75}
        >
          <HeartIcon color={isFavorited ? accent : TEXT_MUTED} size={16} filled={!!isFavorited} />
          <Text style={[styles.rowBtnText, isFavorited && { color: accent }]}>
            {isFavorited ? 'Saved' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, paddingHorizontal: 24 },
  header:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, paddingBottom: 8 },
  headerSub:    { color: '#7a6a58', fontSize: 11, letterSpacing: 3 },
  headerTitle:  { fontSize: 22, fontStyle: 'italic', fontFamily: 'Georgia' },
  favBtn:       { borderWidth: 1, borderColor: BORDER, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
  favBtnText:   { color: '#5a4a3a', fontSize: 12, letterSpacing: 1.5, fontFamily: 'Georgia' },
  voiceBar:     { flexDirection: 'row', gap: 8, marginBottom: 10 },
  calibrateBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, backgroundColor: '#1a1208', borderWidth: 1, borderColor: '#e8c4a045', borderRadius: 10, paddingVertical: 9, paddingHorizontal: 14 },
  calibrateBtnDone: { backgroundColor: CARD_BG, borderColor: '#e8c4a025' },
  calibrateBtnText: { color: '#e8c090', fontSize: 11, letterSpacing: 1.5, fontFamily: 'Georgia' },
  tuneBtn:      { backgroundColor: CARD_BG, borderWidth: 1, borderColor: BORDER, borderRadius: 10, padding: 10, justifyContent: 'center', alignItems: 'center' },
  card:         { backgroundColor: CARD_BG, borderWidth: 1, borderRadius: 20, padding: 32, minHeight: 220, marginBottom: 20, overflow: 'hidden', justifyContent: 'center' },
  cardTopLine:  { position: 'absolute', top: 0, left: 0, right: 0, height: 3 },
  cardCategory: { color: TEXT_DIM, fontSize: 11, letterSpacing: 3, marginBottom: 16, fontFamily: 'Georgia' },
  cardText:     { color: TEXT_PRIMARY, fontSize: 20, lineHeight: 34, fontStyle: 'italic', fontFamily: 'Georgia' },
  speakBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 18, borderRadius: 14, marginBottom: 12 },
  speakBtnText: { color: '#0f0d0b', fontSize: 15, letterSpacing: 2, fontFamily: 'Georgia', fontWeight: 'bold' },
  nowSayIt:     { textAlign: 'center', fontSize: 13, letterSpacing: 1, fontStyle: 'italic', marginBottom: 12, opacity: 0.7 },
  row:          { flexDirection: 'row', gap: 12, marginBottom: 16 },
  rowBtn:       { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: CARD_BG, borderWidth: 1, borderColor: BORDER, borderRadius: 12, padding: 14 },
  rowBtnText:   { color: TEXT_MUTED, fontSize: 13, letterSpacing: 1.5, fontFamily: 'Georgia' },
});
