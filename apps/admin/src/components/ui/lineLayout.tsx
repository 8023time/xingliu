import type { ReactNode, FC } from 'react';

export const LineLayout: FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <div className="isolate">
      <div className="max-w-screen overflow-x-hidden">
        <div className="grid min-h-dvh grid-cols-1 grid-rows-[1fr_1px_auto_1px_auto] justify-center [--gutter-width:2.5rem] lg:grid-cols-[var(--gutter-width)_minmax(0,var(--breakpoint-2xl))_var(--gutter-width)]">
          <div className="col-start-1 row-span-full row-start-1 hidden bg-[image:repeating-linear-gradient(315deg,_var(--pattern-fg)_0,_var(--pattern-fg)_1px,_transparent_0,_transparent_50%)] bg-[size:20px_20px] bg-fixed [--pattern-fg:var(--color-black)]/3 lg:block dark:[--pattern-fg:var(--color-white)]/5"></div>
          <div className="text-gray-950 lg:col-start-2 dark:text-white">{children}</div>
          <div className="row-span-full row-start-1 hidden bg-[image:repeating-linear-gradient(315deg,_var(--pattern-fg)_0,_var(--pattern-fg)_1px,_transparent_0,_transparent_50%)] bg-[size:20px_20px] bg-fixed [--pattern-fg:var(--color-black)]/3 lg:col-start-3 lg:block dark:[--pattern-fg:var(--color-white)]/5"></div>
        </div>
      </div>
    </div>
  );
};
