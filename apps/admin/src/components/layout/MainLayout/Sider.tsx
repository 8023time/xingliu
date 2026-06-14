import { useRef, useState, type ReactNode, lazy, Suspense } from 'react';
import { Button, Flex, Layout, Menu } from 'antd';
import {
  BulbOutlined,
  FileTextOutlined,
  FireOutlined,
  HomeOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  PictureOutlined,
  PlusOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import { routeLoaders } from '@/router/index';
import { useSiderCollapseStrategy } from '@/hooks/useSiderCollapseStrategy';

// 优化：预加载弹窗组件,按需加载，减少首页体积
const CreateModal = lazy(() => import('@/components/createModal'));

const { Sider } = Layout;

const preloadRouteMap = {
  '/home': routeLoaders.home,
  '/prompts': routeLoaders.prompts,
  '/assets': routeLoaders.assets,
  '/content/list': routeLoaders.contentList,
  '/rankings': routeLoaders.rankings,
  '/info': routeLoaders.info,
};

type ValidRoutePath = keyof typeof preloadRouteMap;

interface PreloadMenuLabelProps {
  routeKey: ValidRoutePath;
  children: ReactNode;
}

function PreloadMenuLabel({ routeKey, children }: PreloadMenuLabelProps) {
  const hasPreloaded = useRef(false);
  const timer = useRef<ReturnType<typeof window.setTimeout> | null>(null);

  const handleMouseEnter = () => {
    if (hasPreloaded.current) return;

    timer.current = window.setTimeout(() => {
      void preloadRouteMap[routeKey]?.();
      hasPreloaded.current = true;
    }, 80);
  };

  const handleMouseLeave = () => {
    if (!timer.current) return;
    window.clearTimeout(timer.current);
    timer.current = null;
  };

  return (
    <span onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      {children}
    </span>
  );
}

const menuConfig: { key: ValidRoutePath; icon: ReactNode; label: string }[] = [
  { key: '/home', icon: <HomeOutlined />, label: '首页' },
  { key: '/prompts', icon: <BulbOutlined />, label: 'Prompt 管理' },
  { key: '/assets', icon: <PictureOutlined />, label: '素材管理' },
  { key: '/content/list', icon: <FileTextOutlined />, label: '内容列表' },
  { key: '/rankings', icon: <FireOutlined />, label: '榜单中心' },
  { key: '/info', icon: <UserOutlined />, label: '用户信息' },
];

const menuItems = menuConfig.map((item) => ({
  key: item.key,
  icon: item.icon,
  label: <PreloadMenuLabel routeKey={item.key}>{item.label}</PreloadMenuLabel>,
}));

export default function APPSider() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { collapsed, setCollapsedByUser, toggleCollapsedByUser } = useSiderCollapseStrategy();

  const navigate = useNavigate();
  const location = useLocation();

  const handleCreateClick = () => {
    routeLoaders.contentCreate(); // 优化:预加载创建内容页面
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
      trigger={null}
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
            {isCreateModalOpen && (
              <Suspense fallback={null}>
                <CreateModal open={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />
              </Suspense>
            )}
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
