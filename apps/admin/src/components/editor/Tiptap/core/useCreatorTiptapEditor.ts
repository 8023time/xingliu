import { useEditor, useEditorState, type JSONContent } from '@tiptap/react';
import { editorExtensions } from '../extensions';

interface UseCreatorTiptapEditorOptions {
  initialContent: JSONContent | string;
  readOnly: boolean;
}

export function useCreatorTiptapEditor({ initialContent, readOnly }: UseCreatorTiptapEditorOptions) {
  return useEditor({
    extensions: editorExtensions,
    content: initialContent,
    editable: !readOnly,
    editorProps: {
      attributes: {
        class: 'creator-editor-content',
        'aria-label': '内容编辑器',
      },
    },
  });
}

export function useCreatorEditorCounts(editor: ReturnType<typeof useCreatorTiptapEditor>) {
  return useEditorState({
    editor,
    selector: ({ editor }) => ({
      wordCount: editor?.storage.characterCount?.words?.() ?? 0,
      characterCount: editor?.storage.characterCount?.characters?.() ?? 0,
    }),
  });
}
