import { create } from 'zustand';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

import { supabase } from '@/lib/supabase';
import { getEnvVar } from '@/lib/utils';

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
}

export interface AuthState {
  user: AuthUser | null;
  houseId: string | null;
  loading: boolean;
  initialized: boolean;
  setHouseId: (houseId: string | null) => void;
  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signOut: () => Promise<void>;
}

const mapAuthUser = (user: Awaited<ReturnType<typeof supabase.auth.getUser>>['data']['user']): AuthUser | null => {
  if (!user || !user.email) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    name: (user.user_metadata?.name as string | undefined) ?? null,
    avatarUrl: (user.user_metadata?.avatar_url as string | undefined) ?? null,
  };
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  houseId: null,
  loading: true,
  initialized: false,

  setHouseId: (houseId) => set({ houseId }),

  initialize: async () => {
    console.log('[AuthStore] Initializing...');
    try {
      const { data, error } = await supabase.auth.getUser();

      if (error) {
        // Quando não há sessão salva (primeiro acesso / após logout),
        // o Supabase lança AuthSessionMissingError. Tratamos como "sem usuário"
        // sem logar como erro crítico para evitar ruído no console.
        if (error.name !== 'AuthSessionMissingError') {
          console.error('[AuthStore] Erro ao recuperar usuário:', error);
        } else {
          console.log('[AuthStore] Nenhuma sessão encontrada (normal para primeiro acesso)');
        }
        set({ user: null, loading: false, initialized: true });
        return;
      }

      const mappedUser = mapAuthUser(data.user);
      console.log('[AuthStore] User initialized:', {
        hasUser: !!mappedUser,
        userId: mappedUser?.id,
        email: mappedUser?.email,
      });

      set({
        user: mappedUser,
        loading: false,
        initialized: true,
      });
    } catch (err) {
      console.error('[AuthStore] Exception during initialization:', err);
      set({ user: null, loading: false, initialized: true });
    }
  },

  signIn: async (email, password) => {
    set({ loading: true });

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      set({
        user: mapAuthUser(data.user),
        loading: false,
      });
    } catch (authError) {
      set({ loading: false });
      throw authError;
    }
  },

  signUp: async (email, password, name) => {
    set({ loading: true });

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
          },
        },
      });

      if (error) {
        throw error;
      }

      set({
        user: mapAuthUser(data.user),
        loading: false,
      });
    } catch (authError) {
      set({ loading: false });
      throw authError;
    }
  },

  signInWithGoogle: async () => {
    set({ loading: true });

    try {
      const supabaseUrl = getEnvVar('EXPO_PUBLIC_SUPABASE_URL');
      
      // URL de callback - usar scheme do app para mobile
      const redirectUrl = Platform.select({
        web: typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : `${supabaseUrl}/auth/v1/callback`,
        default: `lumaapp://auth/callback`,
      });

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
        },
      });

      if (error) {
        throw error;
      }

      // No mobile, o Supabase abre o browser automaticamente
      // No web, redireciona automaticamente
      // O callback será tratado pelo onAuthStateChange
      // Não resetar loading aqui - será resetado quando a sessão for criada
    } catch (authError) {
      set({ loading: false });
      throw authError;
    }
  },

  signInWithApple: async () => {
    if (Platform.OS !== 'ios') {
      throw new Error('Apple Sign In está disponível apenas no iOS');
    }

    set({ loading: true });

    try {
      const supabaseUrl = getEnvVar('EXPO_PUBLIC_SUPABASE_URL');
      
      // URL de callback - usar scheme do app para mobile
      const redirectUrl = Platform.select({
        web: typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : `${supabaseUrl}/auth/v1/callback`,
        default: `lumaapp://auth/callback`,
      });

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo: redirectUrl,
        },
      });

      if (error) {
        throw error;
      }

      // No mobile, o Supabase abre o browser automaticamente
      // O callback será tratado pelo onAuthStateChange
      // Não resetar loading aqui - será resetado quando a sessão for criada
    } catch (authError) {
      set({ loading: false });
      throw authError;
    }
  },

  signOut: async () => {
    set({ loading: true });

    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        throw error;
      }

      set({
        user: null,
        houseId: null,
        loading: false,
      });
    } catch (authError) {
      set({ loading: false });
      throw authError;
    }
  },
}));

supabase.auth.onAuthStateChange((_event, session) => {
  const state = useAuthStore.getState();
  // Só atualiza via onAuthStateChange se já inicializou, para evitar race condition
  if (state.initialized) {
    useAuthStore.setState({
      user: mapAuthUser(session?.user ?? null),
      loading: false,
    });
  }
});

