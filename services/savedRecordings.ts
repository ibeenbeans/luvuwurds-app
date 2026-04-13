import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'his_saved_recordings';

export interface SavedRecording {
  id: string;
  text: string;
  audio_base64: string;
  audio_type: string;
  compliment_index: number;
  savedAt: string;
}

export async function getSavedRecordings(): Promise<SavedRecording[]> {
  const raw = await AsyncStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function saveRecordingLocally(
  rec: Omit<SavedRecording, 'id' | 'savedAt'>
): Promise<SavedRecording> {
  const all = await getSavedRecordings();
  const entry: SavedRecording = {
    ...rec,
    id: `rec_${Date.now()}`,
    savedAt: new Date().toISOString(),
  };
  await AsyncStorage.setItem(KEY, JSON.stringify([...all, entry]));
  return entry;
}

export async function deleteRecordingLocally(id: string): Promise<void> {
  const all = await getSavedRecordings();
  await AsyncStorage.setItem(KEY, JSON.stringify(all.filter(r => r.id !== id)));
}
