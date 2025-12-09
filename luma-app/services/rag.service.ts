import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/supabase';
import type {
  AddDocumentParams,
  RAGDocument,
  RAGDocumentType,
  RAGMetadata,
  RAGSearchParams,
} from '@/types/rag.types';

type ExpenseRow = Database['public']['Tables']['expenses']['Row'];
type TaskRow = Database['public']['Tables']['tasks']['Row'];
type ConversationRow = Database['public']['Tables']['conversations']['Row'];

type ExpenseWithJoins = ExpenseRow & {
  category?: { name?: string | null } | null;
  created_by?: { name?: string | null } | null;
};

type TaskWithJoins = TaskRow & {
  assigned_to?: { name?: string | null } | null;
};

export class RAGService {
  static async hybridSearch(params: RAGSearchParams): Promise<RAGDocument[]> {
    try {
      const { data, error } = await supabase.functions.invoke<{
        success: boolean;
        results?: RAGDocument[];
      }>('hybrid-search', {
        body: {
          query: params.query,
          house_id: params.house_id,
          match_count: params.match_count ?? 10,
          doc_type: params.doc_type,
        },
      });

      if (error) {
        console.error('[RAG] hybridSearch error', error);
        return [];
      }

      return data?.results ?? [];
    } catch (err) {
      console.error('[RAG] hybridSearch failed', err);
      return [];
    }
  }

  static async addDocument(params: AddDocumentParams): Promise<string | null> {
    try {
      const { data, error } = await supabase.functions.invoke<{
        document_ids?: string[];
      }>('add-to-rag', {
        body: {
          house_id: params.house_id,
          document: {
            content: params.content,
            doc_type: params.doc_type,
            metadata: params.metadata ?? {},
          },
        },
      });

      if (error) {
        throw error;
      }

      return data?.document_ids?.[0] ?? null;
    } catch (err) {
      console.error('[RAG] addDocument error', err);
      return null;
    }
  }

  static async addDocuments(
    house_id: string,
    documents: Array<{ content: string; doc_type: RAGDocumentType; metadata?: RAGMetadata }>,
  ): Promise<number> {
    try {
      const { data, error } = await supabase.functions.invoke<{
        inserted?: number;
      }>('add-to-rag', {
        body: {
          house_id,
          documents,
        },
      });

      if (error) {
        throw error;
      }

      return data?.inserted ?? 0;
    } catch (err) {
      console.error('[RAG] addDocuments error', err);
      return 0;
    }
  }

  static async indexHouseData(house_id: string): Promise<void> {
    try {
      const [expensesResult, tasksResult, conversationsResult] = await Promise.all([
        supabase
          .from('expenses')
          .select('id, description, amount, expense_date, category:expense_categories(name), created_by:users(name)')
          .eq('house_id', house_id)
          .order('expense_date', { ascending: false })
          .limit(100),
        supabase
          .from('tasks')
          .select('id, title, description, status, priority, due_date, assigned_to:users(name)')
          .eq('house_id', house_id)
          .order('created_at', { ascending: false })
          .limit(100),
        supabase
          .from('conversations')
          .select('id, message, response, created_at')
          .eq('house_id', house_id)
          .order('created_at', { ascending: false })
          .limit(50),
      ]);

      const documents: Array<{ content: string; doc_type: RAGDocumentType; metadata: RAGMetadata }> = [];

      (expensesResult.data as ExpenseWithJoins[] | null)?.forEach((expense) => {
        const dateStr = expense.expense_date ? new Date(expense.expense_date).toLocaleDateString('pt-BR') : '';
        const category = expense.category?.name ?? 'Sem categoria';
        const createdBy = expense.created_by?.name ?? 'Alguém';

        documents.push({
          content: `Despesa de ${category}: ${expense.description}. Valor: R$ ${expense.amount}. Registrada por ${createdBy} em ${dateStr}.`,
          doc_type: 'expense',
          metadata: {
            id: expense.id,
            amount: Number(expense.amount),
            date: expense.expense_date,
            category,
          },
        });
      });

      (tasksResult.data as TaskWithJoins[] | null)?.forEach((task) => {
        const assignedTo = task.assigned_to?.name ?? 'Ninguém';
        const dueDate = task.due_date
          ? `Prazo: ${new Date(task.due_date).toLocaleDateString('pt-BR')}`
          : 'Sem prazo';

        documents.push({
          content: `Tarefa: ${task.title}. ${task.description ?? 'Sem descrição'}. Status: ${task.status}. Prioridade: ${task.priority}. Responsável: ${assignedTo}. ${dueDate}.`,
          doc_type: 'task',
          metadata: {
            id: task.id,
            status: task.status,
            priority: task.priority,
          },
        });
      });

      (conversationsResult.data as ConversationRow[] | null)?.forEach((conv) => {
        if (conv.response) {
          documents.push({
            content: `Pergunta anterior: \"${conv.message}\". Resposta da Luma: \"${conv.response}\".`,
            doc_type: 'conversation',
            metadata: {
              id: conv.id,
              timestamp: conv.created_at,
            },
          });
        }
      });

      if (documents.length > 0) {
        const inserted = await this.addDocuments(house_id, documents);
        console.log(`[RAG] Indexed ${inserted} documentos para house ${house_id}`);
      } else {
        console.log('[RAG] Nenhum documento para indexar');
      }
    } catch (err) {
      console.error('[RAG] indexHouseData error', err);
      throw err;
    }
  }

  static async cleanOldDocuments(house_id: string, days = 90): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      const { count, error } = await supabase
        .from('documents')
        .delete({ count: 'exact' })
        .eq('house_id', house_id)
        .lt('created_at', cutoffDate.toISOString());

      if (error) {
        throw error;
      }

      return count ?? 0;
    } catch (err) {
      console.error('[RAG] cleanOldDocuments error', err);
      throw err;
    }
  }
}

