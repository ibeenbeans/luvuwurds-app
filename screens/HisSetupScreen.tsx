import React, { useState, useContext } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ActivityIndicator, Share, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { createCouple } from '../services/supabase';
import { registerForPushNotifications, sendPush } from '../services/notifications';
import { savePushToken } from '../services/supabase';
import { AppStateContext } from '../hooks/AppStateContext';

type Props = NativeStackScreenProps<RootStackParamList, 'HisSetup'>;

const BG     = '#0f0d0b';
const ACCENT = '#e8c4a0';
const MUTED  = '#5a4a3a';
const CARD   = '#18140f';
const BORDER = '#2a2520';

function generateCode(): string {
  const words = ['ROSE', 'MOON', 'DAWN', 'STAR', 'GOLD', 'JADE', 'IRIS', 'LARK', 'SAGE', 'FERN'];
  const word  = words[Math.floor(Math.random() * words.length)];
  const num   = String(Math.floor(Math.random() * 90) + 10);
  return `${word}${num}`;
}

export default function HisSetupScreen({ navigation }: Props) {
  const { saveAppState } = useContext(AppStateContext);
  const [code]    = useState(generateCode);
  const [loading, setLoading] = useState(false);
  const [done, setDone]       = useState(false);

  const handleSetup = async () => {
    setLoading(true);
    try {
      const couple = await createCouple(code);
      const token  = await registerForPushNotifications();
      if (token) await savePushToken(couple.id, 'his', token);
      await saveAppState({
        role: 'his',
        coupleId: couple.id,
        inviteCode: code,
        hisPushToken: token,
      });
      setDone(true);
    } catch (e) {
      Alert.alert('Setup failed', 'Check your connection and try again.');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = () => {
    Share.share({
      message: `I made something for us. Download Luvuwurds and enter this code when it asks: ${code}`,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Invite Code</Text>
        {!done && (
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backTxt}>← Back</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.content}>
        <View style={styles.codeCard}>
          <Text style={styles.codeLabel}>HER CODE</Text>
          <Text style={styles.code}>{code}</Text>
          <Text style={styles.codeHint}>
            She enters this when she first opens the app.{'\n'}
            Keep it between you two.
          </Text>
        </View>

        {!done ? (
          <>
            <TouchableOpacity
              style={[styles.btn, loading && { opacity: 0.6 }]}
              onPress={handleSetup}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading
                ? <ActivityIndicator color="#0f0d0b" />
                : <Text style={styles.btnTxt}>Set Up My App</Text>
              }
            </TouchableOpacity>
            <Text style={styles.note}>
              This registers your app and creates your private space.
            </Text>
          </>
        ) : (
          <>
            <View style={styles.doneCard}>
              <Text style={styles.doneTitle}>✓ You're all set</Text>
              <Text style={styles.doneDesc}>
                Now send her the code so she can unlock her side.
              </Text>
            </View>
            <TouchableOpacity style={styles.shareBtn} onPress={handleShare} activeOpacity={0.85}>
              <Text style={styles.shareBtnTxt}>Send Her the Code</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.continueBtn}
              onPress={() => navigation.replace('HisHome')}
              activeOpacity={0.85}
            >
              <Text style={styles.continueBtnTxt}>Go to My App →</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: BG },
  header:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 16, paddingBottom: 8 },
  title:         { color: ACCENT, fontSize: 20, fontStyle: 'italic', fontFamily: 'Georgia' },
  backBtn:       { borderWidth: 1, borderColor: BORDER, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7 },
  backTxt:       { color: MUTED, fontSize: 12, fontFamily: 'Georgia' },
  content:       { flex: 1, paddingHorizontal: 24, paddingTop: 20 },
  codeCard:      { backgroundColor: CARD, borderWidth: 1, borderColor: `${ACCENT}40`, borderRadius: 16, padding: 32, alignItems: 'center', marginBottom: 28 },
  codeLabel:     { color: MUTED, fontSize: 11, letterSpacing: 4, fontFamily: 'Georgia', marginBottom: 16 },
  code:          { color: ACCENT, fontSize: 44, letterSpacing: 8, fontFamily: 'Georgia', marginBottom: 20 },
  codeHint:      { color: MUTED, fontSize: 13, fontFamily: 'Georgia', textAlign: 'center', lineHeight: 20 },
  btn:           { backgroundColor: `${ACCENT}cc`, padding: 18, borderRadius: 14, alignItems: 'center', marginBottom: 12 },
  btnTxt:        { color: '#0f0d0b', fontSize: 15, letterSpacing: 2, fontFamily: 'Georgia', fontWeight: 'bold' },
  note:          { color: MUTED, fontSize: 12, fontFamily: 'Georgia', textAlign: 'center', lineHeight: 18 },
  doneCard:      { backgroundColor: CARD, borderWidth: 1, borderColor: `${ACCENT}30`, borderRadius: 14, padding: 24, marginBottom: 20 },
  doneTitle:     { color: ACCENT, fontSize: 18, fontFamily: 'Georgia', marginBottom: 8 },
  doneDesc:      { color: MUTED, fontSize: 13, fontFamily: 'Georgia', lineHeight: 20 },
  shareBtn:      { backgroundColor: `${ACCENT}cc`, padding: 16, borderRadius: 14, alignItems: 'center', marginBottom: 12 },
  shareBtnTxt:   { color: '#0f0d0b', fontSize: 14, letterSpacing: 2, fontFamily: 'Georgia', fontWeight: 'bold' },
  continueBtn:   { backgroundColor: CARD, borderWidth: 1, borderColor: BORDER, padding: 14, borderRadius: 14, alignItems: 'center' },
  continueBtnTxt:{ color: MUTED, fontSize: 13, fontFamily: 'Georgia', letterSpacing: 1 },
});
