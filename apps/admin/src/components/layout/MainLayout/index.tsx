import { Layout } from 'antd';
import { Outlet } from 'react-router-dom';
import APPHeader from './Header';
import APPSider from './Sider';

const { Header, Content } = Layout;

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
