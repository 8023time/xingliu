import type { ComponentProps, CSSProperties, ReactNode } from 'react';
import { Card } from 'antd';

type AntCardProps = ComponentProps<typeof Card>;

export interface XingliuCardProps extends Omit<AntCardProps, 'children' | 'style' | 'styles' | 'variant'> {
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
  bodyStyle?: CSSProperties;
  bodyPadding?: number | string;
  spaced?: boolean;
}

export interface XingliuCardStackProps {
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
  gap?: number | string;
}

const CARD_RADIUS = 10;
const CARD_GAP = 20;
const CARD_BODY_PADDING = 20;

export function XingliuCard({
  children,
  className,
  style,
  bodyStyle,
  bodyPadding = CARD_BODY_PADDING,
  spaced = true,
  ...cardProps
}: XingliuCardProps) {
  return (
    <Card
      {...cardProps}
      variant="borderless"
      className={className}
      style={{
        width: '100%',
        marginBottom: spaced ? CARD_GAP : 0,
        background: '#fff',
        borderRadius: CARD_RADIUS,
        boxShadow: 'none',
        overflow: 'hidden',
        ...style,
      }}
      styles={{
        body: {
          padding: bodyPadding,
          ...bodyStyle,
        },
      }}
    >
      {children}
    </Card>
  );
}

export function XingliuCardStack({ children, className, style, gap = CARD_GAP }: XingliuCardStackProps) {
  return (
    <div
      className={className}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
