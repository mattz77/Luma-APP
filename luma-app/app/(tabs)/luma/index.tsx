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
import { useLocalSearchParams } from 'expo-router';

import { useConversations } from '@/hooks/useConversations';
import { useLumaChat } from '@/hooks/useLumaChat';
import { useAuthStore } from '@/stores/auth.store';
import { useUserHouses } from '@/hooks/useHouses';
import { bubbleShadowStyle, cardShadowStyle } from '@/lib/styles';

export default function LumaChatScreen() {
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

    try {
      await sendMessage(message.trim());
      setMessage('');
      setErrorMessage(null);
      await refetch();
    } catch (error) {
      console.error(error);
      setErrorMessage((error as Error).message || 'Não foi possível enviar a mensagem.');
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
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <View style={[styles.header, { paddingTop: top + 16 }]}>
        <Text style={styles.title}>Assistente Luma</Text>
        <Text style={styles.subtitle}>
          Você está falando sobre: <Text style={styles.houseName}>{currentHouseName}</Text>.
        </Text>
        <Text style={styles.subtitleSecondary}>
          Peça ajuda com despesas, tarefas, organização da rotina ou próximos passos da casa.
        </Text>
      </View>

      {errorMessage ? <Text style={styles.errorMessage}>{errorMessage}</Text> : null}

      {isLoadingConversations || isPending ? (
        <View style={[styles.messagesContainer, styles.centered]}>
          <ActivityIndicator size="large" color="#1d4ed8" />
          <Text style={styles.helperText}>
            {isPending ? 'Luma está pensando...' : 'Carregando histórico...'}
          </Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={conversations ?? []}
          keyExtractor={(item) => item.id}
          refreshing={isRefetching}
          onRefresh={refetch}
          contentContainerStyle={styles.messagesList}
          renderItem={({ item }) => (
            <View style={styles.messageWrapper}>
              <View style={[styles.bubble, styles.userBubble, bubbleShadowStyle]}>
                <Text style={[styles.bubbleLabel, styles.userLabel]}>Você</Text>
                <Text style={[styles.bubbleText, styles.userBubbleText]}>{item.message}</Text>
              </View>
              {item.response ? (
                <View style={[styles.bubble, styles.lumaBubble, bubbleShadowStyle]}>
                  <Text style={[styles.bubbleLabel, styles.lumaLabel]}>Luma</Text>
                  <Text style={styles.bubbleText}>{item.response}</Text>
                </View>
              ) : (
                <View style={styles.loadingIndicator}>
                  <ActivityIndicator size="small" color="#1d4ed8" />
                  <Text style={styles.loadingText}>Luma está pensando...</Text>
                </View>
              )}
            </View>
          )}
        />
      )}

      <View style={[styles.inputContainer, cardShadowStyle]}>
        {conversations && conversations.length === 0 && !message.trim() ? (
          <View style={styles.quickSuggestions}>
            <Text style={styles.quickSuggestionsTitle}>Sugestões rápidas</Text>
            <View style={styles.quickSuggestionsRow}>
              <TouchableOpacity
                style={styles.quickChip}
                onPress={() => setMessage('Como está a situação financeira este mês?')}
              >
                <Text style={styles.quickChipText}>Situação financeira</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickChip}
                onPress={() => setMessage('Quais tarefas tenho para esta semana?')}
              >
                <Text style={styles.quickChipText}>Tarefas da semana</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickChip}
                onPress={() => setMessage('Quero registrar uma nova despesa da casa.')}
              >
                <Text style={styles.quickChipText}>Registrar despesa</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}
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
          placeholderTextColor="#94a3b8"
        />
        <TouchableOpacity style={styles.sendButton} onPress={handleSend} disabled={isPending}>
          {isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.sendButtonText}>Enviar</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0f172a',
  },
  subtitle: {
    fontSize: 14,
    color: '#475569',
    marginTop: 4,
  },
  subtitleSecondary: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  houseName: {
    fontWeight: '600',
    color: '#0f172a',
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 24,
  },
  messagesList: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 120,
  },
  errorMessage: {
    marginHorizontal: 24,
    marginBottom: 8,
    fontSize: 13,
    color: '#dc2626',
    textAlign: 'center',
  },
  messageWrapper: {
    gap: 12,
    marginBottom: 4,
  },
  bubble: {
    borderRadius: 18,
    padding: 14,
    maxWidth: '85%',
    gap: 6,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  lumaBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  bubbleLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  userLabel: {
    color: '#1d4ed8',
  },
  lumaLabel: {
    color: '#0284c7',
  },
  bubbleText: {
    fontSize: 15,
    color: '#0f172a',
    lineHeight: 20,
  },
  userBubbleText: {
    color: '#0f172a',
  },
  loadingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignSelf: 'flex-start',
  },
  loadingText: {
    fontSize: 13,
    color: '#64748b',
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#0f172a',
    backgroundColor: '#f8fafc',
    maxHeight: 120,
  },
  sendButton: {
    borderRadius: 16,
    backgroundColor: '#1d4ed8',
    paddingVertical: 12,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
    opacity: 1,
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
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
    color: '#1e293b',
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 8,
  },
  helperText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748b',
  },
  quickSuggestions: {
    flexDirection: 'column',
    gap: 6,
    marginRight: 12,
    flex: 1,
  },
  quickSuggestionsTitle: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 2,
  },
  quickSuggestionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  quickChip: {
    borderRadius: 999,
    backgroundColor: '#eff6ff',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  quickChipText: {
    fontSize: 12,
    color: '#1f2937',
  },
});

