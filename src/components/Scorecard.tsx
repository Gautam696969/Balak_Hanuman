import React, { useState } from 'react';
import { useMatch } from '../context/MatchContext';
import { Match } from '../types/cricket';
import { getBatsmanStats, getBowlerStats, formatDismissalText } from '../utils/cricket';

interface ScorecardProps {
  matchOverride?: Match;
}

export const Scorecard: React.FC<ScorecardProps> = ({ matchOverride }) => {
  const context = useMatch();
  const match = matchOverride || context.match;
  const [internalInnings, setInternalInnings] = useState<1 | 2>(1);

  if (!match) return null;

  const activeInningsNumber = matchOverride ? internalInnings : context.selectedScorecardInnings;
  const innings = match.innings[activeInningsNumber - 1];

  const handleSelectInnings = (inn: 1 | 2) => {
    if (matchOverride) {
      setInternalInnings(inn);
    } else {
      context.dispatch({ type: 'SELECT_SCORECARD_INNINGS', payload: { inningsNumber: inn } });
    }
  };

  const battingTeam = innings.battingTeamId === 'teamA' ? match.teamA : match.teamB;
  const bowlingTeam = innings.bowlingTeamId === 'teamA' ? match.teamA : match.teamB;

  const batsmanStats = getBatsmanStats(innings, battingTeam);
  const bowlerStats = getBowlerStats(innings, bowlingTeam);

  return (
    <div className="space-y-4 pb-20">
      {/* Innings Switch: Segmented control */}
      <div className="p-1 rounded-md bg-slate-100 dark:bg-slate-800 flex gap-1">
        <button
          type="button"
          onClick={() => handleSelectInnings(1)}
          className={`flex-1 h-9 rounded text-xs transition-colors ${
            activeInningsNumber === 1
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-semibold shadow-sm'
              : 'text-slate-600 dark:text-slate-400 font-normal'
          }`}
        >
          {match.teamA.name} 1st Inn
        </button>
        <button
          type="button"
          onClick={() => handleSelectInnings(2)}
          className={`flex-1 h-9 rounded text-xs transition-colors ${
            activeInningsNumber === 2
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-semibold shadow-sm'
              : 'text-slate-600 dark:text-slate-400 font-normal'
          }`}
        >
          {match.teamB.name} 2nd Inn
        </button>
      </div>

      {/* Innings Header Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3 shadow-sm flex items-center justify-between">
        <div>
          <span className="text-[11px] uppercase tracking-wide text-slate-400 font-medium block">
            {battingTeam.name} Innings
          </span>
          <div className="text-2xl font-semibold tabular-nums text-slate-900 dark:text-slate-100 mt-0.5">
            {innings.totalRuns}
            <span className="text-slate-400 font-normal">/{innings.wickets}</span>
            <span className="text-sm font-normal text-slate-500 ml-2">
              ({innings.oversFormatted} ov)
            </span>
          </div>
        </div>

        <div className="text-right text-xs tabular-nums text-slate-500">
          <div>CRR: <strong className="text-slate-800 dark:text-slate-200 font-medium">{((innings.totalRuns / (innings.legalBalls || 1)) * 6).toFixed(2)}</strong></div>
          {innings.isCompleted && <span className="text-emerald-700 dark:text-emerald-400 font-medium">Completed</span>}
        </div>
      </div>

      {/* Batting Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden shadow-sm">
        <div className="px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold">
          <span>Batter</span>
          <div className="flex items-center gap-3 font-mono text-right">
            <span className="w-6">R</span>
            <span className="w-6">B</span>
            <span className="w-4">4s</span>
            <span className="w-4">6s</span>
            <span className="w-10">SR</span>
          </div>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {batsmanStats.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-400 italic">
              Innings not yet started
            </div>
          ) : (
            batsmanStats.map((batsman) => (
              <div key={batsman.playerId} className="px-3 py-2 text-xs flex items-center justify-between">
                <div className="truncate pr-2 flex-1">
                  <div className="font-medium text-slate-900 dark:text-slate-100 truncate">
                    {batsman.name}
                    {batsman.isNotOut && <span className="text-emerald-700 dark:text-emerald-400 font-semibold ml-1">*</span>}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">
                    {formatDismissalText(batsman.dismissal)}
                  </div>
                </div>

                <div className="flex items-center gap-3 font-mono text-right text-slate-700 dark:text-slate-300 tabular-nums flex-shrink-0">
                  <span className="w-6 font-semibold text-slate-900 dark:text-slate-100">{batsman.runs}</span>
                  <span className="w-6 text-slate-400">{batsman.balls}</span>
                  <span className="w-4 text-slate-500">{batsman.fours}</span>
                  <span className="w-4 text-slate-500">{batsman.sixes}</span>
                  <span className="w-10 text-[11px] text-slate-500">{batsman.strikeRate.toFixed(1)}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Extras Breakdown */}
        <div className="px-3 py-2 bg-slate-50/50 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 text-xs flex items-center justify-between text-slate-600 dark:text-slate-400">
          <span>
            Extras: (wd {innings.extras.wides}, nb {innings.extras.noBalls}, b {innings.extras.byes}, lb {innings.extras.legByes})
          </span>
          <span className="font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
            {innings.extras.total}
          </span>
        </div>

        {/* Total Summary Row */}
        <div className="px-3 py-2.5 bg-slate-100/60 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 text-xs font-semibold flex items-center justify-between">
          <span className="uppercase tracking-wider text-slate-600 dark:text-slate-300 text-[11px]">Total</span>
          <span className="font-semibold tabular-nums text-slate-900 dark:text-slate-100">
            {innings.totalRuns}/{innings.wickets} ({innings.oversFormatted} ov)
          </span>
        </div>
      </div>

      {/* Fall of Wickets */}
      {innings.fallOfWickets && innings.fallOfWickets.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3 shadow-sm">
          <div className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-medium mb-1.5">
            Fall of Wickets
          </div>
          <div className="flex flex-wrap gap-1.5 text-xs">
            {innings.fallOfWickets.map((fow) => (
              <span
                key={fow.wicketNumber}
                className="px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 font-mono text-[11px] tabular-nums"
              >
                {fow.wicketNumber}-{fow.score} <span className="text-slate-400 font-sans text-[10px]">({fow.batsmanName}, {fow.overs} ov)</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Bowling Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden shadow-sm">
        <div className="px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold">
          <span>Bowler</span>
          <div className="flex items-center gap-3 font-mono text-right">
            <span className="w-7">O</span>
            <span className="w-5">M</span>
            <span className="w-6">R</span>
            <span className="w-5">W</span>
            <span className="w-9">Econ</span>
          </div>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {bowlerStats.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-400 italic">
              No bowling figures recorded
            </div>
          ) : (
            bowlerStats.map((bowler) => (
              <div key={bowler.playerId} className="px-3 py-2 text-xs flex items-center justify-between">
                <div className="truncate pr-2 font-medium text-slate-900 dark:text-slate-100">
                  {bowler.name}
                  {bowler.wides > 0 || bowler.noBalls > 0 ? (
                    <span className="text-[10px] text-slate-400 font-normal ml-1">
                      (w{bowler.wides}, nb{bowler.noBalls})
                    </span>
                  ) : null}
                </div>

                <div className="flex items-center gap-3 font-mono text-right text-slate-700 dark:text-slate-300 tabular-nums flex-shrink-0">
                  <span className="w-7">{bowler.oversFormatted}</span>
                  <span className="w-5 text-slate-400">{bowler.maidens}</span>
                  <span className="w-6">{bowler.runsConceded}</span>
                  <span className="w-5 font-semibold text-slate-900 dark:text-slate-100">{bowler.wickets}</span>
                  <span className="w-9 text-[11px] text-slate-500">{bowler.economy.toFixed(2)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
