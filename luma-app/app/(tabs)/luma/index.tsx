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
  StatusBar
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import {
  Sparkles,
  ArrowLeft,
  Mic,
  MoreHorizontal,
  ArrowUp
} from 'lucide-react-native';
import Animated, {
  FadeInUp,
  Layout,
  FadeIn,
  ZoomIn
} from 'react-native-reanimated';

import { Colors } from '@/constants/Colors';
import { useAuthStore } from '@/stores/auth.store';
import { useConversations } from '@/hooks/useConversations';
import { useLumaChat } from '@/hooks/useLumaChat';
import { useRealtimeConversations } from '@/hooks/useRealtimeConversations';

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
  const userName = useAuthStore((state: any) => state.user?.name ?? 'Você');
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
      // Optimistic update or wait for realtime is handled by hooks, 
      // but we scroll to bottom
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (error) {
      setErrorMessage('Não foi possível enviar.');
      setMessage(messageToSend);
    }
  };

  const processedConversations: Array<{
    type: 'date_separator' | 'message';
    label?: string;
    id: string;
    message?: string;
    response?: string | null;
    created_at?: string;
  }> = [];

  if (conversations) {
    // Sort conversations by date (oldest first)
    const sortedConversations = [...conversations].sort((a, b) => {
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return dateA - dateB;
    });

    let lastDateLabel = '';
    sortedConversations.forEach((conv, index: number) => {
      const dateLabel = getMessageDateLabel(conv.createdAt || new Date().toISOString());
      if (dateLabel !== lastDateLabel) {
        processedConversations.push({
          type: 'date_separator',
          label: dateLabel,
          id: `date-${dateLabel}-${index}`
        });
        lastDateLabel = dateLabel;
      }
      processedConversations.push({
        ...conv,
        type: 'message',
        created_at: conv.createdAt
      });
    });
    console.log('Processed Conversations:', JSON.stringify(processedConversations, null, 2));
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

        {isLoadingConversations && processedConversations.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={processedConversations}
            keyExtractor={(item) => item.id}
            refreshing={isRefetching}
            onRefresh={refetch}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
            contentContainerStyle={[styles.messagesList, { paddingBottom: bottom + 100 }]}
            showsVerticalScrollIndicator={false}
            renderItem={({ item, index }) => {
              if (item.type === 'date_separator') {
                return (
                  <View style={styles.dateSeparator}>
                    <View style={styles.datePill}>
                      <Text style={styles.dateText}>{item.label}</Text>
                    </View>
                  </View>
                );
              }

              const time = new Date(item.created_at || Date.now()).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

              return (
                <Animated.View
                  style={styles.messageRow}
                  entering={FadeInUp.delay(index * 50).springify()}
                  layout={Layout.springify()}
                >
                  {/* User Message - Rendered FIRST */}
                  {item.message && (
                    <View style={styles.userRow}>
                      <View style={styles.userBubbleWrapper}>
                        <Text style={styles.userSenderLabel}>{userName}</Text>
                        <View style={styles.userBubble}>
                          <Text style={styles.userText}>{item.message}</Text>
                          <Text style={styles.userTime}>{time}</Text>
                        </View>
                      </View>
                    </View>
                  )}

                  {/* Luma Response - Rendered SECOND */}
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
                </Animated.View>
              );
            }}
            ListFooterComponent={
              isPending ? (
                <Animated.View
                  entering={ZoomIn.duration(300)}
                  layout={Layout.springify()}
                  style={styles.lumaRow}
                >
                  <View style={styles.lumaAvatarContainer}>
                    <Sparkles size={12} color={Colors.primary} />
                  </View>
                  <View style={[styles.lumaBubble, { width: 80, height: 45, justifyContent: 'center', alignItems: 'center', marginLeft: 8 }]}>
                    <ActivityIndicator size="small" color={Colors.text} />
                  </View>
                </Animated.View>
              ) : null
            }
          />
        )}

        {/* Input Area */}
        <View style={[styles.inputBlurContainer, { paddingBottom: bottom > 0 ? bottom : 12 }]}>
          <BlurView intensity={30} tint="light" style={StyleSheet.absoluteFill} />
          <View style={styles.inputInnerRow}>
            <View style={styles.inputPill}>
              <TextInput
                value={message}
                onChangeText={setMessage}
                placeholder="Message Luma..."
                placeholderTextColor={Colors.textSecondary}
                style={styles.inputField}
                multiline
              />
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  dateSeparator: {
    alignItems: 'center',
    marginVertical: 16,
    marginTop: 24,
    marginBottom: 20,
  },
  datePill: {
    borderRadius: 12,
    overflow: 'hidden',
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  dateText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  messageRow: {
    marginBottom: 16,
  },

  // LUMA STYLES
  lumaRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    maxWidth: '85%',
    marginBottom: 2,
    flexShrink: 1,
  },
  lumaAvatarContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary + '10',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
    flexShrink: 0,
  },
  lumaBubbleWrapper: {
    flex: 1,
    minWidth: 0,
  },
  senderLabel: {
    color: Colors.textSecondary,
    fontSize: 11,
    marginBottom: 3,
    marginLeft: 2,
    fontWeight: '500',
  },
  lumaBubble: {
    backgroundColor: '#FFF',
    borderRadius: 18,
    borderTopLeftRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    maxWidth: '100%',
  },
  lumaText: {
    color: Colors.text,
    fontSize: 15,
    lineHeight: 21,
    letterSpacing: 0.1,
    flexShrink: 1,
  },
  lumaTime: {
    color: Colors.textSecondary,
    fontSize: 10,
    marginTop: 8,
    alignSelf: 'flex-start',
  },

  // USER STYLES
  userRow: {
    alignSelf: 'flex-end',
    maxWidth: '85%',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 2,
    flexShrink: 1,
  },
  userBubbleWrapper: {
    flex: 1,
    alignItems: 'flex-end',
    minWidth: 0,
  },
  userSenderLabel: {
    color: Colors.textSecondary,
    fontSize: 11,
    marginBottom: 3,
    marginRight: 2,
    fontWeight: '500',
    alignSelf: 'flex-end',
  },
  userBubble: {
    backgroundColor: Colors.primary,
    borderRadius: 18,
    borderTopRightRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
    maxWidth: '100%',
  },
  userText: {
    color: '#FFF',
    fontSize: 15,
    lineHeight: 21,
    letterSpacing: 0.1,
    flexShrink: 1,
  },
  userTime: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 10,
    marginTop: 8,
    alignSelf: 'flex-end',
  },

  // INPUT AREA
  inputBlurContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
    backgroundColor: 'rgba(255,255,255,0.85)',
  },
  inputInnerRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 10,
  },
  inputPill: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 24,
    paddingLeft: 18,
    paddingRight: 18,
    paddingVertical: 6,
    minHeight: 48,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  inputField: {
    flex: 1,
    color: Colors.text,
    fontSize: 15,
    paddingTop: 12,
    paddingBottom: 12,
    maxHeight: 100,
    lineHeight: 20,
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