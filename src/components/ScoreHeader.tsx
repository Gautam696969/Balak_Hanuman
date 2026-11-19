import React, { useState } from 'react';
import {
  ArrowLeftRight,
  Eye,
  EyeOff,
  Sun,
  Moon,
  MoreVertical,
  Pencil,
  RotateCcw,
} from 'lucide-react';
import { useMatch } from '../context/MatchContext';
import { useWakeLock } from '../hooks/useWakeLock';
import { useHaptic } from '../hooks/useHaptic';
import {
  calculateEconomy,
  calculateRequiredRunRate,
  calculateRunRate,
  calculateStrikeRate,
} from '../utils/cricket';

interface ScoreHeaderProps {
  onOpenInMatchMenu: () => void;
  onConfirmReset: () => void;
  onRequestChangeBowler: () => void;
  onQuickRenamePlayer: (playerId: string, teamId: 'teamA' | 'teamB', currentName: string) => void;
}

export const ScoreHeader: React.FC<ScoreHeaderProps> = ({
  onOpenInMatchMenu,
  onConfirmReset,
  onRequestChangeBowler,
  onQuickRenamePlayer,
}) => {
  const { match, dispatch, darkMode } = useMatch();
  const { isActive: isWakeLockActive, isSupported: isWakeLockSupported, toggleWakeLock } = useWakeLock();
  const { tap } = useHaptic();
  const [showMenu, setShowMenu] = useState(false);

  if (!match) return null;

  const currentInnings = match.innings?.[match.currentInningsIndex];
  if (!currentInnings) return null;

  const battingTeam = currentInnings.battingTeamId === 'teamA' ? match.teamA : match.teamB;
  const bowlingTeam = currentInnings.bowlingTeamId === 'teamA' ? match.teamA : match.teamB;
  if (!battingTeam || !bowlingTeam) return null;

  const striker = battingTeam.players?.find((p) => p.id === currentInnings.strikerId);
  const nonStriker = battingTeam.players?.find((p) => p.id === currentInnings.nonStrikerId);
  const bowler = bowlingTeam.players?.find((p) => p.id === currentInnings.currentBowlerId);

  // Compute batsman live stats
  const allBalls = currentInnings.allBalls || [];
  const strikerBalls = allBalls.filter(
    (b) => b.batsmanId === currentInnings.strikerId && b.extraType !== 'wd'
  );
  const strikerRuns = strikerBalls.reduce((sum, b) => sum + (b.runsOffBat || 0), 0);
  const strikerFours = strikerBalls.filter((b) => b.runsOffBat === 4).length;
  const strikerSixes = strikerBalls.filter((b) => b.runsOffBat === 6).length;
  const strikerSR = calculateStrikeRate(strikerRuns, strikerBalls.length);

  const nonStrikerBalls = allBalls.filter(
    (b) => b.batsmanId === currentInnings.nonStrikerId && b.extraType !== 'wd'
  );
  const nonStrikerRuns = nonStrikerBalls.reduce((sum, b) => sum + (b.runsOffBat || 0), 0);
  const nonStrikerFours = nonStrikerBalls.filter((b) => b.runsOffBat === 4).length;
  const nonStrikerSixes = nonStrikerBalls.filter((b) => b.runsOffBat === 6).length;
  const nonStrikerSR = calculateStrikeRate(nonStrikerRuns, nonStrikerBalls.length);

  // Compute bowler live stats
  const bowlerBalls = allBalls.filter((b) => b.bowlerId === currentInnings.currentBowlerId);
  const bowlerLegalBalls = bowlerBalls.filter((b) => b.isLegal).length;
  const bowlerOvers = `${Math.floor(bowlerLegalBalls / 6)}.${bowlerLegalBalls % 6}`;
  const bowlerRunsConceded = bowlerBalls.reduce((sum, b) => {
    let r = b.runsOffBat;
    if (b.extraType === 'wd') r += b.extraRuns;
    if (b.extraType === 'nb') r += b.extraRuns !== undefined ? b.extraRuns : (match.rules.noBallRuns ?? 1);
    return sum + r;
  }, 0);
  const bowlerWickets = bowlerBalls.filter((b) => b.wicket && b.wicket.type !== 'runOut' && b.wicket.type !== 'retiredHurt').length;

  const bowlerOverRuns = new Map<number, { runs: number; legal: number }>();
  for (const b of bowlerBalls) {
    const o = b.overIndex;
    const cur = bowlerOverRuns.get(o) || { runs: 0, legal: 0 };
    let r = b.runsOffBat;
    if (b.extraType === 'wd') r += b.extraRuns;
    if (b.extraType === 'nb') r += b.extraRuns !== undefined ? b.extraRuns : (match.rules.noBallRuns ?? 1);
    cur.runs += r;
    if (b.isLegal) cur.legal += 1;
    bowlerOverRuns.set(o, cur);
  }
  let bowlerMaidens = 0;
  bowlerOverRuns.forEach((data) => {
    if (data.legal === 6 && data.runs === 0) bowlerMaidens++;
  });
  const bowlerEcon = calculateEconomy(bowlerRunsConceded, bowlerLegalBalls);

  // Run rates
  const crr = calculateRunRate(currentInnings.totalRuns, currentInnings.legalBalls);

  // 2nd innings chase metrics
  const isSecondInnings = match.currentInningsIndex === 1;
  const target = match.innings[0].totalRuns + 1;
  const runsNeeded = target - currentInnings.totalRuns;
  const totalMaxBalls = match.rules.totalOvers * 6;
  const ballsRemaining = Math.max(0, totalMaxBalls - currentInnings.legalBalls);
  const rrr = isSecondInnings ? calculateRequiredRunRate(runsNeeded, ballsRemaining) : null;

  const handleSwapStrike = () => {
    tap();
    dispatch({ type: 'SWAP_STRIKER' });
  };

  const team1Display = match.teamA.shortName || match.teamA.name;
  const team2Display = match.teamB.shortName || match.teamB.name;

  return (
    <div className="w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
      {/* 1. Header (48px): team short names, menu icon; small amber "FREE HIT" text badge when active */}
      <header className="h-12 px-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wide">
            {team1Display} <span className="text-slate-400 font-normal">v</span> {team2Display}
          </span>
          {match.isFreeHit && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800">
              FREE HIT
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {isWakeLockSupported && (
            <button
              type="button"
              onClick={() => {
                tap();
                toggleWakeLock();
              }}
              title={isWakeLockActive ? 'Screen wake lock active' : 'Keep screen awake'}
              className={`p-1.5 rounded-md transition-colors ${
                isWakeLockActive
                  ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
              aria-label="Toggle Wake Lock"
            >
              {isWakeLockActive ? <Eye size={18} strokeWidth={1.75} /> : <EyeOff size={18} strokeWidth={1.75} />}
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              tap();
              dispatch({ type: 'TOGGLE_DARK_MODE' });
            }}
            title="Toggle theme"
            className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded-md transition-colors"
            aria-label="Toggle theme"
          >
            {darkMode ? <Sun size={18} strokeWidth={1.75} /> : <Moon size={18} strokeWidth={1.75} />}
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded-md transition-colors"
              aria-label="Match Menu"
            >
              <MoreVertical size={18} strokeWidth={1.75} />
            </button>

            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md shadow-sm z-30 py-1 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setShowMenu(false);
                      onOpenInMatchMenu();
                    }}
                    className="w-full px-3 py-2 text-left text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2"
                  >
                    <Pencil size={15} strokeWidth={1.75} />
                    <span>Match & Roster Settings</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowMenu(false);
                      onRequestChangeBowler();
                    }}
                    className="w-full px-3 py-2 text-left text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2"
                  >
                    <ArrowLeftRight size={15} strokeWidth={1.75} />
                    <span>Change Bowler Mid-Over</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowMenu(false);
                      onConfirmReset();
                    }}
                    className="w-full px-3 py-2 text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 flex items-center gap-2 border-t border-slate-100 dark:border-slate-800"
                  >
                    <RotateCcw size={15} strokeWidth={1.75} />
                    <span>Reset / New Match</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* 2. Score card: large "45/2" on left; right side muted label/value: CRR, Target, RRR, Need X from Y balls */}
      <div className="p-4 bg-white dark:bg-slate-900 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 font-medium">
            {battingTeam.name} &bull; {currentInnings.inningsNumber === 1 ? '1st Inn' : '2nd Inn'}
          </div>
          <div className="flex items-baseline gap-2.5 mt-0.5">
            <div className="text-4xl font-semibold tabular-nums text-slate-900 dark:text-slate-100 tracking-tight">
              {currentInnings.totalRuns}
              <span className="text-slate-400 font-normal">/{currentInnings.wickets}</span>
            </div>
            <span className="text-base font-medium text-slate-500 dark:text-slate-400 tabular-nums">
              ({currentInnings.oversFormatted} / {match.rules.totalOvers} ov)
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-right tabular-nums">
          <div>
            <span className="text-[10px] uppercase tracking-wider text-slate-400 block leading-tight">CRR</span>
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{crr.toFixed(2)}</span>
          </div>
          {isSecondInnings ? (
            <div>
              <span className="text-[10px] uppercase tracking-wider text-slate-400 block leading-tight">Target</span>
              <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{target}</span>
            </div>
          ) : (
            <div>
              <span className="text-[10px] uppercase tracking-wider text-slate-400 block leading-tight">Extras</span>
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{currentInnings.extras.total}</span>
            </div>
          )}

          {isSecondInnings && (
            <>
              <div>
                <span className="text-[10px] uppercase tracking-wider text-slate-400 block leading-tight">RRR</span>
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  {rrr !== null ? rrr.toFixed(2) : '-'}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider text-slate-400 block leading-tight">Need</span>
                <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
                  {Math.max(0, runsNeeded)} off {ballsRemaining}b
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 3. Batting table: Batter | R | B | 4s | 6s | SR (striker marked with small emerald dot or *). Tap to rename */}
      <div className="px-4 py-2 border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60">
        <div className="flex items-center justify-between text-[11px] font-medium text-slate-400 uppercase tracking-wider pb-1">
          <div className="flex items-center gap-1.5">
            <span>Batter</span>
            {currentInnings.nonStrikerId && (
              <button
                type="button"
                onClick={handleSwapStrike}
                className="text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors p-0.5 rounded"
                title="Swap strike"
                aria-label="Swap Strike"
              >
                <ArrowLeftRight size={13} strokeWidth={1.75} />
              </button>
            )}
          </div>
          <div className="flex items-center gap-3 font-mono text-right">
            <span className="w-6">R</span>
            <span className="w-6">B</span>
            <span className="w-5">4s</span>
            <span className="w-5">6s</span>
            <span className="w-10">SR</span>
          </div>
        </div>

        {/* Striker Row */}
        <div className="flex items-center justify-between text-xs py-1 border-t border-slate-200/60 dark:border-slate-800/60">
          <div
            onClick={() => striker && onQuickRenamePlayer(striker.id, currentInnings.battingTeamId, striker.name)}
            className="flex items-center gap-1.5 truncate pr-2 font-semibold text-slate-900 dark:text-slate-100 cursor-pointer hover:underline"
            title="Click to rename"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-700 dark:bg-emerald-500 flex-shrink-0" />
            <span className="truncate">{striker?.name || 'Striker'}</span>
          </div>
          <div className="flex items-center gap-3 font-mono text-right text-slate-700 dark:text-slate-300 tabular-nums">
            <span className="w-6 font-semibold text-slate-900 dark:text-slate-100">{strikerRuns}</span>
            <span className="w-6 text-slate-400">{strikerBalls.length}</span>
            <span className="w-5">{strikerFours}</span>
            <span className="w-5">{strikerSixes}</span>
            <span className="w-10 text-[11px] text-slate-500">{strikerSR.toFixed(1)}</span>
          </div>
        </div>

        {/* Non-Striker Row (if active) */}
        {currentInnings.nonStrikerId ? (
          <div className="flex items-center justify-between text-xs py-1 border-t border-slate-200/40 dark:border-slate-800/40">
            <div
              onClick={() => nonStriker && onQuickRenamePlayer(nonStriker.id, currentInnings.battingTeamId, nonStriker.name)}
              className="flex items-center gap-1.5 truncate pr-2 text-slate-600 dark:text-slate-400 cursor-pointer hover:underline"
              title="Click to rename"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-transparent flex-shrink-0" />
              <span className="truncate">{nonStriker?.name || 'Non-Striker'}</span>
            </div>
            <div className="flex items-center gap-3 font-mono text-right text-slate-600 dark:text-slate-400 tabular-nums">
              <span className="w-6">{nonStrikerRuns}</span>
              <span className="w-6 text-slate-400">{nonStrikerBalls.length}</span>
              <span className="w-5">{nonStrikerFours}</span>
              <span className="w-5">{nonStrikerSixes}</span>
              <span className="w-10 text-[11px] text-slate-500">{nonStrikerSR.toFixed(1)}</span>
            </div>
          </div>
        ) : (
          <div className="text-[10px] text-slate-400 italic py-0.5 border-t border-slate-200/40">
            Single batter batting alone (Last Man Stands)
          </div>
        )}
      </div>

      {/* 4. Bowler row: Name | O | M | R | W | Econ. Tap to change/rename */}
      <div className="px-4 py-2 bg-white dark:bg-slate-900 flex items-center justify-between text-xs">
        <div
          onClick={onRequestChangeBowler}
          className="truncate pr-2 cursor-pointer hover:underline"
          title="Click to change or rename bowler"
        >
          <span className="text-[10px] uppercase tracking-wider text-slate-400 block">Bowler</span>
          <span className="font-semibold text-slate-900 dark:text-slate-100 truncate block">
            {bowler?.name || 'Bowler'}
          </span>
        </div>
        <div className="flex items-center gap-3 font-mono text-right text-slate-700 dark:text-slate-300 tabular-nums">
          <div className="text-center w-7">
            <span className="text-[10px] text-slate-400 block uppercase">O</span>
            <span className="text-xs font-medium">{bowlerOvers}</span>
          </div>
          <div className="text-center w-5">
            <span className="text-[10px] text-slate-400 block uppercase">M</span>
            <span className="text-xs font-medium">{bowlerMaidens}</span>
          </div>
          <div className="text-center w-6">
            <span className="text-[10px] text-slate-400 block uppercase">R</span>
            <span className="text-xs font-medium">{bowlerRunsConceded}</span>
          </div>
          <div className="text-center w-6">
            <span className="text-[10px] text-slate-400 block uppercase">W</span>
            <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">{bowlerWickets}</span>
          </div>
          <div className="text-center w-9">
            <span className="text-[10px] text-slate-400 block uppercase">Econ</span>
            <span className="text-xs font-medium text-slate-500">{bowlerEcon.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
