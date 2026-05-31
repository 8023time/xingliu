import { useState } from 'react';
import { Layout, Flex, Dropdown, Button, Menu, Avatar, Image } from 'antd';
import {
  PlusOutlined,
  HomeOutlined,
  FileTextOutlined,
  BarChartOutlined,
  DownOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  LogoutOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { WEB_DATA_INFO } from '@/configs/config';
import { useAuthStore } from '@/stores/user-store';

const { Header, Sider, Content } = Layout;

export default function RootLayout() {
  return (
    <Layout style={{ minHeight: '100vh', width: '100%', background: '#F8F8F8' }}>
      <Header
        style={{
          height: 50,
          padding: '0 24px',
          background: '#F8F8F8',
        }}
      >
        <APPHeader />
      </Header>
      <Layout style={{ background: '#F8F8F8', maxHeight: 'calc(100vh - 64px)' }}>
        <APPSider />
        <Content style={{ background: '#F8F8F8', padding: 25, overflow: 'auto' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}

function APPSider() {
  // 将折叠状态内聚在组件内部
  const [collapsed, setCollapsed] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const publishItems = [
    { key: 'video', label: '发布视频' },
    { key: 'image-text', label: '发布图文' },
  ];

  const menuItems = [
    { key: '/home', icon: <HomeOutlined />, label: '首页' },
    { key: '/notes', icon: <FileTextOutlined />, label: '笔记管理' },
    {
      key: '/data',
      icon: <BarChartOutlined />,
      label: '数据看板',
      children: [
        { key: '/data/overview', label: '作品数据' },
        { key: '/data/fans', label: '粉丝数据' },
      ],
    },
  ];

  return (
    <Sider
      collapsible
      collapsed={collapsed}
      onCollapse={(value) => setCollapsed(value)}
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
            <Dropdown menu={{ items: publishItems }} placement="bottomCenter">
              <Button
                type="primary"
                danger
                size="large"
                icon={<PlusOutlined />}
                block
                style={{
                  height: 40,
                  borderRadius: 8,
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {!collapsed && '发布笔记'}
                {!collapsed && <DownOutlined style={{ fontSize: 10, marginLeft: 4 }} />}
              </Button>
            </Dropdown>
          </div>

          {/* 💡 现代化无边框菜单 */}
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

        {/* 💡 自定义折叠按钮（组件最下方） */}
        <div style={{ padding: collapsed ? '0 4px' : '0 8px' }}>
          <Button
            type="text"
            block
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
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
  const { logout } = useAuthStore();

  const userMenuItems = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      danger: true,
      onClick: () => {
        logout();
        navigate('/login');
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
            <Avatar size={25} src="/avatar.png" icon={<UserOutlined />} />
            <span style={{ marginLeft: 8, fontWeight: 500 }}>寻觅～流光</span>
          </Flex>
        </Dropdown>
      </Flex>
    </header>
  );
}
