import { useState } from 'react';
import { Layout, Flex, Dropdown, Button, Menu, Avatar, Image, message } from 'antd';
import {
  PlusOutlined,
  HomeOutlined,
  FileTextOutlined,
  FireOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  LogoutOutlined,
  UserOutlined,
  BulbOutlined,
  PictureOutlined,
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { WEB_DATA_INFO } from '@/configs/config';
import { useAuthStore } from '@/stores/user-store';
import CreateModal from '@/components/createModal/index';
import { logoutApi } from '@/api/user';
import { useSiderCollapseStrategy } from '@/hooks/useSiderCollapseStrategy';

const { Header, Sider, Content } = Layout;

export default function RootLayout() {
  return (
    <Layout style={{ minHeight: '100vh', width: '100%', background: '#F8F8F8' }}>
      <Header
        style={{
          height: 64,
          padding: '0 24px',
          background: '#F8F8F8',
        }}
      >
        <APPHeader />
      </Header>
      <Layout style={{ background: '#F8F8F8', maxHeight: 'calc(100vh - 64px)' }}>
        <APPSider />
        <Content style={{ background: '#F8F8F8', padding: '0 15px 15px 0', overflow: 'auto' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}

function APPSider() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { collapsed, setCollapsedByUser, toggleCollapsedByUser } = useSiderCollapseStrategy();

  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { key: '/home', icon: <HomeOutlined />, label: '首页' },
    { key: '/prompts', icon: <BulbOutlined />, label: 'Prompt 管理' },
    { key: '/assets', icon: <PictureOutlined />, label: '素材管理' },
    { key: '/content/list', icon: <FileTextOutlined />, label: '内容列表' },
    { key: '/rankings', icon: <FireOutlined />, label: '榜单中心' },
    { key: '/info', icon: <UserOutlined />, label: '用户信息' },
  ];

  const handleCreateClick = () => {
    setIsCreateModalOpen(true);
  };

  return (
    <Sider
      collapsible
      collapsed={collapsed}
      onCollapse={setCollapsedByUser}
      theme="light"
      width={200}
      collapsedWidth={70}
      trigger={null} // 隐藏原生 trigger 条
      style={{
        background: '#F8F8F8',
        padding: '16px 8px',
      }}
    >
      <Flex vertical style={{ height: '100%' }} justify="space-between">
        <div>
          <div style={{ marginBottom: 16, padding: collapsed ? '0 4px' : '0 8px', transition: 'all 0.2s' }}>
            <Button
              type="primary"
              danger
              size="large"
              icon={<PlusOutlined />}
              block
              onClick={handleCreateClick}
              style={{
                height: 40,
                borderRadius: 8,
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {!collapsed && '创建'}
            </Button>
            <CreateModal open={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />
          </div>

          <Menu
            mode="inline"
            inlineCollapsed={collapsed}
            selectedKeys={[location.pathname]}
            theme="light"
            style={{ borderRight: 'none', background: '#F8F8F8' }}
            items={menuItems}
            onClick={({ key }) => navigate(key)}
          />
        </div>

        <div style={{ padding: collapsed ? '0 4px' : '0 8px' }}>
          <Button
            type="text"
            block
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={toggleCollapsedByUser}
            style={{
              height: 40,
              borderRadius: 8,
              color: '#64748b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: collapsed ? 'center' : 'flex-start',
              paddingLeft: collapsed ? 0 : 12,
              fontSize: 14,
            }}
          >
            {!collapsed && <span style={{ marginLeft: 8, fontWeight: 500 }}>收起导航</span>}
          </Button>
        </div>
      </Flex>
    </Sider>
  );
}

function APPHeader({ className }: { className?: string }) {
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
          <Image width={32} src="/favicon.png" preview={false} style={{ borderRadius: 6 }} />
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
