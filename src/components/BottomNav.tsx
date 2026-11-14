import React from 'react';
import { Activity, ClipboardList, History } from 'lucide-react';
import { useMatch } from '../context/MatchContext';
import { useHaptic } from '../hooks/useHaptic';

export const BottomNav: React.FC = () => {
  const { activeTab, dispatch, match, savedMatches } = useMatch();
  const { tap } = useHaptic();

  const navItems = [
    {
      id: 'scoring' as const,
      label: 'Scoring',
      icon: Activity,
      badge: match && match.status === 'live' ? 'LIVE' : null,
      disabled: !match,
    },
    {
      id: 'scorecard' as const,
      label: 'Scorecard',
      icon: ClipboardList,
      badge: null,
      disabled: !match,
    },
    {
      id: 'history' as const,
      label: 'History',
      icon: History,
      badge: savedMatches.length > 0 ? `${savedMatches.length}` : null,
      disabled: false,
    },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 pb-[env(safe-area-inset-bottom,0px)]"
      aria-label="Main Navigation"
    >
      <div className="max-w-md mx-auto grid grid-cols-3 h-14">
        {navItems.map(({ id, label, icon: Icon, badge, disabled }) => {
          const isActive = activeTab === id;

          return (
            <button
              key={id}
              disabled={disabled}
              onClick={() => {
                tap();
                dispatch({ type: 'SET_TAB', payload: { tab: id } });
              }}
              className={`flex flex-col items-center justify-center relative transition-colors duration-150 ${
                isActive
                  ? 'text-emerald-700 dark:text-emerald-400 font-semibold'
                  : disabled
                  ? 'text-slate-300 dark:text-slate-700 cursor-not-allowed'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 font-normal'
              }`}
              aria-label={label}
              aria-current={isActive ? 'page' : undefined}
            >
              {/* Active top 2px indicator line */}
              {isActive && (
                <span className="absolute top-0 left-0 right-0 h-0.5 bg-emerald-700 dark:bg-emerald-500" />
              )}

              <div className="relative">
                <Icon size={19} strokeWidth={1.75} />
                {badge && (
                  <span
                    className={`absolute -top-1 -right-2 text-[8px] font-semibold px-1 rounded tabular-nums leading-tight ${
                      badge === 'LIVE'
                        ? 'bg-emerald-700 text-white'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
