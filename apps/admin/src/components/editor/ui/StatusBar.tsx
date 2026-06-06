import type { ReactNode } from 'react';
import { Badge, Button, Space, Tooltip } from 'antd';
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  LoadingOutlined,
} from '@ant-design/icons';
import type { EditorSaveStatus } from '@/components/editor/Tiptap/type/editor-types';

interface EditorStatusBarProps {
  status: EditorSaveStatus;
  lastSavedAt: number | null;
  summary: {
    wordCount: number;
    characterCount: number;
  };
}

const statusMeta: Record<
  EditorSaveStatus,
  { text: string; color: 'default' | 'processing' | 'success' | 'error'; icon: ReactNode }
> = {
  idle: {
    text: '等待编辑',
    color: 'default',
    icon: <ClockCircleOutlined />,
  },
  dirty: {
    text: '有未保存修改',
    color: 'processing',
    icon: <ClockCircleOutlined />,
  },
  saving: {
    text: '保存中',
    color: 'processing',
    icon: <LoadingOutlined />,
  },
  saved: {
    text: '已自动保存',
    color: 'success',
    icon: <CheckCircleOutlined />,
  },
  error: {
    text: '保存失败',
    color: 'error',
    icon: <ExclamationCircleOutlined />,
  },
};

export function EditorStatusBar({ status, lastSavedAt, summary }: EditorStatusBarProps) {
  const meta = statusMeta[status];

  return (
    <footer className="creator-editor-status">
      <Space size={16} wrap>
        <Badge status={meta.color} text={meta.text} />
        <span>字数：{summary.characterCount}</span>
        <span>{summary.wordCount} 词</span>
      </Space>

      <Space size={8} className="creator-editor-status-actions">
        <span className="creator-editor-status-time">{lastSavedAt ? formatSavedTime(lastSavedAt) : '尚未保存'}</span>
        {status === 'error' && (
          <Tooltip title="再次编辑会重新触发自动保存">
            <Button size="small" danger icon={meta.icon}>
              点击重试
            </Button>
          </Tooltip>
        )}
      </Space>
    </footer>
  );
}

function formatSavedTime(timestamp: number) {
  return `保存于 ${new Date(timestamp).toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })}`;
}
