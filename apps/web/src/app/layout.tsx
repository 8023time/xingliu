import type { Metadata } from 'next';
import '@/assets/style';
import MainLayout from '@/components/layout/MainLayout';
import { Theme } from '@radix-ui/themes';
import localFont from 'next/font/local';

export const metadata: Metadata = {
  title: '星流内容',
  description: '发现优质 AI 创作内容、热点榜单与创作者作品',
};

const alimamaFont = localFont({
  src: '../assets/fonts/AlimamaShuHeiTi-Bold.woff2',
  variable: '--font-alimama',
  display: 'swap',
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className={`${alimamaFont.variable} h-full antialiased`}>
      <body className="bg-background text-foreground min-h-full">
        <Theme>
          <MainLayout>{children}</MainLayout>
        </Theme>
      </body>
    </html>
  );
}
