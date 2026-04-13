import React, { useState, useContext } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { findCouple, savePushToken } from '../services/supabase';
import { registerForPushNotifications } from '../services/notifications';
import { AppStateContext } from '../hooks/AppStateContext';

type Props = NativeStackScreenProps<RootStackParamList, 'HerSetup'>;

const BG     = '#0f0d0b';
const ACCENT = '#d4a0c0';
const MUTED  = '#5a4a3a';
const CARD   = '#18140f';
const BORDER = '#2a2520';

export default function HerSetupScreen({ navigation }: Props) {
  const { saveAppState } = useContext(AppStateContext);
  const [code, setCode]   = useState('');
  const [loading, setLoading] = useState(false);

  const handleJoin = async () => {
    if (code.trim().length < 5) {
      Alert.alert('Check your code', 'Enter the code exactly as he sent it.');
      return;
    }
    setLoading(true);
    try {
      const couple = await findCouple(code.trim());
      if (!couple) {
        Alert.alert('Code not found', 'Double-check the code and try again.');
        return;
      }
      const token = await registerForPushNotifications();
      if (token) await savePushToken(couple.id, 'her', token);
      await saveAppState({
        role: 'hers',
        coupleId: couple.id,
        inviteCode: code.trim().toUpperCase(),
        herPushToken: token,
        hisPushToken: couple.his_push_token,
      });
      navigation.replace('HerHome');
    } catch (e) {
      Alert.alert('Something went wrong', 'Check your connection and try again.');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Enter Your Code</Text>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backTxt}>← Back</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>HE SENT YOU A CODE</Text>
            <Text style={styles.cardHint}>
              Enter it below to unlock your private space and pair your apps.
            </Text>
          </View>

          <TextInput
            style={styles.input}
            value={code}
            onChangeText={t => setCode(t.toUpperCase())}
            placeholder="e.g. ROSE47"
            placeholderTextColor="#3a2e24"
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={8}
          />

          <TouchableOpacity
            style={[styles.btn, (loading || code.length < 4) && { opacity: 0.5 }]}
            onPress={handleJoin}
            disabled={loading || code.length < 4}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color="#0f0d0b" />
              : <Text style={styles.btnTxt}>Unlock My App ♡</Text>
            }
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: BG },
  header:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 16, paddingBottom: 8 },
  title:      { color: ACCENT, fontSize: 20, fontStyle: 'italic', fontFamily: 'Georgia' },
  backBtn:    { borderWidth: 1, borderColor: BORDER, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7 },
  backTxt:    { color: MUTED, fontSize: 12, fontFamily: 'Georgia' },
  content:    { flex: 1, paddingHorizontal: 24, paddingTop: 20 },
  card:       { backgroundColor: CARD, borderWidth: 1, borderColor: `${ACCENT}30`, borderRadius: 16, padding: 24, marginBottom: 24 },
  cardLabel:  { color: MUTED, fontSize: 11, letterSpacing: 3, fontFamily: 'Georgia', marginBottom: 10 },
  cardHint:   { color: '#7a6a78', fontSize: 14, fontFamily: 'Georgia', lineHeight: 22 },
  input:      {
    backgroundColor: CARD, borderWidth: 1, borderColor: `${ACCENT}40`,
    borderRadius: 14, padding: 20, color: ACCENT,
    fontSize: 32, letterSpacing: 8, fontFamily: 'Georgia',
    textAlign: 'center', marginBottom: 20,
  },
  btn:        { backgroundColor: `${ACCENT}cc`, padding: 18, borderRadius: 14, alignItems: 'center' },
  btnTxt:     { color: '#0f0d0b', fontSize: 15, letterSpacing: 2, fontFamily: 'Georgia', fontWeight: 'bold' },
});
