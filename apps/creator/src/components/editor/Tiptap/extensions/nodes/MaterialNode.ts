import { mergeAttributes, Node } from '@tiptap/react';

export const MaterialNode = Node.create({
  name: 'materialBlock',
  group: 'block',
  atom: true,
  selectable: true,

  addAttributes() {
    return {
      materialId: {
        default: null,
      },
      name: {
        default: '未命名素材',
      },
      materialType: {
        default: 'document',
      },
      status: {
        default: 'ready',
      },
      url: {
        default: '',
      },
      summary: {
        default: '',
      },
    };
  },

  parseHTML() {
    return [{ tag: 'figure[data-type="material-block"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    const name = HTMLAttributes.name || '未命名素材';
    const summary = HTMLAttributes.summary || '暂无素材摘要';

    return [
      'figure',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'material-block',
        class: 'creator-editor-material-node',
      }),
      ['figcaption', { class: 'creator-editor-material-title' }, name],
      ['p', { class: 'creator-editor-material-summary' }, summary],
    ];
  },
});
