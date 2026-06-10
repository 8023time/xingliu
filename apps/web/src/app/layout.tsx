import type { Metadata } from 'next';
import { Inter, Noto_Sans_SC } from 'next/font/google';
import '@/assets/style';
import MainLayout from '@/components/layout/MainLayout';
import { Theme } from '@radix-ui/themes';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const notoSansSC = Noto_Sans_SC({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-noto',
  display: 'swap',
});

export const metadata: Metadata = {
  title: '星流内容',
  description: '发现优质 AI 创作内容、热点榜单与创作者作品',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body
        className={`${inter.variable} ${notoSansSC.variable} bg-background min-h-full`}
        style={{
          fontFamily:
            'var(--font-inter), var(--font-noto), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        }}
      >
        <Theme>
          <MainLayout>{children}</MainLayout>
        </Theme>
      </body>
    </html>
  );
}
