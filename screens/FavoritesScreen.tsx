import React, { useContext } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { Compliment } from '../constants/compliments';
import { categoryColors, BG, CARD_BG, BORDER, TEXT_PRIMARY, TEXT_DIM } from '../constants/colors';
import { SpeakIcon } from '../components/Icons';
import { VoiceContext } from '../hooks/VoiceContext';

type Props = NativeStackScreenProps<RootStackParamList, 'Favorites'>;

export default function FavoritesScreen({ route, navigation }: Props) {
  const { favorites, setFavorites } = route.params;
  const { speak } = useContext(VoiceContext);

  const remove = (fav: Compliment) =>
    setFavorites(favorites.filter((f: Compliment) => f.text !== fav.text));

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: BG }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Saved ({favorites.length})</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {favorites.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No saved compliments yet.</Text>
            <Text style={styles.emptyHint}>Tap the heart on any you love.</Text>
          </View>
        ) : (
          favorites.map((fav: Compliment, i: number) => {
            const accent = categoryColors[fav.category];
            return (
              <View key={i} style={[styles.card, { borderLeftColor: `${accent}80`, borderColor: `${accent}30` }]}>
                <Text style={styles.cardCategory}>{fav.category.toUpperCase()}</Text>
                <Text style={styles.cardText}>"{fav.text}"</Text>
                <View style={styles.cardActions}>
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: `${accent}20`, borderColor: `${accent}40` }]}
                    onPress={() => speak(fav.text)}
                  >
                    <SpeakIcon color={accent} size={14} />
                    <Text style={[styles.actionBtnText, { color: accent }]}>Speak</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionBtn, { borderColor: BORDER }]}
                    onPress={() => remove(fav)}
                  >
                    <Text style={styles.removeBtnText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1 },
  header:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 16, paddingBottom: 12 },
  title:          { color: '#e8c4a0', fontSize: 20, fontStyle: 'italic', fontFamily: 'Georgia' },
  backBtn:        { borderWidth: 1, borderColor: BORDER, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8 },
  backBtnText:    { color: '#7a6a58', fontSize: 12, fontFamily: 'Georgia', letterSpacing: 1 },
  list:           { paddingHorizontal: 24, paddingBottom: 40 },
  empty:          { alignItems: 'center', marginTop: 80 },
  emptyText:      { color: '#3a2e24', fontSize: 16, fontStyle: 'italic', fontFamily: 'Georgia', marginBottom: 6 },
  emptyHint:      { color: '#3a2e24', fontSize: 13, fontFamily: 'Georgia' },
  card:           { backgroundColor: CARD_BG, borderWidth: 1, borderLeftWidth: 3, borderRadius: 12, padding: 20, marginBottom: 12 },
  cardCategory:   { color: TEXT_DIM, fontSize: 10, letterSpacing: 2, marginBottom: 8, fontFamily: 'Georgia' },
  cardText:       { color: TEXT_PRIMARY, fontSize: 15, fontStyle: 'italic', fontFamily: 'Georgia', marginBottom: 14, lineHeight: 24 },
  cardActions:    { flexDirection: 'row', gap: 8 },
  actionBtn:      { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8 },
  actionBtnText:  { fontSize: 11, letterSpacing: 1.5, fontFamily: 'Georgia' },
  removeBtnText:  { color: '#3a2e24', fontSize: 11, letterSpacing: 1.5, fontFamily: 'Georgia' },
});
