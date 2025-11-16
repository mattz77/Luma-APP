import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/supabase';
import type { Conversation } from '@/types/models';

type ConversationRow = Database['public']['Tables']['conversations']['Row'];
type ConversationInsert = Database['public']['Tables']['conversations']['Insert'];

const mapConversation = (conversation: ConversationRow): Conversation => ({
  id: conversation.id,
  houseId: conversation.house_id,
  userId: conversation.user_id,
  message: conversation.message,
  response: conversation.response,
  metadata: (conversation.metadata as Record<string, unknown> | null) ?? null,
  createdAt: conversation.created_at,
});

export const conversationService = {
  async getByHouse(houseId: string): Promise<Conversation[]> {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('house_id', houseId)
      .order('created_at', { ascending: true });

    if (error) {
      throw error;
    }

    const rows = (data ?? []) as ConversationRow[];
    return rows.map((conversation) => mapConversation(conversation));
  },

  async create(entry: ConversationInsert): Promise<Conversation> {
    const { data, error } = await supabase
      .from('conversations')
      .insert(entry)
      .select('*')
      .single();

    if (error || !data) {
      throw error ?? new Error('Falha ao registrar conversa');
    }

    return mapConversation(data as ConversationRow);
  },
};

