import React, { useState } from 'react';
import {
  ChevronRight,
  ChevronLeft,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Check,
  Minus,
} from 'lucide-react';
import { MatchRules, Player, Team, TossDetails } from '../types/cricket';
import { useMatch } from '../context/MatchContext';
import { useHaptic } from '../hooks/useHaptic';
import { generateId } from '../utils/cricket';

export const Setup: React.FC = () => {
  const { dispatch } = useMatch();
  const { tap, boundary } = useHaptic();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // STEP 1: Teams
  const [team1Name, setTeam1Name] = useState('Team 1');
  const [team1Short, setTeam1Short] = useState('T1');
  const [team2Name, setTeam2Name] = useState('Team 2');
  const [team2Short, setTeam2Short] = useState('T2');

  // STEP 2: Players
  const [team1Players, setTeam1Players] = useState<Player[]>([
    { id: generateId(), name: 'Player 1', isCaptain: true, isKeeper: false },
    { id: generateId(), name: 'Player 2', isCaptain: false, isKeeper: false },
  ]);

  const [team2Players, setTeam2Players] = useState<Player[]>([
    { id: generateId(), name: 'Player 1', isCaptain: true, isKeeper: false },
    { id: generateId(), name: 'Player 2', isCaptain: false, isKeeper: false },
  ]);

  const [activeRosterTeam, setActiveRosterTeam] = useState<'teamA' | 'teamB'>('teamA');
  const [inputPlayerName, setInputPlayerName] = useState('');
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [editingPlayerName, setEditingPlayerName] = useState('');

  // STEP 3: Match Rules
  const [totalOvers, setTotalOvers] = useState<number>(5);
  const [maxOversPerBowler, setMaxOversPerBowler] = useState<number>(2);
  const [hasMaxOvers, setHasMaxOvers] = useState<boolean>(true);
  const [wideRuns, setWideRuns] = useState<number>(1);
  const [noBallRuns, setNoBallRuns] = useState<number>(1);
  const [rebowlWide, setRebowlWide] = useState<boolean>(true);
  const [rebowlNoBall, setRebowlNoBall] = useState<boolean>(true);
  const [freeHitOnNoBall, setFreeHitOnNoBall] = useState<boolean>(true);
  const [lastManStands, setLastManStands] = useState<boolean>(false);

  // STEP 4: Toss & Openers
  const [tossWinner, setTossWinner] = useState<'teamA' | 'teamB'>('teamA');
  const [tossDecision, setTossDecision] = useState<'bat' | 'bowl'>('bat');

  const teamABatsFirst =
    (tossWinner === 'teamA' && tossDecision === 'bat') ||
    (tossWinner === 'teamB' && tossDecision === 'bowl');

  const battingFirstList = teamABatsFirst ? team1Players : team2Players;
  const bowlingFirstList = teamABatsFirst ? team2Players : team1Players;

  const [strikerId, setStrikerId] = useState<string>('');
  const [nonStrikerId, setNonStrikerId] = useState<string>('');
  const [bowlerId, setBowlerId] = useState<string>('');

  // Ensure openers default properly
  React.useEffect(() => {
    if (battingFirstList.length >= 2) {
      if (!strikerId || !battingFirstList.find((p) => p.id === strikerId)) {
        setStrikerId(battingFirstList[0].id);
      }
      if (!nonStrikerId || !battingFirstList.find((p) => p.id === nonStrikerId) || nonStrikerId === strikerId) {
        setNonStrikerId(battingFirstList[1].id);
      }
    }
    if (bowlingFirstList.length >= 1) {
      if (!bowlerId || !bowlingFirstList.find((p) => p.id === bowlerId)) {
        setBowlerId(bowlingFirstList[0].id);
      }
    }
  }, [teamABatsFirst, battingFirstList, bowlingFirstList, strikerId, nonStrikerId, bowlerId]);

  // Player Management Helpers
  const currentRoster = activeRosterTeam === 'teamA' ? team1Players : team2Players;
  const setRoster = (players: Player[]) => {
    if (activeRosterTeam === 'teamA') setTeam1Players(players);
    else setTeam2Players(players);
  };

  const handleAddPlayer = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputPlayerName.trim();
    if (!trimmed) return;
    if (currentRoster.length >= 15) {
      alert('Maximum 15 players per team reached.');
      return;
    }
    if (currentRoster.some((p) => p.name.toLowerCase() === trimmed.toLowerCase())) {
      alert('A player with this name already exists in this team.');
      return;
    }
    tap();
    setRoster([
      ...currentRoster,
      { id: generateId(), name: trimmed, isCaptain: false, isKeeper: false },
    ]);
    setInputPlayerName('');
  };

  const handleQuickFill = () => {
    tap();
    const needed = Math.max(0, 11 - currentRoster.length);
    if (needed === 0) return;
    const fillers: Player[] = [];
    for (let i = 1; i <= needed; i++) {
      fillers.push({
        id: generateId(),
        name: `Player ${currentRoster.length + i}`,
        isCaptain: false,
        isKeeper: false,
      });
    }
    setRoster([...currentRoster, ...fillers]);
  };

  const handleMovePlayer = (index: number, direction: 'up' | 'down') => {
    tap();
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= currentRoster.length) return;
    const copy = [...currentRoster];
    const [moved] = copy.splice(index, 1);
    copy.splice(target, 0, moved);
    setRoster(copy);
  };

  const handleDeletePlayer = (id: string) => {
    if (currentRoster.length <= 2) {
      alert('Minimum 2 players required per team.');
      return;
    }
    tap();
    setRoster(currentRoster.filter((p) => p.id !== id));
  };

  const handleToggleCaptain = (id: string) => {
    tap();
    setRoster(
      currentRoster.map((p) =>
        p.id === id ? { ...p, isCaptain: !p.isCaptain } : { ...p, isCaptain: false }
      )
    );
  };

  const handleToggleKeeper = (id: string) => {
    tap();
    setRoster(
      currentRoster.map((p) =>
        p.id === id ? { ...p, isKeeper: !p.isKeeper } : p
      )
    );
  };

  // Step Validation & Navigation
  const handleNextFromStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    const t1 = team1Name.trim();
    const t2 = team2Name.trim();
    if (!t1 || !t2) {
      alert('Both team names are required.');
      return;
    }
    if (t1.toLowerCase() === t2.toLowerCase()) {
      alert('Team names cannot be identical.');
      return;
    }
    tap();
    setStep(2);
  };

  const handleNextFromStep2 = () => {
    if (team1Players.length < 2 || team2Players.length < 2) {
      alert('Both teams must have at least 2 players.');
      return;
    }
    tap();
    setStep(3);
  };

  const handleNextFromStep3 = () => {
    tap();
    setStep(4);
  };

  const handleStartMatch = () => {
    if (!strikerId || !nonStrikerId || !bowlerId) {
      alert('Please ensure all opening positions are chosen.');
      return;
    }
    if (strikerId === nonStrikerId) {
      alert('Striker and Non-Striker cannot be the same player.');
      return;
    }

    boundary();

    const teamAObj: Team = {
      id: 'teamA',
      name: team1Name.trim(),
      shortName: (team1Short.trim() || team1Name.trim().substring(0, 3)).toUpperCase(),
      players: team1Players,
    };

    const teamBObj: Team = {
      id: 'teamB',
      name: team2Name.trim(),
      shortName: (team2Short.trim() || team2Name.trim().substring(0, 3)).toUpperCase(),
      players: team2Players,
    };

    const rules: MatchRules = {
      totalOvers,
      maxOversPerBowler: hasMaxOvers ? maxOversPerBowler : undefined,
      wideRuns,
      noBallRuns,
      rebowlWide,
      rebowlNoBall,
      freeHitOnNoBall,
      lastManStands,
    };

    const toss: TossDetails = {
      winner: tossWinner,
      decision: tossDecision,
    };

    dispatch({
      type: 'START_MATCH',
      payload: {
        teamA: teamAObj,
        teamB: teamBObj,
        rules,
        toss,
        strikerId,
        nonStrikerId,
        bowlerId,
      },
    });
  };

  return (
    <div className="max-w-md mx-auto p-4 pb-24">
      {/* Step Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5 font-medium">
          <span className="uppercase tracking-wider">
            Step {step} of 4 &bull; {step === 1 ? 'Teams' : step === 2 ? 'Players' : step === 3 ? 'Match Rules' : 'Toss & Lineup'}
          </span>
          <span className="tabular-nums font-mono">{step * 25}%</span>
        </div>
        <div className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-700 transition-all duration-200"
            style={{ width: `${step * 25}%` }}
          />
        </div>
      </div>

      {/* STEP 1: TEAMS */}
      {step === 1 && (
        <form onSubmit={handleNextFromStep1} className="space-y-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 shadow-sm space-y-3.5">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Team Names
              </h2>
              <p className="text-xs text-slate-500">
                Enter team names. You can also add a short 3-letter name
              </p>
            </div>

            <div>
              <label className="text-xs text-slate-600 dark:text-slate-400 block mb-1 font-medium">
                Team 1 (Home)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  value={team1Name}
                  onChange={(e) => setTeam1Name(e.target.value)}
                  placeholder="e.g. Team 1"
                  className="flex-1 h-11 px-3 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-700 font-medium"
                />
                <input
                  type="text"
                  maxLength={4}
                  value={team1Short}
                  onChange={(e) => setTeam1Short(e.target.value.toUpperCase())}
                  placeholder="T1"
                  className="w-16 h-11 px-2 text-center text-xs uppercase font-mono rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-700"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-600 dark:text-slate-400 block mb-1 font-medium">
                Team 2 (Away)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  value={team2Name}
                  onChange={(e) => setTeam2Name(e.target.value)}
                  placeholder="e.g. Team 2"
                  className="flex-1 h-11 px-3 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-700 font-medium"
                />
                <input
                  type="text"
                  maxLength={4}
                  value={team2Short}
                  onChange={(e) => setTeam2Short(e.target.value.toUpperCase())}
                  placeholder="T2"
                  className="w-16 h-11 px-2 text-center text-xs uppercase font-mono rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-700"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full h-11 rounded-md bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white font-medium text-xs transition-colors flex items-center justify-center gap-1.5"
          >
            <span>Continue to Players</span>
            <ChevronRight size={16} strokeWidth={1.75} />
          </button>
        </form>
      )}

      {/* STEP 2: PLAYERS */}
      {step === 2 && (
        <div className="space-y-4 animate-fadeIn">
          {/* Team Switcher Segmented Control */}
          <div className="p-1 rounded-md bg-slate-100 dark:bg-slate-800 flex gap-1">
            <button
              type="button"
              onClick={() => {
                tap();
                setActiveRosterTeam('teamA');
              }}
              className={`flex-1 h-9 rounded text-xs transition-colors flex items-center justify-center gap-1.5 ${
                activeRosterTeam === 'teamA'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-semibold shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 font-normal'
              }`}
            >
              <span>{team1Name}</span>
              <span className="text-[10px] text-slate-400 tabular-nums font-mono">({team1Players.length})</span>
            </button>
            <button
              type="button"
              onClick={() => {
                tap();
                setActiveRosterTeam('teamB');
              }}
              className={`flex-1 h-9 rounded text-xs transition-colors flex items-center justify-center gap-1.5 ${
                activeRosterTeam === 'teamB'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-semibold shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 font-normal'
              }`}
            >
              <span>{team2Name}</span>
              <span className="text-[10px] text-slate-400 tabular-nums font-mono">({team2Players.length})</span>
            </button>
          </div>

          {/* Add Player Box */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3 shadow-sm space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 dark:text-slate-400 font-medium">
                {activeRosterTeam === 'teamA' ? team1Name : team2Name} &bull;{' '}
                <span className="tabular-nums font-semibold text-slate-900 dark:text-slate-100">
                  {currentRoster.length} players
                </span>{' '}
                <span className="text-slate-400">(min 2, max 15)</span>
              </span>
              <button
                type="button"
                onClick={handleQuickFill}
                className="text-xs text-slate-500 hover:text-emerald-700 font-medium transition-colors"
              >
                Quick fill to 11
              </button>
            </div>

            <form onSubmit={handleAddPlayer} className="flex gap-2">
              <input
                type="text"
                value={inputPlayerName}
                onChange={(e) => setInputPlayerName(e.target.value)}
                placeholder="Type player name and press Enter"
                className="flex-1 h-10 px-3 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-700 font-medium"
              />
              <button
                type="submit"
                disabled={!inputPlayerName.trim()}
                className="h-10 px-3 rounded-md bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-medium transition-colors disabled:opacity-40"
              >
                Add
              </button>
            </form>
          </div>

          {/* Player list with edit, delete, reorder, Captain (C) and Keeper (WK) toggles */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden shadow-sm divide-y divide-slate-100 dark:divide-slate-800 max-h-72 overflow-y-auto">
            {currentRoster.map((player, index) => {
              const isEditing = editingPlayerId === player.id;

              return (
                <div
                  key={player.id}
                  className="px-3 py-2 text-xs flex items-center justify-between gap-2"
                >
                  {isEditing ? (
                    <div className="flex-1 flex items-center gap-1.5">
                      <input
                        type="text"
                        value={editingPlayerName}
                        onChange={(e) => setEditingPlayerName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const trimmed = editingPlayerName.trim();
                            if (trimmed) {
                              setRoster(
                                currentRoster.map((p) =>
                                  p.id === player.id ? { ...p, name: trimmed } : p
                                )
                              );
                              setEditingPlayerId(null);
                            }
                          }
                        }}
                        autoFocus
                        className="flex-1 h-8 px-2 text-xs rounded border border-emerald-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const trimmed = editingPlayerName.trim();
                          if (trimmed) {
                            setRoster(
                              currentRoster.map((p) =>
                                p.id === player.id ? { ...p, name: trimmed } : p
                              )
                            );
                            setEditingPlayerId(null);
                          }
                        }}
                        className="h-8 px-2 rounded bg-emerald-700 text-white"
                      >
                        <Check size={14} strokeWidth={2} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 truncate flex-1">
                        <span className="text-[10px] text-slate-400 font-mono tabular-nums w-4">
                          #{index + 1}
                        </span>
                        <span className="font-medium text-slate-900 dark:text-slate-100 truncate">
                          {player.name}
                        </span>
                      </div>

                      {/* Toggles: C (Captain) & WK (Wicket Keeper) */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => handleToggleCaptain(player.id)}
                          className={`w-6 h-6 rounded text-[10px] font-semibold border transition-colors ${
                            player.isCaptain
                              ? 'border-emerald-700 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400'
                              : 'border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-600'
                          }`}
                          title="Toggle Captain"
                        >
                          C
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleKeeper(player.id)}
                          className={`w-7 h-6 rounded text-[9px] font-semibold border transition-colors ${
                            player.isKeeper
                              ? 'border-emerald-700 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400'
                              : 'border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-600'
                          }`}
                          title="Toggle Wicket Keeper"
                        >
                          WK
                        </button>

                        {/* Reorder up/down */}
                        <button
                          type="button"
                          disabled={index === 0}
                          onClick={() => handleMovePlayer(index, 'up')}
                          className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-20"
                          title="Move up"
                        >
                          <ArrowUp size={13} strokeWidth={1.75} />
                        </button>
                        <button
                          type="button"
                          disabled={index === currentRoster.length - 1}
                          onClick={() => handleMovePlayer(index, 'down')}
                          className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-20"
                          title="Move down"
                        >
                          <ArrowDown size={13} strokeWidth={1.75} />
                        </button>

                        {/* Rename */}
                        <button
                          type="button"
                          onClick={() => {
                            setEditingPlayerId(player.id);
                            setEditingPlayerName(player.name);
                          }}
                          className="text-[11px] text-slate-400 hover:text-slate-700 px-1"
                        >
                          Edit
                        </button>

                        {/* Delete */}
                        <button
                          type="button"
                          onClick={() => handleDeletePlayer(player.id)}
                          className="p-1 text-slate-300 hover:text-red-600"
                        >
                          <Trash2 size={13} strokeWidth={1.75} />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {/* Navigation Buttons */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                tap();
                setStep(1);
              }}
              className="h-11 px-4 rounded-md border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium flex items-center gap-1"
            >
              <ChevronLeft size={16} strokeWidth={1.75} />
              <span>Back</span>
            </button>
            <button
              type="button"
              onClick={handleNextFromStep2}
              className="flex-1 h-11 rounded-md bg-emerald-700 hover:bg-emerald-800 text-white font-medium text-xs transition-colors flex items-center justify-center gap-1.5"
            >
              <span>Continue to Match Rules</span>
              <ChevronRight size={16} strokeWidth={1.75} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: MATCH RULES */}
      {step === 3 && (
        <div className="space-y-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 shadow-sm space-y-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Custom Match Rules
              </h2>
              <p className="text-xs text-slate-500">Configure overs, bowler quotas, and extra runs</p>
            </div>

            {/* Total Overs Stepper */}
            <div>
              <label className="text-xs text-slate-600 dark:text-slate-400 block mb-1 font-medium">
                Total Overs Per Innings
              </label>
              <div className="flex items-center gap-2">
                <div className="flex items-center border border-slate-300 dark:border-slate-700 rounded-md overflow-hidden bg-white dark:bg-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      tap();
                      setTotalOvers((prev) => {
                        const n = Math.max(1, prev - 1);
                        setMaxOversPerBowler(Math.max(1, Math.ceil(n / 5)));
                        return n;
                      });
                    }}
                    className="w-10 h-10 flex items-center justify-center text-slate-600 hover:bg-slate-50 active:bg-slate-100"
                  >
                    <Minus size={15} strokeWidth={1.75} />
                  </button>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={totalOvers}
                    onChange={(e) => {
                      const v = parseInt(e.target.value, 10);
                      if (v > 0) {
                        setTotalOvers(v);
                        setMaxOversPerBowler(Math.max(1, Math.ceil(v / 5)));
                      }
                    }}
                    className="w-14 h-10 text-center text-xs font-semibold tabular-nums text-slate-900 dark:text-slate-100 border-x border-slate-200 dark:border-slate-700"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      tap();
                      setTotalOvers((prev) => {
                        const n = Math.min(50, prev + 1);
                        setMaxOversPerBowler(Math.max(1, Math.ceil(n / 5)));
                        return n;
                      });
                    }}
                    className="w-10 h-10 flex items-center justify-center text-slate-600 hover:bg-slate-50 active:bg-slate-100"
                  >
                    <Plus size={15} strokeWidth={1.75} />
                  </button>
                </div>

                <div className="flex gap-1 flex-1">
                  {[2, 5, 10, 20].map((ov) => (
                    <button
                      key={ov}
                      type="button"
                      onClick={() => {
                        tap();
                        setTotalOvers(ov);
                        setMaxOversPerBowler(Math.max(1, Math.ceil(ov / 5)));
                      }}
                      className={`flex-1 h-10 rounded-md border text-xs tabular-nums font-medium ${
                        totalOvers === ov
                          ? 'border-emerald-700 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 font-semibold'
                          : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {ov} ov
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Max Overs Per Bowler */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                  Max Overs Per Bowler
                </label>
                <label className="flex items-center gap-1.5 text-xs text-slate-500 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasMaxOvers}
                    onChange={(e) => setHasMaxOvers(e.target.checked)}
                    className="rounded text-emerald-700 focus:ring-emerald-700"
                  />
                  <span>Limit quota</span>
                </label>
              </div>

              {hasMaxOvers && (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max={totalOvers}
                    value={maxOversPerBowler}
                    onChange={(e) => setMaxOversPerBowler(parseInt(e.target.value, 10) || 1)}
                    className="w-24 h-10 px-3 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 tabular-nums"
                  />
                  <span className="text-xs text-slate-400">
                    Auto-suggested: {Math.ceil(totalOvers / 5)} overs
                  </span>
                </div>
              )}
            </div>

            {/* Extra Runs Values */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-slate-600 dark:text-slate-400 block mb-1 font-medium">
                  Wide Penalty Runs
                </label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={wideRuns}
                  onChange={(e) => setWideRuns(parseInt(e.target.value, 10) || 0)}
                  className="w-full h-10 px-3 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 tabular-nums"
                />
              </div>

              <div>
                <label className="text-slate-600 dark:text-slate-400 block mb-1 font-medium">
                  No-Ball Penalty Runs
                </label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={noBallRuns}
                  onChange={(e) => setNoBallRuns(parseInt(e.target.value, 10) || 0)}
                  className="w-full h-10 px-3 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 tabular-nums"
                />
              </div>
            </div>

            {/* Rule Toggles */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2.5 text-xs">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-slate-700 dark:text-slate-300">Re-bowl on Wide</span>
                <input
                  type="checkbox"
                  checked={rebowlWide}
                  onChange={(e) => setRebowlWide(e.target.checked)}
                  className="rounded text-emerald-700 focus:ring-emerald-700"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-slate-700 dark:text-slate-300">Re-bowl on No-Ball</span>
                <input
                  type="checkbox"
                  checked={rebowlNoBall}
                  onChange={(e) => setRebowlNoBall(e.target.checked)}
                  className="rounded text-emerald-700 focus:ring-emerald-700"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-slate-700 dark:text-slate-300">Free Hit on No-Ball</span>
                <input
                  type="checkbox"
                  checked={freeHitOnNoBall}
                  onChange={(e) => setFreeHitOnNoBall(e.target.checked)}
                  className="rounded text-emerald-700 focus:ring-emerald-700"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <span className="text-slate-700 dark:text-slate-300 block">Last Man Stands (Bat alone)</span>
                  <span className="text-[10px] text-slate-400 block">Single batter continues alone if all teammates are out</span>
                </div>
                <input
                  type="checkbox"
                  checked={lastManStands}
                  onChange={(e) => setLastManStands(e.target.checked)}
                  className="rounded text-emerald-700 focus:ring-emerald-700"
                />
              </label>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                tap();
                setStep(2);
              }}
              className="h-11 px-4 rounded-md border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium flex items-center gap-1"
            >
              <ChevronLeft size={16} strokeWidth={1.75} />
              <span>Back</span>
            </button>
            <button
              type="button"
              onClick={handleNextFromStep3}
              className="flex-1 h-11 rounded-md bg-emerald-700 hover:bg-emerald-800 text-white font-medium text-xs transition-colors flex items-center justify-center gap-1.5"
            >
              <span>Continue to Toss</span>
              <ChevronRight size={16} strokeWidth={1.75} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: TOSS & OPENING LINEUP */}
      {step === 4 && (
        <div className="space-y-4 animate-fadeIn">
          {/* Toss Box */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 shadow-sm space-y-3.5">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Toss Decision
              </h2>
              <p className="text-xs text-slate-500">Record toss outcome and electing team</p>
            </div>

            <div>
              <label className="text-xs text-slate-600 dark:text-slate-400 block mb-1 font-medium">
                Who won the toss?
              </label>
              <div className="p-1 rounded-md bg-slate-100 dark:bg-slate-800 flex gap-1">
                <button
                  type="button"
                  onClick={() => {
                    tap();
                    setTossWinner('teamA');
                  }}
                  className={`flex-1 h-9 rounded text-xs transition-colors ${
                    tossWinner === 'teamA'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-semibold shadow-sm'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {team1Name}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    tap();
                    setTossWinner('teamB');
                  }}
                  className={`flex-1 h-9 rounded text-xs transition-colors ${
                    tossWinner === 'teamB'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-semibold shadow-sm'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {team2Name}
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-600 dark:text-slate-400 block mb-1 font-medium">
                Elected to
              </label>
              <div className="p-1 rounded-md bg-slate-100 dark:bg-slate-800 flex gap-1">
                <button
                  type="button"
                  onClick={() => {
                    tap();
                    setTossDecision('bat');
                  }}
                  className={`flex-1 h-9 rounded text-xs transition-colors ${
                    tossDecision === 'bat'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-semibold shadow-sm'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Bat First
                </button>
                <button
                  type="button"
                  onClick={() => {
                    tap();
                    setTossDecision('bowl');
                  }}
                  className={`flex-1 h-9 rounded text-xs transition-colors ${
                    tossDecision === 'bowl'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-semibold shadow-sm'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Bowl First
                </button>
              </div>
            </div>

            <p className="text-xs text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800">
              <strong>{teamABatsFirst ? team1Name : team2Name}</strong> will bat first in Innings 1.
            </p>
          </div>

          {/* Openers Selectors */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 shadow-sm space-y-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Opening Lineup
              </h2>
              <p className="text-xs text-slate-500">Select openers or type a name directly</p>
            </div>

            {/* Striker */}
            <div>
              <label className="text-xs text-slate-600 dark:text-slate-400 block mb-1 font-medium">
                Opening Striker * ({teamABatsFirst ? team1Name : team2Name})
              </label>
              <select
                value={strikerId}
                onChange={(e) => setStrikerId(e.target.value)}
                className="w-full h-10 px-3 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-700 font-medium"
              >
                {battingFirstList.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.isCaptain ? '(C)' : ''} {p.isKeeper ? '(WK)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Non-Striker */}
            <div>
              <label className="text-xs text-slate-600 dark:text-slate-400 block mb-1 font-medium">
                Opening Non-Striker ({teamABatsFirst ? team1Name : team2Name})
              </label>
              <select
                value={nonStrikerId}
                onChange={(e) => setNonStrikerId(e.target.value)}
                className="w-full h-10 px-3 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-700 font-medium"
              >
                {battingFirstList.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.isCaptain ? '(C)' : ''} {p.isKeeper ? '(WK)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Bowler */}
            <div>
              <label className="text-xs text-slate-600 dark:text-slate-400 block mb-1 font-medium">
                Opening Bowler ({teamABatsFirst ? team2Name : team1Name})
              </label>
              <select
                value={bowlerId}
                onChange={(e) => setBowlerId(e.target.value)}
                className="w-full h-10 px-3 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-700 font-medium"
              >
                {bowlingFirstList.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.isCaptain ? '(C)' : ''} {p.isKeeper ? '(WK)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Navigation Buttons & Start Match */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                tap();
                setStep(3);
              }}
              className="h-11 px-4 rounded-md border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium flex items-center gap-1"
            >
              <ChevronLeft size={16} strokeWidth={1.75} />
              <span>Back</span>
            </button>
            <button
              type="button"
              onClick={handleStartMatch}
              className="flex-1 h-11 rounded-md bg-emerald-700 hover:bg-emerald-800 text-white font-medium text-xs transition-colors flex items-center justify-center select-none"
            >
              Start Match
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
