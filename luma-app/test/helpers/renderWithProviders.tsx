import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

interface AuthStoreState {
  user: { id: string; email: string } | null;
  houseId: string | null;
  loading: boolean;
  initialized: boolean;
}

interface WrapperOptions {
  authState?: Partial<AuthStoreState>;
  queryClient?: QueryClient;
}

const defaultAuthState: AuthStoreState = {
  user: { id: 'test-user-id', email: 'test@example.com' },
  houseId: 'test-house-id',
  loading: false,
  initialized: true,
};

export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

function createWrapper(options: WrapperOptions = {}) {
  const queryClient = options.queryClient ?? createTestQueryClient();
  const authState = { ...defaultAuthState, ...options.authState };

  const mockAuthStore = {
    getState: () => authState,
    setState: jest.fn(),
    subscribe: jest.fn(() => jest.fn()),
  };

  jest.doMock('@/stores/auth.store', () => ({
    useAuthStore: Object.assign(
      (selector?: (state: AuthStoreState) => unknown) =>
        selector ? selector(authState) : authState,
      mockAuthStore,
    ),
  }));

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  authState?: Partial<AuthStoreState>;
  queryClient?: QueryClient;
}

export function renderWithProviders(
  ui: ReactElement,
  options: CustomRenderOptions = {},
): ReturnType<typeof render> & { queryClient: QueryClient } {
  const { authState, queryClient: providedQueryClient, ...renderOptions } = options;
  const queryClient = providedQueryClient ?? createTestQueryClient();

  const result = render(ui, {
    wrapper: createWrapper({ authState, queryClient }),
    ...renderOptions,
  });

  return {
    ...result,
    queryClient,
  };
}

export function mockAuthStore(state: Partial<AuthStoreState> = {}) {
  const fullState = { ...defaultAuthState, ...state };

  return {
    useAuthStore: Object.assign(
      (selector?: (state: AuthStoreState) => unknown) =>
        selector ? selector(fullState) : fullState,
      {
        getState: () => fullState,
        setState: jest.fn(),
        subscribe: jest.fn(() => jest.fn()),
      },
    ),
  };
}

export { defaultAuthState };
