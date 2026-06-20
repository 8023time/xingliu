import { useState } from 'react';
import { CameraOutlined, UserOutlined } from '@ant-design/icons';
import { Avatar, Button, Upload, message, type UploadProps } from 'antd';
import { uploadAvatarApi } from '@/api/user';
import { useAuthStore } from '@/stores/user-store';

const vector1Src =
  'https://sf3-scmcdn-cn.feishucdn.com/obj/feishu-static/ee/suite/admin/lark_admin_billingorder/static/imgs/vector1@ff67abfb.svg';

const vector2Src =
  'https://sf3-scmcdn-cn.feishucdn.com/obj/feishu-static/ee/suite/admin/lark_admin_billingorder/static/imgs/vector2@1d0b5fde.svg';

const MAX_AVATAR_SIZE_MB = 5;

export default function BaseInfoCard() {
  const { user, setUser } = useAuthStore();
  const [uploading, setUploading] = useState(false);

  const uploadProps: UploadProps = {
    accept: 'image/*',
    showUploadList: false,
    disabled: uploading || !user,
    beforeUpload: (file) => {
      if (!file.type.startsWith('image/')) {
        message.error('请上传图片格式的头像');
        return Upload.LIST_IGNORE;
      }

      if (file.size > MAX_AVATAR_SIZE_MB * 1024 * 1024) {
        message.error(`头像不能超过 ${MAX_AVATAR_SIZE_MB} MB`);
        return Upload.LIST_IGNORE;
      }

      return true;
    },
    customRequest: async ({ file, onSuccess, onError }) => {
      if (!(file instanceof File)) {
        onError?.(new Error('无法读取上传文件'));
        return;
      }

      if (!user) {
        onError?.(new Error('登录状态已失效'));
        return;
      }

      setUploading(true);
      try {
        const res = await uploadAvatarApi(file);
        setUser({ ...user, avatarUrl: res.data.avatarUrl });
        message.success(res.message || '头像上传成功');
        onSuccess?.({});
      } catch (error) {
        onError?.(error instanceof Error ? error : new Error('头像上传失败'));
      } finally {
        setUploading(false);
      }
    },
  };

  return (
    <div
      className="relative flex min-h-25 w-full items-center gap-4 overflow-hidden rounded-xl p-5 select-none"
      style={{
        background: 'linear-gradient(90deg, #eff4fc 0%, #f4f8ff 100%)',
      }}
    >
      <img
        src={vector2Src}
        alt=""
        aria-hidden
        className="pointer-events-none absolute bottom-0 left-0 z-0 h-full opacity-40"
      />

      <img
        src={vector1Src}
        alt=""
        aria-hidden
        className="pointer-events-none absolute top-0 right-0 z-0 h-full opacity-50"
      />

      <div className="relative z-10 shrink-0">
        <Avatar
          src={user?.avatarUrl ?? undefined}
          shape="square"
          size={64}
          icon={<UserOutlined />}
          className="rounded-xl border-2 border-white shadow-sm"
        />
      </div>

      <div className="relative z-10 flex min-w-0 flex-1 flex-col justify-center gap-1.5">
        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate text-base font-medium text-gray-900">{user?.username ?? '未登录用户'}</span>
        </div>

        <div className="flex min-w-0 flex-wrap items-center gap-2 text-sm text-gray-500">
          <span className="truncate">星流创作者中心</span>
          <Upload {...uploadProps}>
            <Button size="small" type="link" loading={uploading} icon={<CameraOutlined />} className="px-0">
              更换头像
            </Button>
          </Upload>
        </div>
      </div>
    </div>
  );
}
