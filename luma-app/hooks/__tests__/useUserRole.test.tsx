import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';

import { useUserRole, useCanAccessFinances, useCanManageMembers } from '@/hooks/useUserRole';
import { supabaseTest } from '@/test/supabase-test-registry';

function createWrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return { Wrapper, client };
}

const adminMember = {
  id: 'm1',
  house_id: 'house-1',
  user_id: 'user-1',
  role: 'ADMIN',
  joined_at: new Date().toISOString(),
  is_active: true,
  user: {
    id: 'user-1',
    email: 'admin@example.com',
    name: 'Admin',
    avatar_url: null,
    phone: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    last_login_at: null,
  },
};

const memberUser = {
  ...adminMember,
  id: 'm2',
  user_id: 'user-2',
  role: 'MEMBER',
  user: {
    ...adminMember.user,
    id: 'user-2',
    email: 'member@example.com',
    name: 'Member',
  },
};

describe('useUserRole', () => {
  beforeEach(() => {
    supabaseTest.reset();
  });

  test('retorna ADMIN para usuário admin', async () => {
    supabaseTest.setNextResult([adminMember], null);
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useUserRole('house-1', 'user-1'), { wrapper: Wrapper });
    
    await waitFor(() => expect(result.current).toBe('ADMIN'));
  });

  test('retorna MEMBER para usuário membro', async () => {
    supabaseTest.setNextResult([memberUser], null);
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useUserRole('house-1', 'user-2'), { wrapper: Wrapper });
    
    await waitFor(() => expect(result.current).toBe('MEMBER'));
  });

  test('retorna null quando houseId não definido', () => {
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useUserRole(null, 'user-1'), { wrapper: Wrapper });
    
    expect(result.current).toBeNull();
  });

  test('retorna null quando userId não definido', () => {
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useUserRole('house-1', null), { wrapper: Wrapper });
    
    expect(result.current).toBeNull();
  });

  test('retorna null quando usuário não está na lista de membros', async () => {
    supabaseTest.setNextResult([adminMember], null);
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useUserRole('house-1', 'user-inexistente'), { wrapper: Wrapper });
    
    await waitFor(() => {
      expect(result.current).toBeNull();
    });
  });
});

describe('useCanAccessFinances', () => {
  beforeEach(() => {
    supabaseTest.reset();
  });

  test('retorna true para ADMIN', async () => {
    supabaseTest.setNextResult([adminMember], null);
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useCanAccessFinances('house-1', 'user-1'), { wrapper: Wrapper });
    
    await waitFor(() => expect(result.current).toBe(true));
  });

  test('retorna false para MEMBER', async () => {
    supabaseTest.setNextResult([memberUser], null);
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useCanAccessFinances('house-1', 'user-2'), { wrapper: Wrapper });
    
    await waitFor(() => expect(result.current).toBe(false));
  });

  test('retorna false quando não há membros', async () => {
    supabaseTest.setNextResult([], null);
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useCanAccessFinances('house-1', 'user-1'), { wrapper: Wrapper });
    
    await waitFor(() => expect(result.current).toBe(false));
  });
});

describe('useCanManageMembers', () => {
  beforeEach(() => {
    supabaseTest.reset();
  });

  test('retorna true para ADMIN', async () => {
    supabaseTest.setNextResult([adminMember], null);
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useCanManageMembers('house-1', 'user-1'), { wrapper: Wrapper });
    
    await waitFor(() => expect(result.current).toBe(true));
  });

  test('retorna false para MEMBER', async () => {
    supabaseTest.setNextResult([memberUser], null);
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useCanManageMembers('house-1', 'user-2'), { wrapper: Wrapper });
    
    await waitFor(() => expect(result.current).toBe(false));
  });
});
