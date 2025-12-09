import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { n8nClient } from '@/lib/n8n';
import { RAGService } from '@/services/rag.service';
import type { RAGDocument } from '@/types/rag.types';

export const useLumaChat = (houseId: string | null | undefined, userId: string | null | undefined) => {
  const queryClient = useQueryClient();
  const lastSentAtRef = React.useRef(0);
  const isProcessingRef = React.useRef(false); // Proteção adicional contra execuções simultâneas
  const processingMessagesRef = React.useRef<Set<string>>(new Set()); // Rastrear mensagens em processamento
  const currentMessageHashRef = React.useRef<string | null>(null); // Hash da mensagem atual em processamento

  return useMutation({
    mutationFn: async (message: string) => {
      if (!houseId || !userId) {
        throw new Error('houseId e userId são obrigatórios para enviar mensagens à Luma.');
      }

      // Criar hash simples da mensagem para idempotência
      const messageHash = `${message.trim().toLowerCase()}_${houseId}_${userId}`;
      
      // Proteção contra execuções simultâneas
      if (isProcessingRef.current) {
        console.warn('[useLumaChat] Já está processando uma mensagem, ignorando duplicata');
        throw new Error('RATE_LIMIT_LOCAL');
      }

      // Verificar se esta mensagem exata já está sendo processada
      if (processingMessagesRef.current.has(messageHash)) {
        console.warn('[useLumaChat] Mensagem duplicada detectada, ignorando:', messageHash);
        throw new Error('DUPLICATE_MESSAGE');
      }

      const now = Date.now();
      if (now - lastSentAtRef.current < 5000) { // Aumentado para 5 segundos
        console.warn('[useLumaChat] Rate limit: última mensagem enviada há menos de 5 segundos');
        throw new Error('RATE_LIMIT_LOCAL');
      }
      
      isProcessingRef.current = true;
      currentMessageHashRef.current = messageHash;
      processingMessagesRef.current.add(messageHash);
      lastSentAtRef.current = now;
      
      // Log para debug
      console.log('[useLumaChat] Iniciando envio:', { message, messageHash, timestamp: now });

      // 1) Buscar contexto RAG
      const ragResults: RAGDocument[] = await RAGService.hybridSearch({
        query: message,
        house_id: houseId,
        match_count: 5,
      });

      // 2) Chamar n8n com contexto
      // NOTA: O n8n já salva a conversa no Supabase via nó "Save Conversation"
      // Não precisamos salvar novamente aqui para evitar duplicação
      const response = await n8nClient.sendMessage({
        house_id: houseId,
        user_id: userId,
        message,
        context: {
          rag_results: ragResults.map((r) => ({
            content: r.content,
            score: r.combined_score,
            type: r.doc_type,
            metadata: r.metadata,
          })),
          timestamp: new Date().toISOString(),
        },
      });

      // 3) Indexar conversa no RAG (async, não bloqueia UI)
      // O n8n já salva no Supabase, então apenas indexamos no RAG
      RAGService.addDocument({
        house_id: houseId,
        content: `Usuário: "${message}". Luma: "${response.response}".`,
        doc_type: 'conversation',
        metadata: {
          timestamp: new Date().toISOString(),
          user_id: userId,
        },
      }).catch((err) => console.warn('[LumaChat] Falha ao indexar conversa no RAG', err));

      return response;
    },
    onError: (error) => {
      // Reset em caso de erro
      isProcessingRef.current = false;
      // Remover hash da mensagem do Set após delay
      const messageHash = currentMessageHashRef.current;
      if (messageHash) {
        setTimeout(() => {
          processingMessagesRef.current.delete(messageHash);
          currentMessageHashRef.current = null;
        }, 2000);
      }
      console.error('[useLumaChat] Erro na mutation:', error);
    },
    onSettled: () => {
      // Reset após sucesso ou erro
      const messageHash = currentMessageHashRef.current;
      setTimeout(() => {
        isProcessingRef.current = false;
        // Remover apenas o hash da mensagem atual
        if (messageHash) {
          processingMessagesRef.current.delete(messageHash);
        }
        currentMessageHashRef.current = null;
      }, 2000);
    },
    onSuccess: () => {
      // Apenas invalidar - o realtime já faz o refetch automaticamente
      // Não precisamos fazer refetch manual aqui para evitar múltiplas atualizações
      queryClient.invalidateQueries({ queryKey: ['conversations', houseId ?? ''] });
    },
  });
};

