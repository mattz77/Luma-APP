import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';

import {
  useUserHouses,
  useHouseMembers,
  useCreateHouse,
  useJoinHouse,
  useLeaveHouse,
  useUpdateMemberRole,
} from '@/hooks/useHouses';
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

const houseRow = {
  id: 'house-1',
  name: 'Casa Principal',
  address: null,
  photo_url: null,
  invite_code: 'ABC123',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const membershipRow = {
  id: 'm1',
  house_id: 'house-1',
  user_id: 'user-1',
  role: 'ADMIN',
  joined_at: new Date().toISOString(),
  is_active: true,
};

const memberWithUser = {
  ...membershipRow,
  user: {
    id: 'user-1',
    email: 'user@example.com',
    name: 'João',
    avatar_url: null,
    phone: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    last_login_at: null,
  },
};

describe('useUserHouses', () => {
  beforeEach(() => {
    supabaseTest.reset();
    jest.clearAllMocks();
  });

  test('retorna lista de casas quando userId definido', async () => {
    supabaseTest.enqueueResults(
      { data: [membershipRow], error: null },
      { data: [houseRow], error: null },
    );
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useUserHouses('user-1'), { wrapper: Wrapper });
    
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(1);
  });

  test('retorna lista vazia quando userId não definido', () => {
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useUserHouses(null), { wrapper: Wrapper });
    
    expect(result.current.fetchStatus).toBe('idle');
  });

  test('retorna lista vazia quando não há memberships', async () => {
    supabaseTest.setNextResult([], null);
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useUserHouses('user-1'), { wrapper: Wrapper });
    
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(0);
  });
});

describe('useHouseMembers', () => {
  beforeEach(() => {
    supabaseTest.reset();
  });

  test('retorna membros quando houseId definido', async () => {
    supabaseTest.setNextResult([memberWithUser], null);
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useHouseMembers('house-1'), { wrapper: Wrapper });
    
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(1);
  });

  test('desabilita query sem houseId', () => {
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useHouseMembers(null), { wrapper: Wrapper });
    
    expect(result.current.fetchStatus).toBe('idle');
  });
});

describe('useCreateHouse', () => {
  beforeEach(() => {
    supabaseTest.reset();
  });

  test('invalida houses após criar', async () => {
    (supabaseTest.client.rpc as jest.Mock).mockResolvedValue({
      data: houseRow,
      error: null,
    });
    
    const { Wrapper, client } = createWrapper();
    const invalidate = jest.spyOn(client, 'invalidateQueries');
    
    const { result } = renderHook(() => useCreateHouse('user-1'), { wrapper: Wrapper });
    
    await result.current.mutateAsync({
      name: 'Nova Casa',
      creatorUserId: 'user-1',
    });
    
    await waitFor(() => {
      expect(invalidate).toHaveBeenCalledWith({ queryKey: ['houses', 'user-1'] });
    });
  });
});

describe('useJoinHouse', () => {
  beforeEach(() => {
    supabaseTest.reset();
  });

  test('invalida houses após entrar', async () => {
    supabaseTest.enqueueResults(
      { data: houseRow, error: null },
      { data: null, error: null },
      { data: null, error: null },
    );
    
    const { Wrapper, client } = createWrapper();
    const invalidate = jest.spyOn(client, 'invalidateQueries');
    
    const { result } = renderHook(() => useJoinHouse('user-1'), { wrapper: Wrapper });
    
    await result.current.mutateAsync({ inviteCode: 'ABC123' });
    
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['houses', 'user-1'] });
  });

  test('lança erro quando userId não definido', async () => {
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useJoinHouse(null), { wrapper: Wrapper });
    
    await expect(result.current.mutateAsync({ inviteCode: 'ABC123' })).rejects.toThrow(
      'Usuário não autenticado.',
    );
  });
});

describe('useLeaveHouse', () => {
  beforeEach(() => {
    supabaseTest.reset();
  });

  test('invalida queries após sair', async () => {
    supabaseTest.setNextResult(null, null);
    
    const { Wrapper, client } = createWrapper();
    const invalidate = jest.spyOn(client, 'invalidateQueries');
    
    const { result } = renderHook(() => useLeaveHouse('house-1', 'user-1'), { wrapper: Wrapper });
    
    await result.current.mutateAsync();
    
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['house-members', 'house-1'] });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['houses', 'user-1'] });
  });

  test('lança erro quando userId ou houseId não definido', async () => {
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useLeaveHouse(null, 'user-1'), { wrapper: Wrapper });
    
    await expect(result.current.mutateAsync()).rejects.toThrow('Casa ou usuário inválido.');
  });
});

describe('useUpdateMemberRole', () => {
  beforeEach(() => {
    supabaseTest.reset();
  });

  test('invalida queries após atualizar role', async () => {
    supabaseTest.setNextResult(null, null);
    
    const { Wrapper, client } = createWrapper();
    const invalidate = jest.spyOn(client, 'invalidateQueries');
    
    const { result } = renderHook(
      () => useUpdateMemberRole('house-1', 'user-1'),
      { wrapper: Wrapper },
    );
    
    await result.current.mutateAsync({ membershipId: 'm1', role: 'ADMIN' });
    
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['house-members', 'house-1'] });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['houses', 'user-1'] });
  });
});
