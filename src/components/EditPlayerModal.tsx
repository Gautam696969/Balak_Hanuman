import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import { useMatch } from '../context/MatchContext';
import { useHaptic } from '../hooks/useHaptic';

interface EditPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EditPlayerModal: React.FC<EditPlayerModalProps> = ({ isOpen, onClose }) => {
  const { match, dispatch } = useMatch();
  const { tap } = useHaptic();

  const [selectedTeamId, setSelectedTeamId] = useState<'teamA' | 'teamB'>('teamA');
  const [editingPlayerId, setEditingPlayerId] = useState<string>('');
  const [nameValue, setNameValue] = useState<string>('');

  if (!isOpen || !match) return null;

  const activeTeam = selectedTeamId === 'teamA' ? match.teamA : match.teamB;

  const handleStartEdit = (playerId: string, currentName: string) => {
    tap();
    setEditingPlayerId(playerId);
    setNameValue(currentName);
  };

  const handleSaveName = (playerId: string) => {
    if (!nameValue.trim()) return;
    tap();
    dispatch({
      type: 'EDIT_PLAYER_NAME',
      payload: {
        teamId: selectedTeamId,
        playerId,
        newName: nameValue.trim(),
      },
    });
    setEditingPlayerId('');
    setNameValue('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end justify-center backdrop-blur-[2px]">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-t-xl max-h-[85vh] overflow-y-auto p-4 border-t border-slate-200 dark:border-slate-800 shadow-sm animate-fadeIn">
        <div className="w-8 h-1 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-3" />

        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Edit Player Names
            </h2>
            <p className="text-xs text-slate-500">Update player names in live match</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded"
          >
            <X size={18} strokeWidth={1.75} />
          </button>
        </div>

        {/* Team Segmented Control */}
        <div className="mt-3 p-1 rounded-md bg-slate-100 dark:bg-slate-800 flex gap-1">
          <button
            type="button"
            onClick={() => {
              tap();
              setSelectedTeamId('teamA');
              setEditingPlayerId('');
            }}
            className={`flex-1 h-8 rounded text-xs transition-colors ${
              selectedTeamId === 'teamA'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-semibold shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            {match.teamA.name}
          </button>
          <button
            type="button"
            onClick={() => {
              tap();
              setSelectedTeamId('teamB');
              setEditingPlayerId('');
            }}
            className={`flex-1 h-8 rounded text-xs transition-colors ${
              selectedTeamId === 'teamB'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-semibold shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            {match.teamB.name}
          </button>
        </div>

        {/* Players List */}
        <div className="mt-3 border border-slate-200 dark:border-slate-800 rounded-md divide-y divide-slate-100 dark:divide-slate-800 max-h-64 overflow-y-auto">
          {activeTeam.players.map((player, index) => {
            const isEditing = editingPlayerId === player.id;

            return (
              <div
                key={player.id}
                className="px-3 py-2 flex items-center justify-between gap-2 text-xs"
              >
                {isEditing ? (
                  <div className="flex-1 flex items-center gap-1.5">
                    <span className="text-[10px] text-slate-400 tabular-nums font-mono w-4">#{index + 1}</span>
                    <input
                      type="text"
                      value={nameValue}
                      onChange={(e) => setNameValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveName(player.id);
                      }}
                      autoFocus
                      className="flex-1 h-8 px-2 text-xs rounded border border-emerald-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleSaveName(player.id)}
                      className="h-8 px-2 rounded bg-emerald-700 text-white hover:bg-emerald-800"
                    >
                      <Check size={14} strokeWidth={2} />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-[10px] text-slate-400 tabular-nums font-mono w-4">#{index + 1}</span>
                      <span className="font-medium text-slate-800 dark:text-slate-200 truncate">{player.name}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleStartEdit(player.id, player.name)}
                      className="text-xs text-slate-500 hover:text-emerald-700 font-medium py-1 px-2 rounded hover:bg-slate-50"
                    >
                      Edit
                    </button>
                  </>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="w-full h-11 rounded-md bg-emerald-700 hover:bg-emerald-800 text-white font-medium text-sm transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
