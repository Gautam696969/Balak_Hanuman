import React, { createContext, useContext, useReducer, useEffect } from 'react';
import {
  Ball,
  DismissalInfo,
  Innings,
  Match,
  MatchAction,
  MatchContextState,
  MatchSummary,
  Player,
  Team,
} from '../types/cricket';
import {
  evaluateMatchResult,
  formatBallBadge,
  formatDismissalText,
  generateId,
  legalBallsToOvers,
} from '../utils/cricket';

const CURRENT_MATCH_KEY = 'cricket_current_match_v3';
const HISTORY_STACK_KEY = 'cricket_history_stack_v3';
const SAVED_MATCHES_KEY = 'cricket_saved_matches_v3';
const DARK_MODE_KEY = 'cricket_dark_mode_v3';

interface ExtendedState extends MatchContextState {
  showNewBowlerModal: boolean;
  showNewBatsmanModal: boolean;
  replacingBatsmanRole: 'striker' | 'nonStriker';
}

type ExtendedAction =
  | MatchAction
  | { type: 'SET_TAB'; payload: { tab: 'scoring' | 'scorecard' | 'history' } }
  | { type: 'SELECT_SCORECARD_INNINGS'; payload: { inningsNumber: 1 | 2 } }
  | { type: 'TOGGLE_DARK_MODE' }
  | { type: 'DELETE_SAVED_MATCH'; payload: { id: string } }
  | { type: 'CLOSE_BOWLER_MODAL' }
  | { type: 'CLOSE_BATSMAN_MODAL' };

const initialInnings = (
  inningsNumber: 1 | 2,
  battingTeamId: 'teamA' | 'teamB',
  bowlingTeamId: 'teamA' | 'teamB',
  strikerId: string = '',
  nonStrikerId: string = '',
  currentBowlerId: string = ''
): Innings => ({
  inningsNumber,
  battingTeamId,
  bowlingTeamId,
  totalRuns: 0,
  wickets: 0,
  legalBalls: 0,
  oversFormatted: '0.0',
  currentOverBalls: [],
  allBalls: [],
  strikerId,
  nonStrikerId,
  currentBowlerId,
  previousBowlerId: null,
  isCompleted: false,
  extras: {
    wides: 0,
    noBalls: 0,
    byes: 0,
    legByes: 0,
    total: 0,
  },
  fallOfWickets: [],
});

function createMatchSummary(match: Match): MatchSummary {
  const [inn1, inn2] = match.innings;
  const inn1Score = `${inn1.totalRuns}/${inn1.wickets} (${inn1.oversFormatted} ov)`;
  const inn2Score =
    match.currentInningsIndex === 1 || match.status === 'completed'
      ? `${inn2.totalRuns}/${inn2.wickets} (${inn2.oversFormatted} ov)`
      : undefined;

  return {
    id: match.id,
    date: match.date,
    teamAName: match.teamA.name,
    teamBName: match.teamB.name,
    totalOvers: match.rules.totalOvers,
    innings1Score: inn1Score,
    innings2Score: inn2Score,
    resultText: match.result?.marginText || 'Match in progress',
    createdAt: match.createdAt,
    fullMatch: match,
  };
}

function matchReducer(state: ExtendedState, action: ExtendedAction): ExtendedState {
  switch (action.type) {
    case 'START_MATCH': {
      const { teamA, teamB, rules, toss, strikerId, nonStrikerId, bowlerId } = action.payload;

      const teamABatFirst =
        (toss.winner === 'teamA' && toss.decision === 'bat') ||
        (toss.winner === 'teamB' && toss.decision === 'bowl');

      const innings1BattingTeam = teamABatFirst ? 'teamA' : 'teamB';
      const innings1BowlingTeam = teamABatFirst ? 'teamB' : 'teamA';

      const inn1 = initialInnings(1, innings1BattingTeam, innings1BowlingTeam, strikerId, nonStrikerId, bowlerId);
      const inn2 = initialInnings(2, innings1BowlingTeam, innings1BattingTeam);

      const newMatch: Match = {
        id: `match_${Date.now()}`,
        date: new Date().toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
        teamA,
        teamB,
        rules,
        toss,
        currentInningsIndex: 0,
        innings: [inn1, inn2],
        isFreeHit: false,
        needsBowlerSelection: false,
        needsBatsmanSelection: false,
        status: 'live',
        result: null,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      return {
        ...state,
        match: newMatch,
        historyStack: [],
        activeTab: 'scoring',
        selectedScorecardInnings: 1,
        showNewBowlerModal: false,
        showNewBatsmanModal: false,
      };
    }

    case 'ADD_RUNS': {
      if (!state.match || state.match.status !== 'live') return state;

      const currentMatch = state.match;
      const historyStack = [...state.historyStack, JSON.parse(JSON.stringify(currentMatch))];

      const innIndex = currentMatch.currentInningsIndex;
      const inn = { ...currentMatch.innings[innIndex] };
      const { runs } = action.payload;

      const battingTeam = inn.battingTeamId === 'teamA' ? currentMatch.teamA : currentMatch.teamB;
      const bowlingTeam = inn.bowlingTeamId === 'teamA' ? currentMatch.teamA : currentMatch.teamB;

      const striker = battingTeam.players.find((p) => p.id === inn.strikerId);
      const nonStriker = battingTeam.players.find((p) => p.id === inn.nonStrikerId);
      const bowler = bowlingTeam.players.find((p) => p.id === inn.currentBowlerId);

      const currentOverIndex = Math.floor(inn.legalBalls / 6);
      const legalBallNumber = (inn.legalBalls % 6) + 1;

      const newBall: Ball = {
        id: `ball_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        overIndex: currentOverIndex,
        ballInOver: inn.currentOverBalls.length + 1,
        legalBallNumber,
        isLegal: true,
        runsOffBat: runs,
        extraRuns: 0,
        totalRuns: runs,
        extraType: null,
        wicket: null,
        batsmanId: inn.strikerId,
        batsmanName: striker?.name || 'Striker',
        nonStrikerId: inn.nonStrikerId,
        nonStrikerName: nonStriker?.name || 'Non-Striker',
        bowlerId: inn.currentBowlerId,
        bowlerName: bowler?.name || 'Bowler',
        isFreeHit: currentMatch.isFreeHit,
        displayLabel: `${runs}`,
        timestamp: Date.now(),
      };

      inn.totalRuns += runs;
      inn.legalBalls += 1;
      inn.oversFormatted = legalBallsToOvers(inn.legalBalls);
      inn.currentOverBalls = [...inn.currentOverBalls, newBall];
      inn.allBalls = [...inn.allBalls, newBall];

      // Odd runs swap strike (if 2 batters active)
      let newStrikerId = inn.strikerId;
      let newNonStrikerId = inn.nonStrikerId;
      if (newNonStrikerId && runs % 2 === 1) {
        newStrikerId = inn.nonStrikerId;
        newNonStrikerId = inn.strikerId;
      }

      // Free hit cleared on legal ball
      let isFreeHit = false;

      // Check 2nd innings target chase
      if (innIndex === 1) {
        const target = currentMatch.innings[0].totalRuns + 1;
        if (inn.totalRuns >= target) {
          inn.strikerId = newStrikerId;
          inn.nonStrikerId = newNonStrikerId;
          inn.isCompleted = true;

          const updatedMatch: Match = {
            ...currentMatch,
            innings: [currentMatch.innings[0], inn],
            status: 'completed',
            isFreeHit: false,
            updatedAt: Date.now(),
            result: evaluateMatchResult({
              ...currentMatch,
              innings: [currentMatch.innings[0], inn],
            }),
          };

          const summary = createMatchSummary(updatedMatch);
          const updatedSavedMatches = [summary, ...state.savedMatches.filter((m) => m.id !== updatedMatch.id)];

          return {
            ...state,
            match: updatedMatch,
            historyStack,
            savedMatches: updatedSavedMatches,
            showNewBowlerModal: false,
            showNewBatsmanModal: false,
          };
        }
      }

      // Check Over completion (6 legal balls)
      let needsBowlerSelection = false;
      let showNewBowlerModal = false;
      const isOverComplete = inn.legalBalls % 6 === 0;

      if (isOverComplete) {
        // Swap strike at end of over (if 2 batters active)
        if (newNonStrikerId) {
          const temp = newStrikerId;
          newStrikerId = newNonStrikerId;
          newNonStrikerId = temp;
        }

        inn.previousBowlerId = inn.currentBowlerId;
        inn.currentOverBalls = [];

        // Check if Innings complete
        if (inn.legalBalls >= currentMatch.rules.totalOvers * 6) {
          inn.isCompleted = true;
          if (innIndex === 0) {
            const updatedMatch: Match = {
              ...currentMatch,
              innings: [inn, currentMatch.innings[1]],
              status: 'inningsBreak',
              isFreeHit: false,
              updatedAt: Date.now(),
            };
            return {
              ...state,
              match: updatedMatch,
              historyStack,
              showNewBowlerModal: false,
              showNewBatsmanModal: false,
            };
          } else {
            const updatedMatch: Match = {
              ...currentMatch,
              innings: [currentMatch.innings[0], inn],
              status: 'completed',
              isFreeHit: false,
              updatedAt: Date.now(),
              result: evaluateMatchResult({
                ...currentMatch,
                innings: [currentMatch.innings[0], inn],
              }),
            };
            const summary = createMatchSummary(updatedMatch);
            const updatedSavedMatches = [summary, ...state.savedMatches.filter((m) => m.id !== updatedMatch.id)];
            return {
              ...state,
              match: updatedMatch,
              historyStack,
              savedMatches: updatedSavedMatches,
              showNewBowlerModal: false,
              showNewBatsmanModal: false,
            };
          }
        } else {
          needsBowlerSelection = true;
          showNewBowlerModal = true;
        }
      }

      inn.strikerId = newStrikerId;
      inn.nonStrikerId = newNonStrikerId;

      const updatedMatch: Match = {
        ...currentMatch,
        innings: innIndex === 0 ? [inn, currentMatch.innings[1]] : [currentMatch.innings[0], inn],
        isFreeHit,
        needsBowlerSelection,
        updatedAt: Date.now(),
      };

      return {
        ...state,
        match: updatedMatch,
        historyStack,
        showNewBowlerModal,
        showNewBatsmanModal: false,
      };
    }

    case 'ADD_EXTRA': {
      if (!state.match || state.match.status !== 'live') return state;

      const currentMatch = state.match;
      const historyStack = [...state.historyStack, JSON.parse(JSON.stringify(currentMatch))];

      const innIndex = currentMatch.currentInningsIndex;
      const inn = { ...currentMatch.innings[innIndex] };
      const { extraType, additionalRuns, runsOffBat = 0 } = action.payload;

      const battingTeam = inn.battingTeamId === 'teamA' ? currentMatch.teamA : currentMatch.teamB;
      const bowlingTeam = inn.bowlingTeamId === 'teamA' ? currentMatch.teamA : currentMatch.teamB;

      const striker = battingTeam.players.find((p) => p.id === inn.strikerId);
      const nonStriker = battingTeam.players.find((p) => p.id === inn.nonStrikerId);
      const bowler = bowlingTeam.players.find((p) => p.id === inn.currentBowlerId);

      const isWide = extraType === 'wd';
      const isNoBall = extraType === 'nb';
      const isLegal =
        (extraType === 'b' || extraType === 'lb') ||
        (isWide && currentMatch.rules.rebowlWide === false) ||
        (isNoBall && currentMatch.rules.rebowlNoBall === false);

      const currentOverIndex = Math.floor(inn.legalBalls / 6);
      const legalBallNumber = isLegal ? (inn.legalBalls % 6) + 1 : inn.legalBalls % 6;

      let totalBallRuns = 0;
      let extraRuns = 0;
      let isFreeHit = currentMatch.isFreeHit;
      let newStrikerId = inn.strikerId;
      let newNonStrikerId = inn.nonStrikerId;

      const newExtras = { ...inn.extras };

      if (isWide) {
        extraRuns = (currentMatch.rules.wideRuns || 1) + additionalRuns;
        totalBallRuns = extraRuns;
        newExtras.wides += extraRuns;
        newExtras.total += extraRuns;

        if (newNonStrikerId && additionalRuns % 2 === 1) {
          newStrikerId = inn.nonStrikerId;
          newNonStrikerId = inn.strikerId;
        }
      } else if (isNoBall) {
        const penalty = currentMatch.rules.noBallRuns || 1;
        extraRuns = penalty;
        totalBallRuns = penalty + runsOffBat + additionalRuns;
        newExtras.noBalls += penalty + additionalRuns;
        newExtras.total += penalty + additionalRuns;

        if (currentMatch.rules.freeHitOnNoBall !== false) {
          isFreeHit = true;
        }

        const runningRuns = runsOffBat > 0 ? runsOffBat : additionalRuns;
        if (newNonStrikerId && runningRuns % 2 === 1) {
          newStrikerId = inn.nonStrikerId;
          newNonStrikerId = inn.strikerId;
        }
      } else if (extraType === 'b' || extraType === 'lb') {
        extraRuns = additionalRuns;
        totalBallRuns = additionalRuns;

        if (extraType === 'b') {
          newExtras.byes += additionalRuns;
        } else {
          newExtras.legByes += additionalRuns;
        }
        newExtras.total += additionalRuns;

        isFreeHit = false;

        if (newNonStrikerId && additionalRuns % 2 === 1) {
          newStrikerId = inn.nonStrikerId;
          newNonStrikerId = inn.strikerId;
        }
      }

      inn.extras = newExtras;
      inn.totalRuns += totalBallRuns;

      if (isLegal) {
        inn.legalBalls += 1;
        inn.oversFormatted = legalBallsToOvers(inn.legalBalls);
      }

      const newBall: Ball = {
        id: `ball_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        overIndex: currentOverIndex,
        ballInOver: inn.currentOverBalls.length + 1,
        legalBallNumber,
        isLegal,
        runsOffBat: isNoBall ? runsOffBat : 0,
        extraRuns,
        totalRuns: totalBallRuns,
        extraType,
        wicket: null,
        batsmanId: inn.strikerId,
        batsmanName: striker?.name || 'Striker',
        nonStrikerId: inn.nonStrikerId,
        nonStrikerName: nonStriker?.name || 'Non-Striker',
        bowlerId: inn.currentBowlerId,
        bowlerName: bowler?.name || 'Bowler',
        isFreeHit: currentMatch.isFreeHit,
        displayLabel: '',
        timestamp: Date.now(),
      };
      newBall.displayLabel = formatBallBadge(newBall);

      inn.currentOverBalls = [...inn.currentOverBalls, newBall];
      inn.allBalls = [...inn.allBalls, newBall];

      // Check 2nd innings target chase
      if (innIndex === 1) {
        const target = currentMatch.innings[0].totalRuns + 1;
        if (inn.totalRuns >= target) {
          inn.strikerId = newStrikerId;
          inn.nonStrikerId = newNonStrikerId;
          inn.isCompleted = true;

          const updatedMatch: Match = {
            ...currentMatch,
            innings: [currentMatch.innings[0], inn],
            status: 'completed',
            isFreeHit: false,
            updatedAt: Date.now(),
            result: evaluateMatchResult({
              ...currentMatch,
              innings: [currentMatch.innings[0], inn],
            }),
          };

          const summary = createMatchSummary(updatedMatch);
          const updatedSavedMatches = [summary, ...state.savedMatches.filter((m) => m.id !== updatedMatch.id)];

          return {
            ...state,
            match: updatedMatch,
            historyStack,
            savedMatches: updatedSavedMatches,
            showNewBowlerModal: false,
            showNewBatsmanModal: false,
          };
        }
      }

      // Check over completion if legal ball
      let needsBowlerSelection = false;
      let showNewBowlerModal = false;

      if (isLegal && inn.legalBalls % 6 === 0) {
        if (newNonStrikerId) {
          const temp = newStrikerId;
          newStrikerId = newNonStrikerId;
          newNonStrikerId = temp;
        }

        inn.previousBowlerId = inn.currentBowlerId;
        inn.currentOverBalls = [];

        if (inn.legalBalls >= currentMatch.rules.totalOvers * 6) {
          inn.isCompleted = true;
          if (innIndex === 0) {
            const updatedMatch: Match = {
              ...currentMatch,
              innings: [inn, currentMatch.innings[1]],
              status: 'inningsBreak',
              isFreeHit: false,
              updatedAt: Date.now(),
            };
            return {
              ...state,
              match: updatedMatch,
              historyStack,
              showNewBowlerModal: false,
              showNewBatsmanModal: false,
            };
          } else {
            const updatedMatch: Match = {
              ...currentMatch,
              innings: [currentMatch.innings[0], inn],
              status: 'completed',
              isFreeHit: false,
              updatedAt: Date.now(),
              result: evaluateMatchResult({
                ...currentMatch,
                innings: [currentMatch.innings[0], inn],
              }),
            };
            const summary = createMatchSummary(updatedMatch);
            const updatedSavedMatches = [summary, ...state.savedMatches.filter((m) => m.id !== updatedMatch.id)];
            return {
              ...state,
              match: updatedMatch,
              historyStack,
              savedMatches: updatedSavedMatches,
              showNewBowlerModal: false,
              showNewBatsmanModal: false,
            };
          }
        } else {
          needsBowlerSelection = true;
          showNewBowlerModal = true;
        }
      }

      inn.strikerId = newStrikerId;
      inn.nonStrikerId = newNonStrikerId;

      const updatedMatch: Match = {
        ...currentMatch,
        innings: innIndex === 0 ? [inn, currentMatch.innings[1]] : [currentMatch.innings[0], inn],
        isFreeHit,
        needsBowlerSelection,
        updatedAt: Date.now(),
      };

      return {
        ...state,
        match: updatedMatch,
        historyStack,
        showNewBowlerModal,
        showNewBatsmanModal: false,
      };
    }

    case 'ADD_WICKET': {
      if (!state.match || state.match.status !== 'live') return state;

      const currentMatch = state.match;
      const historyStack = [...state.historyStack, JSON.parse(JSON.stringify(currentMatch))];

      const innIndex = currentMatch.currentInningsIndex;
      const inn = { ...currentMatch.innings[innIndex] };
      const {
        wicketType,
        outBatsmanId,
        fielderId,
        runsCompleted = 0,
        nextBatsmanId,
        nextBatsmanName,
      } = action.payload;

      const battingTeam = inn.battingTeamId === 'teamA' ? currentMatch.teamA : currentMatch.teamB;
      const bowlingTeam = inn.bowlingTeamId === 'teamA' ? currentMatch.teamA : currentMatch.teamB;

      let resolvedNextBatsmanId = nextBatsmanId;
      if (!resolvedNextBatsmanId && nextBatsmanName && nextBatsmanName.trim()) {
        const cleanName = nextBatsmanName.trim();
        const existing = battingTeam.players.find(
          (p) => p.name.toLowerCase() === cleanName.toLowerCase()
        );
        if (existing) {
          resolvedNextBatsmanId = existing.id;
        } else {
          const newPlayer: Player = {
            id: generateId(),
            name: cleanName,
          };
          battingTeam.players = [...battingTeam.players, newPlayer];
          if (inn.battingTeamId === 'teamA') {
            currentMatch.teamA = { ...battingTeam, players: [...battingTeam.players] };
          } else {
            currentMatch.teamB = { ...battingTeam, players: [...battingTeam.players] };
          }
          resolvedNextBatsmanId = newPlayer.id;
        }
      }

      const outBatsman = battingTeam.players.find((p) => p.id === outBatsmanId);
      const fielder = bowlingTeam.players.find((p) => p.id === fielderId);
      const bowler = bowlingTeam.players.find((p) => p.id === inn.currentBowlerId);

      const isStrikerOut = outBatsmanId === inn.strikerId;

      inn.totalRuns += runsCompleted;
      inn.legalBalls += 1;
      inn.oversFormatted = legalBallsToOvers(inn.legalBalls);
      inn.wickets += 1;

      const currentOverIndex = Math.floor((inn.legalBalls - 1) / 6);
      const legalBallNumber = ((inn.legalBalls - 1) % 6) + 1;

      const dismissal: DismissalInfo = {
        type: wicketType,
        batsmanId: outBatsmanId,
        batsmanName: outBatsman?.name || 'Batsman',
        bowlerId: inn.currentBowlerId,
        bowlerName: bowler?.name || 'Bowler',
        fielderId,
        fielderName: fielder?.name,
        runsCompleted,
        outBatsmanIsStriker: isStrikerOut,
        description: '',
      };
      dismissal.description = formatDismissalText(dismissal);

      inn.fallOfWickets = [
        ...inn.fallOfWickets,
        {
          wicketNumber: inn.wickets,
          score: inn.totalRuns,
          overs: inn.oversFormatted,
          batsmanId: outBatsmanId,
          batsmanName: outBatsman?.name || 'Batsman',
        },
      ];

      const newBall: Ball = {
        id: `ball_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        overIndex: currentOverIndex,
        ballInOver: inn.currentOverBalls.length + 1,
        legalBallNumber,
        isLegal: true,
        runsOffBat: 0,
        extraRuns: runsCompleted,
        totalRuns: runsCompleted,
        extraType: null,
        wicket: dismissal,
        batsmanId: inn.strikerId,
        batsmanName: battingTeam.players.find((p) => p.id === inn.strikerId)?.name || 'Striker',
        nonStrikerId: inn.nonStrikerId,
        nonStrikerName: battingTeam.players.find((p) => p.id === inn.nonStrikerId)?.name || 'Non-Striker',
        bowlerId: inn.currentBowlerId,
        bowlerName: bowler?.name || 'Bowler',
        isFreeHit: currentMatch.isFreeHit,
        displayLabel: 'W',
        timestamp: Date.now(),
      };
      newBall.displayLabel = formatBallBadge(newBall);

      inn.currentOverBalls = [...inn.currentOverBalls, newBall];
      inn.allBalls = [...inn.allBalls, newBall];

      let newStrikerId = inn.strikerId;
      let newNonStrikerId = inn.nonStrikerId;

      if (newNonStrikerId && runsCompleted % 2 === 1) {
        newStrikerId = inn.nonStrikerId;
        newNonStrikerId = inn.strikerId;
      }

      const isFreeHit = false;

      // Check target reached on run-out runs
      if (innIndex === 1) {
        const target = currentMatch.innings[0].totalRuns + 1;
        if (inn.totalRuns >= target) {
          inn.isCompleted = true;
          const updatedMatch: Match = {
            ...currentMatch,
            innings: [currentMatch.innings[0], inn],
            status: 'completed',
            isFreeHit: false,
            updatedAt: Date.now(),
            result: evaluateMatchResult({
              ...currentMatch,
              innings: [currentMatch.innings[0], inn],
            }),
          };
          const summary = createMatchSummary(updatedMatch);
          return {
            ...state,
            match: updatedMatch,
            historyStack,
            savedMatches: [summary, ...state.savedMatches.filter((m) => m.id !== updatedMatch.id)],
            showNewBowlerModal: false,
            showNewBatsmanModal: false,
          };
        }
      }

      // Check All Out:
      // If lastManStands enabled: all out when wickets == total players in batting team
      // Otherwise: all out when wickets == total players - 1
      const totalPlayersCount = battingTeam.players.length;
      const maxWickets = currentMatch.rules.lastManStands
        ? totalPlayersCount
        : Math.max(1, totalPlayersCount - 1);

      const isAllOut = inn.wickets >= maxWickets;

      if (isAllOut) {
        inn.isCompleted = true;
        if (innIndex === 0) {
          const updatedMatch: Match = {
            ...currentMatch,
            innings: [inn, currentMatch.innings[1]],
            status: 'inningsBreak',
            isFreeHit: false,
            updatedAt: Date.now(),
          };
          return {
            ...state,
            match: updatedMatch,
            historyStack,
            showNewBowlerModal: false,
            showNewBatsmanModal: false,
          };
        } else {
          const updatedMatch: Match = {
            ...currentMatch,
            innings: [currentMatch.innings[0], inn],
            status: 'completed',
            isFreeHit: false,
            updatedAt: Date.now(),
            result: evaluateMatchResult({
              ...currentMatch,
              innings: [currentMatch.innings[0], inn],
            }),
          };
          const summary = createMatchSummary(updatedMatch);
          return {
            ...state,
            match: updatedMatch,
            historyStack,
            savedMatches: [summary, ...state.savedMatches.filter((m) => m.id !== updatedMatch.id)],
            showNewBowlerModal: false,
            showNewBatsmanModal: false,
          };
        }
      }

      // Check Over completion
      const isOverComplete = inn.legalBalls % 6 === 0;
      let needsBowlerSelection = false;
      let showNewBowlerModal = false;

      if (isOverComplete) {
        if (newNonStrikerId) {
          const temp = newStrikerId;
          newStrikerId = newNonStrikerId;
          newNonStrikerId = temp;
        }

        inn.previousBowlerId = inn.currentBowlerId;
        inn.currentOverBalls = [];

        if (inn.legalBalls >= currentMatch.rules.totalOvers * 6) {
          inn.isCompleted = true;
          if (innIndex === 0) {
            const updatedMatch: Match = {
              ...currentMatch,
              innings: [inn, currentMatch.innings[1]],
              status: 'inningsBreak',
              isFreeHit: false,
              updatedAt: Date.now(),
            };
            return {
              ...state,
              match: updatedMatch,
              historyStack,
              showNewBowlerModal: false,
              showNewBatsmanModal: false,
            };
          } else {
            const updatedMatch: Match = {
              ...currentMatch,
              innings: [currentMatch.innings[0], inn],
              status: 'completed',
              isFreeHit: false,
              updatedAt: Date.now(),
              result: evaluateMatchResult({
                ...currentMatch,
                innings: [currentMatch.innings[0], inn],
              }),
            };
            const summary = createMatchSummary(updatedMatch);
            return {
              ...state,
              match: updatedMatch,
              historyStack,
              savedMatches: [summary, ...state.savedMatches.filter((m) => m.id !== updatedMatch.id)],
              showNewBowlerModal: false,
              showNewBatsmanModal: false,
            };
          }
        } else {
          needsBowlerSelection = true;
          showNewBowlerModal = true;
        }
      }

      // Handle replacement batsman
      const replacedRole: 'striker' | 'nonStriker' = isStrikerOut ? 'striker' : 'nonStriker';

      // If lastManStands and only 1 batter remains:
      const remainingBattersCount = totalPlayersCount - inn.wickets;
      if (currentMatch.rules.lastManStands && remainingBattersCount === 1) {
        // The one surviving batter becomes striker, non-striker is empty
        const survivingId = isStrikerOut ? inn.nonStrikerId : inn.strikerId;
        inn.strikerId = survivingId;
        inn.nonStrikerId = '';

        const updatedMatch: Match = {
          ...currentMatch,
          innings: innIndex === 0 ? [inn, currentMatch.innings[1]] : [currentMatch.innings[0], inn],
          isFreeHit,
          needsBowlerSelection,
          needsBatsmanSelection: false,
          updatedAt: Date.now(),
        };

        return {
          ...state,
          match: updatedMatch,
          historyStack,
          showNewBowlerModal,
          showNewBatsmanModal: false,
        };
      }

      let showNewBatsmanModal = false;

      if (resolvedNextBatsmanId) {
        if (replacedRole === 'striker') {
          newStrikerId = resolvedNextBatsmanId;
        } else {
          newNonStrikerId = resolvedNextBatsmanId;
        }
      } else {
        showNewBatsmanModal = true;
      }

      inn.strikerId = newStrikerId;
      inn.nonStrikerId = newNonStrikerId;

      const updatedMatch: Match = {
        ...currentMatch,
        innings: innIndex === 0 ? [inn, currentMatch.innings[1]] : [currentMatch.innings[0], inn],
        isFreeHit,
        needsBowlerSelection,
        needsBatsmanSelection: showNewBatsmanModal,
        dismissedBatsmanRole: replacedRole,
        updatedAt: Date.now(),
      };

      return {
        ...state,
        match: updatedMatch,
        historyStack,
        showNewBowlerModal,
        showNewBatsmanModal,
        replacingBatsmanRole: replacedRole,
      };
    }

    case 'UNDO': {
      if (state.historyStack.length === 0) return state;

      const previousMatch = state.historyStack[state.historyStack.length - 1];
      const newStack = state.historyStack.slice(0, -1);

      return {
        ...state,
        match: previousMatch,
        historyStack: newStack,
        showNewBowlerModal: previousMatch.needsBowlerSelection,
        showNewBatsmanModal: previousMatch.needsBatsmanSelection,
      };
    }

    case 'SET_BOWLER': {
      if (!state.match) return state;
      const innIndex = state.match.currentInningsIndex;
      const inn = { ...state.match.innings[innIndex] };

      inn.currentBowlerId = action.payload.bowlerId;
      inn.currentOverBalls = [];

      const updatedMatch: Match = {
        ...state.match,
        innings: innIndex === 0 ? [inn, state.match.innings[1]] : [state.match.innings[0], inn],
        needsBowlerSelection: false,
        updatedAt: Date.now(),
      };

      return {
        ...state,
        match: updatedMatch,
        showNewBowlerModal: false,
      };
    }

    case 'ADD_AND_SET_BOWLER': {
      if (!state.match) return state;
      const currentMatch = state.match;
      const innIndex = currentMatch.currentInningsIndex;
      const inn = { ...currentMatch.innings[innIndex] };

      const bowlingTeamKey = inn.bowlingTeamId;
      const bowlingTeam = currentMatch[bowlingTeamKey];

      const newPlayer: Player = {
        id: generateId(),
        name: action.payload.name.trim(),
      };

      const updatedBowlingTeam: Team = {
        ...bowlingTeam,
        players: [...bowlingTeam.players, newPlayer],
      };

      inn.currentBowlerId = newPlayer.id;
      inn.currentOverBalls = [];

      const updatedMatch: Match = {
        ...currentMatch,
        [bowlingTeamKey]: updatedBowlingTeam,
        innings: innIndex === 0 ? [inn, currentMatch.innings[1]] : [currentMatch.innings[0], inn],
        needsBowlerSelection: false,
        updatedAt: Date.now(),
      };

      return {
        ...state,
        match: updatedMatch,
        showNewBowlerModal: false,
      };
    }

    case 'SET_BATTER': {
      if (!state.match) return state;
      const innIndex = state.match.currentInningsIndex;
      const inn = { ...state.match.innings[innIndex] };
      const { batsmanId, replaceRole } = action.payload;

      if (replaceRole === 'striker') {
        inn.strikerId = batsmanId;
      } else {
        inn.nonStrikerId = batsmanId;
      }

      const updatedMatch: Match = {
        ...state.match,
        innings: innIndex === 0 ? [inn, state.match.innings[1]] : [state.match.innings[0], inn],
        needsBatsmanSelection: false,
        updatedAt: Date.now(),
      };

      return {
        ...state,
        match: updatedMatch,
        showNewBatsmanModal: false,
      };
    }

    case 'ADD_AND_SET_BATTER': {
      if (!state.match) return state;
      const currentMatch = state.match;
      const innIndex = currentMatch.currentInningsIndex;
      const inn = { ...currentMatch.innings[innIndex] };

      const battingTeamKey = inn.battingTeamId;
      const battingTeam = currentMatch[battingTeamKey];

      const newPlayer: Player = {
        id: generateId(),
        name: action.payload.name.trim(),
      };

      const updatedBattingTeam: Team = {
        ...battingTeam,
        players: [...battingTeam.players, newPlayer],
      };

      if (action.payload.replaceRole === 'striker') {
        inn.strikerId = newPlayer.id;
      } else {
        inn.nonStrikerId = newPlayer.id;
      }

      const updatedMatch: Match = {
        ...currentMatch,
        [battingTeamKey]: updatedBattingTeam,
        innings: innIndex === 0 ? [inn, currentMatch.innings[1]] : [currentMatch.innings[0], inn],
        needsBatsmanSelection: false,
        updatedAt: Date.now(),
      };

      return {
        ...state,
        match: updatedMatch,
        showNewBatsmanModal: false,
      };
    }

    case 'CHANGE_BOWLER_MID_OVER': {
      if (!state.match || state.match.status !== 'live') return state;
      const currentMatch = state.match;
      const historyStack = [...state.historyStack, JSON.parse(JSON.stringify(currentMatch))];
      const innIndex = currentMatch.currentInningsIndex;
      const inn = { ...currentMatch.innings[innIndex] };

      inn.currentBowlerId = action.payload.bowlerId;

      return {
        ...state,
        match: {
          ...currentMatch,
          innings: innIndex === 0 ? [inn, currentMatch.innings[1]] : [currentMatch.innings[0], inn],
          updatedAt: Date.now(),
        },
        historyStack,
      };
    }

    case 'RETIRE_BATTER': {
      if (!state.match || state.match.status !== 'live') return state;
      const currentMatch = state.match;
      const historyStack = [...state.historyStack, JSON.parse(JSON.stringify(currentMatch))];
      const innIndex = currentMatch.currentInningsIndex;
      const inn = { ...currentMatch.innings[innIndex] };
      const { batsmanId, nextBatsmanId } = action.payload;

      const isStriker = batsmanId === inn.strikerId;
      const battingTeam = inn.battingTeamId === 'teamA' ? currentMatch.teamA : currentMatch.teamB;
      const retiringPlayer = battingTeam.players.find((p) => p.id === batsmanId);

      const dismissal: DismissalInfo = {
        type: 'retiredHurt',
        batsmanId,
        batsmanName: retiringPlayer?.name || 'Batsman',
        bowlerId: inn.currentBowlerId,
        bowlerName: 'N/A',
        description: 'retired hurt',
      };

      const retireBall: Ball = {
        id: `ball_${Date.now()}_rh`,
        overIndex: Math.floor(inn.legalBalls / 6),
        ballInOver: inn.currentOverBalls.length,
        legalBallNumber: inn.legalBalls % 6,
        isLegal: false,
        runsOffBat: 0,
        extraRuns: 0,
        totalRuns: 0,
        extraType: null,
        wicket: dismissal,
        batsmanId,
        batsmanName: retiringPlayer?.name || 'Batsman',
        nonStrikerId: isStriker ? inn.nonStrikerId : inn.strikerId,
        nonStrikerName: 'Non-Striker',
        bowlerId: inn.currentBowlerId,
        bowlerName: 'Bowler',
        isFreeHit: false,
        displayLabel: 'RH',
        timestamp: Date.now(),
      };
      inn.allBalls = [...inn.allBalls, retireBall];

      inn.fallOfWickets = [
        ...inn.fallOfWickets,
        {
          wicketNumber: inn.wickets,
          score: inn.totalRuns,
          overs: inn.oversFormatted,
          batsmanId,
          batsmanName: retiringPlayer?.name || 'Batsman',
        },
      ];

      if (nextBatsmanId) {
        if (isStriker) inn.strikerId = nextBatsmanId;
        else inn.nonStrikerId = nextBatsmanId;
      }

      return {
        ...state,
        match: {
          ...currentMatch,
          innings: innIndex === 0 ? [inn, currentMatch.innings[1]] : [currentMatch.innings[0], inn],
          needsBatsmanSelection: !nextBatsmanId,
          dismissedBatsmanRole: isStriker ? 'striker' : 'nonStriker',
          updatedAt: Date.now(),
        },
        historyStack,
        showNewBatsmanModal: !nextBatsmanId,
        replacingBatsmanRole: isStriker ? 'striker' : 'nonStriker',
      };
    }

    case 'SWAP_STRIKER': {
      if (!state.match || state.match.status !== 'live') return state;
      const currentMatch = state.match;
      const historyStack = [...state.historyStack, JSON.parse(JSON.stringify(currentMatch))];

      const innIndex = currentMatch.currentInningsIndex;
      const inn = { ...currentMatch.innings[innIndex] };

      if (!inn.nonStrikerId) return state; // Single batter mode

      const temp = inn.strikerId;
      inn.strikerId = inn.nonStrikerId;
      inn.nonStrikerId = temp;

      const updatedMatch: Match = {
        ...currentMatch,
        innings: innIndex === 0 ? [inn, currentMatch.innings[1]] : [currentMatch.innings[0], inn],
        updatedAt: Date.now(),
      };

      return {
        ...state,
        match: updatedMatch,
        historyStack,
      };
    }

    case 'END_INNINGS': {
      if (!state.match) return state;
      const currentMatch = state.match;
      const innIndex = currentMatch.currentInningsIndex;
      const inn = { ...currentMatch.innings[innIndex] };
      inn.isCompleted = true;

      if (innIndex === 0) {
        return {
          ...state,
          match: {
            ...currentMatch,
            innings: [inn, currentMatch.innings[1]],
            status: 'inningsBreak',
            updatedAt: Date.now(),
          },
        };
      } else {
        const completedMatch: Match = {
          ...currentMatch,
          innings: [currentMatch.innings[0], inn],
          status: 'completed',
          updatedAt: Date.now(),
          result: evaluateMatchResult({
            ...currentMatch,
            innings: [currentMatch.innings[0], inn],
          }),
        };
        const summary = createMatchSummary(completedMatch);
        return {
          ...state,
          match: completedMatch,
          savedMatches: [summary, ...state.savedMatches.filter((m) => m.id !== completedMatch.id)],
        };
      }
    }

    case 'START_SECOND_INNINGS': {
      if (!state.match) return state;
      const currentMatch = state.match;
      const { strikerId, nonStrikerId, bowlerId } = action.payload;

      const inn2 = { ...currentMatch.innings[1] };
      inn2.strikerId = strikerId;
      inn2.nonStrikerId = nonStrikerId;
      inn2.currentBowlerId = bowlerId;

      const updatedMatch: Match = {
        ...currentMatch,
        currentInningsIndex: 1,
        innings: [currentMatch.innings[0], inn2],
        status: 'live',
        isFreeHit: false,
        needsBowlerSelection: false,
        needsBatsmanSelection: false,
        updatedAt: Date.now(),
      };

      return {
        ...state,
        match: updatedMatch,
        historyStack: [],
        activeTab: 'scoring',
        selectedScorecardInnings: 2,
        showNewBowlerModal: false,
        showNewBatsmanModal: false,
      };
    }

    case 'EDIT_TEAM_NAMES': {
      if (!state.match) return state;
      return {
        ...state,
        match: {
          ...state.match,
          teamA: {
            ...state.match.teamA,
            name: action.payload.teamA.name,
            shortName: action.payload.teamA.shortName,
          },
          teamB: {
            ...state.match.teamB,
            name: action.payload.teamB.name,
            shortName: action.payload.teamB.shortName,
          },
          updatedAt: Date.now(),
        },
      };
    }

    case 'ADD_PLAYER_IN_MATCH': {
      if (!state.match) return state;
      const { teamId, name } = action.payload;
      const targetTeam = state.match[teamId];
      const newPlayer: Player = {
        id: generateId(),
        name: name.trim(),
      };
      return {
        ...state,
        match: {
          ...state.match,
          [teamId]: {
            ...targetTeam,
            players: [...targetTeam.players, newPlayer],
          },
          updatedAt: Date.now(),
        },
      };
    }

    case 'REMOVE_PLAYER_IN_MATCH': {
      if (!state.match) return state;
      const { teamId, playerId } = action.payload;
      const targetTeam = state.match[teamId];
      return {
        ...state,
        match: {
          ...state.match,
          [teamId]: {
            ...targetTeam,
            players: targetTeam.players.filter((p) => p.id !== playerId),
          },
          updatedAt: Date.now(),
        },
      };
    }

    case 'EDIT_PLAYER_NAME': {
      if (!state.match) return state;
      const { teamId, playerId, newName } = action.payload;

      const updateTeamPlayers = (team: Team): Team => {
        if (team.id !== teamId) return team;
        return {
          ...team,
          players: team.players.map((p) => (p.id === playerId ? { ...p, name: newName } : p)),
        };
      };

      return {
        ...state,
        match: {
          ...state.match,
          teamA: updateTeamPlayers(state.match.teamA),
          teamB: updateTeamPlayers(state.match.teamB),
          updatedAt: Date.now(),
        },
      };
    }

    case 'CHANGE_TOTAL_OVERS': {
      if (!state.match) return state;
      return {
        ...state,
        match: {
          ...state.match,
          rules: {
            ...state.match.rules,
            totalOvers: action.payload.newTotalOvers,
          },
          updatedAt: Date.now(),
        },
      };
    }

    case 'RESET': {
      return {
        ...state,
        match: null,
        historyStack: [],
        activeTab: 'scoring',
        selectedScorecardInnings: 1,
        showNewBowlerModal: false,
        showNewBatsmanModal: false,
      };
    }

    case 'LOAD_MATCH': {
      return {
        ...state,
        match: action.payload.match,
        historyStack: [],
        activeTab: action.payload.match.status === 'completed' ? 'scorecard' : 'scoring',
        selectedScorecardInnings: (action.payload.match.currentInningsIndex + 1) as 1 | 2,
      };
    }

    case 'SET_TAB': {
      return {
        ...state,
        activeTab: action.payload.tab,
      };
    }

    case 'SELECT_SCORECARD_INNINGS': {
      return {
        ...state,
        selectedScorecardInnings: action.payload.inningsNumber,
      };
    }

    case 'TOGGLE_DARK_MODE': {
      return {
        ...state,
        darkMode: !state.darkMode,
      };
    }

    case 'DELETE_SAVED_MATCH': {
      return {
        ...state,
        savedMatches: state.savedMatches.filter((m) => m.id !== action.payload.id),
      };
    }

    case 'CLOSE_BOWLER_MODAL': {
      return {
        ...state,
        showNewBowlerModal: false,
      };
    }

    case 'CLOSE_BATSMAN_MODAL': {
      return {
        ...state,
        showNewBatsmanModal: false,
      };
    }

    default:
      return state;
  }
}

interface MatchContextType extends ExtendedState {
  dispatch: React.Dispatch<ExtendedAction>;
}

const MatchContext = createContext<MatchContextType | undefined>(undefined);

export const MatchProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(
    matchReducer,
    undefined,
    (): ExtendedState => {
      let currentMatch: Match | null = null;
      let historyStack: Match[] = [];
      let savedMatches: MatchSummary[] = [];
      let darkMode = false; // clean crisp default light mode matching professional data-first look

      if (typeof window !== 'undefined') {
        try {
          const storedMatch = window.localStorage.getItem(CURRENT_MATCH_KEY);
          if (storedMatch) currentMatch = JSON.parse(storedMatch);

          const storedHistory = window.localStorage.getItem(HISTORY_STACK_KEY);
          if (storedHistory) historyStack = JSON.parse(storedHistory);

          const storedSaved = window.localStorage.getItem(SAVED_MATCHES_KEY);
          if (storedSaved) savedMatches = JSON.parse(storedSaved);

          const storedTheme = window.localStorage.getItem(DARK_MODE_KEY);
          if (storedTheme !== null) {
            darkMode = JSON.parse(storedTheme);
          } else {
            darkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
          }
        } catch (e) {
          console.warn('Failed to parse localStorage on boot:', e);
        }
      }

      return {
        match: currentMatch,
        historyStack,
        savedMatches,
        activeTab: currentMatch ? (currentMatch.status === 'completed' ? 'scorecard' : 'scoring') : 'scoring',
        selectedScorecardInnings: currentMatch ? ((currentMatch.currentInningsIndex + 1) as 1 | 2) : 1,
        darkMode,
        showNewBowlerModal: currentMatch?.needsBowlerSelection || false,
        showNewBatsmanModal: currentMatch?.needsBatsmanSelection || false,
        replacingBatsmanRole: currentMatch?.dismissedBatsmanRole || 'striker',
      };
    }
  );

  useEffect(() => {
    try {
      if (state.match) {
        window.localStorage.setItem(CURRENT_MATCH_KEY, JSON.stringify(state.match));
      } else {
        window.localStorage.removeItem(CURRENT_MATCH_KEY);
      }
    } catch (e) {
      console.warn('Failed saving currentMatch:', e);
    }
  }, [state.match]);

  useEffect(() => {
    try {
      window.localStorage.setItem(HISTORY_STACK_KEY, JSON.stringify(state.historyStack));
    } catch (e) {
      console.warn('Failed saving historyStack:', e);
    }
  }, [state.historyStack]);

  useEffect(() => {
    try {
      window.localStorage.setItem(SAVED_MATCHES_KEY, JSON.stringify(state.savedMatches));
    } catch (e) {
      console.warn('Failed saving savedMatches:', e);
    }
  }, [state.savedMatches]);

  useEffect(() => {
    try {
      window.localStorage.setItem(DARK_MODE_KEY, JSON.stringify(state.darkMode));
      if (state.darkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch (e) {
      console.warn('Failed syncing darkMode:', e);
    }
  }, [state.darkMode]);

  return (
    <MatchContext.Provider value={{ ...state, dispatch }}>
      {children}
    </MatchContext.Provider>
  );
};

export function useMatch(): MatchContextType {
  const context = useContext(MatchContext);
  if (!context) {
    throw new Error('useMatch must be used within a MatchProvider');
  }
  return context;
}
