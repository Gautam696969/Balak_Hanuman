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
  Users,
  Pencil,
  RotateCcw,
  X,
} from 'lucide-react';
import { MatchRules, Player, Team, TossDetails } from '../types/cricket';
import { useMatch } from '../context/MatchContext';
import { useHaptic } from '../hooks/useHaptic';
import { generateId } from '../utils/cricket';

// Default Group Team data (Balak Hanuman group teams)
const DEFAULT_VIKAS_PLAYERS = ['Vikas', 'Rohit', 'Amit', 'Mohit', 'Bottle', 'Gautam', 'Manoj', 'Gopal', 'Avinash', 'Satyam', 'Pawan', 'Akshay','Pandey'];
const DEFAULT_VIPUL_PLAYERS = ['Sashi', 'Vipul','JD', 'Bhavesh', 'Aman','Mohit', 'Vinay',  'Bittu', 'Akshay',  'Pawan', 'Satyam', 'Gopal' ];

interface GroupTeamDraft {
  name: string;
  shortName: string;
  players: Player[];
}

const createInitialGroupTeamA = (): GroupTeamDraft => ({
  name: 'Team Vikas',
  shortName: 'TV',
  players: DEFAULT_VIKAS_PLAYERS.map((name, i) => ({
    id: generateId(),
    name,
    isCaptain: i === 0,
    isViceCaptain: i === 1,
  })),
});

const createInitialGroupTeamB = (): GroupTeamDraft => ({
  name: 'Team Vipul',
  shortName: 'TVP',
  players: DEFAULT_VIPUL_PLAYERS.map((name, i) => ({
    id: generateId(),
    name,
    isCaptain: i === 0,
    isViceCaptain: i === 1,
  })),
});

export const Setup: React.FC = () => {
  const { dispatch } = useMatch();
  const { tap, boundary } = useHaptic();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // STEP 1: Teams
  const [team1Name, setTeam1Name] = useState('Team 1');
  const [team1Short, setTeam1Short] = useState('T1');
  const [team2Name, setTeam2Name] = useState('Team 2');
  const [team2Short, setTeam2Short] = useState('T2');
  const [showDefaultGroupPreview, setShowDefaultGroupPreview] = useState(false);

  // Isolated Default Group Team draft states (per-match only, resets on each new match)
  const [groupTeamA, setGroupTeamA] = useState<GroupTeamDraft>(createInitialGroupTeamA);
  const [groupTeamB, setGroupTeamB] = useState<GroupTeamDraft>(createInitialGroupTeamB);

  // Edit Team Name states
  const [editingTeamNameA, setEditingTeamNameA] = useState(false);
  const [draftTeamNameA, setDraftTeamNameA] = useState('Team Vikas');
  const [draftTeamShortA, setDraftTeamShortA] = useState('TV');

  const [editingTeamNameB, setEditingTeamNameB] = useState(false);
  const [draftTeamNameB, setDraftTeamNameB] = useState('Team Vipul');
  const [draftTeamShortB, setDraftTeamShortB] = useState('TVP');

  // Player edit states
  const [editingGroupPlayerId, setEditingGroupPlayerId] = useState<string | null>(null);
  const [editingGroupPlayerName, setEditingGroupPlayerName] = useState('');

  // Add Player states
  const [showAddPlayerA, setShowAddPlayerA] = useState(false);
  const [newPlayerNameA, setNewPlayerNameA] = useState('');
  const [showAddPlayerB, setShowAddPlayerB] = useState(false);
  const [newPlayerNameB, setNewPlayerNameB] = useState('');

  // STEP 2: Players
  const [team1Players, setTeam1Players] = useState<Player[]>([
    { id: generateId(), name: 'Player 1', isCaptain: true, isViceCaptain: false },
    { id: generateId(), name: 'Player 2', isCaptain: false, isViceCaptain: false },
  ]);

  const [team2Players, setTeam2Players] = useState<Player[]>([
    { id: generateId(), name: 'Player 1', isCaptain: true, isViceCaptain: false },
    { id: generateId(), name: 'Player 2', isCaptain: false, isViceCaptain: false },
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
      { id: generateId(), name: trimmed, isCaptain: false, isViceCaptain: false },
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
        isViceCaptain: false,
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

  const handleToggleViceCaptain = (id: string) => {
    tap();
    setRoster(
      currentRoster.map((p) =>
        p.id === id ? { ...p, isViceCaptain: !p.isViceCaptain } : { ...p, isViceCaptain: false }
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

  const handleOpenDefaultGroupPreview = () => {
    tap();
    const freshA = createInitialGroupTeamA();
    const freshB = createInitialGroupTeamB();
    setGroupTeamA(freshA);
    setGroupTeamB(freshB);
    setDraftTeamNameA(freshA.name);
    setDraftTeamShortA(freshA.shortName);
    setDraftTeamNameB(freshB.name);
    setDraftTeamShortB(freshB.shortName);
    setEditingTeamNameA(false);
    setEditingTeamNameB(false);
    setEditingGroupPlayerId(null);
    setEditingGroupPlayerName('');
    setShowAddPlayerA(false);
    setShowAddPlayerB(false);
    setNewPlayerNameA('');
    setNewPlayerNameB('');
    setShowDefaultGroupPreview(true);
  };

  const handleResetDefaultGroupTeams = () => {
    tap();
    const freshA = createInitialGroupTeamA();
    const freshB = createInitialGroupTeamB();
    setGroupTeamA(freshA);
    setGroupTeamB(freshB);
    setDraftTeamNameA(freshA.name);
    setDraftTeamShortA(freshA.shortName);
    setDraftTeamNameB(freshB.name);
    setDraftTeamShortB(freshB.shortName);
    setEditingTeamNameA(false);
    setEditingTeamNameB(false);
    setEditingGroupPlayerId(null);
    setEditingGroupPlayerName('');
    setShowAddPlayerA(false);
    setShowAddPlayerB(false);
    setNewPlayerNameA('');
    setNewPlayerNameB('');
  };

  const handleToggleGroupCaptain = (team: 'A' | 'B', id: string) => {
    tap();
    const updater = team === 'A' ? setGroupTeamA : setGroupTeamB;
    updater((prev) => ({
      ...prev,
      players: prev.players.map((p) => {
        if (p.id === id) {
          const willBeCaptain = !p.isCaptain;
          return {
            ...p,
            isCaptain: willBeCaptain,
            isViceCaptain: willBeCaptain ? false : p.isViceCaptain,
          };
        }
        return {
          ...p,
          isCaptain: false,
        };
      }),
    }));
  };

  const handleToggleGroupViceCaptain = (team: 'A' | 'B', id: string) => {
    tap();
    const updater = team === 'A' ? setGroupTeamA : setGroupTeamB;
    updater((prev) => ({
      ...prev,
      players: prev.players.map((p) => {
        if (p.id === id) {
          const willBeVC = !p.isViceCaptain;
          return {
            ...p,
            isViceCaptain: willBeVC,
            isCaptain: willBeVC ? false : p.isCaptain,
          };
        }
        return {
          ...p,
          isViceCaptain: false,
        };
      }),
    }));
  };

  const handleStartEditGroupPlayer = (player: Player) => {
    tap();
    setEditingGroupPlayerId(player.id);
    setEditingGroupPlayerName(player.name);
  };

  const handleSaveEditGroupPlayer = (team: 'A' | 'B', id: string) => {
    const trimmed = editingGroupPlayerName.trim();
    if (!trimmed) return;
    tap();
    const updater = team === 'A' ? setGroupTeamA : setGroupTeamB;
    updater((prev) => ({
      ...prev,
      players: prev.players.map((p) => (p.id === id ? { ...p, name: trimmed } : p)),
    }));
    setEditingGroupPlayerId(null);
    setEditingGroupPlayerName('');
  };

  const handleCancelEditGroupPlayer = () => {
    tap();
    setEditingGroupPlayerId(null);
    setEditingGroupPlayerName('');
  };

  const handleDeleteGroupPlayer = (team: 'A' | 'B', id: string) => {
    const targetTeam = team === 'A' ? groupTeamA : groupTeamB;
    if (targetTeam.players.length <= 2) {
      alert('Minimum 2 players required per team.');
      return;
    }
    tap();
    const updater = team === 'A' ? setGroupTeamA : setGroupTeamB;
    updater((prev) => ({
      ...prev,
      players: prev.players.filter((p) => p.id !== id),
    }));
    if (editingGroupPlayerId === id) {
      setEditingGroupPlayerId(null);
    }
  };

  const handleAddGroupPlayer = (team: 'A' | 'B') => {
    const name = (team === 'A' ? newPlayerNameA : newPlayerNameB).trim();
    if (!name) return;
    const targetTeam = team === 'A' ? groupTeamA : groupTeamB;
    if (targetTeam.players.length >= 15) {
      alert('Maximum 15 players per team reached.');
      return;
    }
    if (targetTeam.players.some((p) => p.name.toLowerCase() === name.toLowerCase())) {
      alert('A player with this name already exists in this team.');
      return;
    }
    tap();
    const newPlayer: Player = {
      id: generateId(),
      name,
      isCaptain: false,
      isViceCaptain: false,
    };
    if (team === 'A') {
      setGroupTeamA((prev) => ({ ...prev, players: [...prev.players, newPlayer] }));
      setNewPlayerNameA('');
      setShowAddPlayerA(false);
    } else {
      setGroupTeamB((prev) => ({ ...prev, players: [...prev.players, newPlayer] }));
      setNewPlayerNameB('');
      setShowAddPlayerB(false);
    }
  };

  const handleSaveTeamNameA = () => {
    tap();
    const name = draftTeamNameA.trim() || 'Team Vikas';
    const shortName = (draftTeamShortA.trim() || name.substring(0, 3)).toUpperCase();
    setGroupTeamA((prev) => ({ ...prev, name, shortName }));
    setEditingTeamNameA(false);
  };

  const handleSaveTeamNameB = () => {
    tap();
    const name = draftTeamNameB.trim() || 'Team Vipul';
    const shortName = (draftTeamShortB.trim() || name.substring(0, 3)).toUpperCase();
    setGroupTeamB((prev) => ({ ...prev, name, shortName }));
    setEditingTeamNameB(false);
  };

  const handleConfirmDefaultGroupTeams = () => {
    if (groupTeamA.players.length < 2 || groupTeamB.players.length < 2) {
      alert('Both teams must have at least 2 players.');
      return;
    }
    boundary();
    setTeam1Name(groupTeamA.name);
    setTeam1Short(groupTeamA.shortName);
    setTeam2Name(groupTeamB.name);
    setTeam2Short(groupTeamB.shortName);

    setTeam1Players(groupTeamA.players);
    setTeam2Players(groupTeamB.players);

    // Default openers ready for Step 4
    setStrikerId(groupTeamA.players[0]?.id || '');
    setNonStrikerId(groupTeamA.players[1]?.id || '');
    setBowlerId(groupTeamB.players[0]?.id || '');

    setShowDefaultGroupPreview(false);
    setStep(3); // Proceed to Match Rules directly as requested
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
            className="h-full bg-amber-600 transition-all duration-200"
            style={{ width: `${step * 25}%` }}
          />
        </div>
      </div>

      {/* STEP 1: TEAMS - Normal Entry Form */}
      {step === 1 && !showDefaultGroupPreview && (
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
                  className="flex-1 h-11 px-3 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-amber-500 font-medium"
                />
                <input
                  type="text"
                  maxLength={4}
                  value={team1Short}
                  onChange={(e) => setTeam1Short(e.target.value.toUpperCase())}
                  placeholder="T1"
                  className="w-16 h-11 px-2 text-center text-xs uppercase font-mono rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-amber-500 font-semibold"
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
                  className="flex-1 h-11 px-3 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-amber-500 font-medium"
                />
                <input
                  type="text"
                  maxLength={4}
                  value={team2Short}
                  onChange={(e) => setTeam2Short(e.target.value.toUpperCase())}
                  placeholder="T2"
                  className="w-16 h-11 px-2 text-center text-xs uppercase font-mono rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-amber-500 font-semibold"
                />
              </div>
            </div>
          </div>

          {/* Continue to Players Button */}
          <button
            type="submit"
            className="w-full h-11 rounded-md bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm"
          >
            <span>Continue to Players</span>
            <ChevronRight size={16} strokeWidth={2} />
          </button>

          {/* OR Divider */}
          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
            <span className="flex-shrink mx-3 text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
              OR
            </span>
            <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
          </div>

          {/* Default Group Team Button (Requested) */}
          <button
            type="button"
            onClick={handleOpenDefaultGroupPreview}
            className="w-full h-12 rounded-lg border-2 border-dashed border-amber-500/80 dark:border-amber-500/50 bg-amber-50/70 dark:bg-amber-950/20 hover:bg-amber-100/70 dark:hover:bg-amber-950/40 text-amber-900 dark:text-amber-200 font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-sm active:scale-[0.99]"
          >
            <Users size={17} className="text-amber-600 dark:text-amber-400" />
            <span>Default Group Team</span>
            <span className="text-[10px] py-0.5 px-2 bg-amber-200/80 dark:bg-amber-800/60 text-amber-900 dark:text-amber-100 rounded-full font-semibold ml-1">
              Team Vikas v Team Vipul
            </span>
          </button>
        </form>
      )}

      {/* STEP 1: DEFAULT GROUP TEAM PREVIEW (Editable & Match-isolated) */}
      {step === 1 && showDefaultGroupPreview && (
        <div className="space-y-4 animate-fadeIn">
          {/* Header Card with Reset Defaults button */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3.5 shadow-sm space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Users size={18} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Default Group Teams
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Balak Hanuman group squad
                  </p>
                </div>
              </div>
              <button
                type="button"
                title="Reset edits back to original default players"
                onClick={handleResetDefaultGroupTeams}
                className="h-8 px-2.5 rounded-md border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 hover:border-amber-400 dark:hover:border-amber-600 text-xs font-semibold flex items-center gap-1.5 transition-colors bg-white dark:bg-slate-800 shadow-xs"
              >
                <RotateCcw size={13} />
                <span>Reset Defaults</span>
              </button>
            </div>
            <div className="text-[11px] text-slate-600 dark:text-slate-400 bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-900/40 rounded-md px-2.5 py-1.5 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0"></span>
              <span>
                Edits apply to <strong>this match only</strong>. Starting a new match always restores the original default players.
              </span>
            </div>
          </div>

          {/* 1. Team A Box (Team Vikas) */}
          <div className="bg-white dark:bg-slate-900 border-2 border-amber-500/60 dark:border-amber-500/40 rounded-xl overflow-hidden shadow-sm">
            {/* Team A Header Box */}
            {editingTeamNameA ? (
              <div className="bg-amber-700 px-3.5 py-2.5 flex items-center gap-2">
                <input
                  type="text"
                  autoFocus
                  value={draftTeamNameA}
                  onChange={(e) => setDraftTeamNameA(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSaveTeamNameA();
                    } else if (e.key === 'Escape') {
                      setDraftTeamNameA(groupTeamA.name);
                      setDraftTeamShortA(groupTeamA.shortName);
                      setEditingTeamNameA(false);
                    }
                  }}
                  placeholder="Team A Name"
                  className="flex-1 h-8 px-2 text-xs font-bold rounded bg-amber-800/80 text-white placeholder-amber-300 border border-amber-500 focus:outline-none focus:ring-1 focus:ring-white"
                />
                <input
                  type="text"
                  maxLength={4}
                  value={draftTeamShortA}
                  onChange={(e) => setDraftTeamShortA(e.target.value.toUpperCase())}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSaveTeamNameA();
                    }
                  }}
                  placeholder="T1"
                  className="w-14 h-8 px-1 text-xs text-center font-mono font-bold uppercase rounded bg-amber-800/80 text-white placeholder-amber-300 border border-amber-500 focus:outline-none focus:ring-1 focus:ring-white"
                />
                <button
                  type="button"
                  title="Save team name"
                  onClick={handleSaveTeamNameA}
                  className="w-8 h-8 rounded bg-white text-amber-800 hover:bg-amber-100 font-bold flex items-center justify-center transition-colors shadow-xs"
                >
                  <Check size={14} />
                </button>
                <button
                  type="button"
                  title="Cancel"
                  onClick={() => {
                    setDraftTeamNameA(groupTeamA.name);
                    setDraftTeamShortA(groupTeamA.shortName);
                    setEditingTeamNameA(false);
                  }}
                  className="w-8 h-8 rounded bg-amber-800/60 text-white hover:bg-amber-800 flex items-center justify-center transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div className="bg-gradient-to-r from-amber-600 to-amber-700 px-4 py-3 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-amber-200 block">
                      Team A
                    </span>
                    <h3 className="text-base font-bold tracking-tight">
                      {groupTeamA.name} ({groupTeamA.shortName})
                    </h3>
                  </div>
                  <button
                    type="button"
                    title="Edit team name"
                    onClick={() => {
                      tap();
                      setDraftTeamNameA(groupTeamA.name);
                      setDraftTeamShortA(groupTeamA.shortName);
                      setEditingTeamNameA(true);
                    }}
                    className="w-7 h-7 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-colors ml-1"
                  >
                    <Pencil size={13} />
                  </button>
                </div>
                <span className="bg-white/20 text-white text-[11px] px-2.5 py-1 rounded-md font-mono font-bold">
                  {groupTeamA.players.length} Players
                </span>
              </div>
            )}

            {/* Team A List */}
            <div className="p-3 divide-y divide-slate-100 dark:divide-slate-800 space-y-1">
              {groupTeamA.players.map((player, idx) => {
                const isEditing = editingGroupPlayerId === player.id;
                return (
                  <div key={player.id} className="pt-1.5 first:pt-0">
                    {isEditing ? (
                      <div className="py-1.5 px-2 flex items-center gap-2 bg-amber-50/70 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-700 rounded-md">
                        <span className="w-6 h-6 rounded-full bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-100 text-[11px] font-bold flex items-center justify-center font-mono flex-shrink-0">
                          {idx + 1}
                        </span>
                        <input
                          type="text"
                          autoFocus
                          value={editingGroupPlayerName}
                          onChange={(e) => setEditingGroupPlayerName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleSaveEditGroupPlayer('A', player.id);
                            } else if (e.key === 'Escape') {
                              handleCancelEditGroupPlayer();
                            }
                          }}
                          className="flex-1 h-8 px-2 text-xs font-semibold rounded border border-amber-400 dark:border-amber-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
                        />
                        <button
                          type="button"
                          title="Save player name"
                          onClick={() => handleSaveEditGroupPlayer('A', player.id)}
                          className="w-8 h-8 rounded bg-amber-600 text-white flex items-center justify-center hover:bg-amber-700 transition-colors shadow-xs"
                        >
                          <Check size={14} />
                        </button>
                        <button
                          type="button"
                          title="Cancel"
                          onClick={handleCancelEditGroupPlayer}
                          className="w-8 h-8 rounded border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <div className="py-2 px-1 flex items-center justify-between text-xs hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded transition-colors">
                        <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
                          <span className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-[11px] font-bold flex items-center justify-center font-mono flex-shrink-0">
                            {idx + 1}
                          </span>
                          <span className="font-semibold text-slate-900 dark:text-slate-100 text-sm truncate">
                            {player.name}
                          </span>
                          {player.isCaptain && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-white flex-shrink-0 shadow-xs">
                              C
                            </span>
                          )}
                          {player.isViceCaptain && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-600 text-white flex-shrink-0 shadow-xs">
                              VC
                            </span>
                          )}
                        </div>

                        {/* Player Action Icons */}
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {/* Captain Button */}
                          <button
                            type="button"
                            title={player.isCaptain ? 'Captain (Click to remove)' : 'Assign Captain'}
                            onClick={() => handleToggleGroupCaptain('A', player.id)}
                            className={`h-7 px-2 text-[10px] font-bold rounded transition-all ${
                              player.isCaptain
                                ? 'bg-amber-500 text-white shadow-xs ring-1 ring-amber-600'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                            }`}
                          >
                            C
                          </button>

                          {/* Vice Captain Button */}
                          <button
                            type="button"
                            title={player.isViceCaptain ? 'Vice Captain (Click to remove)' : 'Assign Vice Captain'}
                            onClick={() => handleToggleGroupViceCaptain('A', player.id)}
                            className={`h-7 px-2 text-[10px] font-bold rounded transition-all ${
                              player.isViceCaptain
                                ? 'bg-blue-600 text-white shadow-xs ring-1 ring-blue-700'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40'
                            }`}
                          >
                            VC
                          </button>

                          {/* Edit Player Name Button */}
                          <button
                            type="button"
                            title="Edit player name"
                            onClick={() => handleStartEditGroupPlayer(player)}
                            className="w-7 h-7 flex items-center justify-center rounded text-slate-500 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-slate-800 transition-colors"
                          >
                            <Pencil size={13} />
                          </button>

                          {/* Delete Player Button */}
                          <button
                            type="button"
                            title="Delete player"
                            onClick={() => handleDeleteGroupPlayer('A', player.id)}
                            className="w-7 h-7 flex items-center justify-center rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Add Player to Team A */}
              {showAddPlayerA ? (
                <div className="pt-2 flex items-center gap-2">
                  <input
                    type="text"
                    autoFocus
                    placeholder="New player name"
                    value={newPlayerNameA}
                    onChange={(e) => setNewPlayerNameA(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddGroupPlayer('A');
                      } else if (e.key === 'Escape') {
                        setShowAddPlayerA(false);
                        setNewPlayerNameA('');
                      }
                    }}
                    className="flex-1 h-8 px-2.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-amber-500 font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddGroupPlayer('A')}
                    className="h-8 px-3 rounded bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-colors flex items-center gap-1 shadow-xs"
                  >
                    <Plus size={13} />
                    <span>Add</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddPlayerA(false);
                      setNewPlayerNameA('');
                    }}
                    className="h-8 px-2 rounded border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <X size={13} />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    tap();
                    setShowAddPlayerA(true);
                  }}
                  className="w-full mt-2 py-2 border border-dashed border-slate-300 dark:border-slate-700 rounded-md text-xs font-semibold text-slate-600 dark:text-slate-400 hover:border-amber-500 hover:text-amber-600 dark:hover:border-amber-400 dark:hover:text-amber-400 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Plus size={14} />
                  <span>Add Player</span>
                </button>
              )}
            </div>
          </div>

          {/* 2. Team B Box (Team Vipul) */}
          <div className="bg-white dark:bg-slate-900 border-2 border-orange-500/60 dark:border-orange-500/40 rounded-xl overflow-hidden shadow-sm">
            {/* Team B Header Box */}
            {editingTeamNameB ? (
              <div className="bg-orange-700 px-3.5 py-2.5 flex items-center gap-2">
                <input
                  type="text"
                  autoFocus
                  value={draftTeamNameB}
                  onChange={(e) => setDraftTeamNameB(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSaveTeamNameB();
                    } else if (e.key === 'Escape') {
                      setDraftTeamNameB(groupTeamB.name);
                      setDraftTeamShortB(groupTeamB.shortName);
                      setEditingTeamNameB(false);
                    }
                  }}
                  placeholder="Team B Name"
                  className="flex-1 h-8 px-2 text-xs font-bold rounded bg-orange-800/80 text-white placeholder-orange-300 border border-orange-500 focus:outline-none focus:ring-1 focus:ring-white"
                />
                <input
                  type="text"
                  maxLength={4}
                  value={draftTeamShortB}
                  onChange={(e) => setDraftTeamShortB(e.target.value.toUpperCase())}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSaveTeamNameB();
                    }
                  }}
                  placeholder="T2"
                  className="w-14 h-8 px-1 text-xs text-center font-mono font-bold uppercase rounded bg-orange-800/80 text-white placeholder-orange-300 border border-orange-500 focus:outline-none focus:ring-1 focus:ring-white"
                />
                <button
                  type="button"
                  title="Save team name"
                  onClick={handleSaveTeamNameB}
                  className="w-8 h-8 rounded bg-white text-orange-800 hover:bg-orange-100 font-bold flex items-center justify-center transition-colors shadow-xs"
                >
                  <Check size={14} />
                </button>
                <button
                  type="button"
                  title="Cancel"
                  onClick={() => {
                    setDraftTeamNameB(groupTeamB.name);
                    setDraftTeamShortB(groupTeamB.shortName);
                    setEditingTeamNameB(false);
                  }}
                  className="w-8 h-8 rounded bg-orange-800/60 text-white hover:bg-orange-800 flex items-center justify-center transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div className="bg-gradient-to-r from-orange-600 to-orange-700 px-4 py-3 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-orange-200 block">
                      Team B
                    </span>
                    <h3 className="text-base font-bold tracking-tight">
                      {groupTeamB.name} ({groupTeamB.shortName})
                    </h3>
                  </div>
                  <button
                    type="button"
                    title="Edit team name"
                    onClick={() => {
                      tap();
                      setDraftTeamNameB(groupTeamB.name);
                      setDraftTeamShortB(groupTeamB.shortName);
                      setEditingTeamNameB(true);
                    }}
                    className="w-7 h-7 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-colors ml-1"
                  >
                    <Pencil size={13} />
                  </button>
                </div>
                <span className="bg-white/20 text-white text-[11px] px-2.5 py-1 rounded-md font-mono font-bold">
                  {groupTeamB.players.length} Players
                </span>
              </div>
            )}

            {/* Team B List */}
            <div className="p-3 divide-y divide-slate-100 dark:divide-slate-800 space-y-1">
              {groupTeamB.players.map((player, idx) => {
                const isEditing = editingGroupPlayerId === player.id;
                return (
                  <div key={player.id} className="pt-1.5 first:pt-0">
                    {isEditing ? (
                      <div className="py-1.5 px-2 flex items-center gap-2 bg-orange-50/70 dark:bg-orange-950/30 border border-orange-300 dark:border-orange-700 rounded-md">
                        <span className="w-6 h-6 rounded-full bg-orange-200 dark:bg-orange-900 text-orange-900 dark:text-orange-100 text-[11px] font-bold flex items-center justify-center font-mono flex-shrink-0">
                          {idx + 1}
                        </span>
                        <input
                          type="text"
                          autoFocus
                          value={editingGroupPlayerName}
                          onChange={(e) => setEditingGroupPlayerName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleSaveEditGroupPlayer('B', player.id);
                            } else if (e.key === 'Escape') {
                              handleCancelEditGroupPlayer();
                            }
                          }}
                          className="flex-1 h-8 px-2 text-xs font-semibold rounded border border-orange-400 dark:border-orange-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-orange-500"
                        />
                        <button
                          type="button"
                          title="Save player name"
                          onClick={() => handleSaveEditGroupPlayer('B', player.id)}
                          className="w-8 h-8 rounded bg-orange-600 text-white flex items-center justify-center hover:bg-orange-700 transition-colors shadow-xs"
                        >
                          <Check size={14} />
                        </button>
                        <button
                          type="button"
                          title="Cancel"
                          onClick={handleCancelEditGroupPlayer}
                          className="w-8 h-8 rounded border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <div className="py-2 px-1 flex items-center justify-between text-xs hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded transition-colors">
                        <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
                          <span className="w-6 h-6 rounded-full bg-orange-100 dark:bg-orange-950 text-orange-800 dark:text-orange-300 text-[11px] font-bold flex items-center justify-center font-mono flex-shrink-0">
                            {idx + 1}
                          </span>
                          <span className="font-semibold text-slate-900 dark:text-slate-100 text-sm truncate">
                            {player.name}
                          </span>
                          {player.isCaptain && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-white flex-shrink-0 shadow-xs">
                              C
                            </span>
                          )}
                          {player.isViceCaptain && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-600 text-white flex-shrink-0 shadow-xs">
                              VC
                            </span>
                          )}
                        </div>

                        {/* Player Action Icons */}
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {/* Captain Button */}
                          <button
                            type="button"
                            title={player.isCaptain ? 'Captain (Click to remove)' : 'Assign Captain'}
                            onClick={() => handleToggleGroupCaptain('B', player.id)}
                            className={`h-7 px-2 text-[10px] font-bold rounded transition-all ${
                              player.isCaptain
                                ? 'bg-amber-500 text-white shadow-xs ring-1 ring-amber-600'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                            }`}
                          >
                            C
                          </button>

                          {/* Vice Captain Button */}
                          <button
                            type="button"
                            title={player.isViceCaptain ? 'Vice Captain (Click to remove)' : 'Assign Vice Captain'}
                            onClick={() => handleToggleGroupViceCaptain('B', player.id)}
                            className={`h-7 px-2 text-[10px] font-bold rounded transition-all ${
                              player.isViceCaptain
                                ? 'bg-blue-600 text-white shadow-xs ring-1 ring-blue-700'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40'
                            }`}
                          >
                            VC
                          </button>

                          {/* Edit Player Name Button */}
                          <button
                            type="button"
                            title="Edit player name"
                            onClick={() => handleStartEditGroupPlayer(player)}
                            className="w-7 h-7 flex items-center justify-center rounded text-slate-500 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-slate-800 transition-colors"
                          >
                            <Pencil size={13} />
                          </button>

                          {/* Delete Player Button */}
                          <button
                            type="button"
                            title="Delete player"
                            onClick={() => handleDeleteGroupPlayer('B', player.id)}
                            className="w-7 h-7 flex items-center justify-center rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Add Player to Team B */}
              {showAddPlayerB ? (
                <div className="pt-2 flex items-center gap-2">
                  <input
                    type="text"
                    autoFocus
                    placeholder="New player name"
                    value={newPlayerNameB}
                    onChange={(e) => setNewPlayerNameB(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddGroupPlayer('B');
                      } else if (e.key === 'Escape') {
                        setShowAddPlayerB(false);
                        setNewPlayerNameB('');
                      }
                    }}
                    className="flex-1 h-8 px-2.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-amber-500 font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddGroupPlayer('B')}
                    className="h-8 px-3 rounded bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold transition-colors flex items-center gap-1 shadow-xs"
                  >
                    <Plus size={13} />
                    <span>Add</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddPlayerB(false);
                      setNewPlayerNameB('');
                    }}
                    className="h-8 px-2 rounded border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <X size={13} />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    tap();
                    setShowAddPlayerB(true);
                  }}
                  className="w-full mt-2 py-2 border border-dashed border-slate-300 dark:border-slate-700 rounded-md text-xs font-semibold text-slate-600 dark:text-slate-400 hover:border-orange-500 hover:text-orange-600 dark:hover:border-orange-400 dark:hover:text-orange-400 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Plus size={14} />
                  <span>Add Player</span>
                </button>
              )}
            </div>
          </div>

          {/* Bottom Proceed Action Buttons (Requested) */}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => {
                tap();
                setShowDefaultGroupPreview(false);
              }}
              className="h-12 px-4 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5"
            >
              <ChevronLeft size={16} />
              <span>Back</span>
            </button>
            <button
              type="button"
              onClick={handleConfirmDefaultGroupTeams}
              className="flex-1 h-12 rounded-lg bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow-md active:scale-[0.99]"
            >
              <span>Continue with Default Teams</span>
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
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

          {/* Player list with edit, delete, reorder, Captain (C) and Vice Captain (VC) toggles */}
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

                      {/* Toggles: C (Captain) & VC (Vice Captain) */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => handleToggleCaptain(player.id)}
                          className={`w-6 h-6 rounded text-[10px] font-semibold border transition-colors ${
                            player.isCaptain
                              ? 'border-amber-600 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300'
                              : 'border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-600'
                          }`}
                          title="Toggle Captain"
                        >
                          C
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleViceCaptain(player.id)}
                          className={`w-7 h-6 rounded text-[9px] font-semibold border transition-colors ${
                            player.isViceCaptain
                              ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300'
                              : 'border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-600'
                          }`}
                          title="Toggle Vice Captain"
                        >
                          VC
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
                <div className="flex items-center border border-slate-300 dark:border-slate-700 rounded-md overflow-hidden bg-white dark:bg-slate-800 focus-within:ring-1 focus-within:ring-emerald-700 dark:focus-within:ring-emerald-500 focus-within:border-emerald-700 dark:focus-within:border-emerald-500 transition-colors">
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
                    className="w-10 h-10 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60 active:bg-slate-200 dark:active:bg-slate-700 transition-colors select-none"
                    aria-label="Decrease total overs"
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
                    placeholder="5"
                    className="w-14 h-10 text-center text-xs font-semibold tabular-nums border-x border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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
                    className="w-10 h-10 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60 active:bg-slate-200 dark:active:bg-slate-700 transition-colors select-none"
                    aria-label="Increase total overs"
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
                      className={`flex-1 h-10 rounded-md border text-xs tabular-nums font-medium transition-colors ${
                        totalOvers === ov
                          ? 'border-emerald-700 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 font-semibold'
                          : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
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
                    className="w-24 h-10 px-3 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 tabular-nums focus:outline-none focus:ring-1 focus:ring-emerald-700 dark:focus:ring-emerald-500 placeholder-slate-400 dark:placeholder-slate-500"
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
                  className="w-full h-10 px-3 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 tabular-nums focus:outline-none focus:ring-1 focus:ring-emerald-700 dark:focus:ring-emerald-500 placeholder-slate-400 dark:placeholder-slate-500"
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
                  className="w-full h-10 px-3 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 tabular-nums focus:outline-none focus:ring-1 focus:ring-emerald-700 dark:focus:ring-emerald-500 placeholder-slate-400 dark:placeholder-slate-500"
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
                    {p.name} {p.isCaptain ? '(C)' : ''} {p.isViceCaptain ? '(VC)' : ''}
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
                    {p.name} {p.isCaptain ? '(C)' : ''} {p.isViceCaptain ? '(VC)' : ''}
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
                    {p.name} {p.isCaptain ? '(C)' : ''} {p.isViceCaptain ? '(VC)' : ''}
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
