import React, { useState } from 'react';
import { useMatch } from '../context/MatchContext';
import { useHaptic } from '../hooks/useHaptic';

export const InningsBreakModal: React.FC = () => {
  const { match, dispatch } = useMatch();
  const { boundary } = useHaptic();

  if (!match || match.status !== 'inningsBreak') return null;

  const [inn1] = match.innings;
  const inn1BattingTeam = inn1.battingTeamId === 'teamA' ? match.teamA : match.teamB;
  const inn2BattingTeam = inn1.battingTeamId === 'teamA' ? match.teamB : match.teamA;
  const inn2BowlingTeam = inn1BattingTeam;

  const target = inn1.totalRuns + 1;
  const totalBalls = match.rules.totalOvers * 6;
  const reqRunRate = ((target / totalBalls) * 6).toFixed(2);

  const [strikerId, setStrikerId] = useState<string>(inn2BattingTeam.players[0]?.id || '');
  const [nonStrikerId, setNonStrikerId] = useState<string>(inn2BattingTeam.players[1]?.id || '');
  const [bowlerId, setBowlerId] = useState<string>(inn2BowlingTeam.players[0]?.id || '');

  const handleStartInnings2 = () => {
    if (!strikerId || !nonStrikerId || !bowlerId) {
      alert('Please select opening batsmen and bowler.');
      return;
    }
    if (strikerId === nonStrikerId) {
      alert('Striker and Non-Striker must be different players.');
      return;
    }

    boundary();
    dispatch({
      type: 'START_SECOND_INNINGS',
      payload: {
        strikerId,
        nonStrikerId,
        bowlerId,
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 backdrop-blur-[2px]">
      <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-lg p-5 border border-slate-200 dark:border-slate-800 shadow-sm animate-fadeIn">
        <div className="text-xs uppercase tracking-wide text-slate-400 font-medium">
          Innings Complete
        </div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mt-0.5">
          1st Innings Summary
        </h2>

        {/* 1st Innings Summary Box */}
        <div className="mt-3 p-3 rounded-md bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
          <div className="text-xs text-slate-500 font-medium">{inn1BattingTeam.name} scored</div>
          <div className="text-3xl font-semibold tabular-nums text-slate-900 dark:text-slate-100 mt-0.5">
            {inn1.totalRuns}/{inn1.wickets}
            <span className="text-sm font-normal text-slate-500 ml-2">
              ({inn1.oversFormatted} ov)
            </span>
          </div>

          <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs tabular-nums">
            <span className="text-slate-600 dark:text-slate-400">Target for {inn2BattingTeam.name}:</span>
            <span className="font-semibold text-slate-900 dark:text-slate-100">{target} runs</span>
          </div>
          <div className="text-[11px] text-slate-400 text-right mt-0.5 tabular-nums">
            Required Rate: {reqRunRate} rpo
          </div>
        </div>

        {/* 2nd Innings Openers Selection */}
        <div className="mt-4 space-y-2.5">
          <div className="text-xs uppercase tracking-wide text-slate-500 font-medium">
            2nd Innings Openers
          </div>

          <div>
            <label className="text-xs text-slate-600 dark:text-slate-400 block mb-1">
              Striker ({inn2BattingTeam.name})
            </label>
            <select
              value={strikerId}
              onChange={(e) => setStrikerId(e.target.value)}
              className="w-full h-10 px-3 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-medium focus:ring-1 focus:ring-emerald-700 focus:outline-none"
            >
              {inn2BattingTeam.players.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-slate-600 dark:text-slate-400 block mb-1">
              Non-Striker ({inn2BattingTeam.name})
            </label>
            <select
              value={nonStrikerId}
              onChange={(e) => setNonStrikerId(e.target.value)}
              className="w-full h-10 px-3 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-medium focus:ring-1 focus:ring-emerald-700 focus:outline-none"
            >
              {inn2BattingTeam.players.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-slate-600 dark:text-slate-400 block mb-1">
              Opening Bowler ({inn2BowlingTeam.name})
            </label>
            <select
              value={bowlerId}
              onChange={(e) => setBowlerId(e.target.value)}
              className="w-full h-10 px-3 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-medium focus:ring-1 focus:ring-emerald-700 focus:outline-none"
            >
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
            className="w-full h-11 rounded-md bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white font-medium text-sm transition-colors duration-150 flex items-center justify-center"
          >
            Start 2nd Innings
          </button>
        </div>
      </div>
    </div>
  );
};
