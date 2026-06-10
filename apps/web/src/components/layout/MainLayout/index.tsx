import Header from './Header';
import NavTabs from './NavTabs';
import Footer from './Footer';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f8fbff] text-zinc-950">
      <div className="pointer-events-none fixed inset-x-0 top-0 bottom-0 bg-[linear-gradient(180deg,#dff1ff_0%,#eef7ff_28%,#f7fbff_58%,#fbfdff_100%)]" />
      <Header />

      <div className="relative flex min-h-screen flex-col pt-16">
        <NavTabs />

        <main className="max-w-page mx-auto w-full flex-1 px-4 pt-4 pb-10 lg:px-0">{children}</main>

        <Footer />
      </div>
    </div>
  );
}
