import { supabase } from './supabase';
import type { User, Conversation, Message, UserPreferences } from '@/types';

// ── Profiles ──────────────────────────────────────────────────────────────────

export async function upsertProfile(user: User) {
  const { error } = await supabase.from('profiles').upsert({
    id: user.id,
    name: user.name,
    email: user.email,
    avatar_url: user.avatar ?? null,
    plan: user.plan,
  });
  if (error) throw error;
}

export async function fetchProfile(userId: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, email, avatar_url, plan, created_at')
    .eq('id', userId)
    .single();
  if (error || !data) return null;
  return {
    id: data.id,
    name: data.name,
    email: data.email,
    avatar: data.avatar_url ?? undefined,
    joinedAt: data.created_at,
    plan: data.plan as User['plan'],
  };
}

// ── Preferences ───────────────────────────────────────────────────────────────

export async function fetchPreferences(userId: string): Promise<UserPreferences | null> {
  const { data, error } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', userId)
    .single();
  if (error || !data) return null;
  return {
    theme: data.theme as UserPreferences['theme'],
    notifications: data.notifications,
    emailUpdates: data.email_updates,
    emergencyAlerts: data.emergency_alerts,
    voiceMuted: data.voice_muted,
    language: data.language,
    fontSize: data.font_size as UserPreferences['fontSize'],
  };
}

export async function upsertPreferences(userId: string, prefs: UserPreferences) {
  const { error } = await supabase.from('user_preferences').upsert({
    user_id: userId,
    theme: prefs.theme,
    notifications: prefs.notifications,
    email_updates: prefs.emailUpdates,
    emergency_alerts: prefs.emergencyAlerts,
    voice_muted: prefs.voiceMuted,
    language: prefs.language,
    font_size: prefs.fontSize,
  });
  if (error) throw error;
}

// ── Conversations ─────────────────────────────────────────────────────────────

export async function fetchConversations(userId: string): Promise<Conversation[]> {
  const { data, error } = await supabase
    .from('conversations')
    .select('id, title, last_message, message_count, is_favorite, is_archived, category, updated_at')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });
  if (error || !data) return [];
  return data.map((c) => ({
    id: c.id,
    title: c.title,
    lastMessage: c.last_message,
    messageCount: c.message_count,
    isFavorite: c.is_favorite,
    isArchived: c.is_archived,
    category: c.category as Conversation['category'],
    timestamp: c.updated_at,
  }));
}

export async function createConversation(userId: string, conv: Omit<Conversation, 'id'>): Promise<Conversation | null> {
  const { data, error } = await supabase
    .from('conversations')
    .insert({
      user_id: userId,
      title: conv.title,
      last_message: conv.lastMessage,
      message_count: conv.messageCount,
      is_favorite: conv.isFavorite,
      is_archived: conv.isArchived,
      category: conv.category,
    })
    .select()
    .single();
  if (error || !data) return null;
  return { ...conv, id: data.id, timestamp: data.updated_at };
}

export async function updateConversation(id: string, patch: Partial<{ title: string; isFavorite: boolean; isArchived: boolean; lastMessage: string; messageCount: number }>) {
  const dbPatch: Record<string, unknown> = {};
  if (patch.title !== undefined) dbPatch.title = patch.title;
  if (patch.isFavorite !== undefined) dbPatch.is_favorite = patch.isFavorite;
  if (patch.isArchived !== undefined) dbPatch.is_archived = patch.isArchived;
  if (patch.lastMessage !== undefined) dbPatch.last_message = patch.lastMessage;
  if (patch.messageCount !== undefined) dbPatch.message_count = patch.messageCount;
  const { error } = await supabase.from('conversations').update(dbPatch).eq('id', id);
  if (error) throw error;
}

export async function deleteConversation(id: string) {
  const { error } = await supabase.from('conversations').delete().eq('id', id);
  if (error) throw error;
}

// ── Messages ──────────────────────────────────────────────────────────────────

export async function fetchMessages(conversationId: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('id, conversation_id, role, content, is_emergency, created_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });
  if (error || !data) return [];
  return data.map((m) => ({
    id: m.id,
    conversationId: m.conversation_id,
    role: m.role as Message['role'],
    content: m.content,
    isEmergency: m.is_emergency,
    timestamp: m.created_at,
  }));
}

export async function insertMessage(userId: string, msg: Omit<Message, 'id' | 'timestamp'>): Promise<Message | null> {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: msg.conversationId,
      user_id: userId,
      role: msg.role,
      content: msg.content,
      is_emergency: msg.isEmergency ?? false,
    })
    .select()
    .single();
  if (error || !data) return null;
  return { ...msg, id: data.id, timestamp: data.created_at };
}

// ── Activity Logs ─────────────────────────────────────────────────────────────

export async function logActivity(userId: string, action: string, resourceType?: string, resourceId?: string) {
  await supabase.from('activity_logs').insert({
    user_id: userId,
    action,
    resource_type: resourceType ?? null,
    resource_id: resourceId ?? null,
  });
}
