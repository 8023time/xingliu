import { Button, Result } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { useRouteError } from 'react-router-dom';

export default function RouteError() {
  const error = useRouteError();
  const message = error instanceof Error ? error.message : '页面加载失败，请刷新后重试';

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <Result
        status="warning"
        title="页面加载遇到问题"
        subTitle={message}
        extra={
          <Button type="primary" icon={<ReloadOutlined />} onClick={() => window.location.reload()}>
            重新加载
          </Button>
        }
      />
    </div>
  );
}
