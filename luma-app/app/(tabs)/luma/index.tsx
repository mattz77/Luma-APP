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
import { Colors } from '@/constants/Colors';

// --- MOCKS (Mantidos para funcionamento visual) ---
const useAuthStore = (selector: any) => selector({ houseId: '123', user: { id: 'user1' } });
const useConversations = (houseId: any) => ({
  data: [
    { id: '1', type: 'message', response: 'Olá! Como posso ajudar com a casa hoje?', created_at: new Date(Date.now() - 86400000).toISOString() },
    { id: '2', type: 'message', message: 'Preciso organizar a festa de natal.', created_at: new Date(Date.now() - 3600000).toISOString() },
    { id: '3', type: 'message', response: 'Criado! ✅ A tarefa "montar a árvore de Natal" está agendada para amanhã às 19h. Quer adicionar mais detalhes ou atribuir a alguém?', created_at: new Date().toISOString() },
  ],
  isLoading: false,
  refetch: () => { },
  isRefetching: false
});
const useLumaChat = (h: any, u: any) => ({ mutateAsync: async (msg: string) => { }, isPending: false });
const useRealtimeConversations = (h: any) => { };

const getMessageDateLabel = (date: string) => {
  const msgDate = new Date(date);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const msgDay = new Date(msgDate.getFullYear(), msgDate.getMonth(), msgDate.getDate());

  if (msgDay.getTime() === today.getTime()) return 'Hoje';
  if (msgDay.getTime() === yesterday.getTime()) return 'Ontem';
  return msgDate.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' });
};

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
      <StatusBar barStyle="dark-content" />

      {/* Light Theme Background */}
      <View style={styles.backgroundContainer}>
        <View style={{ backgroundColor: Colors.background, ...StyleSheet.absoluteFillObject }} />
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {/* Header */}
        <BlurView intensity={20} tint="light" style={[styles.header, { paddingTop: top + 10 }]}>
          <View style={styles.headerLeft}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <ArrowLeft size={24} color={Colors.primary} />
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
              <Mic size={22} color={Colors.primary} strokeWidth={1.5} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton}>
              <MoreHorizontal size={22} color={Colors.primary} strokeWidth={1.5} />
            </TouchableOpacity>
          </View>
        </BlurView>

        <FlatList
          ref={flatListRef}
          data={processedConversations}
          keyExtractor={(item) => item.id}
          refreshing={isRefetching}
          onRefresh={refetch}
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
                {/* Luma Response */}
                {item.response && (
                  <View style={styles.lumaRow}>
                    <View style={styles.lumaAvatarContainer}>
                      <Sparkles size={12} color={Colors.primary} />
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
                  <Sparkles size={12} color={Colors.primary} />
                </View>
                <View style={[styles.lumaBubble, { width: 80, height: 45, justifyContent: 'center', alignItems: 'center', marginLeft: 8 }]}>
                  <ActivityIndicator size="small" color={Colors.text} />
                </View>
              </View>
            ) : null
          }
        />

        {/* Input Area */}
        <View style={[styles.inputBlurContainer, { paddingBottom: bottom > 0 ? bottom : 12 }]}>
          <BlurView intensity={30} tint="light" style={StyleSheet.absoluteFill} />
          <View style={styles.inputInnerRow}>
            <TouchableOpacity style={styles.attachButton}>
              <Paperclip size={22} color={Colors.textSecondary} strokeWidth={1.5} />
            </TouchableOpacity>

            <View style={styles.inputPill}>
              <TextInput
                value={message}
                onChangeText={setMessage}
                placeholder="Message Luma..."
                placeholderTextColor={Colors.textSecondary}
                style={styles.inputField}
                multiline
              />
              {message.length === 0 && (
                <View style={styles.inputIconsRight}>
                  <TouchableOpacity><ImageIcon size={20} color={Colors.textSecondary} /></TouchableOpacity>
                  <TouchableOpacity><FileText size={20} color={Colors.textSecondary} /></TouchableOpacity>
                </View>
              )}
            </View>

            <TouchableOpacity
              style={[
                styles.sendButton,
                { backgroundColor: message.trim() ? Colors.primary : Colors.textSecondary + '20' }
              ]}
              onPress={handleSend}
              disabled={!message.trim()}
            >
              {isPending ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <ArrowUp size={20} color={message.trim() ? "#FFF" : Colors.textSecondary} strokeWidth={2.5} />
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
    backgroundColor: Colors.background,
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
    borderBottomColor: 'rgba(0,0,0,0.05)',
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
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  headerTitle: {
    color: Colors.text,
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
    color: Colors.textSecondary,
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
    overflow: 'hidden',
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  dateText: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  messageRow: {
    marginBottom: 24,
  },

  // LUMA STYLES
  lumaRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
    maxWidth: '85%',
  },
  lumaAvatarContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary + '10',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  lumaBubbleWrapper: {
    flex: 1,
  },
  senderLabel: {
    color: Colors.textSecondary,
    fontSize: 11,
    marginBottom: 4,
    marginLeft: 2,
  },
  lumaBubble: {
    backgroundColor: '#FFF',
    borderRadius: 18,
    borderTopLeftRadius: 2,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  lumaText: {
    color: Colors.text,
    fontSize: 16,
    lineHeight: 22,
  },
  lumaTime: {
    color: Colors.textSecondary,
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
    backgroundColor: Colors.primary,
    borderRadius: 18,
    borderTopRightRadius: 2,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  userText: {
    color: '#FFF',
    fontSize: 16,
    lineHeight: 22,
  },
  userTime: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
  },

  // INPUT AREA
  inputBlurContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    backgroundColor: 'rgba(255,255,255,0.8)',
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
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  inputPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#FFF',
    borderRadius: 24,
    paddingLeft: 16,
    paddingRight: 8,
    paddingVertical: 4,
    minHeight: 48,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  inputField: {
    flex: 1,
    color: Colors.text,
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