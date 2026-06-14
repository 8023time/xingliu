import { Avatar, Dropdown, Flex, message } from 'antd';
import { LogoutOutlined, UserOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/user-store';
import { logoutApi } from '@/api/user';
import { WEB_DATA_INFO } from '@/configs/config';

export default function APPHeader({ className }: { className?: string }) {
  const navigate = useNavigate();
  const { logout, user } = useAuthStore();

  const userMenuItems = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      danger: true,
      onClick: async () => {
        const res = await logoutApi();
        if (res.code === 1) {
          logout();
          navigate('/login');
          message.error(res.message ?? '服务出错!');
          return;
        }
        logout();
        navigate('/login');
        message.success('退出登录成功');
      },
    },
  ];

  return (
    <header className={className}>
      <Flex align="center" justify="space-between" style={{ height: '100%' }}>
        <Flex align="center">
          <img src="/logo.png" width={32} height={32} alt="星流" style={{ borderRadius: 6 }} />
          <span style={{ marginLeft: 12, fontSize: 16, fontWeight: 600, letterSpacing: '0.5px' }}>
            {WEB_DATA_INFO.APPLICATION_NAME}
          </span>
        </Flex>

        <Dropdown menu={{ items: userMenuItems }}>
          <Flex align="center" style={{ cursor: 'pointer', padding: '4px 8px', borderRadius: 6 }}>
            <Avatar size={25} src={user?.avatarUrl ?? undefined} icon={<UserOutlined />} />
            <span style={{ marginLeft: 8, fontWeight: 500 }}>{user?.username ?? '未知用户'}</span>
          </Flex>
        </Dropdown>
      </Flex>
    </header>
  );
}
