import React from 'react';
import { useHaptic } from '../hooks/useHaptic';

interface RunPadProps {
  onScoreRuns: (runs: number) => void;
}

export const RunPad: React.FC<RunPadProps> = ({ onScoreRuns }) => {
  const { tap, boundary } = useHaptic();

  const handleRunClick = (runs: number) => {
    if (runs === 4 || runs === 6) {
      boundary();
    } else {
      tap();
    }
    onScoreRuns(runs);
  };

  const buttons = [
    { runs: 0, isBoundary: false },
    { runs: 1, isBoundary: false },
    { runs: 2, isBoundary: false },
    { runs: 3, isBoundary: false },
    { runs: 4, isBoundary: true },
    { runs: 6, isBoundary: true },
  ];

  return (
    <div className="grid grid-cols-3 gap-2">
      {buttons.map(({ runs, isBoundary }) => (
        <button
          key={runs}
          type="button"
          onClick={() => handleRunClick(runs)}
          className={`h-12 rounded-md border text-base font-medium tabular-nums transition-colors duration-150 flex items-center justify-center select-none ${
            isBoundary
              ? 'bg-emerald-50/70 dark:bg-emerald-950/20 border-slate-300 dark:border-slate-700 text-emerald-700 dark:text-emerald-400 active:bg-emerald-100 dark:active:bg-emerald-950/40'
              : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 active:bg-slate-100 dark:active:bg-slate-800'
          }`}
          aria-label={`Score ${runs} ${runs === 1 ? 'run' : 'runs'}`}
        >
          {runs}
        </button>
      ))}
    </div>
  );
};
