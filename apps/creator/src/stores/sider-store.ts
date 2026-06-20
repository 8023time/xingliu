import { create } from 'zustand';

export interface SiderState {
  collapsed: boolean;
  manualCollapsed: boolean | null;
  applyAutoCollapsed: (collapsed: boolean) => void;
  setManualCollapsed: (collapsed: boolean) => void;
  clearManualCollapsed: () => void;
}

const useSiderStore = create<SiderState>((set) => ({
  collapsed: false, // 侧边栏当前的折叠状态
  manualCollapsed: null, // 用户手动设置的折叠状态，null 表示未设置

  // 根据自动折叠状态和用户手动设置的状态来更新 collapsed
  applyAutoCollapsed: (collapsed) =>
    set((state) => ({
      collapsed: state.manualCollapsed ?? collapsed,
    })),

  // 用户手动设置折叠状态，并覆盖自动折叠状态
  setManualCollapsed: (collapsed) =>
    set({
      collapsed,
      manualCollapsed: collapsed,
    }),

  // 清除用户手动设置，恢复自动折叠状态的控制
  clearManualCollapsed: () =>
    set({
      manualCollapsed: null,
    }),
}));

export { useSiderStore };
