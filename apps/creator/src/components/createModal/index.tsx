import { FileTextOutlined, PictureOutlined, BulbOutlined, BookOutlined } from '@ant-design/icons';
import { Card, Flex, Modal, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';

interface CreateModalProps {
  open: boolean;
  onClose: () => void;
}

export default function CreateModal({ open, onClose }: CreateModalProps) {
  const navigate = useNavigate();

  const createTypes = [
    {
      title: '长文章',
      description: '适用于博客、技术文章、深度内容',
      icon: <FileTextOutlined />,
      path: '/content/create?type=article',
    },
    {
      title: '图文内容',
      description: '适用于种草、社交媒体内容',
      icon: <PictureOutlined />,
      path: '/content/create?type=image-text',
    },
    {
      title: '短笔记',
      description: '适用于灵感记录和短内容',
      icon: <BookOutlined />,
      path: '/content/create?type=note',
    },
    {
      title: '创意构思',
      description: 'AI 帮你生成选题和大纲',
      icon: <BulbOutlined />,
      path: '/content/create?type=idea',
    },
  ];

  return (
    <Modal open={open} footer={null} width={720} onCancel={onClose} title="创建内容" centered>
      <Typography.Paragraph type="secondary">选择一个内容类型开始创作</Typography.Paragraph>

      <div className="grid grid-cols-2 gap-4">
        {createTypes.map((item) => (
          <Card
            key={item.title}
            hoverable
            onClick={() => {
              onClose();
              navigate(item.path);
            }}
          >
            <Flex gap={12}>
              <div className="text-xl">{item.icon}</div>

              <div>
                <Typography.Title level={5}>{item.title}</Typography.Title>
                <Typography.Text type="secondary">{item.description}</Typography.Text>
              </div>
            </Flex>
          </Card>
        ))}
      </div>
    </Modal>
  );
}
