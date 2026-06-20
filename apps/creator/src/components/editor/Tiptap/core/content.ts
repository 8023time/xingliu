import type { Editor, JSONContent } from '@tiptap/react';
import type { AiSuggestion, EditorChangePayload, EditorMaterial } from '../type/editor-types';

export function getEditorPayload(editor: Editor, draftId: string, projectTitle: string): EditorChangePayload {
  return {
    draftId,
    projectTitle,
    json: editor.getJSON(),
    html: editor.getHTML(),
    text: editor.getText(),
    updatedAt: Date.now(),
  };
}

export function createSuggestionContent(suggestion: AiSuggestion): JSONContent[] {
  return [
    {
      type: 'heading',
      attrs: { level: 2 },
      content: [{ type: 'text', text: suggestion.title }],
    },
    ...createParagraphs(suggestion.body),
  ];
}

export function insertMaterialContent(material: EditorMaterial): JSONContent {
  return {
    type: 'materialBlock',
    attrs: {
      materialId: material.id,
      name: material.name,
      materialType: material.type,
      status: material.status,
      url: material.url ?? '',
      summary: material.summary ?? '',
    },
  };
}

function createParagraphs(text: string): JSONContent[] {
  return text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => ({
      type: 'paragraph',
      content: [{ type: 'text', text: line }],
    }));
}
