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

interface SpectatorViewProps {
  matchId: string;
  onExitSpectatorMode?: () => void;
}

export const SpectatorView: React.FC<SpectatorViewProps> = ({
  matchId,
  onExitSpectatorMode,
}) => {
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'live' | 'scorecard' | 'info'>('live');
  const [lastUpdated, setLastUpdated] = useState<number>(Date.now());
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return document.documentElement.classList.contains('dark');
  });

  // Toggle theme
  const handleToggleTheme = () => {
    const nextDark = !darkMode;
    setDarkMode(nextDark);
    if (nextDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Subscribe to live updates
  useEffect(() => {
    setLoading(true);
    setError(null);

    // Initial fetch once
    fetchLiveMatchOnce(matchId).then((data) => {
      if (data) {
        setMatch(normalizeMatch(data));
        setLastUpdated(Date.now());
      }
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });

    // Realtime subscription
    const unsubscribe = subscribeToLiveMatch(
      matchId,
      (updatedMatch) => {
        setMatch(normalizeMatch(updatedMatch));
        setLastUpdated(Date.now());
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.warn('Subscription warning:', err);
        // Check if match is in localStorage for local preview testing
        try {
          const stored = localStorage.getItem('cricket_current_match_v3') || localStorage.getItem('CURRENT_MATCH');
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

  // Share handlers
  const handleShare = () => {
    const shareUrl = window.location.href;
    const teamA = match?.teamA.name || 'Team 1';
    const teamB = match?.teamB.name || 'Team 2';
    const text = `🏏 Watch Live Cricket Match!\n*${teamA} vs ${teamB}*\nWatch live ball-by-ball score here:\n${shareUrl}`;
    const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank');
  };

  // Calculations
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

  // Safe arrays for Firebase compatibility (empty arrays can become undefined or objects in RTDB)
  const allBallsList: Ball[] = useMemo(() => {
    if (!currentInnings?.allBalls) return [];
    return Array.isArray(currentInnings.allBalls)
      ? currentInnings.allBalls
      : (Object.values(currentInnings.allBalls) as Ball[]);
  }, [currentInnings?.allBalls]);

  const currentOverBallsList: Ball[] = useMemo(() => {
    if (!currentInnings?.currentOverBalls) return [];
    return Array.isArray(currentInnings.currentOverBalls)
      ? currentInnings.currentOverBalls
      : (Object.values(currentInnings.currentOverBalls) as Ball[]);
  }, [currentInnings?.currentOverBalls]);

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
  const target =
    match?.currentInningsIndex === 1 ? (match.innings[0].totalRuns || 0) + 1 : null;
  const runsNeeded = target !== null && currentInnings ? target - currentInnings.totalRuns : null;
  const totalBallsInMatch = (match?.rules.totalOvers || 20) * 6;
  const ballsRemaining = currentInnings ? Math.max(0, totalBallsInMatch - currentInnings.legalBalls) : 0;
  const rrr =
    target !== null && currentInnings
      ? calculateRequiredRunRate(runsNeeded || 0, ballsRemaining)
      : null;

  if (loading && !match) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full border-4 border-orange-500 border-t-transparent animate-spin" />
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            Connecting to Live Match...
          </p>
          <span className="text-xs text-slate-500">Listening for real-time updates</span>
        </div>
      </div>
    );
  }

  if (error && !match) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4 text-center">
        <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-3">
          <Radio size={24} />
        </div>
        <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1">
          Waiting for Live Stream
        </h2>
        <p className="text-xs text-slate-500 max-w-xs mb-4 leading-relaxed">{error}</p>
        <div className="flex flex-col gap-2 w-full max-w-xs">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="w-full h-10 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-xs"
          >
            <RefreshCw size={14} /> Retry Connection
          </button>
          {onExitSpectatorMode && (
            <button
              type="button"
              onClick={onExitSpectatorMode}
              className="w-full h-9 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium text-xs hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Open Scorer Mode
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 bg-[#fffcf7]/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-amber-200/60 dark:border-slate-800 shadow-xs">
        <div className="max-w-md mx-auto px-4 h-12 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img
              src="/balak-hanuman.png"
              alt="Logo"
              className="w-7 h-7 object-contain drop-shadow-xs"
            />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  Balak Hanuman
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 uppercase tracking-wider">
                  Viewer
                </span>
              </div>
              <span className="text-[9px] text-slate-400 flex items-center gap-1">
                <Clock size={9} />
                Updated {new Date(lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {isCompleted ? (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                <Trophy size={11} className="text-amber-500" /> Finished
              </span>
            ) : (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800/60">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                Live
              </span>
            )}

            <button
              type="button"
              onClick={handleShare}
              title="Share on WhatsApp"
              className="w-8 h-8 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Share2 size={16} />
            </button>

            <button
              type="button"
              onClick={handleToggleTheme}
              title="Toggle theme"
              className="w-8 h-8 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {darkMode ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-md mx-auto w-full flex-1 p-3 space-y-3 pb-20">
        {/* Match Header Scoreboard Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs relative overflow-hidden">
          {/* Background subtle glow */}
          <div className="absolute top-0 right-0 -mr-10 -mt-10 w-32 h-32 bg-orange-500/5 rounded-full blur-2xl pointer-events-none" />

          {/* Teams Header */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 text-xs">
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {match.teamA.name} <span className="text-slate-400">vs</span> {match.teamB.name}
            </span>
            <span className="text-[11px] text-slate-400">
              {match.rules.totalOvers} Overs &bull; {match.innings[0].inningsNumber === currentInnings.inningsNumber ? '1st Innings' : '2nd Innings'}
            </span>
          </div>

          {/* Main Score Display */}
          <div className="py-3 flex items-baseline justify-between">
            <div>
              <div className="flex items-baseline gap-2">
                <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 tabular-nums">
                  {currentInnings.totalRuns}
                  <span className="text-slate-400 font-semibold text-2xl">
                    /{currentInnings.wickets}
                  </span>
                </h1>
                <span className="text-base font-semibold text-slate-500 tabular-nums">
                  ({currentInnings.oversFormatted} / {match.rules.totalOvers} ov)
                </span>
              </div>
              <span className="text-xs font-semibold text-orange-600 dark:text-orange-400 block mt-0.5">
                {battingTeam.name} batting
              </span>
            </div>

            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                CRR
              </span>
              <span className="text-base font-bold text-slate-800 dark:text-slate-200 tabular-nums">
                {calculateRunRate(currentInnings.totalRuns, currentInnings.legalBalls)}
              </span>
              {rrr !== null && (
                <div className="mt-0.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                    RRR
                  </span>
                  <span className="text-xs font-bold text-orange-600 dark:text-orange-400 tabular-nums">
                    {rrr}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Match Situation / Target Banner */}
          {target !== null && !isCompleted && (
            <div className="mt-1 p-2 rounded-lg bg-orange-50 dark:bg-orange-950/40 border border-orange-200/80 dark:border-orange-900/60 text-center">
              <p className="text-xs font-bold text-orange-900 dark:text-orange-200">
                Target: {target} &bull; Need{' '}
                <span className="text-orange-600 dark:text-orange-400 font-extrabold">
                  {runsNeeded}
                </span>{' '}
                runs from {ballsRemaining} balls
              </p>
            </div>
          )}

          {/* Completed Result Banner */}
          {isCompleted && match.result && (
            <div className="mt-1 p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-center">
              <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-amber-900 dark:text-amber-200">
                <Trophy size={14} className="text-amber-600" />
                {match.result.marginText}
              </div>
            </div>
          )}
        </div>

        {/* Live On-Field Batters Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
          <div className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            <span>Batters</span>
            <div className="flex gap-4 font-mono text-right">
              <span className="w-6">R</span>
              <span className="w-6">B</span>
              <span className="w-4">4s</span>
              <span className="w-4">6s</span>
              <span className="w-9">SR</span>
            </div>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {/* Striker */}
            <div className="px-3 py-2 flex items-center justify-between bg-orange-50/20 dark:bg-orange-950/10">
              <div className="flex items-center gap-1.5 truncate">
                <span className="w-2 h-2 rounded-full bg-orange-500 shrink-0" />
                {match.needsBatsmanSelection && match.dismissedBatsmanRole === 'striker' ? (
                  <span className="text-amber-600 dark:text-amber-400 font-semibold italic text-xs animate-pulse">
                    Waiting for new batter...
                  </span>
                ) : (
                  <>
                    <span className="font-bold text-slate-900 dark:text-slate-100 truncate">
                      {striker?.name || 'Striker'}
                    </span>
                    <span className="text-orange-600 dark:text-orange-400 font-extrabold">*</span>
                  </>
                )}
              </div>
              {(!match.needsBatsmanSelection || match.dismissedBatsmanRole !== 'striker') && (
                <div className="flex gap-4 font-mono text-right tabular-nums text-slate-700 dark:text-slate-300 shrink-0">
                  <span className="w-6 font-bold text-slate-900 dark:text-slate-100">
                    {strikerStats.runs}
                  </span>
                  <span className="w-6 text-slate-400">{strikerStats.balls}</span>
                  <span className="w-4 text-slate-500">{strikerStats.fours}</span>
                  <span className="w-4 text-slate-500">{strikerStats.sixes}</span>
                  <span className="w-9 text-slate-500 text-[11px]">{strikerStats.sr.toFixed(1)}</span>
                </div>
              )}
            </div>

            {/* Non-Striker */}
            {nonStriker && (
              <div className="px-3 py-2 flex items-center justify-between">
                <div className="flex items-center gap-1.5 truncate">
                  <span className="w-2 h-2 rounded-full bg-transparent shrink-0" />
                  {match.needsBatsmanSelection && match.dismissedBatsmanRole === 'nonStriker' ? (
                    <span className="text-amber-600 dark:text-amber-400 font-semibold italic text-xs animate-pulse">
                      Waiting for new batter...
                    </span>
                  ) : (
                    <span className="font-medium text-slate-700 dark:text-slate-300 truncate">
                      {nonStriker.name}
                    </span>
                  )}
                </div>
                {(!match.needsBatsmanSelection || match.dismissedBatsmanRole !== 'nonStriker') && (
                  <div className="flex gap-4 font-mono text-right tabular-nums text-slate-700 dark:text-slate-300 shrink-0">
                    <span className="w-6 font-semibold text-slate-800 dark:text-slate-200">
                      {nonStrikerStats.runs}
                    </span>
                    <span className="w-6 text-slate-400">{nonStrikerStats.balls}</span>
                    <span className="w-4 text-slate-500">{nonStrikerStats.fours}</span>
                    <span className="w-4 text-slate-500">{nonStrikerStats.sixes}</span>
                    <span className="w-9 text-slate-500 text-[11px]">{nonStrikerStats.sr.toFixed(1)}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Live Bowler Card */}
        {currentBowler && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
            <div className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <span>Bowler</span>
              <div className="flex gap-4 font-mono text-right">
                <span className="w-7">O</span>
                <span className="w-4">M</span>
                <span className="w-6">R</span>
                <span className="w-4">W</span>
                <span className="w-9">ECON</span>
              </div>
            </div>

            <div className="px-3 py-2 flex items-center justify-between text-xs">
              <span className="font-bold text-slate-900 dark:text-slate-100 truncate">
                {currentBowler.name}
              </span>
              <div className="flex gap-4 font-mono text-right tabular-nums text-slate-700 dark:text-slate-300 shrink-0">
                <span className="w-7 font-semibold text-slate-800 dark:text-slate-200">
                  {bowlerStats.overs}
                </span>
                <span className="w-4 text-slate-400">{bowlerStats.maidens}</span>
                <span className="w-6 font-semibold text-slate-900 dark:text-slate-100">
                  {bowlerStats.runs}
                </span>
                <span className="w-4 font-bold text-orange-600 dark:text-orange-400">
                  {bowlerStats.wickets}
                </span>
                <span className="w-9 text-slate-500 text-[11px]">{bowlerStats.econ.toFixed(1)}</span>
              </div>
            </div>
          </div>
        )}

        {/* This Over Timeline */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] uppercase font-bold text-slate-500 tracking-wider">
              This Over (Over {(Math.floor((currentInnings.legalBalls || 0) / 6) + 1)})
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              {currentOverBallsList.filter((b) => b.isLegal).length}/6 legal balls
            </span>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto py-1">
            {currentOverBallsList.length === 0 ? (
              <span className="text-xs text-slate-400 italic">Over starting...</span>
            ) : (
              currentOverBallsList.map((b, idx) => {
                let badgeClass =
                  'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300';
                if (b.wicket) {
                  badgeClass =
                    'border-red-500 bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 font-bold';
                } else if (b.runsOffBat === 4 || b.totalRuns === 4) {
                  badgeClass =
                    'border-blue-500 bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold';
                } else if (b.runsOffBat === 6 || b.totalRuns === 6) {
                  badgeClass =
                    'border-purple-500 bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-bold';
                } else if (b.extraType === 'wd' || b.extraType === 'nb') {
                  badgeClass =
                    'border-amber-500 bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200 font-semibold';
                }

                return (
                  <div
                    key={b.id || idx}
                    className={`w-8 h-8 rounded-full border flex items-center justify-center text-xs tabular-nums shrink-0 shadow-2xs ${badgeClass}`}
                  >
                    {b.displayLabel || b.totalRuns}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="p-1 rounded-lg bg-slate-200/80 dark:bg-slate-800 flex gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('live')}
            className={`flex-1 h-8 rounded-md text-xs font-semibold flex items-center justify-center gap-1 transition-colors ${
              activeTab === 'live'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Activity size={13} /> Commentary
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('scorecard')}
            className={`flex-1 h-8 rounded-md text-xs font-semibold flex items-center justify-center gap-1 transition-colors ${
              activeTab === 'scorecard'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <FileText size={13} /> Full Scorecard
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('info')}
            className={`flex-1 h-8 rounded-md text-xs font-semibold flex items-center justify-center gap-1 transition-colors ${
              activeTab === 'info'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Info size={13} /> Match Info
          </button>
        </div>

        {/* Tab 1: Ball-by-ball stream */}
        {activeTab === 'live' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-xs space-y-2">
            <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Recent Balls
            </h3>
            {allBallsList.length === 0 ? (
              <p className="text-xs text-slate-400 italic text-center py-4">
                No deliveries bowled in this innings yet.
              </p>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {[...allBallsList]
                  .reverse()
                  .slice(0, 15)
                  .map((ball: Ball) => (
                    <div
                      key={ball.id}
                      className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] font-bold text-slate-500 w-8">
                          {ball.overIndex}.{ball.legalBallNumber || ball.ballInOver}
                        </span>
                        <div>
                          <p className="font-semibold text-slate-800 dark:text-slate-200">
                            {ball.bowlerName} to {ball.batsmanName}
                          </p>
                          <span className="text-[10px] text-slate-400">
                            {ball.wicket
                              ? `WICKET! ${ball.wicket.batsmanName ? `${ball.wicket.batsmanName} ` : ''}(${ball.wicket.description || ball.wicket.type})`
                              : ball.extraType === 'wd'
                              ? `Wide (${ball.extraRuns} run)`
                              : ball.extraType === 'nb'
                              ? `No-Ball (${ball.extraRuns} run penalty + ${ball.runsOffBat} off bat)`
                              : `${ball.runsOffBat} runs`}
                          </span>
                        </div>
                      </div>
                      <span className="font-bold font-mono px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-100">
                        {ball.displayLabel || ball.totalRuns}
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Full Scorecard */}
        {activeTab === 'scorecard' && (
          <Scorecard matchOverride={match} />
        )}

        {/* Tab 3: Match Info */}
        {activeTab === 'info' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs text-xs space-y-3">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Toss
              </span>
              <p className="font-medium text-slate-800 dark:text-slate-200 mt-0.5">
                {match.toss.winner === 'teamA' ? match.teamA.name : match.teamB.name} won the toss
                and elected to {match.toss.decision} first.
              </p>
            </div>

            <div className="border-t border-slate-100 dark:border-slate-800 pt-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Playing Conditions
              </span>
              <ul className="mt-1 space-y-1 text-slate-600 dark:text-slate-400">
                <li>&bull; Total Overs: {match.rules.totalOvers} overs per innings</li>
                <li>&bull; Max Overs Per Bowler: {match.rules.maxOversPerBowler} overs</li>
                <li>&bull; Wide Penalty: {match.rules.wideRuns} runs</li>
                <li>&bull; No-Ball Penalty: {match.rules.noBallRuns} runs</li>
                <li>&bull; Free Hit on No-Ball: {match.rules.freeHitOnNoBall ? 'Yes' : 'No'}</li>
              </ul>
            </div>

            <div className="border-t border-slate-100 dark:border-slate-800 pt-2 grid grid-cols-2 gap-3">
              <div>
                <span className="font-bold text-slate-800 dark:text-slate-200 block mb-1">
                  {match.teamA.name} ({match.teamA.players.length})
                </span>
                <ol className="list-decimal pl-4 space-y-0.5 text-slate-600 dark:text-slate-400 text-[11px]">
                  {match.teamA.players.map((p) => (
                    <li key={p.id}>{p.name}</li>
                  ))}
                </ol>
              </div>
              <div>
                <span className="font-bold text-slate-800 dark:text-slate-200 block mb-1">
                  {match.teamB.name} ({match.teamB.players.length})
                </span>
                <ol className="list-decimal pl-4 space-y-0.5 text-slate-600 dark:text-slate-400 text-[11px]">
                  {match.teamB.players.map((p) => (
                    <li key={p.id}>{p.name}</li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
        )}

        {/* WhatsApp Share Banner for Spectators */}
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200 block">
              Share match with friends
            </span>
            <span className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80 block">
              Send this live stream link on WhatsApp
            </span>
          </div>
          <button
            type="button"
            onClick={handleShare}
            className="h-8 px-3 rounded-lg bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-colors shrink-0"
          >
            <MessageSquare size={14} fill="currentColor" />
            Share
          </button>
        </div>

        {/* Switcher back to Scorer mode */}
        {onExitSpectatorMode && (
          <div className="text-center pt-2">
            <button
              type="button"
              onClick={onExitSpectatorMode}
              className="text-[11px] text-slate-400 hover:text-orange-600 dark:hover:text-orange-400 inline-flex items-center gap-1 transition-colors"
            >
              Are you the scorer? Switch to Scorer App <ArrowRight size={12} />
            </button>
          </div>
        )}
      </main>
    </div>
  );
};
