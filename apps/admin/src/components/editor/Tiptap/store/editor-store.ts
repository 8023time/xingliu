import { create } from 'zustand';
import type { EditorSaveStatus } from '@/components/editor/Tiptap/type/editor-types';

interface CreatorEditorState {
  saveStatus: EditorSaveStatus;
  lastSavedAt: number | null;
  setSaveStatus: (saveStatus: EditorSaveStatus) => void;
  markSaved: (timestamp: number) => void;
  resetEditorState: () => void;
}

export const useCreatorEditorStore = create<CreatorEditorState>((set) => ({
  saveStatus: 'idle',
  lastSavedAt: null,
  setSaveStatus: (saveStatus) => set({ saveStatus }),
  markSaved: (timestamp) => set({ saveStatus: 'saved', lastSavedAt: timestamp }),
  resetEditorState: () => set({ saveStatus: 'idle', lastSavedAt: null }),
}));
