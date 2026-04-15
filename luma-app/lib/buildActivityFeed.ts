import type { Expense, Task } from '@/types/models';
import type { ActivityFeedRow, IoTFeedInput } from '@/types/activity-feed';
import { isTaskIncludedInActivityFeed } from '@/types/activity-feed';
import { getIoTActionLabelPt } from '@/lib/iotActionLabels';

const TASK_STATUS_LABEL_PT: Record<Task['status'], string> = {
  PENDING: 'Pendente',
  IN_PROGRESS: 'Em andamento',
  COMPLETED: 'Concluída',
  CANCELLED: 'Cancelada',
};

/** Data usada para ordenação e filtro de “atividade” da tarefa. */
export function getTaskActivityDate(task: Task): Date {
  if (task.status === 'COMPLETED' && task.completedAt) {
    return new Date(task.completedAt);
  }
  return new Date(task.updatedAt);
}

export function getTaskFeedAvatarUrl(task: Task): string | null {
  return task.assignee?.avatarUrl ?? task.creator?.avatarUrl ?? null;
}

export function formatTaskFeedSubtitle(task: Task): string {
  const statusLabel = TASK_STATUS_LABEL_PT[task.status];
  const assigneeName = task.assignee?.name?.trim() || 'Sem responsável';
  let line = `${statusLabel} · ${assigneeName}`;
  if (
    task.creator &&
    (!task.assignee || task.creator.id !== task.assignee.id)
  ) {
    line += ` · criada por ${task.creator.name ?? '—'}`;
  }
  return line;
}

function isDateInRange(d: Date, start: Date, end: Date): boolean {
  return d >= start && d <= end;
}

function formatTime(d: Date): string {
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function expenseToFeedItem(e: Expense): ActivityFeedRow {
  const date = new Date(e.expenseDate);
  return {
    id: e.id,
    type: 'finance',
    title: e.description,
    subtitle: `R$ ${Number(e.amount).toFixed(2)}`,
    date,
    time: formatTime(date),
    avatarUrl: null,
  };
}

function taskToFeedItem(task: Task): ActivityFeedRow {
  const d = getTaskActivityDate(task);
  return {
    id: task.id,
    type: 'task',
    title: task.title,
    subtitle: formatTaskFeedSubtitle(task),
    date: d,
    time: formatTime(d),
    avatarUrl: getTaskFeedAvatarUrl(task),
  };
}

function iotToFeedItem(row: IoTFeedInput): ActivityFeedRow {
  const actionLabel = getIoTActionLabelPt(row.actionKey);
  const d = row.executedAt;
  return {
    id: row.id,
    type: 'iot',
    title: actionLabel,
    subtitle: `${row.deviceName} · solicitado por ${row.requestedByName}`,
    date: d,
    time: formatTime(d),
    avatarUrl: row.avatarUrl,
  };
}

export type BuildActivityFeedParams = {
  expenses: Expense[];
  tasks: Task[];
  /** Futuro: linhas vindas de `deviceActionService` + join em dispositivo/usuário. */
  iotFeedItems?: IoTFeedInput[];
  /** Limite de despesas do mês (mais recentes primeiro), padrão histórico do dashboard. */
  expenseLimit?: number;
  /** Data de referência para janela do mês (dashboard = hoje). */
  referenceDate: Date;
  /** Recorte final após merge (preview na home). Omitir = todos os itens do mês. */
  previewLimit?: number;
};

/**
 * Monta o feed do mês de `referenceDate`: despesas (top N), tarefas não canceladas cuja
 * data de atividade cai no mês, e entradas IoT opcionais; ordena por data descendente.
 */
export function buildActivityFeed({
  expenses,
  tasks,
  iotFeedItems = [],
  expenseLimit = 3,
  referenceDate,
  previewLimit,
}: BuildActivityFeedParams): ActivityFeedRow[] {
  const now = referenceDate;
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  const recentExpenses = expenses
    .filter((e) => {
      const date = new Date(e.expenseDate);
      return isDateInRange(date, startOfMonth, endOfMonth);
    })
    .sort((a, b) => new Date(b.expenseDate).getTime() - new Date(a.expenseDate).getTime())
    .slice(0, expenseLimit)
    .map(expenseToFeedItem);

  const monthTasks = tasks
    .filter(isTaskIncludedInActivityFeed)
    .filter((t) => {
      const d = getTaskActivityDate(t);
      return isDateInRange(d, startOfMonth, endOfMonth);
    })
    .map(taskToFeedItem);

  const iotRows = (iotFeedItems ?? []).map(iotToFeedItem).filter((row) =>
    isDateInRange(row.date, startOfMonth, endOfMonth)
  );

  const merged = [...recentExpenses, ...monthTasks, ...iotRows].sort(
    (a, b) => b.date.getTime() - a.date.getTime()
  );

  if (previewLimit != null && previewLimit > 0) {
    return merged.slice(0, previewLimit);
  }
  return merged;
}

/** Atalho para o preview da home (4 itens). */
export function buildDashboardActivityPreview(
  params: Omit<BuildActivityFeedParams, 'previewLimit'>
): ActivityFeedRow[] {
  return buildActivityFeed({ ...params, previewLimit: 4 });
}
