'use client';

import { usePathname, useRouter } from 'next/navigation';
import Avatar from './Avatar';

const tabs = [
  {
    key: 'calendar',
    href: '/calendar',
    label: '캘린더',
    dot: '#3B82F6',
    icon: (active: boolean) => (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={active ? '#111827' : '#9CA3AF'} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="3" />
        <line x1="3" y1="10" x2="21" y2="10" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
      </svg>
    ),
  },
  {
    key: 'quick-add',
    href: '/quick-add',
    label: '빠른 추가',
    dot: '#84CC16',
    icon: (active: boolean) => (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={active ? '#111827' : '#9CA3AF'} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="16" />
        <line x1="8" y1="12" x2="16" y2="12" />
      </svg>
    ),
  },
  {
    key: 'records',
    href: '/records',
    label: '기록',
    dot: '#F472B6',
    icon: (active: boolean) => (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={active ? '#111827' : '#9CA3AF'} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    ),
  },
  {
    key: 'stats',
    href: '/stats',
    label: '성장 그래프',
    dot: '#FF00C8',
    icon: (active: boolean) => (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={active ? '#111827' : '#9CA3AF'} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
  },
  {
    key: 'settings',
    href: '/settings',
    label: '설정',
    dot: '#9CA3AF',
    icon: (active: boolean) => (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={active ? '#111827' : '#9CA3AF'} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
      </svg>
    ),
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <aside className="hidden lg:flex flex-col w-56 min-h-screen bg-white border-r border-gray-100 fixed top-0 left-0 bottom-0 z-40">
      {/* Profile */}
      <div className="px-5 py-6">
        <div className="flex items-center gap-3">
          <Avatar size={38} />
          <div>
            <p className="text-sm font-bold text-gray-900 leading-tight">아이두</p>
            <p className="text-[11px] text-gray-400 mt-0.5">발레 다이어리</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-0.5">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href || (tab.href === '/calendar' && pathname === '/');
          return (
            <button
              key={tab.key}
              onClick={() => router.push(tab.href)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group ${
                isActive
                  ? 'bg-gray-100 text-gray-900'
                  : 'text-gray-400 hover:bg-gray-50 hover:text-gray-700'
              }`}
            >
              <span className="flex-shrink-0">{tab.icon(isActive)}</span>
              <span>{tab.label}</span>
              {isActive && (
                <span
                  className="ml-auto w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: tab.dot }}
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-5 py-5">
        <p className="text-[10px] text-gray-300 font-medium">i.do.ballet</p>
      </div>
    </aside>
  );
}
