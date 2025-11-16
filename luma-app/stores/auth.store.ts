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
    const { data, error } = await supabase.auth.getUser();

    if (error) {
      console.error('Erro ao recuperar usuário:', error);
      set({ user: null, loading: false });
      return;
    }

    set({
      user: mapAuthUser(data.user),
      loading: false,
    });
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

