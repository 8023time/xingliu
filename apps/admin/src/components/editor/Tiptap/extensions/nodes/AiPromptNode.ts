import { mergeAttributes, Node } from '@tiptap/react';

export const AiPromptNode = Node.create({
  name: 'aiPrompt',
  group: 'block',
  content: 'block+',
  defining: true,
  selectable: true,

  addAttributes() {
    return {
      promptId: {
        default: null,
      },
      status: {
        default: 'pending',
      },
      title: {
        default: 'AI 生成候选',
      },
    };
  },

  parseHTML() {
    return [{ tag: 'section[data-type="ai-prompt"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'section',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'ai-prompt',
        class: 'creator-editor-ai-node',
      }),
      ['header', { class: 'creator-editor-ai-node-header' }, HTMLAttributes.title || 'AI 生成候选'],
      ['div', { class: 'creator-editor-ai-node-body' }, 0],
    ];
  },
});
