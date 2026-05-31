import { Flex, Image } from 'antd';
import { LineLayout, SectionDivider } from '@/components/ui';
import { WEB_DATA_INFO } from '@/configs/config';
import LoginAddRegister from './components/loginAddRegister';

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
    <header className="h-16">
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
    <footer className="my-10 flex justify-center">
      <div className="text-sm text-slate-400">2026 © 星流创作者中心</div>
    </footer>
  );
}
