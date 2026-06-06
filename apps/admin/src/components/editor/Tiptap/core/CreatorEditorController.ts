import type { Editor, JSONContent } from '@tiptap/react';
import { createSuggestionContent, getEditorPayload, insertMaterialContent } from './content';
import type { AiSuggestion, CreatorEditorHandle, EditorChangePayload, EditorMaterial } from '../type/editor-types';

interface CreatorEditorControllerOptions {
  editor: Editor | null;
  draftId: string;
  projectTitle: string;
}

export class CreatorEditorController implements CreatorEditorHandle {
  private readonly editor: Editor | null;

  private readonly draftId: string;

  private readonly projectTitle: string;

  constructor({ editor, draftId, projectTitle }: CreatorEditorControllerOptions) {
    this.editor = editor;
    this.draftId = draftId;
    this.projectTitle = projectTitle;
  }

  getEditor(): Editor | null {
    return this.editor;
  }

  getPayload(): EditorChangePayload | null {
    if (!this.editor) return null;

    return getEditorPayload(this.editor, this.draftId, this.projectTitle);
  }

  focus(): void {
    this.editor?.chain().focus().run();
  }

  clear(): void {
    this.editor?.chain().focus().clearContent().run();
  }

  insertContent(content: JSONContent | JSONContent[] | string): void {
    this.editor?.chain().focus().insertContent(content).run();
  }

  insertSuggestion(suggestion: AiSuggestion): void {
    this.insertContent(createSuggestionContent(suggestion));
  }

  replaceWithSuggestion(suggestion: AiSuggestion): void {
    this.editor?.commands.setContent({
      type: 'doc',
      content: createSuggestionContent(suggestion),
    });
  }

  insertMaterial(material: EditorMaterial): void {
    this.insertContent(insertMaterialContent(material));
  }
}
