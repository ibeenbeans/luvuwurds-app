import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

const BG     = '#0f0d0b';
const ACCENT = '#e8c4a0';
const MUTED  = '#b89f84';
const CARD   = '#1e1a14';
const BORDER = '#3d3228';

export default function OnboardingScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.glow} pointerEvents="none" />

      <View style={styles.hero}>
        <Text style={styles.eyebrow}>Welcome to</Text>
        <Text style={styles.title}>Luvuwurds</Text>
        <Text style={styles.subtitle}>A private space between two people.</Text>
      </View>

      <View style={styles.cards}>
        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate('HisSetup')}
          activeOpacity={0.85}
        >
          <Text style={styles.cardTitle}>This is my app</Text>
          <Text style={styles.cardDesc}>
            Set up your side and generate an invite code for her.
          </Text>
          <Text style={styles.cardArrow}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.card, styles.cardHer]}
          onPress={() => navigation.navigate('HerSetup')}
          activeOpacity={0.85}
        >
          <Text style={[styles.cardTitle, { color: '#d4a0c0' }]}>I received an invite</Text>
          <Text style={styles.cardDesc}>
            Enter the code he sent you to unlock your experience.
          </Text>
          <Text style={[styles.cardArrow, { color: '#d4a0c0' }]}>→</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  glow: {
    position: 'absolute',
    top: '-10%',
    alignSelf: 'center',
    width: 500,
    height: 500,
    borderRadius: 250,
    backgroundColor: '#e8c4a008',
  },
  hero: {
    alignItems: 'center',
    marginBottom: 56,
  },
  eyebrow: {
    color: MUTED,
    fontSize: 12,
    letterSpacing: 4,
    textTransform: 'uppercase',
    fontFamily: 'Georgia',
    marginBottom: 8,
  },
  title: {
    color: ACCENT,
    fontSize: 42,
    fontStyle: 'italic',
    fontFamily: 'Georgia',
    marginBottom: 12,
  },
  subtitle: {
    color: MUTED,
    fontSize: 14,
    fontFamily: 'Georgia',
    fontStyle: 'italic',
  },
  cards: {
    gap: 16,
  },
  card: {
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: `${ACCENT}40`,
    borderRadius: 16,
    padding: 24,
  },
  cardHer: {
    borderColor: '#d4a0c040',
  },
  cardTitle: {
    color: ACCENT,
    fontSize: 18,
    fontFamily: 'Georgia',
    marginBottom: 8,
  },
  cardDesc: {
    color: MUTED,
    fontSize: 13,
    fontFamily: 'Georgia',
    lineHeight: 20,
    marginBottom: 16,
  },
  cardArrow: {
    color: ACCENT,
    fontSize: 18,
    fontFamily: 'Georgia',
    textAlign: 'right',
  },
});
