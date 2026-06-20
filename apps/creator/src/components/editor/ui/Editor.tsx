import { forwardRef, useImperativeHandle, useMemo, useState, type ForwardedRef } from 'react';
import { EditorContent } from '@tiptap/react';
import { Button, Empty, Input } from 'antd';
import { LeftOutlined } from '@ant-design/icons';
import { CreatorEditorController } from '@Tip/core/CreatorEditorController';
import { useEditorAutoSave } from '@Tip/core/useEditorAutoSave';
import { useCreatorEditorCounts, useCreatorTiptapEditor } from '@Tip/core/useCreatorTiptapEditor';
import { useCreatorEditorStore } from '../Tiptap/store/editor-store';
import type {
  CreatorEditorHandle,
  EditorChangePayload,
  JSONContent,
} from '@/components/editor/Tiptap/type/editor-types';
import { EditorStatusBar } from './StatusBar';
import { EditorToolbar } from './Toolbar';
import './editor.css';

export interface CreatorEditorProps {
  className?: string;
  editorOptions: {
    projectTitle?: string | undefined;
    initialContent?: JSONContent | string;
    readOnly?: boolean;
    draftId?: string;
    saveDelay?: number;
  };
  editorCallbacks: {
    onBack?: () => void;
    onChange?: (payload: EditorChangePayload) => void;
    onAutoSave?: (payload: EditorChangePayload) => Promise<void> | void;
    onProjectTitleChange?: (title: string) => void;
  };
}

const DEFAULT_CONTENT: JSONContent = {
  type: 'doc',
  content: [
    {
      type: 'paragraph',
    },
  ],
};

function CreatorEditor(
  {
    className,
    editorOptions: {
      projectTitle,
      initialContent = DEFAULT_CONTENT,
      readOnly = false,
      draftId = 'local-draft',
      saveDelay = 2000,
    },
    editorCallbacks: { onBack, onChange, onAutoSave, onProjectTitleChange },
  }: CreatorEditorProps,
  ref: ForwardedRef<CreatorEditorHandle>,
) {
  const [title, setTitle] = useState(projectTitle ?? '');
  const { saveStatus, lastSavedAt } = useCreatorEditorStore();

  const editor = useCreatorTiptapEditor({ initialContent, readOnly });

  useEditorAutoSave({
    draftId,
    editor,
    projectTitle: title,
    delay: saveDelay,
    enabled: !readOnly,
    onChange,
    onAutoSave,
  });

  const editorCounts = useCreatorEditorCounts(editor);

  const summary = useMemo(
    () => ({
      wordCount: editorCounts?.wordCount ?? 0,
      characterCount: editorCounts?.characterCount ?? 0,
    }),
    [editorCounts?.characterCount, editorCounts?.wordCount],
  );

  useImperativeHandle(ref, () => new CreatorEditorController({ editor, draftId, projectTitle: title }), [
    draftId,
    editor,
    title,
  ]);

  const handleTitleChange = (value: string) => {
    setTitle(value);
    onProjectTitleChange?.(value);
  };

  return (
    <section className={['creator-editor-core', className].filter(Boolean).join(' ')}>
      <header className="creator-editor-topbar">
        <Button type="text" icon={<LeftOutlined />} onClick={onBack}>
          返回
        </Button>
        <EditorToolbar editor={editor} readOnly={readOnly} />
      </header>

      <main className="creator-editor-stage">
        <div className="creator-editor-paper">
          <Input
            aria-label="内容标题"
            value={title}
            onChange={(event) => handleTitleChange(event.target.value)}
            placeholder="输入标题"
            variant="borderless"
            className="creator-editor-title-input"
            disabled={readOnly}
          />
          <p className="creator-editor-title-helper">输入文字，内容将自动保存</p>
          {editor ? (
            <EditorContent editor={editor} />
          ) : (
            <Empty description="编辑器加载中" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          )}
        </div>
      </main>

      <EditorStatusBar status={saveStatus} lastSavedAt={lastSavedAt} summary={summary} />
    </section>
  );
}

export default forwardRef(CreatorEditor);
