import { create } from 'zustand';

import { supabase } from '@/lib/supabase';

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
  setHouseId: (houseId: string | null) => void;
  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
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
        set({ user: null, loading: false });
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
      });
    } catch (err) {
      console.error('[AuthStore] Exception during initialization:', err);
      set({ user: null, loading: false });
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
  useAuthStore.setState({
    user: mapAuthUser(session?.user ?? null),
    loading: false,
  });
});

