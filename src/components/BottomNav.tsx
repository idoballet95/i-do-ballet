'use client';

import { usePathname, useRouter } from 'next/navigation';

const tabs = [
  {
    key: 'calendar',
    href: '/calendar',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#111827' : '#C4C9D4'} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="3" />
        <line x1="3" y1="10" x2="21" y2="10" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
      </svg>
    ),
    dot: '#3B82F6',
  },
  {
    key: 'quick-add',
    href: '/quick-add',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? '#111827' : 'none'} stroke={active ? '#111827' : '#C4C9D4'} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" fill={active ? '#111827' : 'none'} />
        <line x1="12" y1="8" x2="12" y2="16" stroke={active ? '#fff' : '#C4C9D4'} />
        <line x1="8" y1="12" x2="16" y2="12" stroke={active ? '#fff' : '#C4C9D4'} />
      </svg>
    ),
    dot: '#84CC16',
  },
  {
    key: 'records',
    href: '/records',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#111827' : '#C4C9D4'} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    ),
    dot: '#F472B6',
  },
  {
    key: 'stats',
    href: '/stats',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#111827' : '#C4C9D4'} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
    dot: '#FF00C8',
  },
  {
    key: 'settings',
    href: '/settings',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#111827' : '#C4C9D4'} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
      </svg>
    ),
    dot: '#9CA3AF',
  },
];

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-t border-[#F0F0F0] safe-bottom">
      <div className="max-w-lg mx-auto flex items-center justify-around h-[54px]">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href || (tab.href === '/calendar' && pathname === '/');
          return (
            <button
              key={tab.key}
              onClick={() => router.push(tab.href)}
              className="relative flex flex-col items-center justify-center gap-[3px] w-14 h-full active:scale-90 transition-transform duration-150"
            >
              <div className={`transition-all duration-200 ${isActive ? 'scale-110' : 'scale-100'}`}>
                {tab.icon(isActive)}
              </div>
              <span
                className="w-1 h-1 rounded-full transition-all duration-300"
                style={{
                  backgroundColor: isActive ? tab.dot : 'transparent',
                  transform: isActive ? 'scale(1)' : 'scale(0)',
                }}
              />
            </button>
          );
        })}
      </div>
    </nav>
  );
}
