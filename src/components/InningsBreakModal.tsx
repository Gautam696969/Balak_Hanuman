import React, { useState } from 'react';
import { useMatch } from '../context/MatchContext';
import { useHaptic } from '../hooks/useHaptic';
import { Match, Player } from '../types/cricket';
import { generateId } from '../utils/cricket';

interface InningsBreakModalContentProps {
  match: Match;
}

const InningsBreakModalContent: React.FC<InningsBreakModalContentProps> = ({ match }) => {
  const { dispatch } = useMatch();
  const { boundary, tap } = useHaptic();

  const [inn1] = match.innings;
  const inn1BattingTeam = inn1.battingTeamId === 'teamA' ? match.teamA : match.teamB;
  const inn2BattingTeam = inn1.battingTeamId === 'teamA' ? match.teamB : match.teamA;
  const inn2BowlingTeam = inn1BattingTeam;

  const target = inn1.totalRuns + 1;
  const totalBalls = (match.rules?.totalOvers || 5) * 6;
  const reqRunRate = totalBalls > 0 ? ((target / totalBalls) * 6).toFixed(2) : '0.00';

  const defaultStrikerId = inn2BattingTeam.players[0]?.id || '';
  const defaultNonStrikerId = inn2BattingTeam.players[1]?.id || (match.rules?.lastManStands ? '' : defaultStrikerId);
  const defaultBowlerId = inn2BowlingTeam.players[0]?.id || '';

  const [strikerId, setStrikerId] = useState<string>(defaultStrikerId);
  const [nonStrikerId, setNonStrikerId] = useState<string>(defaultNonStrikerId);
  const [bowlerId, setBowlerId] = useState<string>(defaultBowlerId);

  // Quick new player input states
  const [showAddBatter, setShowAddBatter] = useState(false);
  const [newBatterName, setNewBatterName] = useState('');

  const isLMS = !!match.rules?.lastManStands;

  const handleAddNewBatter = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newBatterName.trim();
    if (!clean) return;
    tap();

    const newP: Player = { id: generateId(), name: clean };
    dispatch({
      type: 'ADD_PLAYER_IN_MATCH',
      payload: {
        teamId: inn2BattingTeam.id as 'teamA' | 'teamB',
        name: clean,
      },
    });

    if (!strikerId) {
      setStrikerId(newP.id);
    } else if (!nonStrikerId && !isLMS) {
      setNonStrikerId(newP.id);
    }
    setNewBatterName('');
    setShowAddBatter(false);
  };

  const handleStartInnings2 = () => {
    if (!strikerId) {
      alert('Please select opening striker.');
      return;
    }

    if (!isLMS && !nonStrikerId) {
      alert('Please select opening non-striker.');
      return;
    }

    if (!isLMS && strikerId === nonStrikerId) {
      alert('Striker and Non-Striker must be different players.');
      return;
    }

    if (!bowlerId) {
      alert('Please select opening bowler.');
      return;
    }

    boundary();
    dispatch({
      type: 'START_SECOND_INNINGS',
      payload: {
        strikerId,
        nonStrikerId: isLMS && !nonStrikerId ? '' : nonStrikerId,
        bowlerId,
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-[2px]">
      <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-lg p-5 border border-slate-200 dark:border-slate-800 shadow-md animate-fadeIn">
        <div className="text-xs uppercase tracking-wide text-amber-600 dark:text-amber-400 font-semibold">
          Innings Complete
        </div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-0.5">
          1st Innings Summary
        </h2>

        {/* 1st Innings Summary Box */}
        <div className="mt-3 p-3 rounded-md bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-800/60">
          <div className="text-xs text-slate-600 dark:text-slate-300 font-medium">
            {inn1BattingTeam.name} scored
          </div>
          <div className="text-3xl font-bold tabular-nums text-slate-900 dark:text-slate-100 mt-0.5">
            {inn1.totalRuns}/{inn1.wickets}
            <span className="text-sm font-normal text-slate-500 ml-2">
              ({inn1.oversFormatted} ov)
            </span>
          </div>

          <div className="mt-2 pt-2 border-t border-amber-200/60 dark:border-amber-800/60 flex items-center justify-between text-xs tabular-nums">
            <span className="text-slate-700 dark:text-slate-300">Target for {inn2BattingTeam.name}:</span>
            <span className="font-bold text-amber-700 dark:text-amber-400 text-sm">{target} runs</span>
          </div>
          <div className="text-[11px] text-slate-500 text-right mt-0.5 tabular-nums">
            Required Rate: {reqRunRate} rpo
          </div>
        </div>

        {/* 2nd Innings Openers Selection */}
        <div className="mt-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wide text-slate-500 font-semibold">
              2nd Innings Openers
            </span>
            <button
              type="button"
              onClick={() => setShowAddBatter(!showAddBatter)}
              className="text-[11px] text-amber-600 dark:text-amber-400 font-medium hover:underline"
            >
              {showAddBatter ? 'Cancel' : '+ Add Batter'}
            </button>
          </div>

          {showAddBatter && (
            <form onSubmit={handleAddNewBatter} className="flex gap-1.5 p-2 bg-slate-50 dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700">
              <input
                type="text"
                autoFocus
                value={newBatterName}
                onChange={(e) => setNewBatterName(e.target.value)}
                placeholder="New batter name..."
                className="flex-1 h-8 px-2 text-xs rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none"
              />
              <button
                type="submit"
                disabled={!newBatterName.trim()}
                className="h-8 px-2.5 bg-amber-600 text-white rounded text-xs font-semibold disabled:opacity-50"
              >
                Add
              </button>
            </form>
          )}

          <div>
            <label className="text-xs text-slate-600 dark:text-slate-400 block mb-1">
              Striker ({inn2BattingTeam.name})
            </label>
            <select
              value={strikerId}
              onChange={(e) => setStrikerId(e.target.value)}
              className="w-full h-10 px-3 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-medium focus:ring-1 focus:ring-amber-500 focus:outline-none"
            >
              <option value="">-- Select Striker --</option>
              {inn2BattingTeam.players.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {!isLMS && (
            <div>
              <label className="text-xs text-slate-600 dark:text-slate-400 block mb-1">
                Non-Striker ({inn2BattingTeam.name})
              </label>
              <select
                value={nonStrikerId}
                onChange={(e) => setNonStrikerId(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-medium focus:ring-1 focus:ring-amber-500 focus:outline-none"
              >
                <option value="">-- Select Non-Striker --</option>
                {inn2BattingTeam.players.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="text-xs text-slate-600 dark:text-slate-400 block mb-1">
              Opening Bowler ({inn2BowlingTeam.name})
            </label>
            <select
              value={bowlerId}
              onChange={(e) => setBowlerId(e.target.value)}
              className="w-full h-10 px-3 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-medium focus:ring-1 focus:ring-amber-500 focus:outline-none"
            >
              <option value="">-- Select Bowler --</option>
              {inn2BowlingTeam.players.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Start 2nd Innings button */}
        <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={handleStartInnings2}
            className="w-full h-11 rounded-md bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-semibold text-sm transition-colors duration-150 flex items-center justify-center shadow-sm"
          >
            Start 2nd Innings
          </button>
        </div>
      </div>
    </div>
  );
};

export const InningsBreakModal: React.FC = () => {
  const { match } = useMatch();

  if (!match || match.status !== 'inningsBreak') return null;

  return <InningsBreakModalContent match={match} />;
};
