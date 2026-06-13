import { Text, Link, Flex } from '@radix-ui/themes';

export default function Footer() {
  return (
    <footer className="max-w-page mx-auto mt-8 w-full bg-white px-4 py-4 lg:px-0">
      <Flex gap="2" align="center" justify="center" wrap="wrap">
        {/* 版权信息 */}
        <Text size="2" color="gray">
          ©2026 星流
        </Text>

        {/* ICP 备案号 */}
        <Link
          href="https://beian.miit.gov.cn/"
          target="_blank"
          rel="noopener noreferrer"
          size="2"
          color="gray"
          underline="none"
          className="hover:underline"
        >
          滇ICP备2026011007号-1
        </Link>
      </Flex>
    </footer>
  );
}
