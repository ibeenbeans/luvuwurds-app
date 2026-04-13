import React, { useState, useContext, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Audio } from 'expo-av';
import { Platform } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { fetchMessages, markDelivered, sendMessage } from '../services/supabase';
import { sendPush } from '../services/notifications';
import { AppStateContext } from '../hooks/AppStateContext';

type Props = NativeStackScreenProps<RootStackParamList, 'HerHome'>;

const BG     = '#0f0d0b';
const ACCENT = '#d4a0c0';
const MUTED  = '#5a4a3a';
const CARD   = '#18140f';
const BORDER = '#2a2520';

const REACTIONS = ['1','2','3','4','5','6','7','8','9','10'];

export default function HerHomeScreen({ navigation }: Props) {
  const { appState } = useContext(AppStateContext);
  const [requesting, setRequesting]   = useState(false);
  const [pendingMsg, setPendingMsg]   = useState<any>(null);
  const [playing, setPlaying]         = useState(false);
  const [reacted, setReacted]         = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Poll for new recordings every 10s
  useEffect(() => {
    checkForMessages();
    const interval = setInterval(checkForMessages, 10000);
    return () => clearInterval(interval);
  }, []);

  // Pulse animation for the request button
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.04, duration: 1200, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  const checkForMessages = async () => {
    if (!appState.coupleId) return;
    const msgs = await fetchMessages(appState.coupleId);
    const recording = msgs.find(m => m.type === 'recording');
    if (recording) setPendingMsg(recording);
  };

  const requestCompliment = async () => {
    if (!appState.coupleId || requesting) return;
    setRequesting(true);
    try {
      await sendMessage(appState.coupleId, 'compliment_request', {});
      if (appState.hisPushToken) {
        await sendPush(
          appState.hisPushToken,
          '♡ She wants to hear from you',
          'Open Luvuwurds to record a compliment for her.',
        );
      }
      Alert.alert('Sent ♡', 'He\'ll get a nudge to record something for you.');
    } catch {
      Alert.alert('Oops', 'Check your connection and try again.');
    } finally {
      setRequesting(false);
    }
  };

  const playRecording = async () => {
    if (!pendingMsg || playing) return;
    setPlaying(true);
    try {
      const base64    = pendingMsg.payload.audio_base64;
      const audioType = pendingMsg.payload.audio_type ?? 'audio/webm';
      const dataUri   = `data:${audioType};base64,${base64}`;

      if (Platform.OS === 'web') {
        const audio = new window.Audio(dataUri);
        audio.onended = () => setPlaying(false);
        audio.onerror = () => setPlaying(false);
        audio.play();
      } else {
        const { sound } = await Audio.Sound.createAsync(
          { uri: dataUri },
          { shouldPlay: true }
        );
        sound.setOnPlaybackStatusUpdate(s => {
          if (s.isLoaded && s.didJustFinish) { setPlaying(false); sound.unloadAsync(); }
        });
      }
    } catch (e) {
      setPlaying(false);
      console.error(e);
    }
  };

  const react = async (rating: string) => {
    if (!appState.coupleId || !pendingMsg) return;
    try {
      await markDelivered(pendingMsg.id);
      await sendMessage(appState.coupleId, 'reaction', {
        rating,
        compliment_text: pendingMsg.payload.text,
      });
      if (appState.hisPushToken) {
        await sendPush(
          appState.hisPushToken,
          `She rated that ${rating}/10 ♡`,
          pendingMsg.payload.text?.slice(0, 60) + '…',
        );
      }
      setReacted(true);
      setPendingMsg(null);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>Just for you</Text>
          <Text style={styles.title}>Luvuwurds</Text>
        </View>
        <TouchableOpacity
          style={styles.savedBtn}
          onPress={() => navigation.navigate('HerSaved')}
        >
          <Text style={styles.savedTxt}>♡ Saved</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* Pending recording from him */}
        {pendingMsg && !reacted && (
          <View style={styles.recordingCard}>
            <Text style={styles.recordingLabel}>HE RECORDED SOMETHING FOR YOU</Text>
            <Text style={styles.recordingText}>"{pendingMsg.payload.text}"</Text>
            <TouchableOpacity
              style={[styles.playBtn, playing && { opacity: 0.6 }]}
              onPress={playRecording}
              disabled={playing}
              activeOpacity={0.85}
            >
              <Text style={styles.playBtnTxt}>{playing ? 'Playing…' : '▶  Play in His Voice'}</Text>
            </TouchableOpacity>

            {/* Reaction */}
            <Text style={styles.reactLabel}>How did that feel?</Text>
            <View style={styles.reactions}>
              {REACTIONS.map(r => (
                <TouchableOpacity key={r} style={styles.reactBtn} onPress={() => react(r)}>
                  <Text style={styles.reactTxt}>{r}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {reacted && (
          <View style={styles.reactedCard}>
            <Text style={styles.reactedTxt}>♡ He'll see your rating</Text>
          </View>
        )}

        {/* Request button */}
        {!pendingMsg && (
          <View style={styles.requestSection}>
            <Text style={styles.requestHint}>
              Tap to ask him to record{'\n'}a compliment just for you.
            </Text>
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <TouchableOpacity
                style={[styles.requestBtn, requesting && { opacity: 0.6 }]}
                onPress={requestCompliment}
                disabled={requesting}
                activeOpacity={0.85}
              >
                {requesting
                  ? <ActivityIndicator color="#0f0d0b" />
                  : <Text style={styles.requestBtnTxt}>Send me a compliment ♡</Text>
                }
              </TouchableOpacity>
            </Animated.View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: BG },
  header:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 16, paddingBottom: 8 },
  eyebrow:        { color: MUTED, fontSize: 11, letterSpacing: 3, fontFamily: 'Georgia' },
  title:          { color: ACCENT, fontSize: 26, fontStyle: 'italic', fontFamily: 'Georgia' },
  savedBtn:       { borderWidth: 1, borderColor: BORDER, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7 },
  savedTxt:       { color: MUTED, fontSize: 12, fontFamily: 'Georgia' },
  content:        { flex: 1, paddingHorizontal: 24, justifyContent: 'center' },
  recordingCard:  { backgroundColor: CARD, borderWidth: 1, borderColor: `${ACCENT}40`, borderRadius: 20, padding: 28, marginBottom: 24 },
  recordingLabel: { color: MUTED, fontSize: 10, letterSpacing: 3, fontFamily: 'Georgia', marginBottom: 14 },
  recordingText:  { color: '#e8ddd0', fontSize: 17, fontStyle: 'italic', fontFamily: 'Georgia', lineHeight: 28, marginBottom: 20 },
  playBtn:        { backgroundColor: `${ACCENT}cc`, padding: 14, borderRadius: 12, alignItems: 'center', marginBottom: 24 },
  playBtnTxt:     { color: '#0f0d0b', fontSize: 14, letterSpacing: 1.5, fontFamily: 'Georgia', fontWeight: 'bold' },
  reactLabel:     { color: MUTED, fontSize: 12, fontFamily: 'Georgia', textAlign: 'center', marginBottom: 12 },
  reactions:      { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  reactBtn:       { backgroundColor: '#18140f', borderWidth: 1, borderColor: `${ACCENT}30`, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
  reactTxt:       { color: ACCENT, fontSize: 14, fontFamily: 'Georgia' },
  reactedCard:    { backgroundColor: CARD, borderWidth: 1, borderColor: `${ACCENT}20`, borderRadius: 14, padding: 20, alignItems: 'center', marginBottom: 24 },
  reactedTxt:     { color: ACCENT, fontSize: 16, fontFamily: 'Georgia', fontStyle: 'italic' },
  requestSection: { alignItems: 'center', gap: 24 },
  requestHint:    { color: MUTED, fontSize: 14, fontFamily: 'Georgia', textAlign: 'center', lineHeight: 22, fontStyle: 'italic' },
  requestBtn:     { backgroundColor: `${ACCENT}cc`, paddingVertical: 20, paddingHorizontal: 36, borderRadius: 50, alignItems: 'center' },
  requestBtnTxt:  { color: '#0f0d0b', fontSize: 16, letterSpacing: 1.5, fontFamily: 'Georgia', fontWeight: 'bold' },
});
