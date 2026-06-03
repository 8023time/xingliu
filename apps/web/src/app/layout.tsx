import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import '@/style/globals.css';
import { AppLayout } from '@/components/layout/app-layout';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
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
    <html lang="zh-CN" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="bg-background text-foreground min-h-full">
        <AppLayout>{children}</AppLayout>
      </body>
    </html>
  );
}
