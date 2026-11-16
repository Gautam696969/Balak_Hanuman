import React from 'react';
import { Ball } from '../types/cricket';
import { useMatch } from '../context/MatchContext';

export const BallTimeline: React.FC = () => {
  const { match } = useMatch();
  if (!match) return null;

  const currentInnings = match.innings?.[match.currentInningsIndex];
  if (!currentInnings) return null;
  const currentOverBalls = currentInnings.currentOverBalls || [];
  const legalBallCount = currentOverBalls.filter((b) => b?.isLegal).length;

  const getChipStyle = (ball: Ball) => {
    if (ball.wicket) {
      return 'border-red-600 text-red-600 dark:text-red-400 font-semibold';
    }
    if (ball.runsOffBat === 4 || ball.runsOffBat === 6) {
      return 'border-emerald-700 text-emerald-700 dark:border-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50/40 dark:bg-emerald-950/20';
    }
    if (ball.extraType) {
      return 'border-slate-300 dark:border-slate-700 text-amber-600 dark:text-amber-400 font-medium';
    }
    return 'border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300';
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 shadow-sm">
      <div className="flex items-center justify-between text-xs mb-1.5">
        <span className="uppercase tracking-wide text-slate-500 font-medium text-[11px]">
          This Over
        </span>
        <span className="font-mono text-slate-500 text-[11px] tabular-nums">
          {legalBallCount}/6 balls
        </span>
      </div>

      <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 no-scrollbar min-h-[30px]">
        {currentOverBalls.length === 0 ? (
          <span className="text-xs text-slate-400 italic">No balls bowled in this over</span>
        ) : (
          currentOverBalls.map((ball) => (
            <div
              key={ball.id}
              className={`w-6 h-6 rounded-full border bg-white dark:bg-slate-900 flex items-center justify-center text-[10px] tabular-nums flex-shrink-0 transition-colors ${getChipStyle(
                ball
              )}`}
              title={`${ball.displayLabel} (by ${ball.bowlerName} to ${ball.batsmanName})`}
            >
              {ball.displayLabel}
            </div>
          ))
        )}

        {/* Empty placeholder rings for remaining legal balls in over */}
        {Array.from({ length: Math.max(0, 6 - legalBallCount) }).map((_, idx) => (
          <div
            key={`placeholder-${idx}`}
            className="w-6 h-6 rounded-full border border-dashed border-slate-200 dark:border-slate-800 flex items-center justify-center text-[9px] text-slate-300 dark:text-slate-700 tabular-nums flex-shrink-0"
          >
            {legalBallCount + idx + 1}
          </div>
        ))}
      </div>
    </div>
  );
};
