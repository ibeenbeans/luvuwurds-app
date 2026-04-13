import React, { useState, useCallback, useContext } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  FlatList, ActivityIndicator, Alert, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Audio } from 'expo-av';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { BG, CARD_BG, BORDER, TEXT_PRIMARY, TEXT_MUTED } from '../constants/colors';
import {
  getSavedRecordings, deleteRecordingLocally, SavedRecording,
} from '../services/savedRecordings';
import { sendMessage } from '../services/supabase';
import { sendPush } from '../services/notifications';
import { AppStateContext } from '../hooks/AppStateContext';

type Props = NativeStackScreenProps<RootStackParamList, 'HisSaved'>;

const ACCENT = '#e8c4a0';

export default function HisSavedScreen({ navigation }: Props) {
  const { appState } = useContext(AppStateContext);
  const [saved, setSaved]     = useState<SavedRecording[]>([]);
  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState<string | null>(null);
  const [sending, setSending] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      getSavedRecordings().then(recs => {
        setSaved(recs);
        setLoading(false);
      });
    }, [])
  );

  const play = async (item: SavedRecording) => {
    if (playing) return;
    setPlaying(item.id);
    try {
      const dataUri = `data:${item.audio_type};base64,${item.audio_base64}`;
      if (Platform.OS === 'web') {
        const audio = new window.Audio(dataUri);
        audio.onended = () => setPlaying(null);
        audio.onerror = () => setPlaying(null);
        audio.play();
      } else {
        const { sound } = await Audio.Sound.createAsync(
          { uri: dataUri }, { shouldPlay: true }
        );
        sound.setOnPlaybackStatusUpdate(s => {
          if (s.isLoaded && s.didJustFinish) { setPlaying(null); sound.unloadAsync(); }
        });
      }
    } catch { setPlaying(null); }
  };

  const send = async (item: SavedRecording) => {
    if (!appState.coupleId) return;
    setSending(item.id);
    try {
      const msg = await sendMessage(appState.coupleId, 'recording', {
        text: item.text,
        audio_base64: item.audio_base64,
        audio_type: item.audio_type,
        compliment_index: item.compliment_index,
      });
      if (appState.hisPushToken) {
        await sendPush(
          appState.hisPushToken,
          '♡ He recorded something for you',
          item.text.slice(0, 80) + (item.text.length > 80 ? '…' : ''),
          { messageId: msg.id },
        );
      }
      await deleteRecordingLocally(item.id);
      setSaved(prev => prev.filter(r => r.id !== item.id));
      Alert.alert('Sent ♡', "She'll hear it in your voice.");
    } catch {
      Alert.alert('Send failed', 'Check your connection and try again.');
    } finally {
      setSending(null);
    }
  };

  const remove = async (item: SavedRecording) => {
    Alert.alert('Delete recording?', 'This can\'t be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          await deleteRecordingLocally(item.id);
          setSaved(prev => prev.filter(r => r.id !== item.id));
        },
      },
    ]);
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
          <Text style={styles.emptyTitle}>No saved recordings.</Text>
          <Text style={styles.emptyHint}>
            Record compliments and save them here.{'\n'}
            Send them whenever the moment feels right.
          </Text>
          <TouchableOpacity
            style={styles.recordBtn}
            onPress={() => navigation.navigate('Record', { complimentIndex: Math.floor(Math.random() * 365) })}
            activeOpacity={0.85}
          >
            <Text style={styles.recordBtnTxt}>🎙  Record one now</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={saved}
          keyExtractor={i => i.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.date}>
                {new Date(item.savedAt).toLocaleDateString('en-US', {
                  month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit',
                })}
              </Text>
              <Text style={styles.text}>"{item.text}"</Text>
              <View style={styles.actions}>
                {/* Play */}
                <TouchableOpacity
                  style={[styles.playBtn, playing === item.id && { opacity: 0.5 }]}
                  onPress={() => play(item)}
                  disabled={!!playing}
                  activeOpacity={0.85}
                >
                  <Text style={styles.playBtnTxt}>
                    {playing === item.id ? 'Playing…' : '▶'}
                  </Text>
                </TouchableOpacity>

                {/* Send */}
                <TouchableOpacity
                  style={[styles.sendBtn, sending === item.id && { opacity: 0.5 }]}
                  onPress={() => send(item)}
                  disabled={!!sending}
                  activeOpacity={0.85}
                >
                  {sending === item.id
                    ? <ActivityIndicator color="#0f0d0b" size="small" />
                    : <Text style={styles.sendBtnTxt}>Send to Her ♡</Text>
                  }
                </TouchableOpacity>

                {/* Delete */}
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => remove(item)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.deleteBtnTxt}>✕</Text>
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
  backTxt:      { color: TEXT_MUTED, fontSize: 12, fontFamily: 'Georgia' },
  list:         { paddingHorizontal: 24, paddingBottom: 40, gap: 14 },
  card:         { backgroundColor: CARD_BG, borderWidth: 1, borderColor: `${ACCENT}25`, borderRadius: 16, padding: 22 },
  date:         { color: TEXT_MUTED, fontSize: 11, letterSpacing: 1, fontFamily: 'Georgia', marginBottom: 10 },
  text:         { color: TEXT_PRIMARY, fontSize: 15, fontStyle: 'italic', fontFamily: 'Georgia', lineHeight: 24, marginBottom: 16 },
  actions:      { flexDirection: 'row', gap: 8, alignItems: 'center' },
  playBtn:      { backgroundColor: CARD_BG, borderWidth: 1, borderColor: `${ACCENT}40`, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10 },
  playBtnTxt:   { color: ACCENT, fontSize: 13, fontFamily: 'Georgia' },
  sendBtn:      { flex: 1, backgroundColor: `${ACCENT}cc`, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10, alignItems: 'center' },
  sendBtnTxt:   { color: '#0f0d0b', fontSize: 12, letterSpacing: 1, fontFamily: 'Georgia', fontWeight: 'bold' },
  deleteBtn:    { borderWidth: 1, borderColor: BORDER, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10 },
  deleteBtnTxt: { color: '#b89f84', fontSize: 13 },
  empty:        { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40, gap: 16 },
  emptyTitle:   { color: TEXT_MUTED, fontSize: 18, fontStyle: 'italic', fontFamily: 'Georgia' },
  emptyHint:    { color: '#7a6450', fontSize: 13, fontFamily: 'Georgia', textAlign: 'center', lineHeight: 22 },
  recordBtn:    { backgroundColor: `${ACCENT}cc`, paddingVertical: 14, paddingHorizontal: 28, borderRadius: 12, marginTop: 8 },
  recordBtnTxt: { color: '#0f0d0b', fontSize: 14, letterSpacing: 1.5, fontFamily: 'Georgia', fontWeight: 'bold' },
});
