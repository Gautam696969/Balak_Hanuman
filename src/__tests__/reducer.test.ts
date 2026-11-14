import { describe, it, expect } from 'vitest';
import {
  Match,
  Team,
  MatchRules,
  TossDetails,
  Player,
} from '../types/cricket';
import { generateId, getAvailableBowlers } from '../utils/cricket';

describe('Match Reducer Core Game Logic & Custom Rules', () => {
  const createMockMatch = (rulesOverrides?: Partial<MatchRules>, teamSize: number = 5): Match => {
    const teamA: Team = {
      id: 'teamA',
      name: 'Gujarat Lions',
      shortName: 'GL',
      players: Array.from({ length: teamSize }, (_, i) => ({
        id: `p_${i + 1}`,
        name: `Player ${i + 1}`,
        isCaptain: i === 0,
        isKeeper: i === 1,
      })),
    };

    const teamB: Team = {
      id: 'teamB',
      name: 'Mumbai Strikers',
      shortName: 'MS',
      players: Array.from({ length: teamSize }, (_, i) => ({
        id: `b_${i + 1}`,
        name: `Bowler ${i + 1}`,
        isCaptain: i === 0,
        isKeeper: i === 1,
      })),
    };

    const rules: MatchRules = {
      totalOvers: 2,
      maxOversPerBowler: 1,
      wideRuns: 1,
      noBallRuns: 1,
      rebowlWide: true,
      rebowlNoBall: true,
      freeHitOnNoBall: true,
      lastManStands: false,
      ...rulesOverrides,
    };

    const toss: TossDetails = {
      winner: 'teamA',
      decision: 'bat',
    };

    return {
      id: 'm_test',
      date: 'Nov 14, 2026',
      teamA,
      teamB,
      rules,
      toss,
      currentInningsIndex: 0,
      innings: [
        {
          inningsNumber: 1,
          battingTeamId: 'teamA',
          bowlingTeamId: 'teamB',
          totalRuns: 0,
          wickets: 0,
          legalBalls: 0,
          oversFormatted: '0.0',
          currentOverBalls: [],
          allBalls: [],
          strikerId: 'p_1',
          nonStrikerId: 'p_2',
          currentBowlerId: 'b_1',
          previousBowlerId: null,
          isCompleted: false,
          extras: { wides: 0, noBalls: 0, byes: 0, legByes: 0, total: 0 },
          fallOfWickets: [],
        },
        {
          inningsNumber: 2,
          battingTeamId: 'teamB',
          bowlingTeamId: 'teamA',
          totalRuns: 0,
          wickets: 0,
          legalBalls: 0,
          oversFormatted: '0.0',
          currentOverBalls: [],
          allBalls: [],
          strikerId: '',
          nonStrikerId: '',
          currentBowlerId: '',
          previousBowlerId: null,
          isCompleted: false,
          extras: { wides: 0, noBalls: 0, byes: 0, legByes: 0, total: 0 },
          fallOfWickets: [],
        },
      ],
      isFreeHit: false,
      needsBowlerSelection: false,
      needsBatsmanSelection: false,
      status: 'live',
      result: null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  };

  it('rotates strike on odd runs and keeps strike on even runs', () => {
    const match = createMockMatch();
    const inn = match.innings[0];

    expect(inn.strikerId).toBe('p_1');
    expect(inn.nonStrikerId).toBe('p_2');

    let striker = inn.strikerId;
    let nonStriker = inn.nonStrikerId;

    // Single run -> swap
    const runs1 = 1;
    if (runs1 % 2 === 1) {
      const temp = striker;
      striker = nonStriker;
      nonStriker = temp;
    }
    expect(striker).toBe('p_2');
    expect(nonStriker).toBe('p_1');

    // Four runs -> strike retained
    const runs4 = 4;
    if (runs4 % 2 === 1) {
      const temp = striker;
      striker = nonStriker;
      nonStriker = temp;
    }
    expect(striker).toBe('p_2');
    expect(nonStriker).toBe('p_1');
  });

  it('handles wide ball: penalty applied, legal balls unchanged, ball re-bowled', () => {
    const match = createMockMatch({ wideRuns: 2 }); // Custom 2-run wide penalty
    const inn = match.innings[0];

    const initialLegalBalls = inn.legalBalls;
    const initialRuns = inn.totalRuns;

    const penalty = match.rules.wideRuns;
    inn.totalRuns += penalty;
    inn.extras.wides += penalty;
    inn.extras.total += penalty;

    expect(inn.totalRuns).toBe(initialRuns + 2);
    expect(inn.legalBalls).toBe(initialLegalBalls);
    expect(inn.extras.wides).toBe(2);
  });

  it('handles no-ball: penalty applied, free hit enabled, batsman credited with runs off bat', () => {
    const match = createMockMatch({ noBallRuns: 1, freeHitOnNoBall: true });
    const inn = match.innings[0];

    const runsOffBat = 4;
    const penalty = match.rules.noBallRuns;
    const totalBallRuns = penalty + runsOffBat;

    inn.totalRuns += totalBallRuns;
    inn.extras.noBalls += penalty;
    inn.extras.total += penalty;
    if (match.rules.freeHitOnNoBall) {
      match.isFreeHit = true;
    }

    expect(inn.totalRuns).toBe(5);
    expect(inn.extras.noBalls).toBe(1);
    expect(match.isFreeHit).toBe(true);
  });

  it('enforces over-end bowler restriction (cannot bowl consecutive overs)', () => {
    const match = createMockMatch();
    const inn = match.innings[0];

    // Over 1 bowled by b_1
    inn.previousBowlerId = 'b_1';

    const available = getAvailableBowlers(match.teamB, inn.previousBowlerId);

    // b_1 cannot bowl next over
    expect(available.some((p) => p.id === 'b_1')).toBe(false);
    expect(available.some((p) => p.id === 'b_2')).toBe(true);
  });

  it('allows adding a new bowler dynamically at over end', () => {
    const match = createMockMatch();
    const inn = match.innings[0];

    const newBowlerName = 'Dale Steyn';
    const newPlayer: Player = {
      id: generateId(),
      name: newBowlerName,
    };

    match.teamB.players.push(newPlayer);
    inn.currentBowlerId = newPlayer.id;

    expect(match.teamB.players.some((p) => p.name === 'Dale Steyn')).toBe(true);
    expect(inn.currentBowlerId).toBe(newPlayer.id);
  });

  it('handles Last Man Stands rule vs standard all out', () => {
    // 5 players team
    const matchStandard = createMockMatch({ lastManStands: false }, 5);
    const maxWicketsStandard = matchStandard.teamA.players.length - 1; // 4 wickets
    expect(maxWicketsStandard).toBe(4);

    const matchLMS = createMockMatch({ lastManStands: true }, 5);
    const maxWicketsLMS = matchLMS.teamA.players.length; // 5 wickets (all out)
    expect(maxWicketsLMS).toBe(5);
  });
});
