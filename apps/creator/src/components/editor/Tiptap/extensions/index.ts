import CharacterCount from '@tiptap/extension-character-count';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import StarterKit from '@tiptap/starter-kit';
import { AiPromptNode } from './nodes/AiPromptNode';
import { MaterialNode } from './nodes/MaterialNode';

export const editorExtensions = [
  StarterKit.configure({
    heading: {
      levels: [2, 3],
    },
  }),
  Image.configure({
    inline: false,
    allowBase64: true,
    HTMLAttributes: {
      class: 'creator-editor-image',
    },
  }),
  Link.configure({
    openOnClick: false,
    autolink: true,
    linkOnPaste: true,
    HTMLAttributes: {
      class: 'creator-editor-link',
      rel: 'noopener noreferrer',
      target: '_blank',
    },
  }),
  TextAlign.configure({
    types: ['heading', 'paragraph'],
  }),
  Placeholder.configure({
    placeholder: '输入正文，或从右侧 AI 建议、素材摘要中写入内容。',
  }),
  CharacterCount.configure({
    limit: 20000,
  }),
  AiPromptNode,
  MaterialNode,
];
