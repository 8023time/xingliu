import type { Editor, JSONContent } from '@tiptap/react';

export type { Editor, JSONContent };

export type EditorSaveStatus = 'idle' | 'dirty' | 'saving' | 'saved' | 'error';

export type EditorMaterialType = 'image' | 'document' | 'audio' | 'video' | 'link' | 'archive';

export type EditorMaterialStatus = 'pending' | 'parsing' | 'ready' | 'failed';

export interface EditorMaterial {
  id: string;
  name: string;
  type: EditorMaterialType;
  status: EditorMaterialStatus;
  url?: string;
  summary?: string;
  keywords?: string[];
}

export interface AiSuggestion {
  id: string;
  title: string;
  body: string;
  tags?: string[];
}

export interface QualitySignal {
  id: string;
  label: string;
  score: number;
  risk: 'safe' | 'warning' | 'blocked';
  message: string;
}

export interface EditorChangePayload {
  draftId: string;
  projectTitle: string;
  json: JSONContent;
  html: string;
  text: string;
  updatedAt: number;
}

export interface CreatorEditorHandle {
  getEditor: () => Editor | null;
  getPayload: () => EditorChangePayload | null;
  focus: () => void;
  clear: () => void;
  insertContent: (content: JSONContent | JSONContent[] | string) => void;
  insertSuggestion: (suggestion: AiSuggestion) => void;
  replaceWithSuggestion: (suggestion: AiSuggestion) => void;
  insertMaterial: (material: EditorMaterial) => void;
}
