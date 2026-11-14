import React from 'react';
import { Scorecard as ScorecardComponent } from '../components/Scorecard';
import { useMatch } from '../context/MatchContext';
import { Share2 } from 'lucide-react';
import { useHaptic } from '../hooks/useHaptic';

export const ScorecardPage: React.FC = () => {
  const { match } = useMatch();
  const { tap } = useHaptic();

  if (!match) {
    return (
      <div className="max-w-md mx-auto p-6 text-center text-slate-500 mt-20">
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">No Match in Progress</h2>
        <p className="text-xs text-slate-400 mt-1">Start a match on the Setup tab to view the live scorecard.</p>
      </div>
    );
  }

  const handleShare = async () => {
    tap();
    const [inn1, inn2] = match.innings;
    const text = `Cricket Match Scorecard:\n${match.teamA.name} vs ${match.teamB.name}\n1st Inn: ${inn1.totalRuns}/${inn1.wickets} (${inn1.oversFormatted} ov)\n2nd Inn: ${inn2.totalRuns}/${inn2.wickets} (${inn2.oversFormatted} ov)\nResult: ${match.result?.marginText || 'Live'}`;

    if (navigator.share) {
      try {
        await navigator.share({ title: 'Cricket Scorecard', text });
      } catch {}
    } else {
      navigator.clipboard.writeText(text);
      alert('Scorecard copied to clipboard.');
    }
  };

  return (
    <div className="max-w-md mx-auto p-4 pb-24">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Scorecard
          </h1>
          <p className="text-xs text-slate-500">
            {match.teamA.name} v {match.teamB.name} &bull; {match.rules.totalOvers} Overs
          </p>
        </div>

        <button
          type="button"
          onClick={handleShare}
          className="h-9 px-2.5 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5 text-xs font-medium transition-colors"
        >
          <Share2 size={16} strokeWidth={1.75} />
          <span>Share</span>
        </button>
      </div>

      <ScorecardComponent />
    </div>
  );
};
