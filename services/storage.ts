import * as FileSystem from 'expo-file-system';

const RECORDINGS_DIR = `${FileSystem.documentDirectory}recordings/`;

async function ensureDir() {
  const info = await FileSystem.getInfoAsync(RECORDINGS_DIR);
  if (!info.exists) await FileSystem.makeDirectoryAsync(RECORDINGS_DIR, { intermediates: true });
}

/** Save a recording from a temp URI to permanent local storage. Returns the new URI. */
export async function saveRecording(tempUri: string, filename: string): Promise<string> {
  await ensureDir();
  const dest = `${RECORDINGS_DIR}${filename}`;
  await FileSystem.copyAsync({ from: tempUri, to: dest });
  return dest;
}

/** List all saved recordings. */
export async function listRecordings(): Promise<string[]> {
  await ensureDir();
  const files = await FileSystem.readDirectoryAsync(RECORDINGS_DIR);
  return files.map(f => `${RECORDINGS_DIR}${f}`).sort().reverse();
}

/** Delete a recording by URI. */
export async function deleteRecording(uri: string) {
  await FileSystem.deleteAsync(uri, { idempotent: true });
}

/** Read a recording as a base64 string (for upload). */
export async function readAsBase64(uri: string): Promise<string> {
  return FileSystem.readAsStringAsync(uri, { encoding: 'base64' as any });
}
