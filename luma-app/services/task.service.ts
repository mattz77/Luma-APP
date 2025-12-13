import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/supabase';
import type { Task, TaskPriority, TaskStatus, User } from '@/types/models';
import { RAGService } from '@/services/rag.service';

type TaskRow = Database['public']['Tables']['tasks']['Row'];
type TaskInsert = Database['public']['Tables']['tasks']['Insert'];
type TaskUpdate = Database['public']['Tables']['tasks']['Update'];
type UserRow = Database['public']['Tables']['users']['Row'];

interface TaskRowWithRelations extends TaskRow {
  assignee: UserRow | null;
  creator: UserRow | null;
}

const mapUser = (user: UserRow | null): User | null => {
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatar_url,
    phone: user.phone,
    createdAt: user.created_at,
    updatedAt: user.updated_at,
    lastLoginAt: user.last_login_at,
  };
};

const mapTask = (task: TaskRowWithRelations): Task => ({
  id: task.id,
  houseId: task.house_id,
  createdById: task.created_by_id,
  assignedToId: task.assigned_to_id,
  title: task.title,
  description: task.description,
  status: task.status as TaskStatus,
  priority: task.priority as TaskPriority,
  dueDate: task.due_date,
  completedAt: task.completed_at,
  isRecurring: task.is_recurring,
  recurrence: task.recurrence,
  tags: task.tags,
  points: task.points,
  createdAt: task.created_at,
  updatedAt: task.updated_at,
  assignee: mapUser(task.assignee),
  creator: mapUser(task.creator),
});

export type { TaskInsert, TaskUpdate };

export const taskService = {
  async getById(id: string, houseId: string): Promise<Task | null> {
    const { data, error } = await supabase
      .from('tasks')
      .select('*, assignee:users!tasks_assigned_to_id_fkey(*), creator:users!tasks_created_by_id_fkey(*)')
      .eq('id', id)
      .eq('house_id', houseId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }

    if (!data) {
      return null;
    }

    return mapTask(data as TaskRowWithRelations);
  },

  async getAll(houseId: string): Promise<Task[]> {
    const { data, error } = await supabase
      .from('tasks')
      .select('*, assignee:users!tasks_assigned_to_id_fkey(*), creator:users!tasks_created_by_id_fkey(*)')
      .eq('house_id', houseId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    const rows = (data ?? []) as TaskRowWithRelations[];
    return rows.map((task) => mapTask(task));
  },

  async create(task: TaskInsert): Promise<Task> {
    const { data, error } = await supabase
      .from('tasks')
      .insert(task)
      .select('*, assignee:users!tasks_assigned_to_id_fkey(*), creator:users!tasks_created_by_id_fkey(*)')
      .single();

    if (error || !data) {
      throw error ?? new Error('Falha ao criar tarefa');
    }

    const created = mapTask(data as TaskRowWithRelations);

    // Indexar tarefa no RAG (async)
    RAGService.addDocument({
      house_id: created.houseId,
      content: `Tarefa: ${created.title}. ${created.description ?? 'Sem descrição'}. Status: ${created.status}. Prioridade: ${created.priority}. Responsável: ${created.assignee?.name ?? 'Ninguém'}.`,
      doc_type: 'task',
      metadata: {
        id: created.id,
        status: created.status,
        priority: created.priority,
      },
    }).catch((err) => console.warn('[Task] Falha ao indexar no RAG', err));

    // Agendar notificação se tiver prazo e responsável
    if (created.dueDate && created.assignedToId) {
      const { scheduleTaskReminder } = await import('@/hooks/useNotifications');
      scheduleTaskReminder(created.id, created.title, new Date(created.dueDate), 24).catch((err) =>
        console.warn('[Task] Falha ao agendar notificação', err)
      );
    }

    return created;
  },

  async update(id: string, updates: TaskUpdate & { house_id?: string; houseId?: string }): Promise<Task> {
    const houseId = updates.house_id ?? (updates as { houseId?: string }).houseId;
    let query = supabase.from('tasks').update(updates).eq('id', id);
    if (houseId) {
      query = query.eq('house_id', houseId);
    }

    const { data, error } = await query
      .select('*, assignee:users!tasks_assigned_to_id_fkey(*), creator:users!tasks_created_by_id_fkey(*)')
      .single();

    if (error || !data) {
      throw error ?? new Error('Falha ao atualizar tarefa');
    }

    return mapTask(data as TaskRowWithRelations);
  },

  async remove(id: string, houseId: string): Promise<void> {
    const { error } = await supabase.from('tasks').delete().eq('id', id).eq('house_id', houseId);

    if (error) {
      throw error;
    }
  },
};

