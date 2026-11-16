import React, { useState } from 'react';
import { X } from 'lucide-react';
import { WicketType } from '../types/cricket';
import { useMatch } from '../context/MatchContext';
import { useHaptic } from '../hooks/useHaptic';
import { getAvailableBatsmen } from '../utils/cricket';

interface WicketModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WicketModal: React.FC<WicketModalProps> = ({ isOpen, onClose }) => {
  const { match, dispatch } = useMatch();
  const { wicket: triggerWicketHaptic, tap } = useHaptic();

  const [wicketType, setWicketType] = useState<WicketType>('bowled');
  const [outBatsmanRole, setOutBatsmanRole] = useState<'striker' | 'nonStriker'>('striker');
  const [fielderId, setFielderId] = useState<string>('');
  const [runsCompleted, setRunsCompleted] = useState<number>(0);
  const [nextBatsmanId, setNextBatsmanId] = useState<string>('');
  const [nextBatterName, setNextBatterName] = useState<string>('');

  if (!isOpen || !match) return null;

  const currentInnings = match.innings?.[match.currentInningsIndex];
  if (!currentInnings) return null;

  const battingTeam = currentInnings.battingTeamId === 'teamA' ? match.teamA : match.teamB;
  const bowlingTeam = currentInnings.bowlingTeamId === 'teamA' ? match.teamA : match.teamB;
  if (!battingTeam || !bowlingTeam) return null;

  const striker = battingTeam.players?.find((p) => p.id === currentInnings.strikerId);
  const nonStriker = battingTeam.players?.find((p) => p.id === currentInnings.nonStrikerId);
  const outBatsman = outBatsmanRole === 'striker' ? (striker || nonStriker) : (nonStriker || striker);

  // Determine if this wicket causes All Out
  const totalPlayers = battingTeam.players?.length || 0;
  const isAllOut = match.rules?.lastManStands
    ? (currentInnings.wickets || 0) + 1 >= totalPlayers
    : (currentInnings.wickets || 0) + 1 >= Math.max(1, totalPlayers - 1);
  const availableBatsmen = getAvailableBatsmen(battingTeam, currentInnings);

  const wicketOptions: { type: WicketType; label: string; needsFielder?: boolean }[] = [
    { type: 'bowled', label: 'Bowled' },
    { type: 'caught', label: 'Caught', needsFielder: true },
    { type: 'lbw', label: 'LBW' },
    { type: 'runOut', label: 'Run Out', needsFielder: true },
    { type: 'stumped', label: 'Stumped', needsFielder: true },
    { type: 'hitWicket', label: 'Hit Wicket' },
  ];

  const handleConfirmWicket = () => {
    if (!outBatsman) return;

    triggerWicketHaptic();

    dispatch({
      type: 'ADD_WICKET',
      payload: {
        wicketType,
        outBatsmanId: outBatsman.id,
        fielderId: fielderId || undefined,
        runsCompleted: wicketType === 'runOut' ? runsCompleted : 0,
        nextBatsmanId: isAllOut ? undefined : (nextBatsmanId || undefined),
        nextBatsmanName: isAllOut ? undefined : (nextBatterName.trim() || undefined),
      },
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end justify-center backdrop-blur-[2px]">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-t-xl max-h-[85vh] overflow-y-auto p-4 border-t border-slate-200 dark:border-slate-800 shadow-sm animate-fadeIn">
        {/* Drag handle */}
        <div className="w-8 h-1 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-3" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Wicket #{currentInnings.wickets + 1}
            </h2>
            <p className="text-xs text-slate-500">Record dismissal details</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded"
          >
            <X size={18} strokeWidth={1.75} />
          </button>
        </div>

        {/* Free hit alert notice if active */}
        {match.isFreeHit && (
          <div className="mt-3 p-2.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-md text-xs text-amber-800 dark:text-amber-300">
            <strong>Free Hit Active:</strong> Only Run Out is allowed on a free hit.
          </div>
        )}

        {/* Wicket Type (Radio List Style) */}
        <div className="mt-3">
          <label className="text-xs uppercase tracking-wide text-slate-500 font-medium block mb-1.5">
            Dismissal Type
          </label>
          <div className="border border-slate-200 dark:border-slate-800 rounded-md divide-y divide-slate-100 dark:divide-slate-800">
            {wicketOptions.map((opt) => {
              const isDisabled = match.isFreeHit && opt.type !== 'runOut';
              const isSelected = wicketType === opt.type;

              return (
                <label
                  key={opt.type}
                  onClick={() => {
                    if (!isDisabled) {
                      tap();
                      setWicketType(opt.type);
                    }
                  }}
                  className={`flex items-center justify-between px-3 py-2 text-xs cursor-pointer transition-colors ${
                    isDisabled
                      ? 'opacity-30 cursor-not-allowed bg-slate-50 dark:bg-slate-850'
                      : isSelected
                      ? 'bg-slate-50 dark:bg-slate-800/60 font-semibold text-slate-900 dark:text-slate-100'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50/50'
                  }`}
                >
                  <span>{opt.label}</span>
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      isSelected
                        ? 'border-emerald-700 dark:border-emerald-500'
                        : 'border-slate-300 dark:border-slate-600'
                    }`}
                  >
                    {isSelected && (
                      <div className="w-2 h-2 rounded-full bg-emerald-700 dark:bg-emerald-500" />
                    )}
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        {/* Out Batsman */}
        <div className="mt-3">
          <label className="text-xs uppercase tracking-wide text-slate-500 font-medium block mb-1.5">
            Batter Dismissed
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                tap();
                setOutBatsmanRole('striker');
              }}
              className={`h-11 rounded-md border text-left px-3 text-xs transition-colors flex items-center justify-between ${
                outBatsmanRole === 'striker'
                  ? 'border-emerald-700 bg-emerald-50/50 dark:border-emerald-600 dark:bg-emerald-950/20 font-semibold text-slate-900 dark:text-slate-100'
                  : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
              }`}
            >
              <span className="truncate">{striker?.name || 'Striker'} *</span>
            </button>

            <button
              type="button"
              onClick={() => {
                tap();
                setOutBatsmanRole('nonStriker');
              }}
              className={`h-11 rounded-md border text-left px-3 text-xs transition-colors flex items-center justify-between ${
                outBatsmanRole === 'nonStriker'
                  ? 'border-emerald-700 bg-emerald-50/50 dark:border-emerald-600 dark:bg-emerald-950/20 font-semibold text-slate-900 dark:text-slate-100'
                  : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
              }`}
            >
              <span className="truncate">{nonStriker?.name || 'Non-Striker'}</span>
            </button>
          </div>
        </div>

        {/* Run Out Runs Completed */}
        {wicketType === 'runOut' && (
          <div className="mt-3">
            <label className="text-xs uppercase tracking-wide text-slate-500 font-medium block mb-1.5">
              Runs Completed Before Run Out
            </label>
            <div className="flex gap-2">
              {[0, 1, 2].map((run) => (
                <button
                  type="button"
                  key={run}
                  onClick={() => {
                    tap();
                    setRunsCompleted(run);
                  }}
                  className={`flex-1 h-9 rounded-md border text-xs font-medium tabular-nums transition-colors ${
                    runsCompleted === run
                      ? 'border-emerald-700 bg-emerald-50/50 text-emerald-700 font-semibold dark:border-emerald-600 dark:text-emerald-400'
                      : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {run} {run === 1 ? 'run' : 'runs'}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Fielder Selection */}
        {(wicketType === 'caught' || wicketType === 'stumped' || wicketType === 'runOut') && (
          <div className="mt-3">
            <label className="text-xs uppercase tracking-wide text-slate-500 font-medium block mb-1">
              Fielder / Catcher (Optional)
            </label>
            <select
              value={fielderId}
              onChange={(e) => setFielderId(e.target.value)}
              className="w-full h-10 px-3 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:ring-1 focus:ring-emerald-700 focus:outline-none"
            >
              <option value="">-- None / Bowler --</option>
              {bowlingTeam.players.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.id === currentInnings.currentBowlerId ? '(Bowler)' : ''}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Next Batsman (if not all out) */}
        {!isAllOut && (
          <div className="mt-3">
            <label className="text-xs uppercase tracking-wide text-slate-500 font-medium block mb-1">
              Next Batter
            </label>
            <input
              type="text"
              value={nextBatterName}
              onChange={(e) => {
                setNextBatterName(e.target.value);
                setNextBatsmanId('');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleConfirmWicket();
                }
              }}
              placeholder="Enter new batter name..."
              className="w-full h-11 px-3 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:ring-1 focus:ring-emerald-700 focus:outline-none font-medium"
            />

            {/* Quick chips if players exist */}
            {availableBatsmen.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5 items-center">
                <span className="text-[11px] text-slate-400">Or select:</span>
                {availableBatsmen.map((p) => {
                  const isSelected =
                    nextBatsmanId === p.id ||
                    (nextBatterName || '').trim().toLowerCase() === (p.name || '').toLowerCase();
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        tap();
                        setNextBatsmanId(p.id);
                        setNextBatterName(p.name);
                      }}
                      className={`px-2.5 py-1 rounded text-xs transition-colors ${
                        isSelected
                          ? 'bg-emerald-700 text-white font-medium'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {p.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* All Out notice */}
        {isAllOut && (
          <div className="mt-3 p-2 bg-slate-100 dark:bg-slate-800 rounded-md text-xs text-slate-600 dark:text-slate-300">
            <strong>All Out:</strong> {currentInnings.wickets + 1} wickets fallen. Innings will conclude.
          </div>
        )}

        {/* Action button */}
        <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 h-11 rounded-md border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirmWicket}
            className="flex-1 h-11 rounded-md bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-medium transition-colors active:bg-emerald-900"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};
