import { useMemo, useState, type ReactNode } from 'react';
import { InfoCircleOutlined } from '@ant-design/icons';
import { Button, Card, Descriptions, Form, Input, Modal, Space, Tooltip, message } from 'antd';
import type { Rule } from 'antd/es/form';
import BaseInfoCard from './baseInfoCard';
import { updateUserInfoApi } from '@/api/user';
import { useAuthStore } from '@/stores/user-store';
import type { AuthUser, UpdateUserInfoRequest } from '@xingliu/shared/user';

interface UserInfoValues {
  id: string;
  username: string;
  phone: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

interface FieldConfig {
  name: keyof UserInfoValues;
  label: string;
  tip?: string;
  copyable?: boolean;
  disabled?: boolean;
  rules?: Rule[];
}

const USER_FIELDS: FieldConfig[] = [
  {
    name: 'id',
    label: '用户 ID',
    tip: '系统唯一标识，通常用于排查账号问题。',
    copyable: true,
    disabled: true,
  },
  {
    name: 'username',
    label: '用户名',
    rules: [
      { required: true, message: '请输入用户名' },
      { max: 20, message: '用户名不能超过 20 个字符' },
    ],
  },
  {
    name: 'phone',
    label: '手机号',
    rules: [
      { required: true, message: '请输入手机号' },
      { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' },
    ],
  },
  {
    name: 'email',
    label: '邮箱',
    rules: [{ type: 'email', message: '请输入正确的邮箱' }],
  },
  {
    name: 'createdAt',
    label: '创建时间',
    tip: '用户首次注册的时间。',
    disabled: true,
  },
  {
    name: 'updatedAt',
    label: '更新时间',
    tip: '用户信息最后一次修改的时间。',
    disabled: true,
  },
];

export default function InfoPage() {
  return (
    <Card className="h-full overflow-hidden">
      <div className="mx-auto w-full max-w-5xl">
        <PageSection title="基础信息" className="mb-8">
          <BaseInfoCard />
        </PageSection>

        <UserInfoSection />
      </div>
    </Card>
  );
}

function UserInfoSection() {
  const [form] = Form.useForm<UserInfoValues>();
  const { user, setUser } = useAuthStore();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const userInfo = useMemo(() => toUserInfoValues(user), [user]);

  const handleEdit = () => {
    form.setFieldsValue(userInfo);
    setEditing(true);
  };

  const closeEditor = () => {
    form.setFieldsValue(userInfo);
    setEditing(false);
  };

  const handleCancel = () => {
    if (!form.isFieldsTouched()) {
      closeEditor();
      return;
    }

    Modal.confirm({
      title: '确认放弃修改？',
      content: '当前表单内容尚未保存，取消后修改将丢失。',
      okText: '确认取消',
      cancelText: '继续编辑',
      onOk: closeEditor,
    });
  };

  const handleFinish = async (values: UserInfoValues) => {
    if (!user) {
      message.error('登录状态已失效，请重新登录');
      return;
    }

    const payload: UpdateUserInfoRequest = {
      username: values.username.trim(),
      phone: values.phone.trim(),
      email: values.email.trim() || undefined,
    };

    setSaving(true);
    try {
      const res = await updateUserInfoApi(payload);
      setUser(res.data);
      setEditing(false);
      message.success(res.message || '保存成功');
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageSection
      title="更多信息"
      extra={
        editing ? (
          <Space>
            <Button onClick={handleCancel} disabled={saving} className="rounded-md px-5 text-sm">
              取消
            </Button>
            <Button type="primary" loading={saving} onClick={() => form.submit()} className="rounded-md px-5 text-sm">
              保存
            </Button>
          </Space>
        ) : (
          <Button ghost type="primary" onClick={handleEdit} disabled={!user} className="rounded-md px-5 text-sm">
            编辑
          </Button>
        )
      }
    >
      <Card className="w-full" styles={{ body: { padding: 24 } }}>
        {editing ? (
          <Form form={form} layout="vertical" initialValues={userInfo} onFinish={handleFinish}>
            <div className="grid grid-cols-1 gap-x-8 md:grid-cols-2">
              {USER_FIELDS.map((field) => (
                <Form.Item
                  key={field.name}
                  name={field.name}
                  label={<LabelWithTip label={field.label} tip={field.tip} />}
                  rules={field.rules}
                >
                  <Input disabled={field.disabled || saving} />
                </Form.Item>
              ))}
            </div>
          </Form>
        ) : (
          <Descriptions column={{ xs: 1, md: 2 }} colon={false} layout="vertical" className="text-sm" size="large">
            {USER_FIELDS.map((field) => (
              <Descriptions.Item key={field.name} label={<LabelWithTip label={field.label} tip={field.tip} />}>
                {field.copyable && userInfo[field.name] ? (
                  <span className="break-all">{userInfo[field.name]}</span>
                ) : (
                  userInfo[field.name] || '-'
                )}
              </Descriptions.Item>
            ))}
          </Descriptions>
        )}
      </Card>
    </PageSection>
  );
}

function PageSection({
  title,
  extra,
  children,
  className = '',
}: {
  title: string;
  extra?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={className}>
      <div className="mb-4 flex items-center justify-between">
        <Title title={title} />
        {extra}
      </div>

      {children}
    </section>
  );
}

function LabelWithTip({ label, tip }: { label: string; tip?: string }) {
  if (!tip) return <span>{label}</span>;

  return (
    <span className="flex items-center gap-1">
      {label}
      <Tooltip title={tip}>
        <InfoCircleOutlined className="cursor-help text-xs text-gray-400" />
      </Tooltip>
    </span>
  );
}

function Title({ title }: { title: string }) {
  return (
    <div className="flex items-center">
      <div className="mr-2 h-4 w-0.75 rounded-full bg-blue-600" />
      <h2 className="text-base font-semibold text-gray-900">{title}</h2>
    </div>
  );
}

function toUserInfoValues(user: AuthUser | null): UserInfoValues {
  return {
    id: user?.id ?? '-',
    username: user?.username ?? '-',
    phone: user?.phone ?? '-',
    email: user?.email ?? '',
    createdAt: formatDateTime(user?.createdAt),
    updatedAt: formatDateTime(user?.updatedAt),
  };
}

function formatDateTime(value?: string) {
  if (!value) return '-';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}
