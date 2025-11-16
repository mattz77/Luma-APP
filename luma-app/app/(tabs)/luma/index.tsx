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

import { useConversations } from '@/hooks/useConversations';
import { useLumaChat } from '@/hooks/useLumaChat';
import { useAuthStore } from '@/stores/auth.store';
import { bubbleShadowStyle, cardShadowStyle } from '@/lib/styles';

export default function LumaChatScreen() {
  const [message, setMessage] = useState('');
  const houseId = useAuthStore((state) => state.houseId);
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const flatListRef = useRef<FlatList>(null);
  const { top } = useSafeAreaInsets();

  const {
    data: conversations,
    isLoading: isLoadingConversations,
    refetch,
    isRefetching,
  } = useConversations(houseId);
  const { mutateAsync: sendMessage, isPending } = useLumaChat(houseId, userId);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
        <Text style={styles.subtitle}>Peça ajuda com despesas, tarefas e automações.</Text>
      </View>

      {errorMessage ? <Text style={styles.errorMessage}>{errorMessage}</Text> : null}

      {isLoadingConversations ? (
        <View style={[styles.messagesContainer, styles.centered]}>
          <ActivityIndicator size="large" color="#1d4ed8" />
          <Text style={styles.helperText}>Carregando histórico...</Text>
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
                <Text style={styles.bubbleLabel}>Você</Text>
                <Text style={styles.bubbleText}>{item.message}</Text>
              </View>
              {item.response ? (
                <View style={[styles.bubble, styles.lumaBubble, bubbleShadowStyle]}>
                  <Text style={[styles.bubbleLabel, styles.lumaLabel]}>Luma</Text>
                  <Text style={styles.bubbleText}>{item.response}</Text>
                </View>
              ) : null}
            </View>
          )}
        />
      )}

      <View style={[styles.inputContainer, cardShadowStyle]}>
        <TextInput
          value={message}
          onChangeText={setMessage}
          placeholder="Escreva algo para a Luma..."
          style={styles.input}
          multiline
          numberOfLines={1}
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
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 24,
  },
  messagesList: {
    paddingHorizontal: 24,
    paddingBottom: 120,
    gap: 16,
  },
  errorMessage: {
    marginHorizontal: 24,
    marginBottom: 8,
    fontSize: 13,
    color: '#dc2626',
    textAlign: 'center',
  },
  messageWrapper: {
    gap: 8,
  },
  bubble: {
    borderRadius: 18,
    padding: 14,
    maxWidth: '90%',
    gap: 6,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#1d4ed8',
  },
  lumaBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
  },
  bubbleLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  lumaLabel: {
    color: '#0284c7',
  },
  bubbleText: {
    fontSize: 15,
    color: '#0f172a',
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
    borderColor: '#cbd5f5',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
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
});

