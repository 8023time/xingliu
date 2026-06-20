import type { ReactNode, FC } from 'react';

export const Background: FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-[#f4f7fb] text-gray-950">
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.96)_0%,rgba(244,247,251,0.94)_42%,rgba(232,241,255,0.78)_100%)]"
        aria-hidden="true"
      />

      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(39,76,119,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(39,76,119,0.045)_1px,transparent_1px)] bg-[size:56px_56px]"
        aria-hidden="true"
      />

      <main className="relative z-10 flex flex-1 items-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-6xl py-4 lg:py-10">{children}</div>
      </main>
    </div>
  );
};
