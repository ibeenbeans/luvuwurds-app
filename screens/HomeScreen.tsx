import React, { useState, useEffect, useContext, useCallback, useRef } from 'react';
import {
  View, Text, TouchableOpacity, TextInput, StyleSheet,
  Animated, StatusBar, ScrollView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RootStackParamList } from '../App';
import { compliments, Compliment } from '../constants/compliments';
import { categoryColors, BG, CARD_BG, BORDER, TEXT_PRIMARY, TEXT_MUTED, TEXT_DIM } from '../constants/colors';
import { HeartIcon, RefreshIcon } from '../components/Icons';
import { AppStateContext } from '../hooks/AppStateContext';
import { fetchMessages, markDelivered } from '../services/supabase';
import { getSavedRecordings } from '../services/savedRecordings';

type Props = NativeStackScreenProps<RootStackParamList, 'HisHome'>;

const ACCENT = '#e8c4a0';

export default function HomeScreen({ navigation }: Props) {
  const { appState } = useContext(AppStateContext);
  const [currentIdx, setCurrentIdx]   = useState<number>(0);
  const [current, setCurrent]         = useState<Compliment | null>(null);
  const [favorites, setFavorites]     = useState<Compliment[]>([]);
  const [hasRequest, setHasRequest]   = useState(false);
  const [requestMsgId, setRequestMsgId] = useState<string | null>(null);
  const [savedCount, setSavedCount]   = useState(0);

  // Editable inspiration text
  const [editText, setEditText]       = useState('');
  const [isEditing, setIsEditing]     = useState(false);
  const [textSaved, setTextSaved]     = useState(false);

  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Pick a random compliment on mount
  useEffect(() => { pickRandom(); }, []);

  // Load saved text whenever the current compliment changes
  useEffect(() => {
    if (current === null) return;
    const original = current.text;
    AsyncStorage.getItem(`compliment_text_${currentIdx}`).then(saved => {
      if (saved && saved !== original) {
        setEditText(saved);
        setTextSaved(true);
      } else {
        setEditText(original);
        setTextSaved(false);
      }
      setIsEditing(false);
    });
  }, [currentIdx]);

  // Poll for her requests + refresh saved count on focus
  useFocusEffect(
    useCallback(() => {
      if (!appState.coupleId) return;
      fetchMessages(appState.coupleId).then(msgs => {
        const req = msgs.find(m => m.type === 'compliment_request');
        if (req) { setHasRequest(true); setRequestMsgId(req.id); }
        else { setHasRequest(false); setRequestMsgId(null); }
      });
      getSavedRecordings().then(recs => setSavedCount(recs.length));
    }, [appState.coupleId])
  );

  const pickRandom = () => {
    Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
      const pool = compliments.map((c, i) => ({ c, i })).filter(({ c }) => c.text !== current?.text);
      const pick = pool[Math.floor(Math.random() * pool.length)];
      setCurrent(pick.c);
      setCurrentIdx(pick.i);
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    });
  };

  const saveText = async () => {
    await AsyncStorage.setItem(`compliment_text_${currentIdx}`, editText);
    setTextSaved(true);
    setIsEditing(false);
  };

  const resetToOriginal = async () => {
    const original = current?.text ?? '';
    setEditText(original);
    setTextSaved(false);
    setIsEditing(false);
    await AsyncStorage.removeItem(`compliment_text_${currentIdx}`);
  };

  const toggleFavorite = () => {
    if (!current) return;
    const already = favorites.find(f => f.text === current.text);
    setFavorites(already ? favorites.filter(f => f.text !== current.text) : [...favorites, current]);
  };

  const handleRecord = async () => {
    if (requestMsgId) {
      await markDelivered(requestMsgId);
      setHasRequest(false);
      setRequestMsgId(null);
    }
    navigation.navigate('Record', { complimentIndex: currentIdx });
  };

  const isFavorited = current && favorites.find(f => f.text === current.text);
  const accent = current ? (categoryColors[current.category] ?? '#e8c4a0') : '#e8c4a0';
  const isCustomised = editText !== (current?.text ?? '');

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: BG }]}>
      <StatusBar barStyle="light-content" backgroundColor={BG} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSub}>INSPIRATION</Text>
          <Text style={[styles.headerTitle, { color: accent }]}>Luvuwurds</Text>
        </View>
        <View style={styles.headerRight}>
          {savedCount > 0 && (
            <TouchableOpacity
              style={styles.savedBtn}
              onPress={() => navigation.navigate('HisSaved')}
            >
              <Text style={styles.savedBtnText}>🎙 {savedCount}</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.favBtn}
            onPress={() => navigation.navigate('Favorites', { favorites, setFavorites })}
          >
            <Text style={styles.favBtnText}>♥ {favorites.length}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Her request banner */}
      {hasRequest && (
        <TouchableOpacity style={styles.requestBanner} onPress={handleRecord} activeOpacity={0.85}>
          <Text style={styles.requestBannerTxt}>♡ She's asking for a compliment — record one now</Text>
        </TouchableOpacity>
      )}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Compliment card */}
        <Animated.View style={[styles.card, { borderColor: `${accent}35`, opacity: fadeAnim }]}>
          <View style={[styles.cardTopLine, { backgroundColor: accent }]} />

          {/* Card header row: category + pencil */}
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardCategory}>{current?.category?.toUpperCase()}</Text>
            <View style={styles.cardHeaderActions}>
              {isCustomised && !isEditing && (
                <TouchableOpacity onPress={resetToOriginal} activeOpacity={0.7}>
                  <Text style={styles.resetTxt}>Reset</Text>
                </TouchableOpacity>
              )}
              {!isEditing && (
                <TouchableOpacity
                  style={[styles.pencilBtn, isCustomised && { borderColor: `${accent}80` }]}
                  onPress={() => setIsEditing(true)}
                  activeOpacity={0.75}
                >
                  <Text style={styles.pencilIcon}>✏️</Text>
                  <Text style={[styles.pencilTxt, isCustomised && { color: accent }]}>
                    {isCustomised ? 'Edited' : 'Edit'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Read-only display */}
          {!isEditing && (
            <Text style={styles.cardText}>"{editText}"</Text>
          )}

          {/* Editable input */}
          {isEditing && (
            <>
              <TextInput
                style={styles.textInput}
                value={editText}
                onChangeText={val => { setEditText(val); setTextSaved(false); }}
                multiline
                autoFocus
                scrollEnabled={false}
                placeholder="Personalise this compliment…"
                placeholderTextColor="#7a6450"
              />
              <View style={styles.saveRow}>
                <TouchableOpacity onPress={resetToOriginal} activeOpacity={0.7}>
                  <Text style={styles.resetTxt}>Reset to original</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.saveBtn}
                  onPress={saveText}
                  activeOpacity={0.8}
                >
                  <Text style={styles.saveBtnTxt}>Save Text ✓</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {!isEditing && (
            <Text style={styles.cardHint}>
              {isCustomised
                ? '✓ Your words saved — tap Record to send it.'
                : 'Tap ✏️ Edit to make this your own before recording.'}
            </Text>
          )}
        </Animated.View>

        {/* Record for Her — main CTA */}
        <TouchableOpacity
          style={[styles.recordBtn, { backgroundColor: `${accent}cc` }]}
          onPress={handleRecord}
          activeOpacity={0.85}
        >
          <Text style={styles.recordBtnText}>🎙  Record for Her</Text>
        </TouchableOpacity>

        {/* Secondary row */}
        <View style={styles.row}>
          <TouchableOpacity style={styles.rowBtn} onPress={pickRandom} activeOpacity={0.75}>
            <RefreshIcon color={TEXT_MUTED} size={16} />
            <Text style={styles.rowBtnText}>New Inspiration</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.rowBtn, isFavorited && { borderColor: `${accent}60`, backgroundColor: `${accent}15` }]}
            onPress={toggleFavorite}
            activeOpacity={0.75}
          >
            <HeartIcon color={isFavorited ? accent : TEXT_MUTED} size={16} filled={!!isFavorited} />
            <Text style={[styles.rowBtnText, isFavorited && { color: accent }]}>
              {isFavorited ? 'Saved' : 'Save Idea'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:         { flex: 1, paddingHorizontal: 24 },
  header:            { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, paddingBottom: 12 },
  headerSub:         { color: '#b89f84', fontSize: 11, letterSpacing: 3, fontFamily: 'Georgia' },
  headerTitle:       { fontSize: 24, fontStyle: 'italic', fontFamily: 'Georgia' },
  headerRight:       { flexDirection: 'row', gap: 8, alignItems: 'center' },
  savedBtn:          { borderWidth: 1, borderColor: `${ACCENT}50`, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
  savedBtnText:      { color: ACCENT, fontSize: 12, letterSpacing: 1.5, fontFamily: 'Georgia' },
  favBtn:            { borderWidth: 1, borderColor: BORDER, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
  favBtnText:        { color: '#b89f84', fontSize: 12, letterSpacing: 1.5, fontFamily: 'Georgia' },
  requestBanner:     { backgroundColor: '#2a1a1a', borderWidth: 1, borderColor: '#e8a0a030', borderRadius: 12, padding: 14, marginBottom: 14, alignItems: 'center' },
  requestBannerTxt:  { color: '#e8c4a0', fontSize: 13, fontFamily: 'Georgia', fontStyle: 'italic', letterSpacing: 0.5 },
  scrollContent:     { gap: 14, paddingBottom: 40 },
  card:              { backgroundColor: CARD_BG, borderWidth: 1, borderRadius: 20, padding: 28, overflow: 'hidden' },
  cardTopLine:       { position: 'absolute', top: 0, left: 0, right: 0, height: 3 },
  cardHeaderRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  cardHeaderActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cardCategory:      { color: TEXT_DIM, fontSize: 11, letterSpacing: 3, fontFamily: 'Georgia' },
  cardText:          { color: TEXT_PRIMARY, fontSize: 19, lineHeight: 32, fontStyle: 'italic', fontFamily: 'Georgia', marginBottom: 14 },
  cardHint:          { color: '#b89f84', fontSize: 11, fontFamily: 'Georgia', fontStyle: 'italic' },
  pencilBtn:         { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: `${ACCENT}40`, borderRadius: 14, paddingHorizontal: 10, paddingVertical: 4 },
  pencilIcon:        { fontSize: 12 },
  pencilTxt:         { color: TEXT_MUTED, fontSize: 11, fontFamily: 'Georgia', letterSpacing: 0.5 },
  resetTxt:          { color: '#b89f84', fontSize: 11, fontFamily: 'Georgia', textDecorationLine: 'underline' },
  textInput:         { color: TEXT_PRIMARY, fontSize: 18, fontStyle: 'italic', fontFamily: 'Georgia', lineHeight: 30, borderWidth: 1, borderColor: `${ACCENT}60`, borderRadius: 10, padding: 14, backgroundColor: '#15110d', marginBottom: 12 },
  saveRow:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  saveBtn:           { backgroundColor: `${ACCENT}cc`, paddingVertical: 9, paddingHorizontal: 18, borderRadius: 10 },
  saveBtnTxt:        { color: '#0f0d0b', fontSize: 12, fontFamily: 'Georgia', fontWeight: 'bold', letterSpacing: 0.5 },
  recordBtn:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 20, borderRadius: 14 },
  recordBtnText:     { color: '#0f0d0b', fontSize: 16, letterSpacing: 2, fontFamily: 'Georgia', fontWeight: 'bold' },
  row:               { flexDirection: 'row', gap: 12 },
  rowBtn:            { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: CARD_BG, borderWidth: 1, borderColor: BORDER, borderRadius: 12, padding: 14 },
  rowBtnText:        { color: TEXT_MUTED, fontSize: 13, letterSpacing: 1.5, fontFamily: 'Georgia' },
});
