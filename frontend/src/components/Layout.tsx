import { Link, Outlet } from 'react-router-dom';
import { TabBar } from './TabBar';

export function Layout() {
  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col bg-cream md:my-6 md:min-h-[calc(100dvh-3rem)] md:rounded-3xl md:border md:border-line md:overflow-hidden">
      <header className="sticky top-0 z-10 flex items-center justify-center border-b border-line bg-cream/95 px-6 py-3 backdrop-blur">
        <Link to="/" className="text-base font-bold tracking-tight text-ink">
          코스<span>Pick</span>
        </Link>
      </header>
      <main className="flex-1 px-6 pt-6 pb-[calc(6rem+env(safe-area-inset-bottom))]">
        <Outlet />
      </main>
      <TabBar />
    </div>
  );
}
