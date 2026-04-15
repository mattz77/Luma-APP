import type { Task, TaskStatus } from '@/types/models';

/** Tarefas que entram no feed unificado (exclui canceladas por padrão). */
export const TASK_FEED_EXCLUDED_STATUSES: TaskStatus[] = ['CANCELLED'];

export function isTaskIncludedInActivityFeed(task: Task): boolean {
  return !TASK_FEED_EXCLUDED_STATUSES.includes(task.status);
}

/**
 * Item unificado para lista de atividade (home, histórico).
 * `type` alinha navegação e ícone: finanças, tarefas, IoT.
 */
/** Linha do feed (dados; UI em `ActivityFeedListItem`). */
export type ActivityFeedRow = {
  id: string;
  type: 'finance' | 'task' | 'iot';
  title: string;
  subtitle: string;
  date: Date;
  time: string;
  /** Tarefas/IoT: avatar do responsável ou solicitante; finanças costuma omitir. */
  avatarUrl?: string | null;
};

/** Entrada já normalizada para merge (ex.: futuro `deviceActionService`). */
export type IoTFeedInput = {
  id: string;
  actionKey: string;
  deviceName: string;
  requestedByName: string;
  avatarUrl: string | null;
  executedAt: Date;
};
