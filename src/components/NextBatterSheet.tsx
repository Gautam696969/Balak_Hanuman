import React, { useState, useRef, useEffect } from 'react';
import { UserCheck, Undo2 } from 'lucide-react';
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

  const query = typedName.trim().toLowerCase();

  const sortedBatsmen = [...availableBatsmen].sort((a, b) => {
    if (!query) return 0;
    const aName = a.name.toLowerCase();
    const bName = b.name.toLowerCase();
    const aStarts = aName.startsWith(query);
    const bStarts = bName.startsWith(query);
    if (aStarts && !bStarts) return -1;
    if (!aStarts && bStarts) return 1;

    const aWordStarts = aName.split(/\s+/).some((p) => p.startsWith(query));
    const bWordStarts = bName.split(/\s+/).some((p) => p.startsWith(query));
    if (aWordStarts && !bWordStarts) return -1;
    if (!aWordStarts && bWordStarts) return 1;

    const aContains = aName.includes(query);
    const bContains = bName.includes(query);
    if (aContains && !bContains) return -1;
    if (!aContains && bContains) return 1;

    return aName.localeCompare(bName);
  });

  const handleDismiss = () => {
    tap();
    if (onClose) {
      onClose();
    } else {
      dispatch({ type: 'CLOSE_BATSMAN_MODAL' });
    }
  };

  const handleUndo = () => {
    handleDismiss();
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

  const handleBatterChipClick = (player: (typeof availableBatsmen)[0]) => {
    tap();
    const isAlreadySelected = typedName.trim().toLowerCase() === player.name.toLowerCase();
    if (isAlreadySelected) {
      handleSelectExistingBatter(player.id);
    } else {
      setTypedName(player.name);
      inputRef.current?.focus();
    }
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
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-t-xl h-[480px] max-h-[85vh] flex flex-col p-4 border-t border-slate-200 dark:border-slate-800 shadow-sm animate-fadeIn">
        <div className="w-8 h-1 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-3 flex-shrink-0" />

        <div className="pb-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 flex-shrink-0">
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 truncate">
              New Batter ({replacingBatsmanRole === 'striker' ? 'Striker' : 'Non-Striker'})
            </h2>
            <p className="text-xs text-slate-500 truncate">
              Type batter name or pick from available players
            </p>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              type="button"
              onClick={handleUndo}
              className="h-8 px-2.5 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 hover:border-amber-400 dark:hover:border-amber-500 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs active:scale-95"
              title="Undo / Close"
            >
              <Undo2 size={14} strokeWidth={2} />
              <span>Undo</span>
            </button>
          </div>
        </div>

        {/* 1. Autofocused text input bar with Set Batter button */}
        <form onSubmit={handleAddNewBatter} className="mt-3 flex gap-2 flex-shrink-0">
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
        <div className="mt-3 flex-1 flex flex-col min-h-0">
          <span className="text-[11px] uppercase tracking-wide text-slate-400 font-medium block mb-1.5 flex-shrink-0">
            Available Players ({battingTeam.name})
          </span>
          {availableBatsmen.length > 0 ? (
            <div className="flex-1 overflow-y-auto min-h-0">
              <div className="flex flex-wrap gap-1.5">
                {sortedBatsmen.map((player) => {
                  const isSelected = typedName.trim().toLowerCase() === player.name.toLowerCase();
                  const isMatch = Boolean(
                    query &&
                      (player.name.toLowerCase().startsWith(query) ||
                        player.name.toLowerCase().includes(query))
                  );
                  return (
                    <button
                      key={player.id}
                      type="button"
                      onClick={() => handleBatterChipClick(player)}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                          : isMatch
                          ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 border-amber-400 dark:border-amber-600 font-semibold'
                          : 'bg-slate-100 dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-amber-950/30 hover:border-amber-300 active:bg-slate-300 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <span>{player.name}</span>
                      {isSelected && <span className="text-[10px] font-bold">✓</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded text-xs text-slate-500">
              No other listed players on bench. Type a new name above to add to {battingTeam.name}.
            </div>
          )}
        </div>

        <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between flex-shrink-0">
          <button
            type="button"
            onClick={handleUndo}
            className="px-3 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 font-medium text-xs flex items-center gap-1.5 transition-colors"
          >
            <Undo2 size={13} strokeWidth={2} />
            <span>Undo</span>
          </button>
          <button
            type="button"
            onClick={handleUndo}
            className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          >
            Cancel / Select Later
          </button>
        </div>
      </div>
    </div>
  );
};
