import React from 'react';
import { Sun, Moon, Maximize, Minimize } from 'lucide-react';
import { useMatch } from '../context/MatchContext';
import { useHaptic } from '../hooks/useHaptic';
import { useFullscreen } from '../hooks/useFullscreen';

export const AppHeader: React.FC = () => {
  const { match, darkMode, dispatch } = useMatch();
  const { tap } = useHaptic();
  const { isFullscreen, toggleFullscreen } = useFullscreen();

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

        {/* Top-right corner: Live indicator & Theme toggle */}
        <div className="flex items-center gap-1.5">
          {isLive && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800/60">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
              Live
            </span>
          )}

          <button
            type="button"
            onClick={() => {
              tap();
              toggleFullscreen();
            }}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-slate-800 transition-colors active:scale-95"
            aria-label={isFullscreen ? 'Exit Full Screen' : 'Enter Full Screen'}
            title={isFullscreen ? 'Exit Full Screen' : 'Full Screen'}
          >
            {isFullscreen ? (
              <Minimize size={17} strokeWidth={2} className="text-orange-600 dark:text-orange-400" />
            ) : (
              <Maximize size={17} strokeWidth={2} />
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              tap();
              dispatch({ type: 'TOGGLE_DARK_MODE' });
            }}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-slate-800 transition-colors"
            aria-label="Toggle Dark Mode"
            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {darkMode ? (
              <Sun size={17} strokeWidth={2} className="text-amber-400" />
            ) : (
              <Moon size={17} strokeWidth={2} className="text-slate-600" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};

