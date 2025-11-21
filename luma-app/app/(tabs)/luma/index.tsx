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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Sparkles, Send, User as UserIcon, ArrowLeft } from 'lucide-react-native';

import { useConversations } from '@/hooks/useConversations';
import { useLumaChat } from '@/hooks/useLumaChat';
import { useRealtimeConversations } from '@/hooks/useRealtimeConversations';
import { useAuthStore } from '@/stores/auth.store';
import { useUserHouses } from '@/hooks/useHouses';
import { GlassCard } from '@/components/shared';

export default function LumaChatScreen() {
  const router = useRouter();
  const [message, setMessage] = useState('');
  const houseId = useAuthStore((state) => state.houseId);
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const flatListRef = useRef<FlatList>(null);
  const { top } = useSafeAreaInsets();
  const { preset } = useLocalSearchParams<{ preset?: string }>();
  const { data: userHouses = [] } = useUserHouses(userId ?? undefined);

  const {
    data: conversations,
    isLoading: isLoadingConversations,
    refetch,
    isRefetching,
  } = useConversations(houseId);
  const { mutateAsync: sendMessage, isPending } = useLumaChat(houseId, userId);
  useRealtimeConversations(houseId); // Atualização em tempo real
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const currentHouseName =
    userHouses.find((item) => item.house.id === houseId)?.house.name ?? 'sua casa';

  // Pré-preenche a mensagem com base no preset vindo do dashboard
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

  // Scroll automático para o final quando novas mensagens chegarem
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
    setMessage(''); // Limpa o input imediatamente para melhor UX
    setErrorMessage(null);

    try {
      await sendMessage(messageToSend);
      
      // Aguarda um pouco para o n8n processar e salvar no banco
      // O realtime subscription também vai atualizar automaticamente
      await new Promise((resolve) => setTimeout(resolve, 800));
      
      // Força um refetch para garantir que está atualizado
      // O realtime subscription também vai atualizar, mas este é um fallback
      await refetch();
    } catch (error) {
      console.error(error);
      setErrorMessage((error as Error).message || 'Não foi possível enviar a mensagem.');
      setMessage(messageToSend); // Restaura a mensagem em caso de erro
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
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        <View style={[styles.header, { paddingTop: top + 16 }]}>
          <View style={styles.headerTopRow}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <ArrowLeft size={24} color="#FFF44F" />
            </TouchableOpacity>
            <View style={styles.headerIconRow}>
              <View style={styles.sparkleIconBg}>
                <Sparkles size={24} color="#C28400" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>Assistente Luma</Text>
                <Text style={styles.subtitle}>
                  {currentHouseName}
                </Text>
              </View>
            </View>
          </View>
          <Text style={styles.subtitleSecondary}>
            Peça ajuda com despesas, tarefas, organização ou próximos passos.
          </Text>
        </View>

      {errorMessage ? <Text style={styles.errorMessage}>{errorMessage}</Text> : null}

      {isLoadingConversations || isPending ? (
        <View style={[styles.messagesContainer, styles.centered]}>
          <ActivityIndicator size="large" color="#FFF44F" />
          <Text style={styles.helperText}>
            {isPending ? 'Luma está pensando...' : 'Carregando histórico...'}
          </Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={conversations ?? []}
          keyExtractor={(item, index) => item.id || `conv-${index}-${item.message?.substring(0, 20)}`}
          refreshing={isRefetching}
          onRefresh={refetch}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={false}
          initialNumToRender={15}
          maxToRenderPerBatch={15}
          windowSize={5}
          updateCellsBatchingPeriod={50}
          renderItem={({ item }) => (
            <View style={styles.messageWrapper}>
              <View style={styles.userBubble}>
                <View style={styles.bubbleHeader}>
                  <View style={styles.userAvatarSmall}>
                    <UserIcon size={12} color="#FFF44F" />
                  </View>
                  <Text style={styles.userLabel}>Você</Text>
                </View>
                <Text style={styles.userBubbleText}>{item.message}</Text>
              </View>
              {item.response ? (
                <GlassCard style={styles.lumaBubble}>
                  <View style={styles.bubbleHeader}>
                    <View style={styles.lumaAvatarSmall}>
                      <Sparkles size={12} color="#C28400" />
                    </View>
                    <Text style={styles.lumaLabel}>Luma</Text>
                  </View>
                  <Text style={styles.lumaBubbleText}>{item.response}</Text>
                </GlassCard>
              ) : (
                <View style={styles.loadingIndicator}>
                  <ActivityIndicator size="small" color="#FFF44F" />
                  <Text style={styles.loadingText}>Luma está pensando...</Text>
                </View>
              )}
            </View>
          )}
        />
      )}

      <GlassCard style={styles.inputContainer}>
        {conversations && conversations.length === 0 && !message.trim() ? (
          <View style={styles.quickSuggestions}>
            <Text style={styles.quickSuggestionsTitle}>Sugestões rápidas</Text>
            <View style={styles.quickSuggestionsRow}>
              <TouchableOpacity
                style={styles.quickChip}
                onPress={() => setMessage('Como está a situação financeira este mês?')}
              >
                <Text style={styles.quickChipText}>💰 Situação financeira</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickChip}
                onPress={() => setMessage('Quais tarefas tenho para esta semana?')}
              >
                <Text style={styles.quickChipText}>✅ Tarefas da semana</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickChip}
                onPress={() => setMessage('Quero registrar uma nova despesa da casa.')}
              >
                <Text style={styles.quickChipText}>📝 Registrar despesa</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}
        <View style={styles.inputRow}>
          <TextInput
            value={message}
            onChangeText={(text) => {
              setMessage(text);
              setErrorMessage(null);
            }}
            placeholder="Escreva algo para a Luma..."
            style={styles.input}
            multiline
            numberOfLines={1}
            editable={!isPending}
            placeholderTextColor="rgba(255,255,255,0.4)"
          />
          <TouchableOpacity style={styles.sendButton} onPress={handleSend} disabled={isPending}>
            {isPending ? (
              <ActivityIndicator size={20} color="#2C1A00" />
            ) : (
              <Send size={20} color="#2C1A00" />
            )}
          </TouchableOpacity>
        </View>
      </GlassCard>
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
  header: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
  },
  headerTopRow: {
    marginBottom: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,244,79,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,244,79,0.3)',
  },
  headerIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sparkleIconBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFF44F',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FFF44F',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 6,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#FFF44F',
  },
  subtitle: {
    fontSize: 14,
    color: '#FFFBE6',
    opacity: 0.8,
    marginTop: 2,
  },
  subtitleSecondary: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    lineHeight: 20,
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 24,
  },
  messagesList: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 140,
  },
  errorMessage: {
    marginHorizontal: 24,
    marginBottom: 8,
    fontSize: 13,
    color: '#FF6B6B',
    textAlign: 'center',
    backgroundColor: 'rgba(255,107,107,0.1)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  messageWrapper: {
    gap: 16,
    marginBottom: 8,
  },
  bubbleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  userAvatarSmall: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,244,79,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FFF44F',
  },
  lumaAvatarSmall: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFF44F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#FFF44F',
    borderRadius: 20,
    borderTopRightRadius: 4,
    padding: 16,
    maxWidth: '85%',
    shadowColor: '#FFF44F',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  lumaBubble: {
    alignSelf: 'flex-start',
    maxWidth: '85%',
    borderTopLeftRadius: 4,
  },
  userLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: '#2C1A00',
  },
  lumaLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: '#FFFBE6',
  },
  userBubbleText: {
    fontSize: 15,
    color: '#2C1A00',
    lineHeight: 22,
    fontWeight: '500',
  },
  lumaBubbleText: {
    fontSize: 15,
    color: '#FFFBE6',
    lineHeight: 22,
  },
  loadingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
  },
  loadingText: {
    fontSize: 13,
    color: '#FFFBE6',
    fontStyle: 'italic',
    opacity: 0.8,
  },
  inputContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    marginHorizontal: 16,
    marginBottom: 24,
    padding: 16,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  input: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#FFFBE6',
    maxHeight: 120,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF44F',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FFF44F',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFBE6',
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    marginTop: 8,
  },
  helperText: {
    marginTop: 12,
    fontSize: 14,
    color: '#FFFBE6',
    opacity: 0.8,
  },
  quickSuggestions: {
    flexDirection: 'column',
    gap: 12,
    marginBottom: 16,
  },
  quickSuggestionsTitle: {
    fontSize: 12,
    color: '#FFFBE6',
    opacity: 0.7,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  quickSuggestionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickChip: {
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  quickChipText: {
    fontSize: 13,
    color: '#FFFBE6',
    fontWeight: '500',
  },
});

