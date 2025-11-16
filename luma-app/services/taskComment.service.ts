import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/supabase';

type TaskCommentRow = Database['public']['Tables']['task_comments']['Row'];
type TaskCommentInsert = Database['public']['Tables']['task_comments']['Insert'];
type UserRow = Database['public']['Tables']['users']['Row'];

interface TaskCommentRowWithUser extends TaskCommentRow {
  user: UserRow | null;
}

export interface TaskComment {
  id: string;
  taskId: string;
  userId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    name: string | null;
    email: string;
    avatarUrl: string | null;
  } | null;
}

const mapComment = (comment: TaskCommentRowWithUser): TaskComment => ({
  id: comment.id,
  taskId: comment.task_id,
  userId: comment.user_id,
  content: comment.content,
  createdAt: comment.created_at,
  updatedAt: comment.updated_at,
  user: comment.user
    ? {
        id: comment.user.id,
        name: comment.user.name,
        email: comment.user.email,
        avatarUrl: comment.user.avatar_url,
      }
    : null,
});

export const taskCommentService = {
  async getByTask(taskId: string): Promise<TaskComment[]> {
    const { data, error } = await supabase
      .from('task_comments')
      .select('*, user:users!task_comments_user_id_fkey(*)')
      .eq('task_id', taskId)
      .order('created_at', { ascending: true });

    if (error) {
      throw error;
    }

    return (data ?? []).map((comment) => mapComment(comment as TaskCommentRowWithUser));
  },

  async create(comment: TaskCommentInsert): Promise<TaskComment> {
    const { data, error } = await supabase
      .from('task_comments')
      .insert(comment)
      .select('*, user:users!task_comments_user_id_fkey(*)')
      .single();

    if (error || !data) {
      throw error ?? new Error('Falha ao criar comentário');
    }

    return mapComment(data as TaskCommentRowWithUser);
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('task_comments').delete().eq('id', id);

    if (error) {
      throw error;
    }
  },
};

