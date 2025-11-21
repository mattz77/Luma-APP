import React, { useState } from 'react';
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
  Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
// MotiView removido temporariamente para compatibilidade web
// TODO: Reativar moti quando configurado corretamente para React Native Web
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { 
  Wallet, CheckCircle, Mic, Bell, Plus, ArrowUpRight, Sparkles, 
  X, Send, User, ListTodo, BrainCircuit 
} from 'lucide-react-native';
import { n8nClient } from '@/lib/n8n';
import { useAuthStore } from '@/stores/auth.store';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

// --- Componentes ---

const GlassCard = ({ children, style, delay = 0 }: any) => (
  <View style={[styles.glassCard, style]}>
    <BlurView intensity={30} tint="light" style={StyleSheet.absoluteFill} />
    <LinearGradient
      colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
      style={StyleSheet.absoluteFill}
    />
    <View style={{ zIndex: 10, flex: 1 }}>{children}</View>
  </View>
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

const ListItem = ({ icon: Icon, title, subtitle, amount, delay = 0 }: any) => (
  <View style={styles.listItem}>
    <View style={styles.listIcon}>
      <Icon size={20} color="#FFF44F" />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={styles.listTitle}>{title}</Text>
      <Text style={styles.listSubtitle}>{subtitle}</Text>
    </View>
    {amount && <Text style={styles.listAmount}>{amount}</Text>}
  </View>
);

export default function Dashboard() {
  const router = useRouter();
  const [modalMode, setModalMode] = useState<'finance' | 'task' | 'chat' | 'briefing' | null>(null);
  const [loading, setLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState("");
  const [taskInput, setTaskInput] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState<{role: 'user' | 'model', text: string}[]>([
    { role: 'model', text: "Olá! Sou a Luma. Como posso ajudar na gestão da casa hoje?" }
  ]);

  // Auth Store
  const { user, houseId } = useAuthStore();
  const userId = user?.id || "";
  const userName = user?.name || "Usuário";

  // Dados Mockados (temporários até conectar com Supabase)
  const financialSummary = { spent: "3.450", limit: "4.000", percent: 86 };
  const pendingTasks = 3;
  const nextTask = "Pagar conta de luz";

  // --- Handlers ---
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

  // Componente Modal Interno para Reutilização
  const renderModalContent = () => {
    const isChat = modalMode === 'chat';
    const isTask = modalMode === 'task';
    const isBriefing = modalMode === 'briefing';
    const isFinance = modalMode === 'finance';
    
    return (
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <View style={styles.modalHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Sparkles size={20} color="#FFF44F" />
            <Text style={styles.modalTitle}>
              {isChat ? 'Luma Chat' : isTask ? 'Planejador Mágico' : isBriefing ? 'Resumo do Dia' : 'Análise Financeira'}
            </Text>
          </View>
          <TouchableOpacity onPress={() => {
            setModalMode(null);
            setAiResponse('');
          }}>
            <X size={24} color="rgba(255,255,255,0.5)" />
          </TouchableOpacity>
        </View>

        <View style={styles.modalBody}>
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
          
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>Bom dia,</Text>
              <Text style={styles.username}>{userName}</Text>
            </View>
            <TouchableOpacity style={styles.bellButton} onPress={handleDailyBriefing}>
              <Bell size={24} color="#FFF44F" />
              <View style={styles.notificationDot} />
            </TouchableOpacity>
          </View>

          {/* Cards Section - Melhorado para Mobile */}
          <View style={styles.cardsSection}>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              contentContainerStyle={styles.cardsScrollContent}
              snapToInterval={width - 48}
              decelerationRate="fast"
              pagingEnabled
            >
              {/* Card 1: Finance */}
              <GlassCard style={styles.mainCard}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardIconBg}>
                    <Wallet size={24} color="#C28400" />
                  </View>
                  <Text style={styles.cardTitle}>Finanças</Text>
                  <View style={styles.badge}><Text style={styles.badgeText}>NOV</Text></View>
                </View>
                
                <View style={styles.financeContent}>
                  <View>
                    <Text style={styles.moneyText}>R$ {financialSummary.spent}</Text>
                    <Text style={styles.subText}>gastos</Text>
                  </View>
                  
                  <View style={styles.progressBarBg}>
                    <View style={[styles.progressBarFill, { width: `${financialSummary.percent}%` }]} />
                  </View>
                  
                  <TouchableOpacity onPress={handleFinancialInsight} style={styles.cardButton}>
                    <Sparkles size={18} color="#FFF44F" />
                    <Text style={styles.cardButtonText}>Analisar Gastos</Text>
                  </TouchableOpacity>
                </View>
              </GlassCard>

              {/* Card 2: Insight */}
              <GlassCard style={styles.mainCard}>
                <View style={styles.cardHeader}>
                  <View style={[styles.cardIconBg, { backgroundColor: 'white' }]}>
                    <BrainCircuit size={24} color="#C28400" />
                  </View>
                  <Text style={styles.cardTitle}>Luma Insight</Text>
                </View>
                
                <View style={styles.insightContent}>
                  <Text style={styles.insightText}>"A conta de luz está 30% acima da média. Quer dicas para economizar?"</Text>
                  
                  <TouchableOpacity 
                    onPress={() => { 
                      setModalMode('chat'); 
                      setChatInput(''); 
                      setChatHistory(prev => [...prev, { role: 'model', text: "Percebi um aumento na conta de luz. Gostaria de dicas para economizar?" }]);
                    }}
                    style={styles.linkButton}
                  >
                    <Text style={styles.linkText}>Perguntar à Luma</Text>
                    <ArrowUpRight size={18} color="#FFF44F" />
                  </TouchableOpacity>
                </View>
              </GlassCard>
            </ScrollView>
          </View>

          {/* Dock Actions - Navegação Principal */}
          <View style={styles.dockContainer}>
            <ActionButton 
              icon={ListTodo} 
              onPress={() => { 
                router.push('/tasks/index' as any);
              }} 
            />
            
            <TouchableOpacity 
              style={styles.micButtonMain}
              onPress={() => { 
                router.push('/luma/index' as any);
              }}
            >
              <Mic size={32} color="#C28400" />
            </TouchableOpacity>

            <ActionButton 
              icon={Plus} 
              onPress={() => { 
                router.push('/finances/index' as any);
              }} 
            />
          </View>

          {/* List Section */}
          <View style={styles.listSection}>
            <Text style={styles.sectionHeader}>Resumo do Dia</Text>
            <ListItem icon={Wallet} title="Internet" subtitle="Agendado hoje" amount="-R$ 120" delay={0.7} />
            <ListItem icon={CheckCircle} title="Limpar Sala" subtitle="Maria • Pendente" delay={0.8} />
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, marginTop: 20, marginBottom: 20 },
  greeting: { color: '#FFFBE6', opacity: 0.8, fontSize: 18 },
  username: { color: '#FFF44F', fontSize: 32, fontWeight: 'bold' },
  bellButton: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(0,0,0,0.2)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,244,79,0.2)' },
  notificationDot: { position: 'absolute', top: 12, right: 12, width: 10, height: 10, borderRadius: 5, backgroundColor: '#FF4F4F', borderWidth: 1, borderColor: '#C28400' },
  
  cardsSection: { marginBottom: 24 },
  cardsScrollContent: { paddingHorizontal: 24, gap: 12 },
  glassCard: { borderRadius: 32, padding: 24, overflow: 'hidden', borderColor: 'rgba(218,165,32,0.3)', borderWidth: 1 },
  mainCard: { width: width - 48, height: 240, borderRadius: 32, padding: 24, overflow: 'hidden', borderColor: 'rgba(218,165,32,0.3)', borderWidth: 1, backgroundColor: 'rgba(194, 132, 0, 0.15)' },
  
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  cardIconBg: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#FFF44F', alignItems: 'center', justifyContent: 'center' },
  cardTitle: { color: '#FFFBE6', fontSize: 22, fontWeight: '600', flex: 1 },
  badge: { backgroundColor: 'rgba(0,0,0,0.3)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  badgeText: { color: '#FFF44F', fontWeight: 'bold', fontSize: 12, letterSpacing: 1 },
  
  financeContent: { flex: 1, justifyContent: 'space-between' },
  moneyText: { fontSize: 42, fontWeight: 'bold', color: 'white', letterSpacing: -1 },
  subText: { color: 'rgba(255,255,255,0.6)', fontSize: 16, marginTop: -4 },
  
  progressBarBg: { height: 6, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 3, width: '60%', marginTop: 8 },
  progressBarFill: { height: '100%', backgroundColor: '#FFF44F', borderRadius: 3 },
  
  cardButton: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 14, backgroundColor: 'rgba(255,244,79,0.15)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,244,79,0.3)' },
  cardButtonText: { color: '#FFF44F', fontWeight: '600', fontSize: 16 },
  
  insightContent: { flex: 1, justifyContent: 'space-between' },
  insightText: { color: '#FFFBE6', fontSize: 20, fontStyle: 'italic', lineHeight: 28, fontWeight: '400' },
  linkButton: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  linkText: { color: '#FFF44F', fontWeight: '600', fontSize: 16 },

  dockContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 32, marginBottom: 32, paddingHorizontal: 24 },
  dockSideButton: { width: 56, height: 56, borderRadius: 20, backgroundColor: 'rgba(60,40,0,0.4)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,244,79,0.2)' },
  micButtonMain: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#FFF44F', alignItems: 'center', justifyContent: 'center', borderWidth: 4, borderColor: 'rgba(255,255,255,0.9)', shadowColor: '#FFF44F', shadowOpacity: 0.5, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 12 },

  listSection: { paddingHorizontal: 24 },
  sectionHeader: { color: 'white', fontSize: 20, fontWeight: '600', marginBottom: 16 },
  listItem: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: 'rgba(0,0,0,0.15)', borderRadius: 24, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,244,79,0.1)' },
  listIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,244,79,0.1)', alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  listTitle: { color: '#FFFBE6', fontSize: 16, fontWeight: '600' },
  listSubtitle: { color: 'rgba(255,255,255,0.5)', fontSize: 14 },
  listAmount: { color: 'white', fontWeight: 'bold', fontSize: 16 },

  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalContainer: { height: '85%', borderTopLeftRadius: 32, borderTopRightRadius: 32, overflow: 'hidden', padding: 24, borderWidth: 1, borderColor: '#DAA520' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { color: '#FFF44F', fontSize: 20, fontWeight: 'bold' },
  modalBody: { flex: 1 },
  
  // Finance Modal
  financeResponseContainer: { backgroundColor: 'rgba(0,0,0,0.2)', padding: 24, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  financeResponseText: { color: '#FFFBE6', fontSize: 18, lineHeight: 28 },
  modalPrimaryButton: { width: '100%', paddingVertical: 12, backgroundColor: '#FFF44F', borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  modalPrimaryButtonText: { color: '#2C1A00', fontWeight: 'bold', fontSize: 16 },
  
  // Task Planner Modal
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
  
  // Daily Briefing Modal
  briefingContainer: { padding: 24, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', overflow: 'hidden' },
  briefingLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 16 },
  briefingText: { color: '#FFFBE6', fontSize: 20, fontStyle: 'italic', lineHeight: 28, fontWeight: '300' },
  briefingCloseButton: { width: '100%', paddingVertical: 12, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  briefingCloseButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  
  // Chat Modal
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
  chatDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.4)' }
});