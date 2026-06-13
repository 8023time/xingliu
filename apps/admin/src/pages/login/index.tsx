import { Flex, Image, Space, Typography } from 'antd';
import { LineLayout, SectionDivider } from '@/components/ui';
import { WEB_DATA_INFO } from '@/configs/config';
import LoginAddRegister from './components/loginAddRegister';

const { Text, Link } = Typography;

export default function LoginPage() {
  return (
    <LineLayout>
      <div className="flex h-full flex-col">
        <APPHeader />
        <SectionDivider className="min-h-10 flex-1" />

        <SectionDivider>
          <Flex align="center" justify="center" wrap>
            <img
              src="/xingliu.png"
              alt="星流"
              draggable={false}
              className="pointer-events-none mx-auto w-full max-w-[800px] object-contain"
            />
            <LoginAddRegister />
          </Flex>
        </SectionDivider>

        <SectionDivider className="min-h-10 flex-1" />

        <AppFooter />
      </div>
    </LineLayout>
  );
}

function APPHeader() {
  return (
    <header className="h-16 px-3">
      <Flex align="center" justify="space-between" gap={8} className="h-full">
        <Flex align="center" gap={10}>
          <Image width={30} src="/favicon.png" preview={false} className="rounded-lg" />
          <span className="text-base font-semibold tracking-wide text-slate-900">{WEB_DATA_INFO.APPLICATION_NAME}</span>
        </Flex>
        🥺
      </Flex>
    </header>
  );
}

function AppFooter() {
  return (
    <footer className="my-5 flex w-full justify-center text-center">
      <Space direction="horizontal" size={4} align="center">
        {/* 版权信息 */}
        <Text type="secondary" className="text-sm">
          ©2026 星流创作者中心
        </Text>

        {/* 工信部 ICP 备案 */}
        <Link
          href="https://beian.miit.gov.cn/"
          target="_blank"
          rel="noopener noreferrer"
          type="secondary"
          className="text-xs hover:opacity-80"
        >
          滇ICP备2026011007号-1
        </Link>
      </Space>
    </footer>
  );
}
