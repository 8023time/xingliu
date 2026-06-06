import type { CSSProperties } from 'react';
import { Button, Space } from 'antd';
import { cn } from '@/lib/class-name';

export interface ProductHeaderCardProps {
  title?: string;
  description?: string;
  actions?: {
    label: string;
    onClick?: () => void;
    type?: 'primary' | 'default' | 'dashed' | 'text' | 'link';
    icon?: React.ReactNode;
  }[];
  className?: string;
  style?: CSSProperties;
  contentStyle?: CSSProperties;
}

export function ProductHeaderCard({
  title = '标题',
  description = '关于标题的一些描述性信息，可以是两三行，提供更多上下文',
  actions = [],
  className = '',
  style,
  contentStyle,
}: ProductHeaderCardProps) {
  // 飞书原版 3 张 SVG 资源
  const illustrationSrc =
    'https://sf3-scmcdn-cn.feishucdn.com/obj/feishu-static/ee/suite/admin/lark_admin_billingorder/static/imgs/illustration@a73d997a.svg';
  const vector1Src =
    'https://sf3-scmcdn-cn.feishucdn.com/obj/feishu-static/ee/suite/admin/lark_admin_billingorder/static/imgs/vector1@ff67abfb.svg';
  const vector2Src =
    'https://sf3-scmcdn-cn.feishucdn.com/obj/feishu-static/ee/suite/admin/lark_admin_billingorder/static/imgs/vector2@1d0b5fde.svg';

  return (
    <div
      className={cn('relative w-full overflow-hidden rounded-xl p-5 select-none', className)}
      style={{
        background: 'linear-gradient(90deg, #f4f7fc 0%, #f8faff 100%)',
        minHeight: '142px',
        ...style,
      }}
    >
      <img src={vector2Src} alt="" className="pointer-events-none absolute bottom-0 left-0 z-0 h-full opacity-60" />
      <img src={vector1Src} alt="" className="pointer-events-none absolute top-0 right-0 z-0 h-full opacity-40" />

      <div className="relative z-10 flex h-full w-full items-center justify-between gap-8">
        <div className="flex flex-1 flex-col items-start" style={contentStyle}>
          <span className="mb-2 block text-xl font-bold text-gray-950" style={{ letterSpacing: '0.5px' }}>
            {title}
          </span>

          <span className="mb-5 block max-w-2xl text-sm leading-relaxed text-gray-500">{description}</span>

          {actions && actions.length > 0 && (
            <Space size="large">
              {actions.map((action, index) => {
                const isLink = action.type === 'link' || (!action.type && index > 0);
                return (
                  <Button
                    key={index}
                    type={action.type || (index === 0 ? 'primary' : 'default')}
                    onClick={action.onClick}
                    icon={action.icon ?? undefined}
                    size="middle"
                    style={{
                      padding: isLink ? '0' : undefined,
                      fontWeight: isLink ? 500 : undefined,
                      zIndex: isLink ? 1 : undefined,
                    }}
                  >
                    {action.label}
                  </Button>
                );
              })}
            </Space>
          )}
        </div>

        <div className="hidden shrink-0 md:block">
          <img src={illustrationSrc} alt="illustration" className="h-28 object-contain" />
        </div>
      </div>
    </div>
  );
}
