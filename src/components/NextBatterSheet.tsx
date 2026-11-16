import React, { useState, useRef, useEffect } from 'react';
import { UserCheck, X } from 'lucide-react';
import { useMatch } from '../context/MatchContext';
import { useHaptic } from '../hooks/useHaptic';
import { getAvailableBatsmen } from '../utils/cricket';

interface NextBatterSheetProps {
  isOpen: boolean;
  onClose?: () => void;
}

export const NextBatterSheet: React.FC<NextBatterSheetProps> = ({ isOpen, onClose }) => {
  const { match, dispatch, replacingBatsmanRole } = useMatch();
  const { tap } = useHaptic();
  const [typedName, setTypedName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTypedName('');
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen || !match) return null;

  const currentInnings = match.innings[match.currentInningsIndex];
  if (!currentInnings) return null;

  const battingTeam = currentInnings.battingTeamId === 'teamA' ? match.teamA : match.teamB;
  if (!battingTeam) return null;

  const availableBatsmen = getAvailableBatsmen(battingTeam, currentInnings);

  const handleDismiss = () => {
    tap();
    if (onClose) {
      onClose();
    } else {
      dispatch({ type: 'CLOSE_BATSMAN_MODAL' });
    }
  };

  const handleSelectExistingBatter = (batsmanId: string) => {
    tap();
    dispatch({
      type: 'SET_BATTER',
      payload: { batsmanId, replaceRole: replacingBatsmanRole || 'striker' },
    });
    setTypedName('');
    if (onClose) onClose();
  };

  const handleAddNewBatter = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = typedName.trim();
    if (!trimmed) return;

    tap();
    const existing = battingTeam.players.find(
      (p) => (p.name || '').toLowerCase() === trimmed.toLowerCase()
    );

    if (existing) {
      handleSelectExistingBatter(existing.id);
    } else {
      dispatch({
        type: 'ADD_AND_SET_BATTER',
        payload: { name: trimmed, replaceRole: replacingBatsmanRole || 'striker' },
      });
      setTypedName('');
      if (onClose) onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end justify-center backdrop-blur-[2px]">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-t-xl max-h-[85vh] overflow-y-auto p-4 border-t border-slate-200 dark:border-slate-800 shadow-sm animate-fadeIn">
        <div className="w-8 h-1 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-3" />

        <div className="pb-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              New Batter ({replacingBatsmanRole === 'striker' ? 'Striker' : 'Non-Striker'})
            </h2>
            <p className="text-xs text-slate-500">
              Type batter name or pick from available players
            </p>
          </div>
          <button
            type="button"
            onClick={handleDismiss}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded"
            title="Close"
          >
            <X size={18} strokeWidth={1.75} />
          </button>
        </div>

        {/* 1. Autofocused text input bar with Set Batter button */}
        <form onSubmit={handleAddNewBatter} className="mt-3 flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={typedName}
            onChange={(e) => setTypedName(e.target.value)}
            placeholder="Enter new batter name..."
            className="flex-1 h-12 px-3 text-sm rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-amber-500 font-medium"
          />
          <button
            type="submit"
            disabled={!typedName.trim()}
            className={`h-12 px-4 rounded-md text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              typedName.trim()
                ? 'bg-amber-600 hover:bg-amber-700 text-white active:bg-amber-800 shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-200 dark:border-slate-700'
            }`}
          >
            <UserCheck size={16} strokeWidth={2} />
            <span>Set Batter</span>
          </button>
        </form>

        {/* 2. Quick chips or list of available unbatted players */}
        {availableBatsmen.length > 0 ? (
          <div className="mt-3">
            <span className="text-[11px] uppercase tracking-wide text-slate-400 font-medium block mb-1.5">
              Available Players ({battingTeam.name})
            </span>
            <div className="flex flex-wrap gap-1.5">
              {availableBatsmen.map((player) => (
                <button
                  key={player.id}
                  type="button"
                  onClick={() => handleSelectExistingBatter(player.id)}
                  className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-amber-950/30 hover:border-amber-300 active:bg-slate-300 rounded-md text-xs font-medium text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors"
                >
                  {player.name}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="mt-3 p-2 bg-slate-50 dark:bg-slate-800/50 rounded text-xs text-slate-500">
            No other listed players on bench. Type a new name above to add to {battingTeam.name}.
          </div>
        )}

        <div className="mt-4 pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={handleDismiss}
            className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          >
            Cancel / Select Later
          </button>
        </div>
      </div>
    </div>
  );
};
