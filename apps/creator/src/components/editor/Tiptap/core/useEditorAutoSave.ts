import { useEffect, useRef } from 'react';
import type { Editor } from '@tiptap/react';
import { useCreatorEditorStore } from '../store/editor-store';
import { getEditorPayload } from './content';
import type { EditorChangePayload } from '../type/editor-types';

interface UseEditorAutoSaveOptions {
  draftId: string;
  editor: Editor | null;
  projectTitle: string;
  delay: number;
  enabled: boolean;
  onChange?: (payload: EditorChangePayload) => void;
  onAutoSave?: (payload: EditorChangePayload) => Promise<void> | void;
}

export function useEditorAutoSave({
  draftId,
  editor,
  projectTitle,
  delay,
  enabled,
  onChange,
  onAutoSave,
}: UseEditorAutoSaveOptions) {
  const timerRef = useRef<ReturnType<typeof window.setTimeout> | null>(null);
  const latestTitleRef = useRef(projectTitle);
  const latestChangeRef = useRef(onChange);
  const latestAutoSaveRef = useRef(onAutoSave);

  useEffect(() => {
    latestTitleRef.current = projectTitle;
    latestChangeRef.current = onChange;
    latestAutoSaveRef.current = onAutoSave;
  }, [onAutoSave, onChange, projectTitle]);

  useEffect(() => {
    if (!editor || !enabled) return undefined;

    const clearSaveTimer = () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };

    const handleUpdate = async () => {
      const payload = getEditorPayload(editor, draftId, latestTitleRef.current);
      latestChangeRef.current?.(payload);
      useCreatorEditorStore.getState().setSaveStatus('dirty');

      clearSaveTimer();
      timerRef.current = window.setTimeout(async () => {
        useCreatorEditorStore.getState().setSaveStatus('saving');

        try {
          await latestAutoSaveRef.current?.(payload);
          useCreatorEditorStore.getState().markSaved(Date.now());
        } catch {
          useCreatorEditorStore.getState().setSaveStatus('error');
        }
      }, delay);
    };

    editor.on('update', handleUpdate);

    return () => {
      clearSaveTimer();
      editor.off('update', handleUpdate);
    };
  }, [delay, draftId, editor, enabled]);
}
