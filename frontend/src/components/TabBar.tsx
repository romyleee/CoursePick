import { NavLink } from 'react-router-dom';

const tabs = [
  { to: '/', label: '홈' },
  { to: '/timeline', label: '타임라인' },
  { to: '/settings', label: '설정' },
];

export function TabBar() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 mx-auto flex w-full max-w-md justify-around border-t border-line bg-cream/95 px-2 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur md:sticky md:bottom-0 md:rounded-b-3xl">
      {tabs.map((t) => (
        <NavLink
          key={t.to}
          to={t.to}
          end={t.to === '/'}
          className={({ isActive }) =>
            `flex flex-1 items-center justify-center rounded-full py-2 text-sm transition ${
              isActive ? 'font-bold text-ink' : 'text-ink-3'
            }`
          }
        >
          {t.label}
        </NavLink>
      ))}
    </nav>
  );
}
