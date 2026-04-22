import { useDashboardSearchStore } from '@/stores/dashboard-search.store';

describe('useDashboardSearchStore', () => {
  beforeEach(() => {
    useDashboardSearchStore.setState({ query: '' });
  });

  test('inicia com query vazia', () => {
    expect(useDashboardSearchStore.getState().query).toBe('');
  });

  test('setQuery atualiza a query', () => {
    useDashboardSearchStore.getState().setQuery('tarefa');
    expect(useDashboardSearchStore.getState().query).toBe('tarefa');
  });

  test('setQuery pode limpar a query', () => {
    useDashboardSearchStore.getState().setQuery('busca');
    useDashboardSearchStore.getState().setQuery('');
    expect(useDashboardSearchStore.getState().query).toBe('');
  });

  test('setQuery preserva espaços e caracteres especiais', () => {
    useDashboardSearchStore.getState().setQuery('  busca com espaços  ');
    expect(useDashboardSearchStore.getState().query).toBe('  busca com espaços  ');
  });

  test('múltiplas atualizações mantêm estado correto', () => {
    const { setQuery } = useDashboardSearchStore.getState();
    
    setQuery('primeiro');
    expect(useDashboardSearchStore.getState().query).toBe('primeiro');
    
    setQuery('segundo');
    expect(useDashboardSearchStore.getState().query).toBe('segundo');
    
    setQuery('');
    expect(useDashboardSearchStore.getState().query).toBe('');
  });
});
