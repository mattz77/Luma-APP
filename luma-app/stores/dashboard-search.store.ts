import { create } from 'zustand';

export interface DashboardSearchState {
  query: string;
  setQuery: (query: string) => void;
}

export const useDashboardSearchStore = create<DashboardSearchState>((set) => ({
  query: '',
  setQuery: (query) => set({ query }),
}));
