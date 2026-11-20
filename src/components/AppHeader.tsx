import React from 'react';
import { useMatch } from '../context/MatchContext';

export const AppHeader: React.FC = () => {
  const { match } = useMatch();

  const isLive = match && match.status === 'live';

  return (
    <header className="sticky top-0 z-30 bg-[#fffcf7]/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-amber-200/60 dark:border-slate-800 shadow-sm transition-colors duration-150">
      <div className="max-w-md mx-auto px-4 h-12 flex items-center justify-between">
        {/* Top-left corner: Logo + Title */}
        <div className="flex items-center gap-2.5">
          <img
            src="/balak-hanuman.png"
            alt="Balak Hanuman Logo"
            className="w-8 h-8 object-contain drop-shadow-sm select-none"
          />
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-base tracking-tight text-slate-900 dark:text-slate-100 select-none">
              Balak Hanuman
            </span>
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300/80 dark:border-amber-800/60 uppercase tracking-wider">
              Scorer
            </span>
          </div>
        </div>

        {/* Top-right corner: Live indicator */}
        <div className="flex items-center gap-1.5">
          {isLive && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800/60">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
              Live
            </span>
          )}
        </div>
      </div>
    </header>
  );
};

