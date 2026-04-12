const API_KEY  = process.env.EXPO_PUBLIC_ELEVENLABS_API_KEY  ?? '';
const VOICE_ID = process.env.EXPO_PUBLIC_ELEVENLABS_VOICE_ID ?? '';
const BASE_URL = 'https://api.elevenlabs.io/v1';

export interface ElevenLabsSettings {
  stability: number;
  similarity_boost: number;
  style: number;
}

// In-memory settings (persisted via TuneScreen)
let _settings: ElevenLabsSettings = {
  stability: 0.5,
  similarity_boost: 0.85,
  style: 0.2,
};

export function getVoiceSettings(): ElevenLabsSettings {
  return { ..._settings };
}

export function setVoiceSettings(s: ElevenLabsSettings) {
  _settings = { ...s };
}

/**
 * Converts text to speech using the user's cloned ElevenLabs voice.
 * Returns a blob URL suitable for playing via HTMLAudioElement or expo-av.
 */
export async function textToSpeech(text: string): Promise<string> {
  const response = await fetch(`${BASE_URL}/text-to-speech/${VOICE_ID}`, {
    method: 'POST',
    headers: {
      'xi-api-key': API_KEY,
      'Content-Type': 'application/json',
      'Accept': 'audio/mpeg',
    },
    body: JSON.stringify({
      text,
      model_id: 'eleven_turbo_v2_5',
      voice_settings: {
        ..._settings,
        use_speaker_boost: true,
      },
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`ElevenLabs TTS failed: ${response.status} ${err}`);
  }

  const blob = await response.blob();
  return URL.createObjectURL(blob);
}

/**
 * Clones the user's voice from an audio Blob and returns the new voice_id.
 */
export async function cloneVoice(audioBlob: Blob, name = 'My Voice'): Promise<string> {
  const form = new FormData();
  form.append('name', name);
  form.append('files', audioBlob, 'recording.webm');
  form.append('description', 'Cloned via Words of Love app');

  const response = await fetch(`${BASE_URL}/voices/add`, {
    method: 'POST',
    headers: { 'xi-api-key': API_KEY },
    body: form,
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`ElevenLabs voice clone failed: ${response.status} ${err}`);
  }

  const data = await response.json();
  return data.voice_id as string;
}
