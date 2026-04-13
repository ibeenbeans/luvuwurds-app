import { createClient } from '@supabase/supabase-js';

const URL   = process.env.EXPO_PUBLIC_SUPABASE_URL   ?? '';
const ANON  = process.env.EXPO_PUBLIC_SUPABASE_ANON  ?? '';

export const supabase = createClient(URL, ANON);

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Couple {
  id: string;
  invite_code: string;
  his_push_token: string | null;
  her_push_token: string | null;
}

export type MessageType =
  | 'compliment_request'   // she → him
  | 'recording'            // him → her
  | 'reaction';            // her → him

export interface Message {
  id: string;
  couple_id: string;
  type: MessageType;
  payload: Record<string, any>;
  delivered: boolean;
  created_at: string;
}

// ── Couples ───────────────────────────────────────────────────────────────────

/** Generate a short invite code and create a new couple row. */
export async function createCouple(inviteCode: string): Promise<Couple> {
  const { data, error } = await supabase
    .from('couples')
    .insert({ invite_code: inviteCode.toUpperCase() })
    .select()
    .single();
  if (error) throw error;
  return data;
}

/** Look up a couple by invite code (her side). */
export async function findCouple(inviteCode: string): Promise<Couple | null> {
  const { data, error } = await supabase
    .from('couples')
    .select()
    .eq('invite_code', inviteCode.toUpperCase())
    .maybeSingle();
  if (error) throw error;
  return data;
}

/** Save a push token for his or her side. */
export async function savePushToken(
  coupleId: string,
  role: 'his' | 'her',
  token: string,
) {
  const col = role === 'his' ? 'his_push_token' : 'her_push_token';
  const { error } = await supabase
    .from('couples')
    .update({ [col]: token })
    .eq('id', coupleId);
  if (error) throw error;
}

// ── Messages ──────────────────────────────────────────────────────────────────

/** Post a message to the mailbox. */
export async function sendMessage(
  coupleId: string,
  type: MessageType,
  payload: Record<string, any>,
): Promise<Message> {
  const { data, error } = await supabase
    .from('messages')
    .insert({ couple_id: coupleId, type, payload })
    .select()
    .single();
  if (error) throw error;
  return data;
}

/** Fetch all undelivered messages for a couple. */
export async function fetchMessages(coupleId: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from('messages')
    .select()
    .eq('couple_id', coupleId)
    .eq('delivered', false)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

/** Mark a message as delivered (it stays for history but won't re-appear). */
export async function markDelivered(messageId: string) {
  const { error } = await supabase
    .from('messages')
    .update({ delivered: true })
    .eq('id', messageId);
  if (error) throw error;
}
