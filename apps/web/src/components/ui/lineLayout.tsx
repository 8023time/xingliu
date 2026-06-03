import type { FC, ReactNode } from 'react';

const LineLayout: FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <div className="isolate min-h-dvh bg-white">
      <div className="overflow-x-hidden">
        <div className="grid min-h-dvh grid-cols-1 grid-rows-[1fr_1px_auto_1px_auto] justify-center [--gutter-width:2.5rem] lg:grid-cols-[var(--gutter-width)_minmax(0,var(--breakpoint-2xl))_var(--gutter-width)]">
          <div className="col-start-1 row-span-full row-start-1 hidden bg-white bg-[repeating-linear-gradient(315deg,var(--pattern-fg)_0,var(--pattern-fg)_1px,transparent_0,transparent_50%)] bg-[size:20px_20px] bg-fixed [--pattern-fg:var(--color-black)]/3 lg:block dark:[--pattern-fg:var(--color-white)]/5" />
          <div className="text-gray-950 lg:col-start-2 dark:text-white">{children}</div>
          <div className="row-span-full row-start-1 hidden bg-white bg-[repeating-linear-gradient(315deg,var(--pattern-fg)_0,var(--pattern-fg)_1px,transparent_0,transparent_50%)] bg-[size:20px_20px] bg-fixed [--pattern-fg:var(--color-black)]/3 lg:col-start-3 lg:block dark:[--pattern-fg:var(--color-white)]/5" />
        </div>
      </div>
    </div>
  );
};

export { LineLayout };
