import { lazy, Suspense } from 'react';
import { Flex, Input, Spin } from 'antd';
import { useCreateContentContext } from './CreateContentContext';

const CreatorEditor = lazy(() => import('@/components/editor/ui/Editor'));

export function RichTextEditorPanel() {
  const { content, editorRef, editorKey, initialTitle, initialContent, summary, actions } = useCreateContentContext();
  if (!content) return null;

  return (
    <section className="h-full overflow-hidden rounded-xl bg-[#f8f8f8]">
      <Flex vertical className="h-full">
        <Input.TextArea
          aria-label="内容摘要"
          value={summary}
          maxLength={1000}
          autoSize={{ minRows: 2, maxRows: 3 }}
          placeholder="输入内容摘要"
          className="mb-3 shrink-0"
          onChange={(event) => actions.handleSummaryChange(event.target.value)}
        />
        <div className="min-h-0 flex-1 overflow-hidden">
          <Suspense
            fallback={
              <div className="grid h-full place-items-center">
                <Spin tip="正在加载编辑器" />
              </div>
            }
          >
            <CreatorEditor
              key={editorKey}
              ref={editorRef}
              editorOptions={{
                draftId: content.id,
                projectTitle: initialTitle,
                initialContent,
              }}
              editorCallbacks={{
                onBack: actions.leave,
                onChange: actions.handleEditorChange,
                onAutoSave: actions.handleEditorAutoSave,
                onProjectTitleChange: actions.handleProjectTitleChange,
              }}
            />
          </Suspense>
        </div>
      </Flex>
    </section>
  );
}
