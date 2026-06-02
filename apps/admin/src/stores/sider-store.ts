import { create } from 'zustand';

export interface SiderState {
  collapsed: boolean;
  previousCollapsed: boolean | null;
  setCollapsed: (collapsed: boolean) => void;
  toggleCollapsed: () => void;
  setPreviousCollapsed: (collapsed: boolean) => void;
  restoreCollapsed: () => void;
}

const useSiderStore = create<SiderState>((set) => ({
  collapsed: false,
  previousCollapsed: null,

  setCollapsed: (collapsed) => set({ collapsed }),
  toggleCollapsed: () => set((state) => ({ collapsed: !state.collapsed })),
  setPreviousCollapsed: (collapsed) =>
    set((state) => ({
      previousCollapsed: state.previousCollapsed ?? collapsed,
    })),
  restoreCollapsed: () =>
    set((state) => ({
      collapsed: state.previousCollapsed ?? state.collapsed,
      previousCollapsed: null,
    })),
}));

export { useSiderStore };
