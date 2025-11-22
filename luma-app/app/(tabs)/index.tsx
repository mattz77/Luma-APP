import React, { useState, useMemo } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Dimensions, 
  ScrollView, 
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { 
  Wallet, CheckCircle, Mic, Bell, Plus, ArrowUpRight, Sparkles, 
  X, Send, User, ListTodo, BrainCircuit, Wand2, MessageCircle, LogOut, Home,
  Search, ChevronDown, Users, CheckSquare, MoreHorizontal
} from 'lucide-react-native';
import { LiquidGlassCard } from '../../components/ui/LiquidGlassCard';
import { n8nClient } from '@/lib/n8n';
import { useAuthStore } from '@/stores/auth.store';
import { useRouter } from 'expo-router';
import { SpeedDial } from '../../components/SpeedDial';
import { taskService, type TaskInsert } from '@/services/task.service';
import { expenseService, type SaveExpenseInput } from '@/services/expense.service';
import { useTasks } from '@/hooks/useTasks';
import type { TaskPriority } from '@/types/models';
import { useExpenses } from '@/hooks/useExpenses';
import { useRealtimeTasks } from '@/hooks/useRealtimeTasks';
import { useRealtimeExpenses } from '@/hooks/useRealtimeExpenses';
import { useMonthlyBudget } from '@/hooks/useMonthlyBudget';
import { useQueryClient } from '@tanstack/react-query';
import { useHouseMembers } from '@/hooks/useHouses';
import type { HouseMemberWithUser } from '@/types/models';

const { width } = Dimensions.get('window');

// ... helper functions mantidas ...
// Formata data para exibição legível
const formatTaskDate = (dateValue: string | null): string => {
  if (!dateValue) return 'Sem data definida';
  
  if (dateValue === 'Hoje' || dateValue === 'Amanhã') {
    return dateValue;
  }
  
  try {
    const isoMatch = dateValue.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/);
    if (!isoMatch) {
      return dateValue; 
    }
    
    const [, year, month, day, hour, minute] = isoMatch;
    const yearNum = parseInt(year, 10);
    const monthNum = parseInt(month, 10) - 1; 
    const dayNum = parseInt(day, 10);
    const hourNum = parseInt(hour, 10);
    const minuteNum = parseInt(minute, 10);
    
    let displayHour = hourNum;
    if (dateValue.endsWith('Z')) {
      const utcDate = new Date(dateValue); 
      displayHour = utcDate.getHours(); 
    }
    
    const taskDate = new Date(yearNum, monthNum, dayNum);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const diffDays = Math.round((taskDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    const hours = displayHour.toString().padStart(2, '0');
    const minutes = minuteNum.toString().padStart(2, '0');
    const timeStr = minutes !== '00' ? `${hours}:${minutes}` : `${hours}h`;
    
    if (diffDays === 0) {
      return `Hoje às ${timeStr}`;
    } else if (diffDays === 1) {
      return `Amanhã às ${timeStr}`;
    } else if (diffDays === -1) {
      return `Ontem às ${timeStr}`;
    } else if (diffDays > 0 && diffDays <= 7) {
      const weekDays = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
      const dayName = weekDays[taskDate.getDay()];
      return `${dayName.charAt(0).toUpperCase() + dayName.slice(1)} às ${timeStr}`;
    } else {
      const day = dayNum.toString().padStart(2, '0');
      const month = (monthNum + 1).toString().padStart(2, '0');
      return `${day}/${month}/${yearNum} às ${timeStr}`;
    }
  } catch (error) {
    return dateValue;
  }
};

// --- Componentes Atualizados ---

const GlassCard = ({ children, style, variant = 'default' }: any) => {
  // Variants: default, primary (golden tint), danger (red tint)
  const isPrimary = variant === 'primary';
  
  return (
    <View style={[styles.glassCard, isPrimary && styles.glassCardPrimary, style]}>
      <BlurView intensity={30} tint="light" style={StyleSheet.absoluteFill} />
      <LinearGradient
        colors={
          isPrimary 
            ? ['rgba(255,244,79,0.15)', 'rgba(255,244,79,0.05)'] 
            : ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']
        }
        style={StyleSheet.absoluteFill}
      />
      <View style={{ zIndex: 10, flex: 1 }}>{children}</View>
    </View>
  );
};

const StatCard = ({ icon: Icon, label, value, subtext, highlight = false }: any) => (
  <GlassCard style={styles.statCard}>
    <View style={styles.statHeader}>
      <Text style={styles.statLabel}>{label}</Text>
      {Icon && <Icon size={14} color={highlight ? '#FFF44F' : 'rgba(255,255,255,0.5)'} />}
    </View>
    <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
    {subtext && <Text style={styles.statSubtext}>{subtext}</Text>}
  </GlassCard>
);

const ActionButton = ({ icon: Icon, onPress }: any) => (
  <TouchableOpacity 
    onPress={() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress();
    }}
    style={styles.dockSideButton}
  >
    <Icon size={24} color="#FFF44F" strokeWidth={2.5} />
  </TouchableOpacity>
);

const ActivityItem = ({ icon: Icon, title, subtitle, time, type }: any) => (
  <View style={styles.activityItem}>
    <View style={styles.activityIconBg}>
      <Icon size={18} color="#B47500" />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={styles.activityTitle} numberOfLines={1}>{title}</Text>
      <Text style={styles.activitySubtitle} numberOfLines={1}>{subtitle}</Text>
    </View>
    <Text style={styles.activityTime}>{time}</Text>
  </View>
);

export default function Dashboard() {
  const router = useRouter();
  // ... (estados mantidos)
  const [modalMode, setModalMode] = useState<'finance' | 'task' | 'chat' | 'briefing' | 'magic' | 'user_menu' | null>(null);
  const [loading, setLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState("");
  const [taskInput, setTaskInput] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [magicInput, setMagicInput] = useState("");
  const [magicPreview, setMagicPreview] = useState<any | any[]>(null);
  const [selectedAssigneeId, setSelectedAssigneeId] = useState<string | null>(null);
  const [showAssigneeSelector, setShowAssigneeSelector] = useState(false);
  const [chatHistory, setChatHistory] = useState<{role: 'user' | 'model', text: string}[]>([
    { role: 'model', text: "Olá! Sou a Luma. Como posso ajudar na gestão da casa hoje?" }
  ]);
  const signOut = useAuthStore(state => state.signOut);

  // Auth Store
  const { user, houseId } = useAuthStore();
  const userId = user?.id || "";
  const userName = user?.name || "Usuário";
  // Dados fake para nome da casa se não tiver
  const houseName = "Minha Casa"; // TODO: Pegar do store/query

  // Query Client
  const queryClient = useQueryClient();

  // Buscar dados reais
  const { data: tasks = [], isLoading: tasksLoading } = useTasks(houseId);
  const { data: expenses = [], isLoading: expensesLoading } = useExpenses(houseId);
  const { data: members = [], isLoading: membersLoading } = useHouseMembers(houseId);
  
  // Atualização em tempo real
  useRealtimeTasks(houseId);
  useRealtimeExpenses(houseId);

  // ... (cálculos mantidos: currentMonth, monthlyBudget, financialSummary, pendingTasks, nextTask)
  const currentMonth = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }, []);

  const { data: monthlyBudget } = useMonthlyBudget(houseId, currentMonth);

  const financialSummary = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const monthlyExpenses = expenses.filter(expense => {
      const expenseDate = new Date(expense.expenseDate);
      return expenseDate >= startOfMonth && expenseDate <= endOfMonth;
    });

    const spent = monthlyExpenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
    const limit = monthlyBudget ? Number(monthlyBudget.amount) : 0;
    const percent = limit > 0 ? Math.round((spent / limit) * 100) : 0;

    return {
      spent: spent.toFixed(2).replace('.', ','),
      limit: limit.toFixed(2).replace('.', ','),
      percent: Math.min(percent, 100)
    };
  }, [expenses, monthlyBudget, currentMonth]);

  const pendingTasksCount = useMemo(() => {
    return tasks.filter(task => task.status === 'PENDING').length;
  }, [tasks]);

  const pendingTasks = useMemo(() => {
    return tasks.filter(task => task.status === 'PENDING').length;
  }, [tasks]);

  const nextTask = useMemo(() => {
    const pending = tasks.filter(task => task.status === 'PENDING');
    if (pending.length === 0) return null;
    
    const sorted = pending.sort((a, b) => {
      const priorityOrder: Record<TaskPriority, number> = { URGENT: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      
      if (a.dueDate && b.dueDate) {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
      if (a.dueDate) return -1;
      if (b.dueDate) return 1;
      return 0;
    });
    
    return sorted[0]?.title || null;
  }, [tasks]);

  // Filtrar top 3 tarefas pendentes para o card "Tarefas"
  const topPendingTasks = useMemo(() => {
    return tasks
      .filter(t => t.status === 'PENDING')
      .sort((a, b) => {
         const dateA = a.dueDate ? new Date(a.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
         const dateB = b.dueDate ? new Date(b.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
         return dateA - dateB;
      })
      .slice(0, 3);
  }, [tasks]);

  // Activity Feed misturado (Despesas + Tarefas Concluídas recentes)
  const recentActivity = useMemo(() => {
    const recentExpenses = expenses
      .sort((a, b) => new Date(b.expenseDate).getTime() - new Date(a.expenseDate).getTime())
      .slice(0, 3)
      .map(e => ({
        id: e.id,
        type: 'finance' as const,
        title: e.description,
        subtitle: `R$ ${Number(e.amount).toFixed(2)}`,
        date: new Date(e.expenseDate),
        time: new Date(e.expenseDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
      }));

    const recentTasks = tasks
      .filter(t => t.status === 'COMPLETED')
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 3)
      .map(t => ({
        id: t.id,
        type: 'task' as const,
        title: t.title,
        subtitle: 'Concluída',
        date: new Date(t.updatedAt),
        time: new Date(t.updatedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
      }));

    return [...recentExpenses, ...recentTasks]
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 4);
  }, [expenses, tasks]);

  // ... (Handlers mantidos: handleMagicInput, handleConfirmMagic, handleFinancialInsight, handleSmartTask, handleDailyBriefing, handleSendMessage, renderModalContent)
  // ... (Copiar todos os handlers do código anterior para manter funcionalidade)
  // Mantenho os handlers idênticos aqui, apenas omitindo para brevidade na visualização, mas no código final eles devem estar presentes.
  
  // --- Handlers ---
  const handleMagicInput = async () => {
    if (!magicInput.trim()) return;
    if (!houseId || !userId) {
      setAiResponse("Erro: Você precisa estar logado e ter uma casa selecionada.");
      return;
    }

    setLoading(true);
    setMagicPreview(null);

    // Função helper para extrair valores de diferentes formatos de moeda
    const extractAmount = (text: string): { value: string | null; currency: string | null; index: number | null } => {
      // Padrões aceitos:
      // R$ 100, R$100, 100 R$, 100R$
      // USD 100, $100, 100 USD, 100$
      // EUR 100, €100, 100 EUR, 100€
      // 100 reais, 100 dólares, etc
      
      // Padrão 1: Moeda antes do número (R$ 100, R$100, USD 100, $100, €100)
      let match = text.match(/(R\$|USD|EUR|US\$|€|\$)\s*([0-9]+(?:[.,][0-9]+)?)/i);
      if (match && match[2]) {
        const currency = match[1];
        const numValue = parseFloat(match[2].replace(',', '.'));
        if (!isNaN(numValue)) {
          return {
            value: numValue.toFixed(2),
            currency: /R\$|reais?/i.test(currency) ? 'R$' : currency.toUpperCase(),
            index: match.index || null
          };
        }
      }
      
      // Padrão 2: Número antes da moeda (100 R$, 100R$, 100 reais, 100 USD, 100$)
      match = text.match(/([0-9]+(?:[.,][0-9]+)?)\s*(R\$|USD|EUR|reais?|dólares?|euros?|\$)/i);
      if (match && match[1]) {
        const currency = match[2] || '';
        const numValue = parseFloat(match[1].replace(',', '.'));
        if (!isNaN(numValue)) {
          return {
            value: numValue.toFixed(2),
            currency: /R\$|reais?/i.test(currency) ? 'R$' : currency.toUpperCase(),
            index: match.index || null
          };
        }
      }
      
      return { value: null, currency: null, index: null };
    };

    // Função helper para calcular fallback local (sempre disponível)
    const calculateFallback = (): any | any[] => {
      const lowerInput = magicInput.toLowerCase();
      
      // Detecta despesa por: palavras-chave OU presença de valores monetários
      const amountInfo = extractAmount(magicInput);
      const hasExpense = lowerInput.includes('comprar') || 
                        lowerInput.includes('pagar') || 
                        lowerInput.includes('gast') ||
                        lowerInput.includes('despesa') ||
                        amountInfo.value !== null;
      
      const hasTask = lowerInput.includes('fazer') || 
                     lowerInput.includes('limpar') || 
                     lowerInput.includes('tarefa') || 
                     lowerInput.includes('preciso') ||
                     lowerInput.includes('lembrar') ||
                     lowerInput.includes('lembre');
      
      const results: any[] = [];
      
      // Se tiver despesa e tarefa, cria ambos
      if (hasExpense) {
        // Extrai valor monetário
        const amount = amountInfo.value || '0.00';
        
        // Extrai descrição da despesa (removendo parte da tarefa e valores monetários)
        // Se a tarefa vem ANTES da despesa, pega apenas a parte da despesa (depois do conector)
        // Se a despesa vem ANTES da tarefa, pega apenas a parte da despesa (antes do conector)
        
        let description = magicInput;
        
        // Detecta se tarefa vem antes ou depois da despesa
        const taskKeywords = ['limpar', 'fazer', 'tarefa', 'lembrar', 'lembre'];
        const expenseKeywords = ['pagar', 'comprar', 'gastar'];
        
        let taskKeywordIndex = -1;
        let expenseKeywordIndex = -1;
        
        for (const keyword of taskKeywords) {
          const idx = lowerInput.indexOf(keyword);
          if (idx > -1) {
            taskKeywordIndex = idx;
            break;
          }
        }
        
        for (const keyword of expenseKeywords) {
          const idx = lowerInput.indexOf(keyword);
          if (idx > -1) {
            expenseKeywordIndex = idx;
            break;
          }
        }
        
        // Se encontrou valor monetário, usa ele como referência
        const valueIndex = amountInfo.index !== null ? amountInfo.index : -1;
        
          // Se tarefa vem ANTES da despesa, extrai apenas a parte da despesa (depois do conector "e pagar")
          if (taskKeywordIndex > -1 && expenseKeywordIndex > -1 && taskKeywordIndex < expenseKeywordIndex) {
            // Tarefa vem primeiro - pega apenas a parte da despesa (depois de "e pagar"/"e comprar")
            const expenseMatch = magicInput.match(/\s+e\s+(pagar|comprar|gastar)\s+(.+?)(?:\s+R\$|\s+\d+\s*(?:R\$|reais)|$)/i);
            if (expenseMatch && expenseMatch[2]) {
              description = expenseMatch[2].trim();
              // Remove valor monetário se sobrou
              description = description.replace(/\s*(R\$|USD|EUR)\s*[0-9]+/gi, '').trim();
            } else {
              // Fallback: pega texto depois de "e pagar"/"e comprar" até o valor
              const afterExpenseKeyword = magicInput.substring(expenseKeywordIndex);
              const match = afterExpenseKeyword.match(/(pagar|comprar|gastar)\s+([^\s]+(?:\s+[^\s]+)?)/i);
              if (match && match[2]) {
                description = match[2].trim();
              } else {
                description = 'Despesa';
              }
            }
          } else if (valueIndex > -1) {
            // Despesa vem antes ou não há tarefa clara
            // Pega tudo antes do valor monetário como descrição da despesa
            description = magicInput.substring(0, valueIndex).trim();
            
            // Remove conectores que separam despesa de tarefa
            description = description.replace(/\s+e\s+(limpar|fazer|tarefa)/i, '').trim();
            
            // Remove palavras de tarefa no início se existirem
            description = description.replace(/^(limpar|fazer|tarefa)\s+/i, '').trim();
          }
        
        // Remove valores monetários da descrição
        description = description.replace(/(R\$|USD|EUR|US\$|€|\$)\s*[0-9]+(?:[.,][0-9]+)?/gi, '').trim();
        description = description.replace(/[0-9]+(?:[.,][0-9]+)?\s*(R\$|USD|EUR|reais?|dólares?|euros?|\$)/gi, '').trim();
        
        // Limpa espaços extras e conectores no final
        description = description.replace(/\s+e\s*$/i, '').trim();
        
        // Remove palavras temporais da descrição da despesa
        description = description.replace(/\b(amanhã|hoje|às|as)\s*\d*[hH]?/gi, '').trim();
        
        // Se a descrição ficou vazia ou muito curta, usa uma descrição padrão
        if (!description || description.length < 3) {
          // Tenta pegar palavra-chave de despesa
          if (expenseKeywordIndex > -1) {
            const afterExpense = magicInput.substring(expenseKeywordIndex);
            const match = afterExpense.match(/(pagar|comprar|gastar)\s+([^\s]+(?:\s+[^\s]+){0,2})/i);
            if (match && match[2]) {
              description = match[2].replace(/\s*(R\$|USD|EUR)\s*[0-9]+/gi, '').trim();
            }
          }
          if (!description || description.length < 3) {
            description = 'Despesa';
          }
        }
        
        results.push({
          type: 'expense' as const,
          data: {
            title: description,
            amount: amount,
            date: lowerInput.includes('amanhã') || lowerInput.includes('amanha') ? 'Amanhã' : 'Hoje',
            description: description
          }
        });
      }
      
      if (hasTask) {
        // Extrai descrição da tarefa
        // Se tarefa vem ANTES da despesa, pega tudo antes do conector "e pagar"/"e comprar"
        // Se tarefa vem DEPOIS da despesa, pega tudo depois do valor monetário
        let taskDescription = magicInput;
        
        if (hasExpense) {
          // Detecta ordem: tarefa antes ou depois da despesa
          const taskKeywords = ['limpar', 'fazer', 'tarefa', 'lembrar', 'lembre'];
          const expenseKeywords = ['pagar', 'comprar', 'gastar'];
          
          let taskKeywordIndex = -1;
          let expenseKeywordIndex = -1;
          
          for (const keyword of taskKeywords) {
            const idx = lowerInput.indexOf(keyword);
            if (idx > -1 && (taskKeywordIndex === -1 || idx < taskKeywordIndex)) {
              taskKeywordIndex = idx;
            }
          }
          
          for (const keyword of expenseKeywords) {
            const idx = lowerInput.indexOf(keyword);
            if (idx > -1 && (expenseKeywordIndex === -1 || idx < expenseKeywordIndex)) {
              expenseKeywordIndex = idx;
            }
          }
          
          const valueIndex = amountInfo.index !== null ? amountInfo.index : expenseKeywordIndex;
          
          // Se tarefa vem ANTES da despesa, pega tudo ANTES do conector "e pagar"/"e comprar"
          if (taskKeywordIndex > -1 && expenseKeywordIndex > -1 && taskKeywordIndex < expenseKeywordIndex) {
            // Tarefa vem primeiro - pega tudo antes de "e pagar", "e comprar", etc
            const separatorPattern = /\s+e\s+(pagar|comprar|gastar)/i;
            const separatorMatch = magicInput.match(separatorPattern);
            if (separatorMatch && separatorMatch.index !== undefined) {
              taskDescription = magicInput.substring(0, separatorMatch.index).trim();
            } else if (valueIndex > -1 && taskKeywordIndex < valueIndex) {
              // Se não encontrou conector explícito, pega tudo antes do valor
              taskDescription = magicInput.substring(0, valueIndex).trim();
              // Remove conectores no final
              taskDescription = taskDescription.replace(/\s+e\s*$/i, '').trim();
            }
          } else if (valueIndex > -1) {
            // Despesa vem antes - pega tudo DEPOIS do valor monetário
            const afterValue = magicInput.substring(valueIndex);
            const valueEndMatch = afterValue.match(/[0-9]+(?:[.,][0-9]+)?\s*(R\$|USD|EUR|reais?|dólares?|euros?|\$)?/i);
            if (valueEndMatch) {
              const valueEnd = valueIndex + valueEndMatch.index! + valueEndMatch[0].length;
              taskDescription = magicInput.substring(valueEnd).trim();
              
              // Remove conectores no início
              taskDescription = taskDescription.replace(/^\s*[,e]\s*/i, '').trim();
              
              // Remove palavras de despesa se sobraram
              taskDescription = taskDescription.replace(/^(pagar|comprar|gastar)\s+/i, '').trim();
            }
          }
          
          // Se ainda não encontrou, procura pela primeira palavra de tarefa
          if (!taskDescription || taskDescription.length < 3) {
            for (const keyword of taskKeywords) {
              const idx = lowerInput.indexOf(keyword);
              if (idx > -1) {
                // Pega tudo a partir da palavra de tarefa até o conector ou valor
                const fromTask = magicInput.substring(idx);
                const endMatch = fromTask.match(/\s+e\s+(pagar|comprar|gastar)/i);
                if (endMatch && endMatch.index !== undefined) {
                  taskDescription = fromTask.substring(0, endMatch.index).trim();
                } else {
                  taskDescription = fromTask.split(/\s+e\s+(pagar|comprar|gastar)/i)[0].trim();
                }
                break;
              }
            }
          }
        }
        
        // Extrai título (remove palavras temporais, horas e datas)
        // Primeiro, tenta pegar tudo ANTES do primeiro termo temporal/horário
        const temporalPattern = /\b(amanhã|hoje|depois|antes|às|as)\s*\d*(?::\d{2})?[hH]?|\b\d{1,2}(?::\d{2})?[hH]\b/i;
        const temporalMatch = taskDescription.match(temporalPattern);
        
        let title: string;
        if (temporalMatch && temporalMatch.index !== undefined && temporalMatch.index > 0) {
          // Pega tudo antes do termo temporal
          title = taskDescription.substring(0, temporalMatch.index).trim();
        } else {
          // Se não encontrou padrão temporal, faz limpeza completa
          title = taskDescription;
          
          // Remove padrões completos: "amanhã às 15h", "hoje às 14:30", "amanhã as 15h"
          title = title.replace(/\b(amanhã|hoje|depois|antes)\s+(às|as)\s*\d{1,2}(?::\d{2})?[hH]?/gi, ' ');
          // Remove padrões de hora com preposição: "às 15h", "as 15h", "às 15:00"
          title = title.replace(/\b(às|as)\s*\d{1,2}(?::\d{2})?[hH]?/gi, ' ');
          // Remove horas isoladas: "15h", "15:00"
          title = title.replace(/\b\d{1,2}(?::\d{2})?[hH]?\b/g, ' ');
          
          // Remove palavras temporais sozinhas: "amanhã", "hoje", "depois", "antes", etc.
          title = title.replace(/\b(amanhã|hoje|depois|antes|agora|mais tarde|mais cedo|à tarde|à noite|de manhã|de tarde|de noite|em seguida)\b/gi, ' ');
          
          // Remove preposições temporais isoladas: "às", "as", "para", "em", "no", "na"
          title = title.replace(/\b(às|as|para|em|no|na|pelo|pela|do|da|dos|das|e)\b/gi, ' ');
        }
        
        // Remove datas no formato: "22/11", "22-11", "22 de novembro"
        title = title.replace(/\b\d{1,2}[/-]\d{1,2}\b/g, ' ');
        title = title.replace(/\b\d{1,2}\s+de\s+(janeiro|fevereiro|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)\b/gi, ' ');
        
        // Limpa espaços múltiplos e espaços nas extremidades
        title = title.replace(/\s+/g, ' ').trim();
        
        // Se título está vazio ou muito curto, usa a descrição original
        if (!title || title.length < 3) {
          title = taskDescription;
        }
        
        // Extrai data/hora
        let dueDate: string | null = null;
        if (lowerInput.includes('amanhã') || lowerInput.includes('amanha')) {
          const hourMatch = magicInput.match(/(\d{1,2})[hH]/);
          if (hourMatch) {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const hour = parseInt(hourMatch[1], 10);
            // Cria data no timezone local (não UTC)
            tomorrow.setHours(hour, 0, 0, 0);
            // Converte para ISO mantendo o timezone local (sem Z)
            const year = tomorrow.getFullYear();
            const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
            const day = String(tomorrow.getDate()).padStart(2, '0');
            const hours = String(tomorrow.getHours()).padStart(2, '0');
            dueDate = `${year}-${month}-${day}T${hours}:00:00`;
          } else {
            dueDate = 'Amanhã';
          }
        } else if (lowerInput.includes('hoje')) {
          const hourMatch = magicInput.match(/(\d{1,2})[hH]/);
          if (hourMatch) {
            const today = new Date();
            const hour = parseInt(hourMatch[1], 10);
            today.setHours(hour, 0, 0, 0);
            const year = today.getFullYear();
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const day = String(today.getDate()).padStart(2, '0');
            const hours = String(today.getHours()).padStart(2, '0');
            dueDate = `${year}-${month}-${day}T${hours}:00:00`;
          } else {
            dueDate = 'Hoje';
          }
        }
        
        results.push({
          type: 'task' as const,
          data: {
            title: title || 'Nova tarefa',
            due_date: dueDate
          }
        });
      }
      
      // Se não encontrou nenhum, tenta inferir como única entidade
      if (results.length === 0) {
        if (hasExpense) {
          // Usa a função extractAmount para detectar valores
          const amountInfo = extractAmount(magicInput);
          const amount = amountInfo.value || '0.00';
          
          // Remove valores monetários da descrição
          let description = magicInput
            .replace(/(R\$|USD|EUR|US\$|€|\$)\s*[0-9]+(?:[.,][0-9]+)?/gi, '')
            .replace(/[0-9]+(?:[.,][0-9]+)?\s*(R\$|USD|EUR|reais?|dólares?|euros?|\$)/gi, '')
            .trim();
          
          if (!description || description.length < 3) {
            description = magicInput;
          }
          
          return {
            type: 'expense' as const,
            data: {
              title: description,
              amount: amount,
              date: lowerInput.includes('amanhã') || lowerInput.includes('amanha') ? 'Amanhã' : 'Hoje',
              description: description
            }
          };
        } else {
          return {
            type: 'task' as const,
            data: {
              title: magicInput,
              due_date: lowerInput.includes('amanhã') || lowerInput.includes('amanha') ? 'Amanhã' : (lowerInput.includes('hoje') ? 'Hoje' : null)
            }
          };
        }
      } else {
        // Retorna array se encontrou múltiplas entidades
        return results.length > 1 ? results : results[0];
      }
    };

    // Calcula fallback local primeiro (sempre funciona)
    let parsedData: any | any[] = calculateFallback();
    
    try {
      const response = await n8nClient.sendMessage({
        house_id: houseId,
        user_id: userId,
        message: magicInput,
        context: {
          mode: 'magic_create'
        }
      });

      // Se response foi bem-sucedida E tem parsed data, usa do n8n
      if (response.success && response.metadata?.parsed) {
        const n8nParsed = Array.isArray(response.metadata.parsed) 
          ? response.metadata.parsed 
          : [response.metadata.parsed];
        
        // Normaliza datas do n8n: remove "Z" (UTC) e trata como horário local
        parsedData = n8nParsed.map((item: any) => {
          if (item?.data?.due_date && typeof item.data.due_date === 'string' && item.data.due_date.endsWith('Z')) {
            // Se a data vem com Z (UTC), remove o Z e trata como local
            // O horário na string já é o horário que o usuário digitou, então apenas removemos o Z
            item.data.due_date = item.data.due_date.replace(/Z$/, '');
          }
          return item;
        });
        
        // Se não era array original, retorna primeiro item
        if (!Array.isArray(response.metadata.parsed)) {
          parsedData = parsedData[0];
        }
        
        setAiResponse(response.response || "Entendido! Confirme os detalhes abaixo.");
      } else {
        // Se não tem parsed data do n8n, usa fallback local (já calculado)
        setAiResponse("Entendido! Confirme os detalhes abaixo.");
      }
    } catch (error) {
      console.error('Erro ao processar mágico:', error);
      // Em caso de erro, usa fallback local (já calculado)
      setAiResponse("Entendido! Confirme os detalhes abaixo.");
    }
    
    setMagicPreview(parsedData);
    
    // Verifica se há tarefas sem responsável especificado
    const items = Array.isArray(parsedData) ? parsedData : [parsedData];
    const hasTasksWithoutAssignee = items.some((item: any) => item.type === 'task' && !item.data?.assigned_to_id);
    
    // Se há tarefas sem responsável, mostra seletor de membros
    if (hasTasksWithoutAssignee && members.length > 0) {
      setShowAssigneeSelector(true);
    } else {
      setShowAssigneeSelector(false);
    }
    
    setLoading(false);
  };

  const handleConfirmMagic = async () => {
    if (!magicPreview || !houseId || !userId) {
      return;
    }

    setLoading(true);
    
    try {
      const items = Array.isArray(magicPreview) ? magicPreview : [magicPreview];
      const createdItems: string[] = [];
      
      // Processa cada item do preview (tarefa ou despesa)
      for (const item of items) {
        if (item.type === 'task') {
          // Converte due_date para formato ISO se necessário
          let dueDate: string | null = null;
          if (item.data.due_date) {
            if (item.data.due_date === 'Hoje' || item.data.due_date === 'Amanhã') {
              // Para "Hoje" ou "Amanhã", cria data apropriada
              const targetDate = new Date();
              if (item.data.due_date === 'Amanhã') {
                targetDate.setDate(targetDate.getDate() + 1);
              }
              // Se tiver hora, extrai e aplica
              const hourMatch = magicInput.match(/(\d{1,2})[hH]/);
              if (hourMatch) {
                targetDate.setHours(parseInt(hourMatch[1], 10), 0, 0, 0);
              } else {
                // Se não tem hora, define para meio-dia para evitar problemas de timezone
                targetDate.setHours(12, 0, 0, 0);
              }
              // Usa toISOString() para garantir formato correto para o Supabase
              dueDate = targetDate.toISOString();
            } else if (!item.data.due_date.endsWith('Z') && item.data.due_date.includes('T')) {
              // Já está no formato ISO sem Z (local) - adiciona 'Z' para UTC
              // ou melhor, converte para ISO completo
              const dateObj = new Date(item.data.due_date);
              if (!isNaN(dateObj.getTime())) {
                dueDate = dateObj.toISOString();
              } else {
                dueDate = item.data.due_date;
              }
            } else if (item.data.due_date.endsWith('Z')) {
              // Já está em formato ISO com Z (UTC)
              dueDate = item.data.due_date;
            } else {
              // Tenta parsear e converter para ISO
              const dateObj = new Date(item.data.due_date);
              if (!isNaN(dateObj.getTime())) {
                dueDate = dateObj.toISOString();
              } else {
                dueDate = item.data.due_date;
              }
            }
          }
          
          // Usa o responsável selecionado, ou o criador como fallback
          const assignedToId = selectedAssigneeId || item.data?.assigned_to_id || userId;
          
          const taskData: TaskInsert = {
            house_id: houseId,
            created_by_id: userId,
            assigned_to_id: assignedToId,
            title: item.data.title || 'Nova tarefa',
            description: item.data.description || null,
            due_date: dueDate,
            status: 'PENDING',
            priority: 'MEDIUM',
            points: 10
          };
          
          await taskService.create(taskData);
          createdItems.push(`Tarefa "${item.data.title || 'Nova tarefa'}"`);
          // Invalidar queries para atualizar dados em tempo real
          queryClient.invalidateQueries({ queryKey: ['tasks', houseId] });
        } else if (item.type === 'expense') {
          // Converte expense_date para formato ISO
          let expenseDate: string;
          if (item.data.date === 'Hoje' || item.data.date === 'Amanhã') {
            const today = new Date();
            if (item.data.date === 'Amanhã') {
              today.setDate(today.getDate() + 1);
            }
            expenseDate = today.toISOString();
          } else if (item.data.date) {
            expenseDate = new Date(item.data.date).toISOString();
          } else {
            expenseDate = new Date().toISOString();
          }
          
          const expenseData: SaveExpenseInput = {
            houseId: houseId,
            createdById: userId,
            categoryId: null, // Pode ser melhorado para detectar categoria automaticamente
            amount: parseFloat(item.data.amount || '0'),
            description: item.data.title || item.data.description || 'Despesa',
            expenseDate: expenseDate,
            isRecurring: false,
            isPaid: false,
            splits: []
          };
          
          await expenseService.create(expenseData);
          createdItems.push(`Despesa "${item.data.title || 'Despesa'}" - R$ ${item.data.amount || '0.00'}`);
          // Invalidar queries para atualizar dados em tempo real
          queryClient.invalidateQueries({ queryKey: ['expenses', houseId] });
          queryClient.invalidateQueries({ queryKey: ['monthlyBudget', houseId, currentMonth] });
        }
      }
      
      // Fecha modal e limpa estado
            setModalMode(null);
            setMagicInput("");
            setMagicPreview(null);
            setAiResponse("");
            setSelectedAssigneeId(null);
            setShowAssigneeSelector(false);
      
      // Aqui você pode adicionar um toast de sucesso
      console.log(`Criado(s) com sucesso: ${createdItems.join(', ')}`);
      
    } catch (error) {
      console.error('Erro ao criar itens:', error);
      setAiResponse("Erro ao criar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleFinancialInsight = async () => {
    if (!houseId || !userId) {
      setAiResponse("Erro: Você precisa estar logado e ter uma casa selecionada.");
      return;
    }

    setModalMode('finance');
    setLoading(true);
    setAiResponse("");
    
    try {
      const response = await n8nClient.sendMessage({
        house_id: houseId,
        user_id: userId,
        message: `Analise a situação financeira deste mês. Gasto: R$${financialSummary.spent}, Limite: R$${financialSummary.limit}. 86% usado. Dê uma dica curta e amigável de como economizar nos últimos dias do mês ou um aviso cauteloso. Use emojis. Máximo 2 frases.`,
        context: {
          mode: 'finance_insight',
          current_month: new Date().toISOString().slice(0, 7),
          spent: financialSummary.spent,
          limit: financialSummary.limit,
          percent: financialSummary.percent
        }
      });

      setAiResponse(response.response || "Não consegui processar sua solicitação agora.");
    } catch (error) {
      console.error('Erro ao chamar Luma:', error);
      setAiResponse("A Luma está fora do ar momentaneamente. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleSmartTask = async () => {
    if (!taskInput.trim()) return;
    if (!houseId || !userId) {
      setAiResponse("Erro: Você precisa estar logado e ter uma casa selecionada.");
      return;
    }

    setLoading(true);
    setAiResponse("");

    try {
      const response = await n8nClient.sendMessage({
        house_id: houseId,
        user_id: userId,
        message: `Quebre a tarefa "${taskInput}" em 3 a 4 subtarefas acionáveis e curtas para um checklist. Retorne apenas a lista com emojis. Exemplo: - 🛒 Comprar x - 🧹 Limpar y`,
        context: {
          mode: 'task_planner',
          task_description: taskInput
        }
      });

      setAiResponse(response.response || "Não consegui criar o plano agora.");
    } catch (error) {
      console.error('Erro ao chamar Luma:', error);
      setAiResponse("A Luma está fora do ar momentaneamente. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleDailyBriefing = async () => {
    if (!houseId || !userId) {
      setAiResponse("Erro: Você precisa estar logado e ter uma casa selecionada.");
      return;
    }

    setModalMode('briefing');
    setLoading(true);
    setAiResponse("");

    try {
      const response = await n8nClient.sendMessage({
        house_id: houseId,
        user_id: userId,
        message: `Gere um "Morning Briefing" executivo e motivacional para ${userName}. Finanças: 86% do budget usado (Alerta). Tarefas: ${pendingTasks} pendentes, principal é "${nextTask}". Clima da casa: Ocupado. O tom deve ser calmo, sofisticado e direto (Estilo Steve Jobs/Apple). Máximo 3 frases curtas.`,
        context: {
          mode: 'daily_briefing',
          user_name: userName,
          pending_tasks: pendingTasks,
          next_task: nextTask,
          budget_percent: financialSummary.percent
        }
      });

      setAiResponse(response.response || "Não consegui preparar seu briefing agora.");
    } catch (error) {
      console.error('Erro ao chamar Luma:', error);
      setAiResponse("A Luma está fora do ar momentaneamente. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;
    if (!houseId || !userId) {
      setAiResponse("Erro: Você precisa estar logado e ter uma casa selecionada.");
      return;
    }
    
    const userMsg = chatInput;
    setChatHistory(prev => [...prev, { role: 'user', text: userMsg }]);
    setChatInput("");
    setLoading(true);

    try {
      const response = await n8nClient.sendMessage({
        house_id: houseId,
        user_id: userId,
        message: userMsg,
        context: {
          mode: 'chat',
          current_month: new Date().toISOString().slice(0, 7),
          user_name: userName,
          recent_history: chatHistory.slice(-5).map(m => `${m.role}: ${m.text}`).join('\n')
        }
      });

      setChatHistory(prev => [...prev, { role: 'model', text: response.response || "Desculpe, não consegui processar sua mensagem." }]);
    } catch (error) {
      console.error('Erro ao chamar Luma:', error);
      setChatHistory(prev => [...prev, { role: 'model', text: "A Luma está fora do ar momentaneamente. Tente novamente." }]);
    } finally {
      setLoading(false);
    }
  };

  const renderModalContent = () => {
    const isChat = modalMode === 'chat';
    const isTask = modalMode === 'task';
    const isBriefing = modalMode === 'briefing';
    const isFinance = modalMode === 'finance';
    const isMagic = modalMode === 'magic';
    const isUserMenu = modalMode === 'user_menu';
    
    return (
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <View style={styles.modalHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {isUserMenu ? <User size={20} color="#FFF44F" /> : <Sparkles size={20} color="#FFF44F" />}
            <Text style={styles.modalTitle}>
              {isChat ? 'Luma Chat' : isTask ? 'Planejador Mágico' : isBriefing ? 'Resumo do Dia' : isMagic ? 'Criação Mágica' : isUserMenu ? 'Perfil' : 'Análise Financeira'}
            </Text>
          </View>
          <TouchableOpacity onPress={() => {
            setModalMode(null);
            setAiResponse('');
            setMagicPreview(null);
            setSelectedAssigneeId(null);
            setShowAssigneeSelector(false);
          }}>
            <X size={24} color="rgba(255,255,255,0.5)" />
          </TouchableOpacity>
        </View>

        <View style={styles.modalBody}>
          {/* User Menu Modal */}
          {isUserMenu && (
            <View style={{ gap: 16 }}>
               <TouchableOpacity style={styles.menuItem} onPress={() => setModalMode(null)}>
                  <View style={styles.menuIconBg}>
                    <User size={20} color="#FFF44F" />
                  </View>
                  <Text style={styles.menuItemText}>Meu Perfil</Text>
               </TouchableOpacity>
               
               <TouchableOpacity style={styles.menuItem} onPress={() => {
                   setModalMode(null);
                   router.push('/(tabs)/house' as any);
               }}>
                  <View style={styles.menuIconBg}>
                    <Home size={20} color="#FFF44F" />
                  </View>
                  <Text style={styles.menuItemText}>Minha Casa</Text>
               </TouchableOpacity>

               <TouchableOpacity style={[styles.menuItem, { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)', paddingTop: 16, marginTop: 8 }]} onPress={async () => {
                   setModalMode(null);
                   await signOut();
                   router.replace('/(auth)/login' as any);
               }}>
                  <View style={[styles.menuIconBg, { backgroundColor: 'rgba(255,79,79,0.2)' }]}>
                    <LogOut size={20} color="#FF4F4F" />
                  </View>
                  <Text style={[styles.menuItemText, { color: '#FF4F4F' }]}>Sair da Conta</Text>
               </TouchableOpacity>
            </View>
          )}

          {/* Magic Input Modal */}
          {isMagic && (
            <View style={{ flex: 1, gap: 16 }}>
              <Text style={styles.taskDescriptionText}>Descreva o que você precisa (tarefa ou despesa) e eu cuido do resto.</Text>
              
              <View style={styles.taskInputWrapper}>
                <TextInput 
                  style={styles.taskInput} 
                  placeholder="Ex: Comprar leite R$ 5 amanhã..." 
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  value={magicInput}
                  onChangeText={setMagicInput}
                  onSubmitEditing={handleMagicInput}
                />
                <TouchableOpacity 
                  onPress={handleMagicInput} 
                  disabled={loading || !magicInput.trim()}
                  style={[styles.taskSubmitButton, (!magicInput.trim() || loading) && styles.taskSubmitButtonDisabled]}
                >
                  {loading ? (
                    <ActivityIndicator size={20} color="#2C1A00" />
                  ) : (
                    <Wand2 size={20} color="#2C1A00" />
                  )}
                </TouchableOpacity>
              </View>

              {magicPreview && (
                <View style={{ gap: 12 }}>
                  {(Array.isArray(magicPreview) ? magicPreview : [magicPreview]).map((preview: any, index: number) => (
                    <View key={index} style={styles.financeResponseContainer}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                        {preview.type === 'expense' ? <Wallet size={20} color="#FFF44F"/> : <CheckCircle size={20} color="#FFF44F"/>}
                        <Text style={styles.taskResponseLabel}>
                          {preview.type === 'expense' ? 'Nova Despesa Detectada' : 'Nova Tarefa Detectada'}
                        </Text>
                      </View>
                      <Text style={styles.financeResponseText}>{preview.data.title || preview.data.description}</Text>
                      {preview.type === 'expense' && preview.data.amount && (
                        <Text style={[styles.subText, { color: '#FFF44F' }]}>Valor: R$ {preview.data.amount}</Text>
                      )}
                      {preview.type === 'task' && preview.data.due_date && (
                        <Text style={[styles.subText, { color: '#FFF44F' }]}>
                          Data: {formatTaskDate(preview.data.due_date)}
                        </Text>
                      )}
                    </View>
                  ))}
                </View>
              )}

              {/* Seletor de Responsável para Tarefas */}
              {showAssigneeSelector && magicPreview && members.length > 0 && (
                <View style={{ gap: 12, marginTop: 16 }}>
                  <Text style={[styles.subText, { fontSize: 14, marginBottom: 8 }]}>
                    A quem você quer atribuir esta tarefa?
                  </Text>
                  <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    style={{ maxHeight: 120 }}
                    contentContainerStyle={{ gap: 8 }}
                  >
                    {members.map((member) => (
                      <TouchableOpacity
                        key={member.userId}
                        onPress={() => {
                          setSelectedAssigneeId(member.userId);
                          setShowAssigneeSelector(false);
                        }}
                        style={[
                          {
                            paddingHorizontal: 16,
                            paddingVertical: 10,
                            borderRadius: 20,
                            borderWidth: 2,
                            borderColor: selectedAssigneeId === member.userId ? '#FFF44F' : 'rgba(255,255,255,0.2)',
                            backgroundColor: selectedAssigneeId === member.userId ? 'rgba(255,244,79,0.2)' : 'rgba(255,255,255,0.1)',
                          }
                        ]}
                      >
                        <Text style={[styles.subText, { color: selectedAssigneeId === member.userId ? '#FFF44F' : 'white', fontSize: 13 }]}>
                          {member.user.name || member.user.email}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

              {magicPreview && (
                <View style={{ flexDirection: 'row', gap: 12, marginTop: 'auto' }}>
                    <TouchableOpacity 
                        onPress={() => {
                          setMagicPreview(null);
                          setSelectedAssigneeId(null);
                          setShowAssigneeSelector(false);
                        }} 
                        style={[styles.modalSecondaryButton, { flex: 1, borderColor: 'rgba(255,255,255,0.3)' }]}
                    >
                        <Text style={[styles.modalSecondaryButtonText, { color: 'white' }]}>Cancelar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        onPress={handleConfirmMagic} 
                        disabled={showAssigneeSelector && !selectedAssigneeId}
                        style={[
                          styles.modalPrimaryButton, 
                          { flex: 1 },
                          showAssigneeSelector && !selectedAssigneeId && { opacity: 0.5 }
                        ]}
                    >
                        <Text style={styles.modalPrimaryButtonText}>Confirmar</Text>
                    </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          {/* Finance Modal */}
          {isFinance && (
            <View style={{ flex: 1, justifyContent: 'center', gap: 16 }}>
              {loading ? (
                <View style={{ alignItems: 'center', paddingVertical: 32 }}>
                  <ActivityIndicator size="large" color="#FFF44F" />
                  <Text style={{ color: 'rgba(255,255,255,0.5)', marginTop: 8 }}>Calculando...</Text>
                </View>
              ) : (
                <>
                  <View style={styles.financeResponseContainer}>
                    <Text style={styles.financeResponseText}>{aiResponse}</Text>
                  </View>
                  <TouchableOpacity onPress={() => setModalMode(null)} style={styles.modalPrimaryButton}>
                    <Text style={styles.modalPrimaryButtonText}>Entendido</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          )}

          {/* Task Planner Modal */}
          {isTask && (
            <View style={{ flex: 1, gap: 16 }}>
              <Text style={styles.taskDescriptionText}>Diga uma meta e eu crio o plano.</Text>
              
              <View style={styles.taskInputWrapper}>
                <TextInput 
                  style={styles.taskInput} 
                  placeholder="Ex: Organizar festa surpresa..." 
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  value={taskInput}
                  onChangeText={setTaskInput}
                  onSubmitEditing={handleSmartTask}
                />
                <TouchableOpacity 
                  onPress={handleSmartTask} 
                  disabled={loading || !taskInput.trim()}
                  style={[styles.taskSubmitButton, (!taskInput.trim() || loading) && styles.taskSubmitButtonDisabled]}
                >
                  {loading ? (
                    <ActivityIndicator size={20} color="#2C1A00" />
                  ) : (
                    <Sparkles size={20} color="#2C1A00" />
                  )}
                </TouchableOpacity>
              </View>

              {aiResponse && (
                <View style={styles.taskResponseContainer}>
                  <Text style={styles.taskResponseLabel}>Checklist Sugerido</Text>
                  <Text style={styles.taskResponseText}>{aiResponse}</Text>
                </View>
              )}
              
              {aiResponse && (
                <TouchableOpacity 
                  onPress={() => setModalMode(null)} 
                  style={styles.modalSecondaryButton}
                >
                  <Text style={styles.modalSecondaryButtonText}>Adicionar Tarefas</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Daily Briefing Modal */}
          {isBriefing && (
            <View style={{ flex: 1, justifyContent: 'center', gap: 16 }}>
              {loading ? (
                <View style={{ alignItems: 'center', paddingVertical: 32 }}>
                  <ActivityIndicator size="large" color="#FFF44F" />
                  <Text style={{ color: 'rgba(255,255,255,0.5)', marginTop: 8 }}>Preparando seu briefing...</Text>
                </View>
              ) : (
                <>
                  <View style={styles.briefingContainer}>
                    <LinearGradient
                      colors={['rgba(255,255,255,0.1)', 'transparent']}
                      style={StyleSheet.absoluteFill}
                    />
                    <Text style={styles.briefingLabel}>EXECUTIVE SUMMARY</Text>
                    <Text style={styles.briefingText}>"{aiResponse}"</Text>
                  </View>
                  <TouchableOpacity 
                    onPress={() => setModalMode(null)} 
                    style={styles.briefingCloseButton}
                  >
                    <Text style={styles.briefingCloseButtonText}>Fechar</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          )}

          {/* Chat Modal */}
          {isChat && (
            <>
              <ScrollView style={{ flex: 1 }} contentContainerStyle={{ gap: 12, paddingBottom: 16 }}>
                {chatHistory.map((msg, idx) => (
                  <View key={idx} style={[
                    styles.chatBubbleContainer,
                    msg.role === 'user' ? { flexDirection: 'row-reverse' } : { flexDirection: 'row' }
                  ]}>
                    {msg.role === 'model' && (
                      <View style={styles.chatAvatar}>
                        <Sparkles size={16} color="#C28400" />
                      </View>
                    )}
                    <View style={[
                      styles.chatBubble, 
                      msg.role === 'user' ? styles.chatUser : styles.chatModel
                    ]}>
                      <Text style={msg.role === 'user' ? styles.chatTextUser : styles.chatTextModel}>
                        {msg.text}
                      </Text>
                    </View>
                    {msg.role === 'user' && (
                      <View style={[styles.chatAvatar, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                        <User size={16} color="white" />
                      </View>
                    )}
                  </View>
                ))}
                {loading && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <View style={styles.chatAvatar}>
                      <ActivityIndicator size={16} color="#C28400" />
                    </View>
                    <View style={styles.chatLoadingBubble}>
                      <View style={{ flexDirection: 'row', gap: 4 }}>
                        <View style={[styles.chatDot, { animationDelay: '0ms' }]} />
                        <View style={[styles.chatDot, { animationDelay: '150ms' }]} />
                        <View style={[styles.chatDot, { animationDelay: '300ms' }]} />
                      </View>
                    </View>
                  </View>
                )}
              </ScrollView>

              <View style={[styles.inputContainer, { marginBottom: 20 }]}>
                <TextInput 
                  style={styles.chatInput} 
                  placeholder="Pergunte algo à Luma..." 
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  value={chatInput}
                  onChangeText={setChatInput}
                  onSubmitEditing={handleSendMessage}
                />
                <TouchableOpacity 
                  onPress={handleSendMessage} 
                  disabled={!chatInput.trim() || loading}
                  style={[styles.chatSendButton, (!chatInput.trim() || loading) && styles.chatSendButtonDisabled]}
                >
                  <Send size={18} color="#2C1A00" />
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#C28400', '#8F6100']}
        style={StyleSheet.absoluteFill}
      />
      
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
          
          {/* New Header */}
          <View style={styles.headerContainer}>
            <View style={styles.houseSelector}>
              <View style={styles.houseIconBg}>
                <Text style={styles.houseInitial}>{houseName.charAt(0)}</Text>
              </View>
              <Text style={styles.houseName}>{houseName}</Text>
              <ChevronDown size={16} color="rgba(255,255,255,0.5)" />
            </View>
            <TouchableOpacity onPress={() => setModalMode('user_menu')}>
              <View style={styles.userAvatar}>
                <User size={20} color="#C28400" />
              </View>
            </TouchableOpacity>
          </View>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <StatCard 
              icon={Wallet} 
              label="Finanças" 
              value={`R$ ${financialSummary.spent}`} 
              subtext={`${financialSummary.percent}% do limite`}
              highlight={financialSummary.percent > 80}
            />
            <StatCard 
              icon={ListTodo} 
              label="Tarefas" 
              value={pendingTasksCount.toString()} 
              subtext="pendentes"
            />
            <StatCard 
              icon={Users} 
              label="Membros" 
              value={members.length.toString()} 
              subtext="na casa"
            />
          </View>

          {/* Split Section */}
          <View style={styles.splitSection}>
            {/* Left: Tasks */}
            <GlassCard style={[styles.splitCard, styles.splitCardLeft]} variant="primary">
              <View style={styles.splitHeader}>
                <Text style={[styles.splitTitle, { color: '#2C1A00' }]}>Tarefas</Text>
                <TouchableOpacity onPress={() => router.push('/(tabs)/tasks' as any)}>
                  <ArrowUpRight size={16} color="#2C1A00" />
                </TouchableOpacity>
              </View>
              <View style={styles.miniTaskList}>
                {topPendingTasks.length > 0 ? (
                  topPendingTasks.map(task => (
                    <View key={task.id} style={styles.miniTaskItem}>
                      <View style={styles.miniTaskCheckbox} />
                      <Text style={styles.miniTaskText} numberOfLines={1}>{task.title}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={[styles.miniTaskText, { opacity: 0.6 }]}>Tudo feito!</Text>
                )}
              </View>
              <TouchableOpacity 
                style={styles.miniFab}
                onPress={() => router.push('/(tabs)/tasks?action=create' as any)}
              >
                <Plus size={20} color="#FFF44F" />
              </TouchableOpacity>
            </GlassCard>

            {/* Right: Notes/Insight */}
            <LiquidGlassCard style={[styles.splitCard, styles.splitCardRight]} intensity={40}>
              <View style={styles.splitHeader}>
                <Text style={styles.splitTitle}>Luma Insight</Text>
                <TouchableOpacity onPress={handleDailyBriefing}>
                   <Sparkles size={16} color="#FFF44F" />
                </TouchableOpacity>
              </View>
              <View style={styles.noteContent}>
                <View style={styles.noteTagsRow}>
                  <View style={styles.noteTag}>
                    <Text style={styles.noteTagText}>Finance</Text>
                  </View>
                  <View style={styles.noteTag}>
                    <Text style={styles.noteTagText}>Tips</Text>
                  </View>
                </View>
                <View style={styles.noteLines}>
                  <View style={styles.noteLine} />
                  <View style={styles.noteLine} />
                  <View style={[styles.noteLine, { width: '60%' }]} />
                </View>
                <TouchableOpacity 
                  style={[styles.miniFab, { backgroundColor: 'rgba(255,255,255,0.1)' }]}
                  onPress={handleFinancialInsight}
                >
                  <Plus size={20} color="#FFF" />
                </TouchableOpacity>
              </View>
            </LiquidGlassCard>
          </View>

          {/* Activity Feed */}
          <View style={styles.activitySection}>
            <View style={styles.sectionHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <MessageCircle size={16} color="rgba(255,255,255,0.6)" />
                <Text style={styles.sectionTitle}>Atividade Recente</Text>
              </View>
            </View>
            <View style={styles.activityList}>
              {recentActivity.length > 0 ? (
                recentActivity.map((item, index) => (
                  <ActivityItem 
                    key={`${item.type}-${item.id}-${index}`}
                    icon={item.type === 'finance' ? Wallet : CheckCircle}
                    title={item.title}
                    subtitle={item.subtitle}
                    time={item.time}
                    type={item.type}
                  />
                ))
              ) : (
                <Text style={styles.emptyStateText}>Nenhuma atividade recente</Text>
              )}
            </View>
          </View>

          {/* Search/Magic Bar */}
          <View style={styles.searchBarContainer}>
            <Search size={20} color="rgba(255,255,255,0.4)" />
            <TouchableOpacity 
              style={{ flex: 1 }} 
              onPress={() => {
                setModalMode('magic');
                setMagicInput('');
                setMagicPreview(null);
              }}
            >
              <Text style={styles.searchPlaceholder}>Pergunte à Luma ou crie algo...</Text>
            </TouchableOpacity>
          </View>

          {/* Dock Actions */}
          <View style={styles.dockContainer}>
            <ActionButton 
              icon={Home} 
              onPress={() => {}} 
            />
            
            <TouchableOpacity 
              style={styles.micButtonMain}
              onPress={() => { 
                router.push('/(tabs)/luma' as any);
              }}
            >
              <MessageCircle size={32} color="#C28400" />
            </TouchableOpacity>

            <SpeedDial
              mainIcon={Plus}
              actions={[
                { 
                  icon: Wallet, 
                  label: 'Nova Despesa', 
                  onPress: () => router.push('/(tabs)/finances?action=create' as any),
                  backgroundColor: 'rgba(60,40,0,0.9)'
                },
                { 
                  icon: CheckCircle, 
                  label: 'Nova Tarefa', 
                  onPress: () => router.push('/(tabs)/tasks?action=create' as any),
                  backgroundColor: 'rgba(60,40,0,0.9)'
                }
              ]}
            />
          </View>

        </ScrollView>
      </SafeAreaView>

      {/* Full Screen Modal */}
      <Modal visible={!!modalMode} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <BlurView intensity={20} style={StyleSheet.absoluteFill} />
          <View style={styles.modalContainer}>
            <LinearGradient colors={['#2C1A00', '#1a1000']} style={StyleSheet.absoluteFill} />
            {renderModalContent()}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a1a' },
  
  // Header
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    marginBottom: 24,
  },
  houseSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  houseIconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  houseInitial: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 18,
  },
  houseName: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '600',
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFF44F',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Stats Row
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 24,
  },
  glassCard: { 
    borderRadius: 24, 
    padding: 16, 
    overflow: 'hidden', 
    borderColor: 'rgba(255,255,255,0.1)', 
    borderWidth: 1, 
    backgroundColor: 'rgba(255,255,255,0.05)' 
  },
  glassCardPrimary: {
    backgroundColor: 'rgba(255,244,79,0.9)', // Solid gold background appearance
    borderColor: '#FFF44F',
  },
  statCard: {
    flex: 1,
    height: 100,
    justifyContent: 'space-between',
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    fontWeight: '500',
  },
  statValue: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  statSubtext: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 11,
  },

  // Split Section
  splitSection: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 16,
    height: 220,
    marginBottom: 32,
  },
  splitCard: {
    flex: 1,
    borderRadius: 32,
    padding: 20,
  },
  splitCardLeft: {
    backgroundColor: '#FFF44F', // Fallback
  },
  splitCardRight: {
    // Glass default
  },
  splitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  splitTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
  
  // Mini Task List
  miniTaskList: {
    gap: 12,
  },
  miniTaskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  miniTaskCheckbox: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: 'rgba(44,26,0,0.3)',
  },
  miniTaskText: {
    color: '#2C1A00',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  miniFab: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2C1A00',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Note/Insight Content
  noteContent: {
    flex: 1,
  },
  noteTagsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  noteTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: '#FFF44F',
  },
  noteTagText: {
    color: '#FFF44F',
    fontSize: 10,
    fontWeight: '600',
  },
  noteLines: {
    gap: 12,
    marginTop: 8,
  },
  noteLine: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    width: '100%',
  },

  // Activity Feed
  activitySection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    fontWeight: '600',
  },
  activityList: {
    backgroundColor: '#FFFBE6',
    borderRadius: 24,
    padding: 8,
    borderWidth: 1,
    borderColor: 'rgba(194, 132, 0, 0.1)',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
  },
  activityIconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(194, 132, 0, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(194, 132, 0, 0.2)',
  },
  activityTitle: {
    color: '#1a1a1a',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  activitySubtitle: {
    color: '#1a1a1a',
    fontSize: 12,
    opacity: 0.8,
  },
  activityTime: {
    color: '#1a1a1a',
    fontSize: 11,
    fontWeight: '500',
    opacity: 0.6,
  },
  emptyStateText: {
    padding: 20,
    textAlign: 'center',
    color: 'rgba(0,0,0,0.4)',
  },

  // Search Bar
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginHorizontal: 20,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 30,
    gap: 12,
    marginBottom: 30,
  },
  searchPlaceholder: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 15,
  },

  // Dock
  dockContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 40, marginBottom: 32, paddingHorizontal: 24 },
  dockSideButton: { width: 48, height: 48, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center' },
  micButtonMain: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#FFF44F', alignItems: 'center', justifyContent: 'center', shadowColor: '#FFF44F', shadowOpacity: 0.4, shadowRadius: 20, shadowOffset: { width: 0, height: 4 }, elevation: 10, borderWidth: 4, borderColor: 'rgba(255,255,255,0.1)' },

  // Modal Styles (Mantidos)
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalContainer: { height: '85%', borderTopLeftRadius: 32, borderTopRightRadius: 32, overflow: 'hidden', padding: 24, borderWidth: 1, borderColor: '#DAA520' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { color: '#FFF44F', fontSize: 20, fontWeight: 'bold' },
  modalBody: { flex: 1 },
  
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 16 },
  menuIconBg: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,244,79,0.1)', alignItems: 'center', justifyContent: 'center' },
  menuItemText: { color: '#FFFBE6', fontSize: 18, fontWeight: '500' },

  financeResponseContainer: { backgroundColor: 'rgba(0,0,0,0.2)', padding: 24, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  financeResponseText: { color: '#FFFBE6', fontSize: 18, lineHeight: 28 },
  modalPrimaryButton: { width: '100%', paddingVertical: 12, backgroundColor: '#FFF44F', borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  modalPrimaryButtonText: { color: '#2C1A00', fontWeight: 'bold', fontSize: 16 },
  
  taskDescriptionText: { color: 'rgba(255,255,255,0.7)', fontSize: 14 },
  taskInputWrapper: { position: 'relative' },
  taskInput: { width: '100%', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 16, paddingRight: 60, color: 'white', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', fontSize: 16 },
  taskSubmitButton: { position: 'absolute', right: 8, top: 8, width: 40, height: 40, borderRadius: 8, backgroundColor: '#FFF44F', alignItems: 'center', justifyContent: 'center' },
  taskSubmitButtonDisabled: { opacity: 0.5 },
  taskResponseContainer: { backgroundColor: 'rgba(0,0,0,0.2)', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', flex: 1 },
  taskResponseLabel: { color: '#FFF44F', fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  taskResponseText: { color: '#FFFBE6', fontSize: 16, lineHeight: 28 },
  modalSecondaryButton: { width: '100%', paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,244,79,0.5)', alignItems: 'center', justifyContent: 'center' },
  modalSecondaryButtonText: { color: '#FFF44F', fontWeight: 'bold', fontSize: 14 },
  
  briefingContainer: { padding: 24, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', overflow: 'hidden' },
  briefingLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 16 },
  briefingText: { color: '#FFFBE6', fontSize: 20, fontStyle: 'italic', lineHeight: 28, fontWeight: '300' },
  briefingCloseButton: { width: '100%', paddingVertical: 12, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  briefingCloseButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  
  inputContainer: { flexDirection: 'row', gap: 12, marginTop: 'auto' },
  chatInput: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 24, paddingHorizontal: 16, paddingVertical: 12, color: 'white', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', fontSize: 16 },
  chatSendButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFF44F', alignItems: 'center', justifyContent: 'center' },
  chatSendButtonDisabled: { opacity: 0.5, backgroundColor: 'rgba(128,128,128,0.5)' },
  chatBubbleContainer: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 8 },
  chatAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#FFF44F', alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  chatBubble: { maxWidth: '80%', padding: 12, borderRadius: 16 },
  chatUser: { backgroundColor: '#FFF44F', borderTopRightRadius: 4 },
  chatModel: { backgroundColor: 'rgba(255,255,255,0.1)', borderTopLeftRadius: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  chatTextUser: { color: '#2C1A00', fontSize: 14, lineHeight: 20 },
  chatTextModel: { color: '#FFFBE6', fontSize: 14, lineHeight: 20 },
  chatLoadingBubble: { backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 16, borderTopLeftRadius: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  chatDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.4)' },
  subText: { color: 'rgba(255,255,255,0.5)', fontSize: 14, marginTop: -2 },
});