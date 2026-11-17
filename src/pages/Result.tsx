import React from 'react';
import { RotateCcw, Share2, Undo2 } from 'lucide-react';
import { useMatch } from '../context/MatchContext';
import { useHaptic } from '../hooks/useHaptic';
import { Scorecard } from '../components/Scorecard';

export const Result: React.FC = () => {
  const { match, historyStack, dispatch } = useMatch();
  const { tap } = useHaptic();

  if (!match) return null;

  const [inn1, inn2] = match.innings;
  const team1 = inn1.battingTeamId === 'teamA' ? match.teamA : match.teamB;
  const team2 = inn1.battingTeamId === 'teamA' ? match.teamB : match.teamA;

  const resultText = match.result?.marginText || 'Match Finished';

  const handleNewMatch = () => {
    tap();
    dispatch({ type: 'RESET' });
  };

  const handleShare = async () => {
    tap();
    const shareData = {
      title: 'Cricket Match Result',
      text: `${match.teamA.name} vs ${match.teamB.name}\n${team1.name}: ${inn1.totalRuns}/${inn1.wickets} (${inn1.oversFormatted})\n${team2.name}: ${inn2.totalRuns}/${inn2.wickets} (${inn2.oversFormatted})\nResult: ${resultText}`,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {}
    } else {
      navigator.clipboard.writeText(shareData.text);
      alert('Match result copied to clipboard.');
    }
  };

  return (
    <div className="max-w-md mx-auto p-4 pb-24 space-y-4">
      {/* Calm, minimal result card (No gradients, no bright fills, no emojis) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 shadow-sm">
        <div className="text-xs uppercase tracking-wide text-slate-400 font-medium">
          Final Result
        </div>
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mt-1">
          {resultText}
        </h1>

        {/* Scores summary rows */}
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs tabular-nums">
          <div className="flex items-center justify-between">
            <span className="text-slate-600 dark:text-slate-400 font-medium">{team1.name}</span>
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              {inn1.totalRuns}/{inn1.wickets}{' '}
              <span className="text-slate-400 font-normal">({inn1.oversFormatted} ov)</span>
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-600 dark:text-slate-400 font-medium">{team2.name}</span>
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              {inn2.totalRuns}/{inn2.wickets}{' '}
              <span className="text-slate-400 font-normal">({inn2.oversFormatted} ov)</span>
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex gap-2">
          {(historyStack || []).length > 0 && (
            <button
              type="button"
              onClick={() => {
                tap();
                dispatch({ type: 'UNDO' });
              }}
              className="h-10 px-3 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors shadow-xs active:scale-95"
              title="Undo last delivery"
            >
              <Undo2 size={15} strokeWidth={1.75} />
              <span>Undo</span>
            </button>
          )}
          <button
            type="button"
            onClick={handleShare}
            className="flex-1 h-10 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-1.5"
          >
            <Share2 size={16} strokeWidth={1.75} />
            <span>Share</span>
          </button>
          <button
            type="button"
            onClick={handleNewMatch}
            className="flex-1 h-10 rounded-md bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
          >
            <RotateCcw size={16} strokeWidth={1.75} />
            <span>New Match</span>
          </button>
        </div>
      </div>

      {/* Scorecard */}
      <div>
        <div className="text-xs uppercase tracking-wide text-slate-500 font-medium mb-2 px-1">
          Full Scorecard
        </div>
        <Scorecard />
      </div>
    </div>
  );
};
