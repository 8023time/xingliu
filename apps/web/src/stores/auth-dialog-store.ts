'use client';

import { create } from 'zustand';

type AuthMode = 'login' | 'register';

interface AuthDialogState {
  open: boolean;
  mode: AuthMode;
  openAuth: (mode?: AuthMode) => void;
  closeAuth: () => void;
  setMode: (mode: AuthMode) => void;
}

export const useAuthDialogStore = create<AuthDialogState>((set) => ({
  open: false,
  mode: 'login',
  openAuth: (mode = 'login') => set({ open: true, mode }),
  closeAuth: () => set({ open: false }),
  setMode: (mode) => set({ mode }),
}));
