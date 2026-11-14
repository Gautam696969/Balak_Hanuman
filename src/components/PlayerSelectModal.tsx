import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useMatch } from '../context/MatchContext';
import { useHaptic } from '../hooks/useHaptic';
import { getAvailableBatsmen } from '../utils/cricket';

interface PlayerSelectModalProps {
  type: 'bowler' | 'batsman';
  isOpen: boolean;
  onClose: () => void;
}

export const PlayerSelectModal: React.FC<PlayerSelectModalProps> = ({
  type,
  isOpen,
  onClose,
}) => {
  const { match, dispatch, replacingBatsmanRole } = useMatch();
  const { tap } = useHaptic();
  const [selectedId, setSelectedId] = useState<string>('');

  if (!isOpen || !match) return null;

  const currentInnings = match.innings[match.currentInningsIndex];
  const battingTeam = currentInnings.battingTeamId === 'teamA' ? match.teamA : match.teamB;
  const bowlingTeam = currentInnings.bowlingTeamId === 'teamA' ? match.teamA : match.teamB;

  const availableBatsmen = getAvailableBatsmen(battingTeam, currentInnings);

  const handleConfirm = () => {
    if (!selectedId) return;
    tap();

    if (type === 'bowler') {
      dispatch({ type: 'SET_BOWLER', payload: { bowlerId: selectedId } });
    } else {
      dispatch({
        type: 'SET_BATTER',
        payload: {
          batsmanId: selectedId,
          replaceRole: replacingBatsmanRole,
        },
      });
    }

    setSelectedId('');
    onClose();
  };

  const currentOverNumber = Math.floor(currentInnings.legalBalls / 6) + 1;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end justify-center backdrop-blur-[2px]">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-t-xl max-h-[85vh] overflow-y-auto p-4 border-t border-slate-200 dark:border-slate-800 shadow-sm animate-fadeIn">
        {/* Drag handle */}
        <div className="w-8 h-1 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-3" />

        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              {type === 'bowler' ? `Select Bowler (Over ${currentOverNumber})` : 'Select Incoming Batter'}
            </h2>
            <p className="text-xs text-slate-500">
              {type === 'bowler'
                ? 'Select a bowler (cannot bowl consecutive overs)'
                : `Replacing ${replacingBatsmanRole === 'striker' ? 'Striker' : 'Non-Striker'}`}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded"
          >
            <X size={18} strokeWidth={1.75} />
          </button>
        </div>

        {/* Bowler List */}
        {type === 'bowler' && (
          <div className="mt-3 border border-slate-200 dark:border-slate-800 rounded-md divide-y divide-slate-100 dark:divide-slate-800">
            {bowlingTeam.players.map((player) => {
              const isPreviousBowler =
                bowlingTeam.players.length > 1 &&
                currentInnings.previousBowlerId &&
                player.id === currentInnings.previousBowlerId;

              const ballsBowled = currentInnings.allBalls.filter(
                (b) => b.bowlerId === player.id && b.isLegal
              ).length;
              const completedOvers = Math.floor(ballsBowled / 6);
              const isOverLimit =
                match.rules.maxOversPerBowler &&
                completedOvers >= match.rules.maxOversPerBowler;

              const isDisabled = isPreviousBowler || isOverLimit;
              const isSelected = selectedId === player.id;

              return (
                <label
                  key={player.id}
                  onClick={() => {
                    if (!isDisabled) {
                      tap();
                      setSelectedId(player.id);
                    }
                  }}
                  className={`flex items-center justify-between px-3 py-2.5 text-xs transition-colors ${
                    isDisabled
                      ? 'opacity-40 bg-slate-50 dark:bg-slate-850 cursor-not-allowed'
                      : isSelected
                      ? 'bg-slate-50 dark:bg-slate-800/60 font-semibold text-slate-900 dark:text-slate-100 cursor-pointer'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50/50 cursor-pointer'
                  }`}
                >
                  <div>
                    <span className="font-medium text-slate-900 dark:text-slate-100">{player.name}</span>
                    <span className="text-[10px] text-slate-400 block tabular-nums">
                      {Math.floor(ballsBowled / 6)}.{ballsBowled % 6} ov bowled
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {isPreviousBowler ? (
                      <span className="text-[10px] text-slate-400">Consecutive</span>
                    ) : isOverLimit ? (
                      <span className="text-[10px] text-slate-400">Quota Reached</span>
                    ) : null}

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
                  </div>
                </label>
              );
            })}
          </div>
        )}

        {/* Batsman List */}
        {type === 'batsman' && (
          <div className="mt-3 border border-slate-200 dark:border-slate-800 rounded-md divide-y divide-slate-100 dark:divide-slate-800">
            {availableBatsmen.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400">
                No more batsmen available in lineup.
              </div>
            ) : (
              availableBatsmen.map((player) => {
                const isSelected = selectedId === player.id;
                return (
                  <label
                    key={player.id}
                    onClick={() => {
                      tap();
                      setSelectedId(player.id);
                    }}
                    className={`flex items-center justify-between px-3 py-2.5 text-xs cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-slate-50 dark:bg-slate-800/60 font-semibold text-slate-900 dark:text-slate-100'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50/50'
                    }`}
                  >
                    <span>{player.name}</span>
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
              })
            )}
          </div>
        )}

        {/* Action Buttons */}
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
            disabled={!selectedId}
            onClick={handleConfirm}
            className={`flex-1 h-11 rounded-md text-sm font-medium transition-colors ${
              selectedId
                ? 'bg-emerald-700 hover:bg-emerald-800 text-white active:bg-emerald-900'
                : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
            }`}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};
