import React, { useState } from 'react';
import { Trash2, ChevronRight, X } from 'lucide-react';
import { useMatch } from '../context/MatchContext';
import { useHaptic } from '../hooks/useHaptic';
import { MatchSummary } from '../types/cricket';
import { Scorecard } from '../components/Scorecard';

export const History: React.FC = () => {
  const { savedMatches, dispatch } = useMatch();
  const { tap } = useHaptic();
  const [selectedMatch, setSelectedMatch] = useState<MatchSummary | null>(null);

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    tap();
    if (confirm('Delete this match record?')) {
      dispatch({ type: 'DELETE_SAVED_MATCH', payload: { id } });
      if (selectedMatch?.id === id) {
        setSelectedMatch(null);
      }
    }
  };

  const handleLoadPastMatch = (matchSummary: MatchSummary) => {
    tap();
    dispatch({ type: 'LOAD_MATCH', payload: { match: matchSummary.fullMatch } });
    setSelectedMatch(null);
  };

  return (
    <div className="max-w-md mx-auto p-4 pb-24">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Match History
          </h1>
          <p className="text-xs text-slate-500">
            Saved match records and past scorecards
          </p>
        </div>
        <span className="text-xs font-mono font-medium text-slate-400 tabular-nums">
          {savedMatches.length} {savedMatches.length === 1 ? 'match' : 'matches'}
        </span>
      </div>

      {savedMatches.length === 0 ? (
        <div className="p-8 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm mt-4">
          <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
            No saved matches
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Matches are automatically recorded when completed.
          </p>
        </div>
      ) : (
        <div className="border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800 shadow-sm">
          {savedMatches.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedMatch(item)}
              className="p-3.5 hover:bg-slate-50/70 dark:hover:bg-slate-850 transition-colors cursor-pointer flex items-center justify-between"
            >
              <div className="pr-3">
                <div className="flex items-baseline gap-2">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {item.teamAName} <span className="text-slate-400 font-normal">v</span> {item.teamBName}
                  </h3>
                  <span className="text-[10px] text-slate-400 tabular-nums font-mono">{item.date}</span>
                </div>

                <div className="text-xs font-mono text-slate-500 mt-1 tabular-nums">
                  <span>{item.innings1Score}</span>
                  {item.innings2Score && <span className="ml-2">&bull; {item.innings2Score}</span>}
                </div>

                <div className="text-xs font-medium text-emerald-700 dark:text-emerald-400 mt-0.5">
                  {item.resultText}
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={(e) => handleDelete(e, item.id)}
                  className="p-1.5 text-slate-400 hover:text-red-600 rounded transition-colors"
                  title="Delete match"
                >
                  <Trash2 size={16} strokeWidth={1.75} />
                </button>
                <ChevronRight size={18} strokeWidth={1.75} className="text-slate-400" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Scorecard Modal for viewing past match */}
      {selectedMatch && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end justify-center backdrop-blur-[2px]">
          <div className="bg-slate-50 dark:bg-slate-950 w-full max-w-md rounded-t-xl max-h-[90vh] overflow-y-auto p-4 border-t border-slate-200 dark:border-slate-800 shadow-sm animate-fadeIn">
            <div className="w-8 h-1 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-3" />
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-3">
              <div>
                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {selectedMatch.teamAName} v {selectedMatch.teamBName}
                </h2>
                <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                  {selectedMatch.resultText}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleLoadPastMatch(selectedMatch)}
                  className="h-8 px-2.5 rounded-md bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-medium transition-colors"
                >
                  Load Match
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedMatch(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded"
                >
                  <X size={18} strokeWidth={1.75} />
                </button>
              </div>
            </div>

            <Scorecard />
          </div>
        </div>
      )}
    </div>
  );
};
