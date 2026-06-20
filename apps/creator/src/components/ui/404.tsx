import { Button, Result } from 'antd';
import { ArrowLeftOutlined, HomeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-dvh items-center justify-center bg-[#f8f8f8] px-4 text-gray-950">
      <Result
        status="404"
        title="404"
        subTitle="页面不存在或已被移动。"
        extra={
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
              返回上一页
            </Button>
            <Button type="primary" icon={<HomeOutlined />} onClick={() => navigate('/home', { replace: true })}>
              回到首页
            </Button>
          </div>
        }
      />
    </div>
  );
}

export default NotFoundPage;
