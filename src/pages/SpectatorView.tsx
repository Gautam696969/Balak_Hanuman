import React, { useEffect, useState, useMemo } from 'react';
import {
  Share2,
  RefreshCw,
  Sun,
  Moon,
  Radio,
  Trophy,
  Activity,
  FileText,
  Info,
  Clock,
  ArrowRight,
  MessageSquare,
  Zap,
  Flame,
  Award,
  Maximize,
  Minimize,
} from 'lucide-react';
import { Match, Ball } from '../types/cricket';
import {
  subscribeToLiveMatch,
  fetchLiveMatchOnce,
  isFirebaseConfigured,
} from '../services/firebase';
import {
  calculateRunRate,
  calculateRequiredRunRate,
  calculateStrikeRate,
  calculateEconomy,
  normalizeMatch,
} from '../utils/cricket';
import { Scorecard } from '../components/Scorecard';
import { useFullscreen } from '../hooks/useFullscreen';

interface SpectatorViewProps {
  matchId: string;
  initialMatch?: Match;
  onExitSpectatorMode?: () => void;
}

export const SpectatorView: React.FC<SpectatorViewProps> = ({
  matchId,
  initialMatch,
  onExitSpectatorMode,
}) => {
  const [match, setMatch] = useState<Match | null>(initialMatch ? normalizeMatch(initialMatch) : null);
  const [loading, setLoading] = useState(!initialMatch);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'live' | 'scorecard' | 'info'>('live');
  const [lastUpdated, setLastUpdated] = useState<number>(Date.now());
  const [hasNewUpdate, setHasNewUpdate] = useState(false);
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    if (typeof document !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return false;
  });
  const { isFullscreen, toggleFullscreen } = useFullscreen();

  // Toggle theme
  const handleToggleTheme = () => {
    const nextDark = !darkMode;
    setDarkMode(nextDark);
    if (typeof document !== 'undefined') {
      if (nextDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  };

  // Manual refresh
  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      const data = await fetchLiveMatchOnce(matchId);
      if (data) {
        setMatch(normalizeMatch(data));
        setLastUpdated(Date.now());
      }
    } catch (e) {
      console.warn('Manual refresh error:', e);
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  // Subscribe to live updates
  useEffect(() => {
    setLoading(true);
    setError(null);

    // Initial fetch once
    fetchLiveMatchOnce(matchId)
      .then((data) => {
        if (data) {
          setMatch(normalizeMatch(data));
          setLastUpdated(Date.now());
        }
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });

    // Realtime subscription
    const unsubscribe = subscribeToLiveMatch(
      matchId,
      (updatedMatch) => {
        setMatch(normalizeMatch(updatedMatch));
        setLastUpdated(Date.now());
        setHasNewUpdate(true);
        setTimeout(() => setHasNewUpdate(false), 1200);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.warn('Subscription warning:', err);
        try {
          const stored =
            localStorage.getItem('cricket_current_match_v3') ||
            localStorage.getItem('CURRENT_MATCH');
          if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed && (parsed.id === matchId || !parsed.id)) {
              setMatch(normalizeMatch(parsed));
              setLoading(false);
              return;
            }
          }
        } catch {
          // ignore
        }
        if (!match) {
          setError(
            !isFirebaseConfigured()
              ? 'Firebase cloud database is not connected. The scorer needs to set up Firebase to broadcast live.'
              : 'Waiting for match updates from scorer...'
          );
        }
        setLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [matchId]);

  // Calculations & team definitions
  const currentInnings = match?.innings?.[match?.currentInningsIndex ?? 0];
  const battingTeam = currentInnings
    ? currentInnings.battingTeamId === 'teamA'
      ? match?.teamA
      : match?.teamB
    : null;
  const bowlingTeam = currentInnings
    ? currentInnings.bowlingTeamId === 'teamA'
      ? match?.teamA
      : match?.teamB
    : null;

  const striker = battingTeam?.players?.find((p) => p.id === currentInnings?.strikerId);
  const nonStriker = battingTeam?.players?.find((p) => p.id === currentInnings?.nonStrikerId);
  const currentBowler = bowlingTeam?.players?.find((p) => p.id === currentInnings?.currentBowlerId);

  // Safe arrays for Firebase compatibility
  const allBallsList: Ball[] = useMemo(() => {
    if (!currentInnings?.allBalls) return [];
    return (Array.isArray(currentInnings.allBalls)
      ? currentInnings.allBalls
      : (Object.values(currentInnings.allBalls) as Ball[])
    ).filter(Boolean);
  }, [currentInnings?.allBalls]);

  const currentOverBallsList: Ball[] = useMemo(() => {
    if (!currentInnings?.currentOverBalls) return [];
    return (Array.isArray(currentInnings.currentOverBalls)
      ? currentInnings.currentOverBalls
      : (Object.values(currentInnings.currentOverBalls) as Ball[])
    ).filter(Boolean);
  }, [currentInnings?.currentOverBalls]);

  // Share handlers
  const handleShare = () => {
    const shareUrl = window.location.href;
    const teamA = match?.teamA.name || 'Team 1';
    const teamB = match?.teamB.name || 'Team 2';
    const inn = currentInnings;
    const scoreStr = inn
      ? `${battingTeam?.name || 'Batting'}: ${inn.totalRuns}/${inn.wickets} (${inn.oversFormatted} ov)`
      : '';
    const text = `🏏 *${teamA} vs ${teamB}*\n⚡ Live Score: ${scoreStr}\n\n👉 Watch live ball-by-ball score here:\n${shareUrl}`;
    const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank');
  };

  // Batter stats calculation
  const strikerStats = useMemo(() => {
    if (!currentInnings || !striker) return { runs: 0, balls: 0, fours: 0, sixes: 0, sr: 0 };
    let runs = 0;
    let balls = 0;
    let fours = 0;
    let sixes = 0;

    for (const b of allBallsList) {
      if (b.batsmanId === striker.id) {
        if (b.extraType !== 'wd') balls += 1;
        runs += b.runsOffBat;
        if (b.runsOffBat === 4) fours += 1;
        if (b.runsOffBat === 6) sixes += 1;
      }
    }
    return {
      runs,
      balls,
      fours,
      sixes,
      sr: calculateStrikeRate(runs, balls),
    };
  }, [currentInnings, striker, allBallsList]);

  const nonStrikerStats = useMemo(() => {
    if (!currentInnings || !nonStriker) return { runs: 0, balls: 0, fours: 0, sixes: 0, sr: 0 };
    let runs = 0;
    let balls = 0;
    let fours = 0;
    let sixes = 0;

    for (const b of allBallsList) {
      if (b.batsmanId === nonStriker.id) {
        if (b.extraType !== 'wd') balls += 1;
        runs += b.runsOffBat;
        if (b.runsOffBat === 4) fours += 1;
        if (b.runsOffBat === 6) sixes += 1;
      }
    }
    return {
      runs,
      balls,
      fours,
      sixes,
      sr: calculateStrikeRate(runs, balls),
    };
  }, [currentInnings, nonStriker, allBallsList]);

  // Bowler stats calculation
  const bowlerStats = useMemo(() => {
    if (!currentInnings || !currentBowler) return { overs: '0.0', maidens: 0, runs: 0, wickets: 0, econ: 0 };
    let legalBalls = 0;
    let runsConceded = 0;
    let wickets = 0;

    for (const b of allBallsList) {
      if (b.bowlerId === currentBowler.id) {
        if (b.isLegal) legalBalls += 1;
        if (b.extraType === 'wd') runsConceded += b.extraRuns;
        else if (b.extraType === 'nb') runsConceded += (b.extraRuns !== undefined ? b.extraRuns : 1) + b.runsOffBat;
        else runsConceded += b.runsOffBat;

        if (b.wicket && b.wicket.type !== 'runOut' && b.wicket.type !== 'retiredHurt') {
          wickets += 1;
        }
      }
    }

    const oversFormatted = `${Math.floor(legalBalls / 6)}.${legalBalls % 6}`;
    return {
      overs: oversFormatted,
      maidens: 0,
      runs: runsConceded,
      wickets,
      econ: calculateEconomy(runsConceded, legalBalls),
    };
  }, [currentInnings, currentBowler, allBallsList]);

  // Target chase calculations
  const inn1 = match?.innings?.[0];
  const inn2 = match?.innings?.[1];
  const isSecondInnings = match?.currentInningsIndex === 1;
  const target = isSecondInnings && inn1 ? (inn1.totalRuns || 0) + 1 : null;
  const runsNeeded = target !== null && currentInnings ? target - currentInnings.totalRuns : null;
  const totalBallsInMatch = (match?.rules.totalOvers || 20) * 6;
  const ballsRemaining = currentInnings ? Math.max(0, totalBallsInMatch - currentInnings.legalBalls) : 0;
  const rrr = target !== null && currentInnings ? calculateRequiredRunRate(runsNeeded || 0, ballsRemaining) : null;
  const crr = currentInnings ? calculateRunRate(currentInnings.totalRuns, currentInnings.legalBalls) : '0.00';

  const targetProgress = target && target > 0 && currentInnings
    ? Math.min(100, Math.max(0, Math.round((currentInnings.totalRuns / target) * 100)))
    : 0;

  const runsInCurrentOver = useMemo(() => {
    return currentOverBallsList.reduce((acc, b) => acc + (b.totalRuns || 0), 0);
  }, [currentOverBallsList]);

  // Teams who batted in innings 1 and 2
  const inn1BattingTeam = inn1
    ? inn1.battingTeamId === 'teamA'
      ? match?.teamA
      : match?.teamB
    : match?.teamA;
  const inn2BattingTeam = inn1
    ? inn1.battingTeamId === 'teamA'
      ? match?.teamB
      : match?.teamA
    : match?.teamB;

  if (loading && !match) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="relative mb-4">
          <div className="w-16 h-16 rounded-full border-4 border-orange-500/30 border-t-orange-500 animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Radio size={22} className="text-orange-500 animate-pulse" />
          </div>
        </div>
        <h2 className="text-base font-bold text-slate-800 dark:text-slate-200">
          Connecting to Live Match...
        </h2>
        <p className="text-xs text-slate-400 mt-1 max-w-xs">
          Listening for ball-by-ball updates from the scorer.
        </p>
      </div>
    );
  }

  if (error && !match) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-3 shadow-inner">
          <Radio size={28} />
        </div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">
          Waiting for Live Stream
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mb-5 leading-relaxed">
          {error}
        </p>
        <div className="flex flex-col gap-2.5 w-full max-w-xs">
          <button
            type="button"
            onClick={handleManualRefresh}
            className="w-full h-11 rounded-xl bg-orange-600 hover:bg-orange-700 active:scale-[0.98] transition-all text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm"
          >
            <RefreshCw size={15} className={isRefreshing ? 'animate-spin' : ''} /> Retry Connection
          </button>
          {onExitSpectatorMode && (
            <button
              type="button"
              onClick={onExitSpectatorMode}
              className="w-full h-10 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Open Scorer App
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!match || !currentInnings || !battingTeam || !bowlingTeam) {
    return null;
  }

  const isCompleted = match.status === 'completed';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col antialiased">
      {/* Sticky Top Mobile Navbar */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/90 dark:border-slate-800 shadow-2xs">
        <div className="max-w-md mx-auto px-3.5 h-13 flex items-center justify-between">
          {/* Logo & App Title */}
          <div className="flex items-center gap-2 min-w-0">
            <img
              src="/balak-hanuman.png"
              alt="Balak Hanuman"
              className="w-7 h-7 object-contain drop-shadow-xs shrink-0"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-sm tracking-tight text-slate-900 dark:text-slate-100 truncate">
                  Balak Hanuman
                </span>
                {isCompleted ? (
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 shrink-0">
                    <Trophy size={10} className="text-amber-500" /> Done
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[9px] font-black uppercase tracking-wider bg-red-100 dark:bg-red-950/80 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/60 shrink-0">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-600"></span>
                    </span>
                    LIVE
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 text-[9px] text-slate-400">
                <Clock size={9} />
                <span>
                  {hasNewUpdate ? (
                    <strong className="text-emerald-600 dark:text-emerald-400 font-bold animate-pulse">
                      Updated just now
                    </strong>
                  ) : (
                    `Sync ${new Date(lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={handleManualRefresh}
              title="Refresh match data"
              aria-label="Refresh match data"
              className="w-8 h-8 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-all"
            >
              <RefreshCw size={15} className={isRefreshing ? 'animate-spin text-orange-600' : ''} />
            </button>

            <button
              type="button"
              onClick={toggleFullscreen}
              title={isFullscreen ? 'Exit Full Screen' : 'Full Screen'}
              aria-label={isFullscreen ? 'Exit Full Screen' : 'Full Screen'}
              className="w-8 h-8 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-all"
            >
              {isFullscreen ? (
                <Minimize size={16} className="text-orange-600 dark:text-orange-400" />
              ) : (
                <Maximize size={16} />
              )}
            </button>

            <button
              type="button"
              onClick={handleShare}
              title="Share on WhatsApp"
              aria-label="Share on WhatsApp"
              className="w-8 h-8 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 active:scale-95 transition-all"
            >
              <Share2 size={16} />
            </button>

            <button
              type="button"
              onClick={handleToggleTheme}
              title="Toggle dark mode"
              aria-label="Toggle dark mode"
              className="w-8 h-8 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-all"
            >
              {darkMode ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} />}
            </button>
          </div>
        </div>

        {/* Dual-Team Mini Scorebar */}
        <div className="bg-slate-100/90 dark:bg-slate-850 border-t border-slate-200/70 dark:border-slate-800/80 px-3.5 py-1.5 flex items-center justify-between text-xs">
          {/* Innings 1 Team */}
          <div
            className={`flex items-center gap-1.5 truncate ${
              match.currentInningsIndex === 0
                ? 'font-bold text-orange-600 dark:text-orange-400'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <span className="truncate max-w-[100px] sm:max-w-[130px]">
              {inn1BattingTeam?.name || 'Team 1'}
            </span>
            <span className="font-mono font-bold tabular-nums">
              {inn1 ? `${inn1.totalRuns}/${inn1.wickets}` : '0/0'}
            </span>
            {inn1 && <span className="text-[10px] text-slate-400">({inn1.oversFormatted})</span>}
            {match.currentInningsIndex === 0 && (
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0 animate-pulse" />
            )}
          </div>

          <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-600 px-1">
            vs
          </span>

          {/* Innings 2 Team */}
          <div
            className={`flex items-center gap-1.5 truncate justify-end ${
              match.currentInningsIndex === 1
                ? 'font-bold text-orange-600 dark:text-orange-400'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            {match.currentInningsIndex === 1 && (
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0 animate-pulse" />
            )}
            <span className="truncate max-w-[100px] sm:max-w-[130px]">
              {inn2BattingTeam?.name || 'Team 2'}
            </span>
            <span className="font-mono font-bold tabular-nums">
              {inn2 && inn2.legalBalls > 0
                ? `${inn2.totalRuns}/${inn2.wickets}`
                : match.currentInningsIndex === 1
                ? '0/0'
                : 'Yet to bat'}
            </span>
            {inn2 && inn2.legalBalls > 0 && (
              <span className="text-[10px] text-slate-400">({inn2.oversFormatted})</span>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-md mx-auto w-full flex-1 px-3 py-3 space-y-3 pb-24">
        {/* HERO LIVE SCORE CARD */}
        <div className="bg-gradient-to-br from-white via-white to-orange-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-slate-850 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 shadow-xs relative overflow-hidden">
          {/* Subtle warm ambient glow */}
          <div className="absolute top-0 right-0 -mr-8 -mt-8 w-28 h-28 bg-orange-500/10 rounded-full blur-2xl pointer-events-none" />

          {/* Top Info Line: Toss & Format */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800/80 text-[11px]">
            <span className="font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1">
              <Award size={13} className="text-orange-500 shrink-0" />
              {match.rules.totalOvers} Overs Match
            </span>
            <span className="text-slate-400 font-medium">
              {match.toss.winner === 'teamA' ? match.teamA.name : match.teamB.name} elected to{' '}
              {match.toss.decision}
            </span>
          </div>

          {/* Large Live Score Display */}
          <div className="pt-3 pb-2 flex items-baseline justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-sm text-orange-600 dark:text-orange-400 uppercase tracking-wide truncate">
                  {battingTeam.name}
                </span>
                <span className="text-[10px] font-bold text-slate-400 uppercase">
                  ({currentInnings.inningsNumber === 1 ? '1st Inn' : '2nd Inn'})
                </span>
              </div>

              <div className="flex items-baseline gap-2 mt-0.5">
                <div className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-slate-50 tabular-nums">
                  {currentInnings.totalRuns}
                  <span className="text-2xl sm:text-3xl font-bold text-slate-400 dark:text-slate-500">
                    /{currentInnings.wickets}
                  </span>
                </div>
                <div className="text-sm sm:text-base font-semibold text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                  ({currentInnings.oversFormatted} ov)
                </div>
              </div>
            </div>

            {/* Run Rate Chips */}
            <div className="flex flex-col items-end gap-1 shrink-0">
              <div className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 text-right">
                <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider leading-none">
                  CRR
                </span>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 font-mono tabular-nums">
                  {crr}
                </span>
              </div>

              {rrr !== null && (
                <div className="px-2 py-0.5 rounded-md bg-orange-100/70 dark:bg-orange-950/60 border border-orange-200 dark:border-orange-800/60 text-right">
                  <span className="text-[9px] uppercase font-extrabold text-orange-600 dark:text-orange-400 block tracking-wider leading-none">
                    REQ RR
                  </span>
                  <span className="text-xs font-extrabold text-orange-600 dark:text-orange-400 font-mono tabular-nums">
                    {rrr}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Free Hit Alert Banner */}
          {match.isFreeHit && !isCompleted && (
            <div className="mt-2 py-1 px-2.5 rounded-lg bg-red-500 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-xs animate-pulse">
              <Flame size={14} fill="currentColor" /> FREE HIT ON THIS BALL!
            </div>
          )}

          {/* Chase Target Progress Box (2nd Innings) */}
          {target !== null && !isCompleted && (
            <div className="mt-2.5 p-2.5 rounded-xl bg-orange-50/90 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-900/60 space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-orange-950 dark:text-orange-200">
                <span>
                  Target: <strong className="font-mono text-sm">{target}</strong>
                </span>
                <span className="text-orange-600 dark:text-orange-400 font-extrabold">
                  Need {Math.max(0, runsNeeded || 0)} from {ballsRemaining} balls
                </span>
              </div>

              {/* Visual Progress Bar */}
              <div className="w-full h-1.5 bg-orange-200/80 dark:bg-orange-950 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full transition-all duration-300"
                  style={{ width: `${targetProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Completed Result Banner */}
          {isCompleted && match.result && (
            <div className="mt-2.5 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-300/80 dark:border-amber-700/80 text-center">
              <div className="flex items-center justify-center gap-1.5 text-xs font-extrabold text-amber-900 dark:text-amber-200">
                <Trophy size={16} className="text-amber-600 shrink-0" />
                <span>{match.result.marginText}</span>
              </div>
            </div>
          )}
        </div>

        {/* THIS OVER TIMELINE */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-3 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider flex items-center gap-1">
              <Activity size={12} className="text-orange-500" />
              This Over (Over {Math.floor((currentInnings.legalBalls || 0) / 6) + 1})
            </span>
            <div className="flex items-center gap-2 text-[11px] font-mono">
              <span className="text-slate-500 dark:text-slate-400">
                {runsInCurrentOver} runs
              </span>
              <span className="text-slate-400">&bull;</span>
              <span className="text-slate-400">
                {currentOverBallsList.filter((b) => b.isLegal).length}/6 balls
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none">
            {currentOverBallsList.length === 0 ? (
              <span className="text-xs text-slate-400 dark:text-slate-500 italic py-1">
                Over starting soon...
              </span>
            ) : (
              currentOverBallsList.map((b, idx) => {
                let badgeStyle =
                  'border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300';
                let label = b.displayLabel || `${b.totalRuns}`;

                if (b.wicket) {
                  badgeStyle =
                    'border-red-600 bg-red-500 text-white font-black shadow-xs';
                  label = 'W';
                } else if (b.runsOffBat === 6 || b.totalRuns === 6) {
                  badgeStyle =
                    'border-purple-600 bg-purple-600 text-white font-black shadow-xs';
                  label = '6';
                } else if (b.runsOffBat === 4 || b.totalRuns === 4) {
                  badgeStyle =
                    'border-blue-600 bg-blue-600 text-white font-black shadow-xs';
                  label = '4';
                } else if (b.extraType === 'wd') {
                  badgeStyle =
                    'border-amber-500 bg-amber-500 text-white font-bold';
                  label = `${b.extraRuns}wd`;
                } else if (b.extraType === 'nb') {
                  badgeStyle =
                    'border-amber-600 bg-amber-600 text-white font-bold';
                  label = b.runsOffBat > 0 ? `${b.runsOffBat + b.extraRuns}nb` : 'nb';
                } else if (b.totalRuns === 0) {
                  badgeStyle =
                    'border-slate-200 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500';
                  label = '•';
                }

                return (
                  <div
                    key={b.id || idx}
                    className={`w-8 h-8 rounded-full border flex items-center justify-center text-xs tabular-nums shrink-0 font-mono transition-transform ${badgeStyle}`}
                  >
                    {label}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ON-FIELD BATTERS (MOBILE FRIENDLY CARD) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
          <div className="px-3.5 py-2 bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <Zap size={12} className="text-orange-500" />
              Batters
            </span>
            <span className="font-mono text-[10px] text-slate-400">R (B) &bull; 4s / 6s &bull; SR</span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {/* Striker Row */}
            <div className="px-3.5 py-2.5 bg-orange-50/30 dark:bg-orange-950/15">
              {match.needsBatsmanSelection && match.dismissedBatsmanRole === 'striker' ? (
                <div className="flex items-center gap-2 py-1 text-amber-600 dark:text-amber-400 text-xs font-semibold animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                  <span>Waiting for new batter to arrive at crease...</span>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="w-2 h-2 rounded-full bg-orange-500 shrink-0" />
                      <span className="font-bold text-slate-900 dark:text-slate-100 truncate text-sm">
                        {striker?.name || 'Striker'}
                      </span>
                      <span className="px-1.5 py-0.2 text-[9px] font-extrabold uppercase rounded bg-orange-500 text-white shrink-0 tracking-wider">
                        Strike
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 pl-3.5 font-mono">
                      4s: <strong className="text-slate-800 dark:text-slate-200">{strikerStats.fours}</strong>
                      {' '}&bull;{' '}
                      6s: <strong className="text-slate-800 dark:text-slate-200">{strikerStats.sixes}</strong>
                      {' '}&bull;{' '}
                      SR: <strong className="text-slate-800 dark:text-slate-200">{strikerStats.sr.toFixed(1)}</strong>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-lg font-black text-slate-900 dark:text-slate-50 font-mono tabular-nums leading-tight">
                      {strikerStats.runs}
                      <span className="text-xs font-medium text-slate-400 ml-1">
                        ({strikerStats.balls})
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Non-Striker Row */}
            {nonStriker && (
              <div className="px-3.5 py-2.5">
                {match.needsBatsmanSelection && match.dismissedBatsmanRole === 'nonStriker' ? (
                  <div className="flex items-center gap-2 py-1 text-amber-600 dark:text-amber-400 text-xs font-semibold animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                    <span>Waiting for new batter to arrive at crease...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-700 shrink-0" />
                        <span className="font-semibold text-slate-800 dark:text-slate-200 truncate text-sm">
                          {nonStriker.name}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 pl-3.5 font-mono">
                        4s: <strong className="text-slate-800 dark:text-slate-200">{nonStrikerStats.fours}</strong>
                        {' '}&bull;{' '}
                        6s: <strong className="text-slate-800 dark:text-slate-200">{nonStrikerStats.sixes}</strong>
                        {' '}&bull;{' '}
                        SR: <strong className="text-slate-800 dark:text-slate-200">{nonStrikerStats.sr.toFixed(1)}</strong>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-lg font-bold text-slate-800 dark:text-slate-200 font-mono tabular-nums leading-tight">
                        {nonStrikerStats.runs}
                        <span className="text-xs font-medium text-slate-400 ml-1">
                          ({nonStrikerStats.balls})
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* CURRENT BOWLER CARD */}
        {currentBowler && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-3.5 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider">
                Current Bowler
              </span>
              <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                Econ: <strong className="text-slate-800 dark:text-slate-200">{bowlerStats.econ.toFixed(2)}</strong>
              </span>
            </div>

            <div className="flex items-center justify-between gap-3">
              <div className="truncate pr-2">
                <span className="font-bold text-slate-900 dark:text-slate-100 text-sm truncate block">
                  {currentBowler.name}
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  Overs: <strong className="text-slate-700 dark:text-slate-300">{bowlerStats.overs}</strong> &bull; M: {bowlerStats.maidens}
                </span>
              </div>

              <div className="flex items-center gap-3 shrink-0 font-mono">
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block uppercase font-medium leading-tight">Runs</span>
                  <span className="text-base font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                    {bowlerStats.runs}
                  </span>
                </div>
                <div className="text-right pl-3 border-l border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-orange-500 block uppercase font-bold leading-tight">Wkts</span>
                  <span className="text-base font-extrabold text-orange-600 dark:text-orange-400 tabular-nums">
                    {bowlerStats.wickets}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB NAVIGATION (SEGMENTED CONTROL) */}
        <div className="sticky top-24 z-30 p-1 rounded-xl bg-slate-200/80 dark:bg-slate-800/90 backdrop-blur-md flex gap-1 shadow-2xs">
          <button
            type="button"
            onClick={() => setActiveTab('live')}
            className={`flex-1 h-9 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'live'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Activity size={14} className={activeTab === 'live' ? 'text-orange-500' : ''} />
            Feed
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('scorecard')}
            className={`flex-1 h-9 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'scorecard'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <FileText size={14} className={activeTab === 'scorecard' ? 'text-orange-500' : ''} />
            Scorecard
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('info')}
            className={`flex-1 h-9 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'info'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Info size={14} className={activeTab === 'info' ? 'text-orange-500' : ''} />
            Match Info
          </button>
        </div>

        {/* TAB 1: BALL-BY-BALL COMMENTARY */}
        {activeTab === 'live' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-3.5 shadow-xs space-y-2.5">
            <div className="flex items-center justify-between pb-1">
              <h3 className="text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                Live Deliveries
              </h3>
              <span className="text-[10px] text-slate-400 font-mono">
                Latest first ({allBallsList.length} balls bowled)
              </span>
            </div>

            {allBallsList.length === 0 ? (
              <p className="text-xs text-slate-400 italic text-center py-6">
                No deliveries recorded yet. First over will appear here once bowled!
              </p>
            ) : (
              <div className="space-y-2">
                {[...allBallsList]
                  .reverse()
                  .slice(0, 20)
                  .map((ball: Ball) => {
                    let badgeClass =
                      'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700';
                    let label = ball.displayLabel || `${ball.totalRuns}`;

                    if (ball.wicket) {
                      badgeClass = 'bg-red-500 text-white font-extrabold border-red-600';
                      label = 'W';
                    } else if (ball.runsOffBat === 6 || ball.totalRuns === 6) {
                      badgeClass = 'bg-purple-600 text-white font-extrabold border-purple-700';
                      label = '6';
                    } else if (ball.runsOffBat === 4 || ball.totalRuns === 4) {
                      badgeClass = 'bg-blue-600 text-white font-extrabold border-blue-700';
                      label = '4';
                    } else if (ball.extraType === 'wd') {
                      badgeClass = 'bg-amber-500 text-white font-bold border-amber-600';
                      label = `${ball.extraRuns}wd`;
                    } else if (ball.extraType === 'nb') {
                      badgeClass = 'bg-amber-600 text-white font-bold border-amber-700';
                      label = ball.runsOffBat > 0 ? `${ball.runsOffBat + ball.extraRuns}nb` : 'nb';
                    } else if (ball.totalRuns === 0) {
                      badgeClass = 'bg-slate-50 dark:bg-slate-800/50 text-slate-400 border-slate-200 dark:border-slate-700';
                      label = '•';
                    }

                    return (
                      <div
                        key={ball.id}
                        className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 pr-2">
                          <span className="font-mono text-xs font-extrabold text-slate-400 dark:text-slate-500 w-8 shrink-0">
                            {ball.overIndex}.{ball.legalBallNumber || ball.ballInOver}
                          </span>
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-800 dark:text-slate-200 text-xs truncate">
                              {ball.bowlerName} to {ball.batsmanName}
                            </p>
                            <span className="text-[11px] block mt-0.5 text-slate-500 dark:text-slate-400 truncate">
                              {ball.wicket ? (
                                <strong className="text-red-600 dark:text-red-400 font-extrabold">
                                  WICKET! {ball.wicket.batsmanName ? `${ball.wicket.batsmanName} ` : ''}
                                  ({ball.wicket.description || ball.wicket.type})
                                </strong>
                              ) : ball.extraType === 'wd' ? (
                                <strong className="text-amber-600 dark:text-amber-400 font-bold">
                                  Wide ball ({ball.extraRuns} run)
                                </strong>
                              ) : ball.extraType === 'nb' ? (
                                <strong className="text-amber-600 dark:text-amber-400 font-bold">
                                  No-Ball ({ball.extraRuns} penalty + {ball.runsOffBat} off bat)
                                </strong>
                              ) : ball.runsOffBat === 4 ? (
                                <strong className="text-blue-600 dark:text-blue-400 font-bold">
                                  FOUR! Beautiful boundary
                                </strong>
                              ) : ball.runsOffBat === 6 ? (
                                <strong className="text-purple-600 dark:text-purple-400 font-bold">
                                  SIX! Massive hit over the ropes
                                </strong>
                              ) : ball.runsOffBat === 0 && !ball.extraType ? (
                                'Dot ball, no run'
                              ) : (
                                `${ball.runsOffBat} run${ball.runsOffBat > 1 ? 's' : ''}`
                              )}
                            </span>
                          </div>
                        </div>

                        <span
                          className={`w-7 h-7 rounded-full border flex items-center justify-center text-xs font-mono shrink-0 shadow-2xs ${badgeClass}`}
                        >
                          {label}
                        </span>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: FULL SCORECARD */}
        {activeTab === 'scorecard' && (
          <Scorecard matchOverride={match} />
        )}

        {/* TAB 3: MATCH INFO */}
        {activeTab === 'info' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 shadow-xs text-xs space-y-3.5">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Toss Result
              </span>
              <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 text-sm">
                {match.toss.winner === 'teamA' ? match.teamA.name : match.teamB.name} won the toss
                and elected to {match.toss.decision} first.
              </p>
            </div>

            <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider mb-1">
                Playing Conditions
              </span>
              <ul className="space-y-1.5 text-slate-600 dark:text-slate-400 text-xs">
                <li className="flex justify-between">
                  <span>Total Overs:</span>
                  <strong className="font-mono text-slate-800 dark:text-slate-200">{match.rules.totalOvers} overs / innings</strong>
                </li>
                <li className="flex justify-between">
                  <span>Max Bowler Overs:</span>
                  <strong className="font-mono text-slate-800 dark:text-slate-200">{match.rules.maxOversPerBowler} overs</strong>
                </li>
                <li className="flex justify-between">
                  <span>Wide Run:</span>
                  <strong className="font-mono text-slate-800 dark:text-slate-200">{match.rules.wideRuns} run penalty</strong>
                </li>
                <li className="flex justify-between">
                  <span>No-Ball Run:</span>
                  <strong className="font-mono text-slate-800 dark:text-slate-200">{match.rules.noBallRuns} run penalty</strong>
                </li>
                <li className="flex justify-between">
                  <span>Free Hit:</span>
                  <strong className="font-mono text-slate-800 dark:text-slate-200">{match.rules.freeHitOnNoBall ? 'Yes' : 'No'}</strong>
                </li>
              </ul>
            </div>

            <div className="border-t border-slate-100 dark:border-slate-800 pt-3 grid grid-cols-2 gap-3">
              <div className="bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                <span className="font-bold text-slate-800 dark:text-slate-200 block mb-1 truncate">
                  {match.teamA.name} ({match.teamA.players.length})
                </span>
                <ol className="list-decimal pl-4 space-y-0.5 text-slate-600 dark:text-slate-400 text-[11px]">
                  {match.teamA.players.map((p) => (
                    <li key={p.id} className="truncate">{p.name}</li>
                  ))}
                </ol>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                <span className="font-bold text-slate-800 dark:text-slate-200 block mb-1 truncate">
                  {match.teamB.name} ({match.teamB.players.length})
                </span>
                <ol className="list-decimal pl-4 space-y-0.5 text-slate-600 dark:text-slate-400 text-[11px]">
                  {match.teamB.players.map((p) => (
                    <li key={p.id} className="truncate">{p.name}</li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
        )}

        {/* Switcher back to Scorer mode (if opened by Scorer) */}
        {onExitSpectatorMode && (
          <div className="text-center pt-2">
            <button
              type="button"
              onClick={onExitSpectatorMode}
              className="text-[11px] text-slate-400 hover:text-orange-600 dark:hover:text-orange-400 inline-flex items-center gap-1 transition-colors py-1"
            >
              Are you the scorer? Switch to Scorer App <ArrowRight size={12} />
            </button>
          </div>
        )}
      </main>

      {/* FIXED BOTTOM WHATSAPP SHARE BAR (MOBILE FIRST) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 p-2.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 shadow-lg">
        <div className="max-w-md mx-auto">
          <button
            type="button"
            onClick={handleShare}
            className="w-full h-11 rounded-xl bg-[#25D366] hover:bg-[#20ba59] active:scale-[0.98] transition-all text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm"
          >
            <MessageSquare size={16} fill="currentColor" />
            <span>Share Live Match on WhatsApp</span>
          </button>
        </div>
      </div>
    </div>
  );
};