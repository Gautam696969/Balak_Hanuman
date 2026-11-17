import React, { useState, useRef, useEffect } from 'react';
import { UserCheck, Undo2 } from 'lucide-react';
import { useMatch } from '../context/MatchContext';
import { useHaptic } from '../hooks/useHaptic';

interface NextBowlerSheetProps {
  isOpen: boolean;
  isMidOverChange?: boolean;
  onClose?: () => void;
}

export const NextBowlerSheet: React.FC<NextBowlerSheetProps> = ({
  isOpen,
  isMidOverChange = false,
  onClose,
}) => {
  const { match, historyStack, dispatch } = useMatch();
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
  const bowlingTeam = currentInnings.bowlingTeamId === 'teamA' ? match.teamA : match.teamB;

  const currentOverNumber = Math.floor(currentInnings.legalBalls / 6) + 1;

  const query = typedName.trim().toLowerCase();

  // Keep all bowlers in list so modal size stays fixed and constant,
  // but sort matching bowlers directly to the top when typing ("name sirf upar aaye")
  const sortedBowlers = [...bowlingTeam.players].sort((a, b) => {
    if (!query) return 0;
    const aName = a.name.toLowerCase();
    const bName = b.name.toLowerCase();

    const aExact = aName === query;
    const bExact = bName === query;
    if (aExact && !bExact) return -1;
    if (!aExact && bExact) return 1;

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

  const handleUndo = () => {
    if ((historyStack || []).length === 0) return;
    tap();
    dispatch({ type: 'UNDO' });
    if (onClose) onClose();
  };

  const handleSelectExistingBowler = (bowlerId: string) => {
    tap();
    if (isMidOverChange) {
      dispatch({ type: 'CHANGE_BOWLER_MID_OVER', payload: { bowlerId } });
    } else {
      dispatch({ type: 'SET_BOWLER', payload: { bowlerId } });
    }
    setTypedName('');
    if (onClose) onClose();
  };

  const handleBowlerRowClick = (player: (typeof bowlingTeam.players)[0], isDisabled?: boolean) => {
    if (isDisabled) return;
    tap();
    const isAlreadySelected = typedName.trim().toLowerCase() === player.name.toLowerCase();
    if (isAlreadySelected) {
      handleSelectExistingBowler(player.id);
    } else {
      setTypedName(player.name);
      inputRef.current?.focus();
    }
  };

  const handleAddNewBowler = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = typedName.trim();
    if (!trimmed) return;

    tap();
    const existing = bowlingTeam.players.find(
      (p) => p.name.toLowerCase() === trimmed.toLowerCase()
    );

    if (existing) {
      const isPreviousBowler =
        !isMidOverChange &&
        bowlingTeam.players.length > 1 &&
        currentInnings.previousBowlerId &&
        existing.id === currentInnings.previousBowlerId;
      const ballsBowled = currentInnings.allBalls.filter(
        (b) => b.bowlerId === existing.id && b.isLegal
      ).length;
      const completedOvers = Math.floor(ballsBowled / 6);
      const isOverLimit = Boolean(
        match.rules.maxOversPerBowler && completedOvers >= match.rules.maxOversPerBowler
      );

      if (isPreviousBowler) {
        alert(`${existing.name} bowled the previous over and cannot bowl consecutive overs!`);
        return;
      }
      if (isOverLimit) {
        alert(`${existing.name} has reached the maximum overs limit!`);
        return;
      }
      handleSelectExistingBowler(existing.id);
    } else {
      dispatch({ type: 'ADD_AND_SET_BOWLER', payload: { name: trimmed } });
      setTypedName('');
      if (onClose) onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end justify-center backdrop-blur-[2px]">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-t-xl h-[540px] max-h-[85vh] flex flex-col p-4 border-t border-slate-200 dark:border-slate-800 shadow-sm animate-fadeIn">
        <div className="w-8 h-1 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-3 flex-shrink-0" />

        <div className="pb-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 flex-shrink-0">
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 truncate">
              {isMidOverChange ? 'Change Bowler (Mid-Over)' : `Select Next Bowler (Over ${currentOverNumber})`}
            </h2>
            <p className="text-xs text-slate-500 truncate">
              Choose an existing bowler or type a new name
            </p>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {(historyStack || []).length > 0 && (
              <button
                type="button"
                onClick={handleUndo}
                className="h-8 px-2.5 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 hover:border-amber-400 dark:hover:border-amber-500 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs active:scale-95"
                title="Undo last delivery"
              >
                <Undo2 size={14} strokeWidth={2} />
                <span>Undo</span>
              </button>
            )}
            {isMidOverChange && onClose && (
              <button
                type="button"
                onClick={onClose}
                className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 px-2 py-1 rounded"
              >
                Cancel
              </button>
            )}
          </div>
        </div>

        {/* 1. Autofocused text input with Set Bowler button */}
        <form onSubmit={handleAddNewBowler} className="mt-3 flex gap-2 flex-shrink-0">
          <input
            ref={inputRef}
            type="text"
            value={typedName}
            onChange={(e) => setTypedName(e.target.value)}
            placeholder="Enter bowler name..."
            className="flex-1 h-12 px-3 text-sm rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-700 font-medium"
          />
          <button
            type="submit"
            disabled={!typedName.trim()}
            className={`h-12 px-4 rounded-md text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              typedName.trim()
                ? 'bg-emerald-700 hover:bg-emerald-800 text-white active:bg-emerald-900'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-200 dark:border-slate-700'
            }`}
          >
            <UserCheck size={16} strokeWidth={2} />
            <span>Set Bowler</span>
          </button>
        </form>

        {/* 2. List of existing bowling-team players as tappable rows with stats (O-R-W) */}
        <div className="mt-3 flex-1 flex flex-col min-h-0">
          <span className="text-[11px] uppercase tracking-wide text-slate-400 font-medium block mb-1.5 flex-shrink-0">
            {bowlingTeam.name} Bowlers
          </span>

          <div className="border border-slate-200 dark:border-slate-800 rounded-md divide-y divide-slate-100 dark:divide-slate-800 flex-1 overflow-y-auto min-h-0">
            {query && !bowlingTeam.players.some((p) => p.name.toLowerCase().includes(query)) && (
              <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 flex items-center justify-between">
                <span>New player: <strong>"{typedName.trim()}"</strong></span>
                <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">Click Set Bowler</span>
              </div>
            )}
            {sortedBowlers.map((player) => {
              const isPreviousBowler =
                !isMidOverChange &&
                bowlingTeam.players.length > 1 &&
                currentInnings.previousBowlerId &&
                player.id === currentInnings.previousBowlerId;

              const isCurrentBowler = isMidOverChange && player.id === currentInnings.currentBowlerId;

              const ballsBowled = currentInnings.allBalls.filter(
                (b) => b.bowlerId === player.id && b.isLegal
              ).length;
              const completedOvers = Math.floor(ballsBowled / 6);
              const remainderBalls = ballsBowled % 6;
              const oversFormatted = `${completedOvers}.${remainderBalls}`;

              const runsConceded = currentInnings.allBalls
                .filter((b) => b.bowlerId === player.id)
                .reduce((sum, b) => {
                  let r = b.runsOffBat;
                  if (b.extraType === 'wd') r += b.extraRuns;
                  if (b.extraType === 'nb') r += 1;
                  return sum + r;
                }, 0);

              const wickets = currentInnings.allBalls.filter(
                (b) => b.bowlerId === player.id && b.wicket && b.wicket.type !== 'runOut'
              ).length;

              const isOverLimit =
                match.rules.maxOversPerBowler &&
                completedOvers >= match.rules.maxOversPerBowler;

              const isDisabled = isPreviousBowler || isCurrentBowler || isOverLimit;
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
                  disabled={Boolean(isDisabled)}
                  onClick={() => handleBowlerRowClick(player, Boolean(isDisabled))}
                  className={`w-full px-3 py-2.5 text-xs text-left transition-colors flex items-center justify-between ${
                    isDisabled
                      ? 'opacity-40 bg-slate-50 dark:bg-slate-800 cursor-not-allowed'
                      : isSelected
                      ? 'border border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-slate-900 dark:text-slate-100 shadow-xs'
                      : isMatch
                      ? 'bg-emerald-50/40 dark:bg-emerald-950/20 font-medium text-slate-900 dark:text-slate-100'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800 active:bg-slate-100 text-slate-800 dark:text-slate-200'
                  }`}
                >
                  <div>
                    <span className="font-medium text-slate-900 dark:text-slate-100">{player.name}</span>
                    {player.isCaptain && <span className="text-[10px] text-slate-400 ml-1">(C)</span>}
                    {player.isViceCaptain && <span className="text-[10px] text-slate-400 ml-1">(VC)</span>}
                    {isSelected && !isDisabled && (
                      <span className="ml-2 text-[10px] bg-emerald-700 text-white px-1.5 py-0.5 rounded font-semibold">
                        Selected
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-mono text-slate-500 tabular-nums text-[11px]">
                      {oversFormatted} ov &bull; {runsConceded} r &bull; {wickets} w
                    </span>

                    {isPreviousBowler && (
                      <span className="text-[10px] text-slate-400 border border-slate-200 dark:border-slate-700 px-1.5 py-0.5 rounded">
                        bowled last over
                      </span>
                    )}

                    {isOverLimit && (
                      <span className="text-[10px] text-slate-400 border border-slate-200 dark:border-slate-700 px-1.5 py-0.5 rounded">
                        max overs reached
                      </span>
                    )}

                    {isSelected && !isDisabled && (
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectExistingBowler(player.id);
                        }}
                        className="px-2 py-0.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-[11px] font-semibold transition-colors cursor-pointer"
                      >
                        Confirm
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {(historyStack || []).length > 0 && (
          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs flex-shrink-0">
            <button
              type="button"
              onClick={handleUndo}
              className="px-3 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 font-medium flex items-center gap-1.5 transition-colors"
            >
              <Undo2 size={13} strokeWidth={2} />
              <span>Undo Last Ball ({historyStack.length})</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

