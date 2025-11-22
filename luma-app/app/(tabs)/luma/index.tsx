import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  StatusBar,
  Dimensions
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { LiquidGlassCard } from '../../../components/ui/LiquidGlassCard';
import { 
  Sparkles, 
  ArrowLeft, 
  Paperclip, 
  Mic, 
  MoreHorizontal, 
  Image as ImageIcon, 
  FileText, 
  ArrowUp
} from 'lucide-react-native';

// --- MOCKS (Mantidos para funcionamento visual) ---
const useAuthStore = (selector: any) => selector({ houseId: '123', user: { id: 'user1' } });
const useConversations = (houseId: any) => ({ 
  data: [
    { id: '1', type: 'message', response: 'Olá! Como posso ajudar com a casa hoje?', created_at: new Date(Date.now() - 86400000).toISOString() },
    { id: '2', type: 'message', message: 'Preciso organizar a festa de natal.', created_at: new Date(Date.now() - 3600000).toISOString() },
    { id: '3', type: 'message', response: 'Criado! ✅ A tarefa "montar a árvore de Natal" está agendada para amanhã às 19h. Quer adicionar mais detalhes ou atribuir a alguém?', created_at: new Date().toISOString() },
  ], 
  isLoading: false, 
  refetch: () => {}, 
  isRefetching: false 
});
const useLumaChat = (h: any, u: any) => ({ mutateAsync: async (msg: string) => {}, isPending: false });
const useRealtimeConversations = (h: any) => {};

const getMessageDateLabel = (date: string) => {
  const msgDate = new Date(date);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (msgDay.getTime() === today.getTime()) return 'Hoje';
  if (msgDay.getTime() === yesterday.getTime()) return 'Ontem';
  return msgDate.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' });
};

// Variável auxiliar para comparar datas
const msgDay = new Date(); 

export default function LumaChatScreen() {
  const router = useRouter();
  const [message, setMessage] = useState('');
  const houseId = useAuthStore((state: any) => state.houseId);
  const userId = useAuthStore((state: any) => state.user?.id ?? null);
  const flatListRef = useRef<FlatList>(null);
  const { top, bottom } = useSafeAreaInsets();
  const { preset } = useLocalSearchParams<{ preset?: string }>();

  const { data: conversations, isLoading: isLoadingConversations, refetch, isRefetching } = useConversations(houseId);
  const { mutateAsync: sendMessage, isPending } = useLumaChat(houseId, userId);
  useRealtimeConversations(houseId); 
  
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!preset || message.trim().length > 0) return;
    if (preset === 'financas') setMessage('Como está a situação financeira este mês?');
    else if (preset === 'tarefas') setMessage('Quais tarefas tenho para esta semana?');
    else if (preset === 'despesa') setMessage('Quero registrar uma nova despesa da casa.');
  }, [preset, message]);

  useEffect(() => {
    if (conversations && conversations.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [conversations]);

  const handleSend = async () => {
    if (!message.trim()) return;
    const messageToSend = message.trim();
    setMessage('');
    setErrorMessage(null);
    try {
      await sendMessage(messageToSend);
      await new Promise((resolve) => setTimeout(resolve, 800));
      await refetch();
    } catch (error) {
      setErrorMessage('Não foi possível enviar.');
      setMessage(messageToSend); 
    }
  };

  const processedConversations = [];
  if (conversations) {
    let lastDateLabel = '';
    conversations.forEach((conv: any, index: number) => {
      const dateLabel = getMessageDateLabel(conv.created_at || new Date().toISOString());
      if (dateLabel !== lastDateLabel) {
        processedConversations.push({ type: 'date_separator', label: dateLabel, id: `date-${dateLabel}-${index}` });
        lastDateLabel = dateLabel;
      }
      processedConversations.push({ ...conv, type: 'message' });
    });
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <View style={styles.backgroundContainer}>
        <LinearGradient
          colors={['#8C6A18', '#6B4F15']}
          style={StyleSheet.absoluteFill}
        />
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {/* Header com Blur leve para consistência */}
        <BlurView intensity={20} tint="dark" style={[styles.header, { paddingTop: top + 10 }]}>
          <View style={styles.headerLeft}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => router.back()}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <ArrowLeft size={24} color="#FFF" />
            </TouchableOpacity>
            
            <View style={styles.headerTitleContainer}>
              <View style={styles.headerAvatarContainer}>
                <Sparkles size={14} color="#FFF" />
              </View>
              <View>
                <Text style={styles.headerTitle}>Luma AI</Text>
                <View style={styles.statusContainer}>
                   <View style={styles.statusDot} />
                   <Text style={styles.headerSubtitle}>Online</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.iconButton}>
              <Mic size={22} color="#FFF" strokeWidth={1.5} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton}>
              <MoreHorizontal size={22} color="#FFF" strokeWidth={1.5} />
            </TouchableOpacity>
          </View>
        </BlurView>

        <FlatList
          ref={flatListRef}
          data={processedConversations}
          keyExtractor={(item) => item.id}
          refreshing={isRefetching}
          onRefresh={refetch}
          // Padding inferior aumentado para compensar o Liquid Glass Input que flutua
          contentContainerStyle={[styles.messagesList, { paddingBottom: bottom + 90 }]} 
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            if (item.type === 'date_separator') {
              return (
                <View style={styles.dateSeparator}>
                  <BlurView intensity={10} tint="light" style={styles.datePill}>
                    <Text style={styles.dateText}>{item.label}</Text>
                  </BlurView>
                </View>
              );
            }

            const time = new Date(item.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            return (
              <View style={styles.messageRow}>
                {/* Luma Response (Ajuste de layout flex-row para espaçamento correto do avatar) */}
                {item.response && (
                  <View style={styles.lumaRow}>
                    <View style={styles.lumaAvatarContainer}>
                       <Sparkles size={12} color="rgba(255,255,255,0.9)" />
                    </View>
                    <View style={styles.lumaBubbleWrapper}>
                      <Text style={styles.senderLabel}>Luma</Text>
                      <View style={styles.lumaBubble}>
                        <Text style={styles.lumaText}>{item.response}</Text>
                        <Text style={styles.lumaTime}>{time}</Text>
                      </View>
                    </View>
                  </View>
                )}

                {/* User Message */}
                {item.message && (
                  <View style={styles.userRow}>
                    <View style={styles.userBubble}>
                      <Text style={styles.userText}>{item.message}</Text>
                      <Text style={styles.userTime}>{time}</Text>
                    </View>
                  </View>
                )}
              </View>
            );
          }}
          ListFooterComponent={
            isPending ? (
              <View style={styles.lumaRow}>
                <View style={styles.lumaAvatarContainer}>
                    <Sparkles size={12} color="#FFF" />
                </View>
                <View style={[styles.lumaBubble, { width: 80, height: 45, justifyContent: 'center', alignItems: 'center', marginLeft: 8 }]}>
                    <ActivityIndicator size="small" color="#FFF" />
                </View>
              </View>
            ) : null
          }
        />

        {/* Input Area com Efeito Liquid Glass */}
        <View style={[styles.inputBlurContainer, { paddingBottom: bottom > 0 ? bottom : 12, backgroundColor: 'transparent' }]}>
          <LiquidGlassCard 
             style={StyleSheet.absoluteFill} 
             intensity={80} 
             tint="dark"
          />
          <View style={styles.inputInnerRow}>
            <TouchableOpacity style={styles.attachButton}>
               <Paperclip size={22} color="#C7C7CC" strokeWidth={1.5} />
            </TouchableOpacity>
            
            <View style={styles.inputPill}>
              <TextInput
                value={message}
                onChangeText={setMessage}
                placeholder="Message Luma..."
                placeholderTextColor="rgba(255,255,255,0.4)"
                style={styles.inputField}
                multiline
              />
              {message.length === 0 && (
                <View style={styles.inputIconsRight}>
                   <TouchableOpacity><ImageIcon size={20} color="rgba(255,255,255,0.4)" /></TouchableOpacity>
                   <TouchableOpacity><FileText size={20} color="rgba(255,255,255,0.4)" /></TouchableOpacity>
                </View>
              )}
            </View>

            <TouchableOpacity 
              style={[
                styles.sendButton, 
                { backgroundColor: message.trim() ? '#D99030' : 'rgba(255,255,255,0.1)' }
              ]}
              onPress={handleSend}
              disabled={!message.trim()}
            >
              {isPending ? (
                 <ActivityIndicator size="small" color="#FFF" />
               ) : (
                 <ArrowUp size={20} color={message.trim() ? "#FFF" : "rgba(255,255,255,0.3)"} strokeWidth={2.5} />
               )}
            </TouchableOpacity>
          </View>
        </View>

      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1C1C1E',
  },
  backgroundContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: -1,
  },
  keyboardView: {
    flex: 1,
  },
  
  // HEADER
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginLeft: 4,
  },
  headerAvatarContainer: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#D99030',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  iconButton: {
    padding: 8,
  },

  // MESSAGES
  messagesList: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  dateSeparator: {
    alignItems: 'center',
    marginVertical: 20,
  },
  datePill: {
    borderRadius: 12,
    overflow: 'hidden', // Importante para o BlurView respeitar o border radius
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  dateText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  messageRow: {
    marginBottom: 24,
  },
  
  // LUMA STYLES (Updated Layout)
  lumaRow: {
    flexDirection: 'row',
    alignItems: 'flex-end', // Alinha o avatar com a base da mensagem
    gap: 12, // Espaço entre avatar e balão
    maxWidth: '85%',
  },
  lumaAvatarContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4, // Leve ajuste para alinhar visualmente com o balão
  },
  lumaBubbleWrapper: {
    flex: 1,
  },
  senderLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
    marginBottom: 4,
    marginLeft: 2,
  },
  lumaBubble: {
    backgroundColor: '#D99030',
    borderRadius: 18,
    borderTopLeftRadius: 2, // Ponta do balão
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  lumaText: {
    color: '#FFF',
    fontSize: 16,
    lineHeight: 22,
  },
  lumaTime: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 10,
    marginTop: 6,
    alignSelf: 'flex-start',
  },

  // USER STYLES
  userRow: {
    alignSelf: 'flex-end',
    maxWidth: '80%',
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  userBubble: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderTopRightRadius: 2,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  userText: {
    color: '#000',
    fontSize: 16,
    lineHeight: 22,
  },
  userTime: {
    color: 'rgba(0,0,0,0.4)',
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
  },

  // INPUT AREA (LIQUID GLASS)
  inputBlurContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  inputInnerRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingTop: 12,
    gap: 8,
  },
  attachButton: {
    width: 40,
    height: 44, // Altura alinhada com o input
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  inputPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.2)', // Escuro semi-transparente para contraste
    borderRadius: 24,
    paddingLeft: 16,
    paddingRight: 8,
    paddingVertical: 4,
    minHeight: 48,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  inputField: {
    flex: 1,
    color: '#FFF',
    fontSize: 16,
    paddingTop: 10,
    paddingBottom: 10,
    maxHeight: 100,
  },
  inputIconsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 12,
    paddingRight: 4,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
});