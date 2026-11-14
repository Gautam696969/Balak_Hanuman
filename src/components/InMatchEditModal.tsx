import React, { useState } from 'react';
import { X, Trash2, Check, AlertTriangle } from 'lucide-react';
import { useMatch } from '../context/MatchContext';
import { useHaptic } from '../hooks/useHaptic';

interface InMatchEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRequestChangeBowler: () => void;
}

export const InMatchEditModal: React.FC<InMatchEditModalProps> = ({
  isOpen,
  onClose,
  onRequestChangeBowler,
}) => {
  const { match, dispatch } = useMatch();
  const { tap, boundary } = useHaptic();

  const [activeTab, setActiveTab] = useState<'teams' | 'players' | 'overs'>('players');
  const [selectedTeamId, setSelectedTeamId] = useState<'teamA' | 'teamB'>('teamA');
  const [newPlayerName, setNewPlayerName] = useState('');
  const [editingPlayerId, setEditingPlayerId] = useState<string>('');
  const [editingPlayerName, setEditingPlayerName] = useState('');

  // Team names state
  const [teamAName, setTeamAName] = useState(match?.teamA.name || '');
  const [teamAShort, setTeamAShort] = useState(match?.teamA.shortName || '');
  const [teamBName, setTeamBName] = useState(match?.teamB.name || '');
  const [teamBShort, setTeamBShort] = useState(match?.teamB.shortName || '');

  // Overs change state
  const [newOversInput, setNewOversInput] = useState(match?.rules.totalOvers.toString() || '20');

  if (!isOpen || !match) return null;

  const currentInnings = match.innings[match.currentInningsIndex];
  const activeTeam = selectedTeamId === 'teamA' ? match.teamA : match.teamB;

  // Check if player has participated (batted or bowled)
  const isPlayerParticipated = (playerId: string) => {
    for (const inn of match.innings) {
      if (inn.strikerId === playerId || inn.nonStrikerId === playerId || inn.currentBowlerId === playerId) {
        return true;
      }
      for (const b of inn.allBalls) {
        if (b.batsmanId === playerId || b.nonStrikerId === playerId || b.bowlerId === playerId) {
          return true;
        }
      }
      for (const f of inn.fallOfWickets) {
        if (f.batsmanId === playerId) return true;
      }
    }
    return false;
  };

  const handleSaveTeamNames = (e: React.FormEvent) => {
    e.preventDefault();
    tap();
    dispatch({
      type: 'EDIT_TEAM_NAMES',
      payload: {
        teamA: {
          name: teamAName.trim() || match.teamA.name,
          shortName: teamAShort.trim().toUpperCase() || match.teamA.shortName,
        },
        teamB: {
          name: teamBName.trim() || match.teamB.name,
          shortName: teamBShort.trim().toUpperCase() || match.teamB.shortName,
        },
      },
    });
    alert('Team names updated.');
  };

  const handleAddPlayer = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newPlayerName.trim();
    if (!trimmed) return;
    tap();
    dispatch({
      type: 'ADD_PLAYER_IN_MATCH',
      payload: { teamId: selectedTeamId, name: trimmed },
    });
    setNewPlayerName('');
  };

  const handleSaveRenamePlayer = (playerId: string) => {
    const trimmed = editingPlayerName.trim();
    if (!trimmed) return;
    tap();
    dispatch({
      type: 'EDIT_PLAYER_NAME',
      payload: { teamId: selectedTeamId, playerId, newName: trimmed },
    });
    setEditingPlayerId('');
    setEditingPlayerName('');
  };

  const handleDeletePlayer = (playerId: string) => {
    if (isPlayerParticipated(playerId)) {
      alert('Cannot remove a player who has already batted or bowled in this match.');
      return;
    }
    tap();
    if (confirm('Remove this player from the team roster?')) {
      dispatch({
        type: 'REMOVE_PLAYER_IN_MATCH',
        payload: { teamId: selectedTeamId, playerId },
      });
    }
  };

  const handleChangeTotalOvers = (e: React.FormEvent) => {
    e.preventDefault();
    const ov = parseInt(newOversInput, 10);
    if (!ov || ov < 1 || ov > 50) {
      alert('Please enter a valid overs value between 1 and 50.');
      return;
    }
    const completedOvers = Math.floor(currentInnings.legalBalls / 6);
    if (ov < completedOvers) {
      alert(`Cannot set total overs lower than overs already completed (${completedOvers} ov).`);
      return;
    }
    if (confirm(`Change match total overs to ${ov} overs?`)) {
      boundary();
      dispatch({ type: 'CHANGE_TOTAL_OVERS', payload: { newTotalOvers: ov } });
      alert(`Match overs updated to ${ov} overs.`);
    }
  };

  const handleRetireBatter = (role: 'striker' | 'nonStriker') => {
    const batterId = role === 'striker' ? currentInnings.strikerId : currentInnings.nonStrikerId;
    if (!batterId) return;

    if (confirm(`Retire ${role === 'striker' ? 'Striker' : 'Non-Striker'} (Retired Hurt)?`)) {
      tap();
      dispatch({
        type: 'RETIRE_BATTER',
        payload: { batsmanId: batterId },
      });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end justify-center backdrop-blur-[2px]">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-t-xl max-h-[88vh] overflow-y-auto p-4 border-t border-slate-200 dark:border-slate-800 shadow-sm animate-fadeIn">
        <div className="w-8 h-1 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-3" />

        <div className="pb-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Match Controls & Roster
            </h2>
            <p className="text-xs text-slate-500">Edit teams, players, overs or retire batters</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded"
          >
            <X size={18} strokeWidth={1.75} />
          </button>
        </div>

        {/* Tab selection */}
        <div className="mt-3 p-1 rounded-md bg-slate-100 dark:bg-slate-800 flex gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('players')}
            className={`flex-1 h-8 rounded text-xs transition-colors ${
              activeTab === 'players'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-semibold shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Players
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('teams')}
            className={`flex-1 h-8 rounded text-xs transition-colors ${
              activeTab === 'teams'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-semibold shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Teams
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('overs')}
            className={`flex-1 h-8 rounded text-xs transition-colors ${
              activeTab === 'overs'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-semibold shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Overs & Rules
          </button>
        </div>

        {/* PLAYERS TAB */}
        {activeTab === 'players' && (
          <div className="mt-3 space-y-3">
            {/* Team selector */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSelectedTeamId('teamA')}
                className={`flex-1 h-9 rounded-md border text-xs font-medium transition-colors ${
                  selectedTeamId === 'teamA'
                    ? 'border-emerald-700 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 font-semibold'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                {match.teamA.name} ({match.teamA.players.length})
              </button>
              <button
                type="button"
                onClick={() => setSelectedTeamId('teamB')}
                className={`flex-1 h-9 rounded-md border text-xs font-medium transition-colors ${
                  selectedTeamId === 'teamB'
                    ? 'border-emerald-700 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 font-semibold'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                {match.teamB.name} ({match.teamB.players.length})
              </button>
            </div>

            {/* Add new player input */}
            <form onSubmit={handleAddPlayer} className="flex gap-2">
              <input
                type="text"
                value={newPlayerName}
                onChange={(e) => setNewPlayerName(e.target.value)}
                placeholder={`Add player to ${activeTeam.name}`}
                className="flex-1 h-9 px-3 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-700"
              />
              <button
                type="submit"
                disabled={!newPlayerName.trim()}
                className="h-9 px-3 rounded-md bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-medium transition-colors disabled:opacity-40"
              >
                Add
              </button>
            </form>

            {/* Player list */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-md divide-y divide-slate-100 dark:divide-slate-800 max-h-56 overflow-y-auto">
              {activeTeam.players.map((p, index) => {
                const isEditing = editingPlayerId === p.id;
                const participated = isPlayerParticipated(p.id);

                return (
                  <div key={p.id} className="px-3 py-2 flex items-center justify-between text-xs gap-2">
                    {isEditing ? (
                      <div className="flex-1 flex items-center gap-1.5">
                        <input
                          type="text"
                          value={editingPlayerName}
                          onChange={(e) => setEditingPlayerName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveRenamePlayer(p.id);
                          }}
                          autoFocus
                          className="flex-1 h-8 px-2 text-xs rounded border border-emerald-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveRenamePlayer(p.id)}
                          className="h-8 px-2 rounded bg-emerald-700 text-white hover:bg-emerald-800"
                        >
                          <Check size={14} strokeWidth={2} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="truncate">
                          <span className="text-[10px] text-slate-400 font-mono tabular-nums mr-1.5">#{index + 1}</span>
                          <span className="font-medium text-slate-900 dark:text-slate-100">{p.name}</span>
                          {participated && <span className="text-[10px] text-slate-400 ml-1">(active)</span>}
                        </div>

                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingPlayerId(p.id);
                              setEditingPlayerName(p.name);
                            }}
                            className="text-xs text-slate-500 hover:text-slate-800 px-1.5 py-0.5 rounded"
                          >
                            Edit
                          </button>
                          {!participated && (
                            <button
                              type="button"
                              onClick={() => handleDeletePlayer(p.id)}
                              className="text-slate-400 hover:text-red-600 p-1 rounded"
                              title="Delete player"
                            >
                              <Trash2 size={14} strokeWidth={1.75} />
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Quick Actions: Mid-over Bowler Change & Retire Batter */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
              <span className="text-[11px] uppercase tracking-wide text-slate-400 font-medium block">
                Crease Controls
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onRequestChangeBowler();
                  }}
                  className="h-9 rounded-md border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50"
                >
                  Change Bowler (Injury)
                </button>
                <button
                  type="button"
                  onClick={() => handleRetireBatter('striker')}
                  className="h-9 rounded-md border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50"
                >
                  Retire Striker
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TEAMS TAB */}
        {activeTab === 'teams' && (
          <form onSubmit={handleSaveTeamNames} className="mt-3 space-y-3 text-xs">
            <div className="space-y-1">
              <label className="text-slate-600 dark:text-slate-400 block font-medium">Team A Name & Short (3 letters)</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={teamAName}
                  onChange={(e) => setTeamAName(e.target.value)}
                  className="flex-1 h-9 px-2 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
                <input
                  type="text"
                  maxLength={4}
                  value={teamAShort}
                  onChange={(e) => setTeamAShort(e.target.value)}
                  placeholder="IND"
                  className="w-16 h-9 px-2 text-center uppercase font-mono rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-slate-600 dark:text-slate-400 block font-medium">Team B Name & Short (3 letters)</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={teamBName}
                  onChange={(e) => setTeamBName(e.target.value)}
                  className="flex-1 h-9 px-2 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
                <input
                  type="text"
                  maxLength={4}
                  value={teamBShort}
                  onChange={(e) => setTeamBShort(e.target.value)}
                  placeholder="AUS"
                  className="w-16 h-9 px-2 text-center uppercase font-mono rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full h-10 rounded-md bg-emerald-700 hover:bg-emerald-800 text-white font-medium text-xs transition-colors"
            >
              Update Team Names
            </button>
          </form>
        )}

        {/* OVERS & RULES TAB */}
        {activeTab === 'overs' && (
          <form onSubmit={handleChangeTotalOvers} className="mt-3 space-y-3 text-xs">
            <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-md text-amber-800 dark:text-amber-300 text-xs flex items-start gap-2">
              <AlertTriangle size={16} strokeWidth={1.75} className="flex-shrink-0 mt-0.5" />
              <span>
                Editing total overs mid-match recalibrates target run rates and bowler limits.
              </span>
            </div>

            <div>
              <label className="text-slate-600 dark:text-slate-400 block font-medium mb-1">
                Total Match Overs (Currently {match.rules.totalOvers} ov)
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={newOversInput}
                onChange={(e) => setNewOversInput(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono text-sm tabular-nums"
              />
            </div>

            <button
              type="submit"
              className="w-full h-10 rounded-md bg-emerald-700 hover:bg-emerald-800 text-white font-medium text-xs transition-colors"
            >
              Update Overs
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
