import type React from 'react';
import type { FC } from 'react';
import { cn } from '@/lib/class-name';

export interface SectionDividerProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * @description: The content of the section divider.(内容)
   */
  children?: React.ReactNode;
  /**
   * @description: The class name of the section divider.(样式)
   */
  className?: string;
  /**
   * @description: Divider direction. horizontal = 上下横线, vertical = 左右竖线
   */
  mode?: 'horizontal' | 'vertical';
}

export const SectionDivider: FC<SectionDividerProps> = (props) => {
  const { children, className, mode = 'horizontal', ...rest } = props;

  const styles = cn(
    'relative',
    mode === 'horizontal'
      ? 'before:absolute before:top-0 before:-left-[100vw] before:h-px before:w-[200vw] before:bg-gray-950/5 ' +
          'after:absolute after:bottom-0 after:-left-[100vw] after:h-px after:w-[200vw] after:bg-gray-950/5 ' +
          'dark:before:bg-white/10 dark:after:bg-white/10'
      : 'before:absolute before:top-0 before:left-0 before:h-full before:w-px before:bg-gray-950/5 ' +
          'after:absolute after:top-0 after:right-0 after:h-full after:w-px after:bg-gray-950/5 ' +
          'dark:before:bg-white/10 dark:after:bg-white/10',
    className,
  );

  return (
    <div className={styles} {...rest}>
      {children}
    </div>
  );
};
