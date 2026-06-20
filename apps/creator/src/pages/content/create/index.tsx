import { Spin } from 'antd';
import { CreateContentProvider, useCreateContentContext } from './CreateContentContext';
import { LeftSidebar } from './LeftSidebar';
import { RichTextEditorPanel } from './RichTextEditorPanel';

export default function CreateContentPage() {
  return (
    <CreateContentProvider>
      <CreateContentLayout />
    </CreateContentProvider>
  );
}

function CreateContentLayout() {
  const { loading, content } = useCreateContentContext();

  if (loading || !content) {
    return <Spin fullscreen tip="正在准备内容草稿" />;
  }

  return (
    <main className="h-[calc(100vh-79px)] overflow-hidden bg-[#f8f8f8]">
      <div className="grid h-full min-h-0 grid-cols-1 gap-5 xl:grid-cols-[400px_minmax(0,1fr)]">
        <LeftSidebar />
        <RichTextEditorPanel />
      </div>
    </main>
  );
}
