import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  FlatList, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';

type Props = NativeStackScreenProps<RootStackParamList, 'HerSaved'>;

const BG     = '#0f0d0b';
const ACCENT = '#d4a0c0';
const MUTED  = '#5a4a3a';
const CARD   = '#18140f';
const BORDER = '#2a2520';

const STORAGE_KEY = 'her_saved_recordings';

export interface SavedRecording {
  id: string;
  text: string;
  audio_base64: string;
  savedAt: string;
  rating?: string;
}

export default function HerSavedScreen({ navigation }: Props) {
  const [saved, setSaved]   = useState<SavedRecording[]>([]);
  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState<string | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(raw => {
      if (raw) setSaved(JSON.parse(raw));
      setLoading(false);
    });
  }, []);

  const play = async (item: SavedRecording) => {
    if (playing) return;
    setPlaying(item.id);
    try {
      const { sound } = await Audio.Sound.createAsync(
        { uri: `data:audio/m4a;base64,${item.audio_base64}` },
        { shouldPlay: true }
      );
      sound.setOnPlaybackStatusUpdate(s => {
        if (s.isLoaded && s.didJustFinish) {
          setPlaying(null);
          sound.unloadAsync();
        }
      });
    } catch {
      setPlaying(null);
    }
  };

  const remove = async (id: string) => {
    const next = saved.filter(s => s.id !== id);
    setSaved(next);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  if (loading) return (
    <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
      <ActivityIndicator color={ACCENT} />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Saved ({saved.length})</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backTxt}>← Back</Text>
        </TouchableOpacity>
      </View>

      {saved.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTxt}>No saved messages yet.</Text>
          <Text style={styles.emptyHint}>When he records for you, you can save them here.</Text>
        </View>
      ) : (
        <FlatList
          data={saved}
          keyExtractor={i => i.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.date}>
                {new Date(item.savedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                {item.rating ? `  ·  ${item.rating}/10` : ''}
              </Text>
              <Text style={styles.text}>"{item.text}"</Text>
              <View style={styles.actions}>
                <TouchableOpacity
                  style={[styles.playBtn, playing === item.id && { opacity: 0.5 }]}
                  onPress={() => play(item)}
                  disabled={!!playing}
                >
                  <Text style={styles.playBtnTxt}>
                    {playing === item.id ? 'Playing…' : '▶  Play'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.removeBtn} onPress={() => remove(item.id)}>
                  <Text style={styles.removeBtnTxt}>Remove</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: BG },
  header:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 16, paddingBottom: 8 },
  title:        { color: ACCENT, fontSize: 20, fontStyle: 'italic', fontFamily: 'Georgia' },
  backBtn:      { borderWidth: 1, borderColor: BORDER, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7 },
  backTxt:      { color: MUTED, fontSize: 12, fontFamily: 'Georgia' },
  list:         { paddingHorizontal: 24, paddingBottom: 40 },
  card:         { backgroundColor: CARD, borderWidth: 1, borderColor: `${ACCENT}25`, borderRadius: 14, padding: 22, marginBottom: 14 },
  date:         { color: MUTED, fontSize: 11, letterSpacing: 1.5, fontFamily: 'Georgia', marginBottom: 10 },
  text:         { color: '#e8ddd0', fontSize: 15, fontStyle: 'italic', fontFamily: 'Georgia', lineHeight: 24, marginBottom: 16 },
  actions:      { flexDirection: 'row', gap: 10 },
  playBtn:      { backgroundColor: `${ACCENT}20`, borderWidth: 1, borderColor: `${ACCENT}40`, paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8 },
  playBtnTxt:   { color: ACCENT, fontSize: 12, letterSpacing: 1, fontFamily: 'Georgia' },
  removeBtn:    { borderWidth: 1, borderColor: BORDER, paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8 },
  removeBtnTxt: { color: MUTED, fontSize: 12, letterSpacing: 1, fontFamily: 'Georgia' },
  empty:        { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  emptyTxt:     { color: MUTED, fontSize: 16, fontStyle: 'italic', fontFamily: 'Georgia', marginBottom: 10 },
  emptyHint:    { color: '#3a2e24', fontSize: 13, fontFamily: 'Georgia', textAlign: 'center', lineHeight: 20 },
});
