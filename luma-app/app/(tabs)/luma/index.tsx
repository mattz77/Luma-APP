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
  Image
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Sparkles, Send, User as UserIcon, ArrowLeft, Paperclip, Mic, MoreHorizontal, Image as ImageIcon, AtSign, FileText } from 'lucide-react-native';

import { useConversations } from '@/hooks/useConversations';
import { useLumaChat } from '@/hooks/useLumaChat';
import { useRealtimeConversations } from '@/hooks/useRealtimeConversations';
import { useAuthStore } from '@/stores/auth.store';
import { useUserHouses } from '@/hooks/useHouses';
import { GlassCard } from '@/components/shared';

// Helper para formatar data das mensagens
const getMessageDateLabel = (date: string) => {
  const msgDate = new Date(date);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const msgDay = new Date(msgDate.getFullYear(), msgDate.getMonth(), msgDate.getDate());
  
  if (msgDay.getTime() === today.getTime()) {
    return 'Hoje';
  } else if (msgDay.getTime() === yesterday.getTime()) {
    return 'Ontem';
  } else {
    return msgDate.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' });
  }
};

export default function LumaChatScreen() {
  const router = useRouter();
  const [message, setMessage] = useState('');
  const houseId = useAuthStore((state) => state.houseId);
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const flatListRef = useRef<FlatList>(null);
  const { top, bottom } = useSafeAreaInsets();
  const { preset } = useLocalSearchParams<{ preset?: string }>();
  const { data: userHouses = [] } = useUserHouses(userId ?? undefined);

  const {
    data: conversations,
    isLoading: isLoadingConversations,
    refetch,
    isRefetching,
  } = useConversations(houseId);
  const { mutateAsync: sendMessage, isPending } = useLumaChat(houseId, userId);
  useRealtimeConversations(houseId); 
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const currentHouseName =
    userHouses.find((item) => item.house.id === houseId)?.house.name ?? 'sua casa';

  useEffect(() => {
    if (!preset || message.trim().length > 0) return;

    if (preset === 'financas') {
      setMessage('Como está a situação financeira este mês?');
    } else if (preset === 'tarefas') {
      setMessage('Quais tarefas tenho para esta semana?');
    } else if (preset === 'despesa') {
      setMessage('Quero registrar uma nova despesa da casa.');
    }
  }, [preset, message]);

  useEffect(() => {
    if (conversations && conversations.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [conversations]);

  const handleSend = async () => {
    if (!message.trim()) {
      setErrorMessage('Digite uma mensagem antes de enviar.');
      return;
    }

    const messageToSend = message.trim();
    setMessage('');
    setErrorMessage(null);

    try {
      await sendMessage(messageToSend);
      await new Promise((resolve) => setTimeout(resolve, 800));
      await refetch();
    } catch (error) {
      console.error(error);
      setErrorMessage((error as Error).message || 'Não foi possível enviar a mensagem.');
      setMessage(messageToSend); 
    }
  };

  if (!houseId) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.emptyTitle}>Conecte-se a uma casa</Text>
        <Text style={styles.emptySubtitle}>
          Você precisa selecionar ou criar uma casa para conversar com a Luma.
        </Text>
      </View>
    );
  }

  // Processar conversas para adicionar separadores de data
  const processedConversations = [];
  if (conversations) {
    let lastDateLabel = '';
    conversations.forEach((conv, index) => {
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
      <LinearGradient
        colors={['#C28400', '#8F6100']}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {/* Minimal Header */}
        <View style={[styles.header, { paddingTop: top + 10 }]}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color="#FFF" />
          </TouchableOpacity>
          
          <View style={styles.headerTitleContainer}>
            <View style={styles.headerAvatar}>
              <Sparkles size={16} color="#FFF" />
            </View>
            <Text style={styles.headerTitle}>Luma AI</Text>
            <View style={styles.statusDot} />
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerActionButton}>
              <Mic size={20} color="#FFF" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerActionButton}>
              <MoreHorizontal size={20} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>

        {errorMessage ? <Text style={styles.errorMessage}>{errorMessage}</Text> : null}

        {isLoadingConversations && !conversations ? (
          <View style={[styles.messagesContainer, styles.centered]}>
            <ActivityIndicator size="large" color="#FFF44F" />
            <Text style={styles.helperText}>Carregando histórico...</Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={processedConversations}
            keyExtractor={(item) => item.id}
            refreshing={isRefetching}
            onRefresh={refetch}
            contentContainerStyle={[styles.messagesList, { paddingBottom: bottom + 80 }]} // Espaço para o input flutuante
            showsVerticalScrollIndicator={false}
            removeClippedSubviews={false}
            initialNumToRender={15}
            renderItem={({ item }) => {
              if (item.type === 'date_separator') {
                return (
                  <View style={styles.dateSeparator}>
                    <View style={styles.datePill}>
                      <Text style={styles.dateText}>{item.label}</Text>
                    </View>
                  </View>
                );
              }

              const time = new Date(item.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

              return (
                <View style={styles.messageRow}>
                  <View style={styles.messageWrapper}>
                    {/* Luma Response (Left) */}
                    {item.response && (
                      <View style={styles.lumaRow}>
                        <View style={styles.lumaAvatarSmall}>
                          <Sparkles size={12} color="#FFF" />
                        </View>
                        <View style={styles.lumaBubbleContainer}>
                          <View style={styles.lumaNameRow}>
                            <Text style={styles.senderName}>Luma</Text>
                          </View>
                          <GlassCard style={styles.lumaBubble}>
                            <Text style={styles.lumaBubbleText}>{item.response}</Text>
                            {/* Attachments simulados (inspirado na imagem) */}
                            {/* <View style={styles.attachmentPreview}>
                               <FileText size={16} color="#FFF" />
                               <Text style={styles.attachmentText}>Resumo Financeiro.pdf</Text>
                            </View> */}
                          </GlassCard>
                          <Text style={styles.messageTime}>{time}</Text>
                        </View>
                      </View>
                    )}

                    {/* User Message (Right) */}
                    <View style={styles.userRow}>
                      <View style={styles.userBubbleContainer}>
                        <View style={styles.userBubble}>
                          <Text style={styles.userBubbleText}>{item.message}</Text>
                        </View>
                        <Text style={[styles.messageTime, { alignSelf: 'flex-end' }]}>{time}</Text>
                      </View>
                    </View>
                  </View>
                </View>
              );
            }}
            ListFooterComponent={
              isPending ? (
                <View style={styles.lumaRow}>
                  <View style={styles.lumaAvatarSmall}>
                    <Sparkles size={12} color="#FFF" />
                  </View>
                  <GlassCard style={[styles.lumaBubble, { paddingVertical: 12, width: 60, alignItems: 'center' }]}>
                     <ActivityIndicator size="small" color="#FFF" />
                  </GlassCard>
                </View>
              ) : null
            }
          />
        )}

        {/* Floating Input Pill */}
        <View style={[styles.inputWrapper, { paddingBottom: bottom > 0 ? bottom : 16 }]}>
          <View style={styles.pillContainer}>
            {message.length === 0 && (
              <View style={styles.inputIconsLeft}>
                <TouchableOpacity style={styles.iconButton}><Paperclip size={20} color="rgba(255,255,255,0.5)" /></TouchableOpacity>
                <TouchableOpacity style={styles.iconButton}><ImageIcon size={20} color="rgba(255,255,255,0.5)" /></TouchableOpacity>
                <TouchableOpacity style={styles.iconButton}><FileText size={20} color="rgba(255,255,255,0.5)" /></TouchableOpacity>
                <TouchableOpacity style={styles.iconButton}><AtSign size={20} color="rgba(255,255,255,0.5)" /></TouchableOpacity>
              </View>
            )}
            
            <TextInput
              value={message}
              onChangeText={(text) => {
                setMessage(text);
                setErrorMessage(null);
              }}
              placeholder={message.length > 0 ? "" : "Message Luma..."}
              placeholderTextColor="rgba(255,255,255,0.5)"
              style={[styles.pillInput, message.length > 0 && { paddingLeft: 20 }]}
              multiline
            />

            <TouchableOpacity 
              style={[styles.sendButtonPill, !message.trim() && { backgroundColor: 'rgba(255,255,255,0.1)' }]} 
              onPress={handleSend} 
              disabled={!message.trim() || isPending}
            >
              {isPending ? (
                <ActivityIndicator size={18} color={!message.trim() ? "rgba(255,255,255,0.5)" : "#000"} />
              ) : (
                <ArrowLeft size={20} color={!message.trim() ? "rgba(255,255,255,0.5)" : "#000"} style={{ transform: [{ rotate: '90deg' }] }} />
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
    backgroundColor: '#1a1a1a',
  },
  keyboardView: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(26,26,26,0.8)', 
  },
  backButton: {
    padding: 8,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#C28400',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981', // Green dot
  },
  headerActions: {
    flexDirection: 'row',
    gap: 4,
  },
  headerActionButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginLeft: 8,
  },

  // Messages
  messagesContainer: {
    flex: 1,
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  dateSeparator: {
    alignItems: 'center',
    marginVertical: 16,
  },
  datePill: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  dateText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    fontWeight: '500',
  },
  messageRow: {
    marginBottom: 24,
  },
  messageWrapper: {
    gap: 16,
  },
  
  // Luma Layout
  lumaRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    marginBottom: 16,
  },
  lumaAvatarSmall: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#C28400', // Avatar mais escuro
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20, // Align with bottom of bubble
  },
  lumaBubbleContainer: {
    flex: 1,
    maxWidth: '85%',
  },
  lumaNameRow: {
    marginBottom: 4,
  },
  senderName: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600',
  },
  lumaBubble: {
    borderTopLeftRadius: 4, // Corner style from reference
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16,
    borderBottomLeftRadius: 16,
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.08)', // Glass effect
  },
  lumaBubbleText: {
    color: '#FFF',
    fontSize: 15,
    lineHeight: 22,
  },
  messageTime: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 11,
    marginTop: 4,
  },

  // User Layout
  userRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  userBubbleContainer: {
    maxWidth: '85%',
    alignItems: 'flex-end',
  },
  userBubble: {
    backgroundColor: '#FFF', // Solid white/cream from reference (or Golden for Luma)
    borderRadius: 16,
    borderTopRightRadius: 4,
    padding: 12,
  },
  userBubbleText: {
    color: '#000', // Dark text on light bubble
    fontSize: 15,
    lineHeight: 22,
  },

  // Input Area
  inputWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1a1a1a', // Solid background to cover list
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  pillContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 30,
    padding: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  inputIconsLeft: {
    flexDirection: 'row',
    paddingLeft: 8,
    gap: 4,
  },
  iconButton: {
    padding: 6,
  },
  pillInput: {
    flex: 1,
    color: '#FFF',
    fontSize: 16,
    paddingVertical: 8,
    paddingHorizontal: 8,
    maxHeight: 100,
  },
  sendButtonPill: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF', // White button (active)
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Empty State
  emptyTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  emptySubtitle: { color: 'rgba(255,255,255,0.6)', textAlign: 'center', marginTop: 8 },
  helperText: { color: 'rgba(255,255,255,0.5)', marginTop: 16 },
  errorMessage: { color: '#FF6B6B', textAlign: 'center', padding: 8 },
});

