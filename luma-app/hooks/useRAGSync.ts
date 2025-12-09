import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useAuthStore } from '@/stores/auth.store';
import { RAGService } from '@/services/rag.service';

const SYNC_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24h

export function useRAGSync() {
  const { houseId } = useAuthStore();
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    if (!houseId) return;

    const checkAndSync = async () => {
      try {
        const lastSyncKey = `rag_last_sync_${houseId}`;
        const lastSyncStr = await AsyncStorage.getItem(lastSyncKey);
        const lastSync = lastSyncStr ? parseInt(lastSyncStr, 10) : 0;
        const now = Date.now();

        if (now - lastSync > SYNC_INTERVAL_MS) {
          await RAGService.indexHouseData(houseId);
          await AsyncStorage.setItem(lastSyncKey, now.toString());
        }
      } catch (error) {
        console.error('[RAG Sync] Falha na sincronização automática', error);
      }
    };

    // Sincroniza ao montar
    checkAndSync();

    // Sincroniza quando o app volta para o foreground
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        checkAndSync();
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [houseId]);
}

