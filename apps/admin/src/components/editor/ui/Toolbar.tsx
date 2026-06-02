import type { ReactNode } from 'react';
import type { Editor } from '@/components/editor/Tiptap/type/editor-types';
import { Button, Divider, Space, Tooltip } from 'antd';
import {
  BoldOutlined,
  ItalicOutlined,
  LinkOutlined,
  OrderedListOutlined,
  PictureOutlined,
  RedoOutlined,
  UndoOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons';

interface EditorToolbarProps {
  editor: Editor | null;
  readOnly?: boolean;
}

export function EditorToolbar({ editor, readOnly = false }: EditorToolbarProps) {
  const disabled = !editor || readOnly;

  const handleSetLink = () => {
    if (!editor) return;

    const previousUrl = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('请输入链接地址', previousUrl ?? 'https://');

    if (url === null) return;

    if (!url) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  const handleInsertImage = () => {
    if (!editor) return;

    const src = window.prompt('请输入图片地址');
    if (!src) return;

    editor.chain().focus().setImage({ src, alt: '内容图片' }).run();
  };

  return (
    <div className="creator-editor-toolbar" aria-label="编辑器工具栏">
      <Space wrap size={4} split={<Divider type="vertical" />}>
        <Space size={4}>
          <ToolbarButton
            title="加粗"
            icon={<BoldOutlined />}
            disabled={disabled}
            active={!!editor?.isActive('bold')}
            onClick={() => editor?.chain().focus().toggleBold().run()}
          />
          <ToolbarButton
            title="斜体"
            icon={<ItalicOutlined />}
            disabled={disabled}
            active={!!editor?.isActive('italic')}
            onClick={() => editor?.chain().focus().toggleItalic().run()}
          />
        </Space>

        <Space size={4}>
          <Button disabled={disabled} onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}>
            H2
          </Button>
          <Button disabled={disabled} onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}>
            H3
          </Button>
        </Space>

        <Space size={4}>
          <ToolbarButton
            title="无序列表"
            icon={<UnorderedListOutlined />}
            disabled={disabled}
            active={!!editor?.isActive('bulletList')}
            onClick={() => editor?.chain().focus().toggleBulletList().run()}
          />
          <ToolbarButton
            title="有序列表"
            icon={<OrderedListOutlined />}
            disabled={disabled}
            active={!!editor?.isActive('orderedList')}
            onClick={() => editor?.chain().focus().toggleOrderedList().run()}
          />
        </Space>

        <Space size={4}>
          <ToolbarButton title="插入链接" icon={<LinkOutlined />} disabled={disabled} onClick={handleSetLink} />
          <ToolbarButton title="插入图片" icon={<PictureOutlined />} disabled={disabled} onClick={handleInsertImage} />
        </Space>

        <Space size={4}>
          <ToolbarButton
            title="撤销"
            icon={<UndoOutlined />}
            disabled={disabled || !editor?.can().undo()}
            onClick={() => editor?.chain().focus().undo().run()}
          />
          <ToolbarButton
            title="重做"
            icon={<RedoOutlined />}
            disabled={disabled || !editor?.can().redo()}
            onClick={() => editor?.chain().focus().redo().run()}
          />
        </Space>
      </Space>
    </div>
  );
}

interface ToolbarButtonProps {
  title: string;
  icon: ReactNode;
  disabled?: boolean;
  active?: boolean;
  onClick: () => void;
}

function ToolbarButton({ title, icon, disabled = false, active = false, onClick }: ToolbarButtonProps) {
  return (
    <Tooltip title={title}>
      <Button
        aria-label={title}
        icon={icon}
        disabled={disabled}
        type={active ? 'primary' : 'default'}
        onClick={onClick}
      />
    </Tooltip>
  );
}
