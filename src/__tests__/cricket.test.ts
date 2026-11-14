import { describe, it, expect } from 'vitest';
import {
  legalBallsToOvers,
  oversToLegalBalls,
  calculateRunRate,
  calculateRequiredRunRate,
  calculateStrikeRate,
  calculateEconomy,
  formatDismissalText,
  formatBallBadge,
  getAvailableBowlers,
  getAvailableBatsmen,
  evaluateMatchResult,
  generateId,
} from '../utils/cricket';
import {
  Ball,
  DismissalInfo,
  Innings,
  Match,
  Team,
} from '../types/cricket';

describe('Cricket Utility Functions', () => {
  describe('UUID Generation', () => {
    it('generates unique non-empty string IDs', () => {
      const id1 = generateId();
      const id2 = generateId();
      expect(typeof id1).toBe('string');
      expect(id1.length).toBeGreaterThan(0);
      expect(id1).not.toBe(id2);
    });
  });

  describe('Overs & Ball Calculations', () => {
    it('converts legal balls to cricket overs format correctly', () => {
      expect(legalBallsToOvers(0)).toBe('0.0');
      expect(legalBallsToOvers(1)).toBe('0.1');
      expect(legalBallsToOvers(5)).toBe('0.5');
      expect(legalBallsToOvers(6)).toBe('1.0');
      expect(legalBallsToOvers(7)).toBe('1.1');
      expect(legalBallsToOvers(23)).toBe('3.5');
      expect(legalBallsToOvers(120)).toBe('20.0');
    });

    it('converts overs string back to legal balls correctly', () => {
      expect(oversToLegalBalls('0.0')).toBe(0);
      expect(oversToLegalBalls('0.5')).toBe(5);
      expect(oversToLegalBalls('1.0')).toBe(6);
      expect(oversToLegalBalls('3.5')).toBe(23);
      expect(oversToLegalBalls('20.0')).toBe(120);
    });
  });

  describe('Rate and Economy Calculations', () => {
    it('calculates current run rate correctly', () => {
      expect(calculateRunRate(0, 0)).toBe(0);
      expect(calculateRunRate(60, 30)).toBe(12.0); // 60 runs in 5 overs (30 balls)
      expect(calculateRunRate(45, 23)).toBe(11.74); // 45 runs in 3.5 overs
    });

    it('calculates required run rate correctly', () => {
      expect(calculateRequiredRunRate(36, 24)).toBe(9.0); // 36 runs in 4 overs
      expect(calculateRequiredRunRate(0, 10)).toBe(0);
      expect(calculateRequiredRunRate(10, 0)).toBe(99.99);
    });

    it('calculates strike rate accurately', () => {
      expect(calculateStrikeRate(50, 25)).toBe(200.0);
      expect(calculateStrikeRate(0, 0)).toBe(0);
      expect(calculateStrikeRate(45, 30)).toBe(150.0);
    });

    it('calculates bowler economy rate accurately', () => {
      expect(calculateEconomy(24, 18)).toBe(8.0); // 24 runs in 3 overs
      expect(calculateEconomy(0, 6)).toBe(0);
    });
  });

  describe('Dismissal Formatting', () => {
    it('formats various dismissal types with standard cricket nomenclature', () => {
      const bowled: DismissalInfo = {
        type: 'bowled',
        batsmanId: 'p1',
        batsmanName: 'Kohli',
        bowlerId: 'b1',
        bowlerName: 'Cummins',
        description: '',
      };
      expect(formatDismissalText(bowled)).toBe('b Cummins');

      const caught: DismissalInfo = {
        type: 'caught',
        batsmanId: 'p1',
        batsmanName: 'Kohli',
        bowlerId: 'b1',
        bowlerName: 'Starc',
        fielderId: 'f1',
        fielderName: 'Smith',
        description: '',
      };
      expect(formatDismissalText(caught)).toBe('c Smith b Starc');

      const caughtAndBowled: DismissalInfo = {
        type: 'caught',
        batsmanId: 'p1',
        batsmanName: 'Kohli',
        bowlerId: 'b1',
        bowlerName: 'Starc',
        fielderId: 'b1',
        fielderName: 'Starc',
        description: '',
      };
      expect(formatDismissalText(caughtAndBowled)).toBe('c & b Starc');

      const runOut: DismissalInfo = {
        type: 'runOut',
        batsmanId: 'p1',
        batsmanName: 'Rohit',
        bowlerId: 'b1',
        bowlerName: 'Starc',
        fielderName: 'Maxwell',
        description: '',
      };
      expect(formatDismissalText(runOut)).toBe('run out (Maxwell)');

      const lbw: DismissalInfo = {
        type: 'lbw',
        batsmanId: 'p1',
        batsmanName: 'Gill',
        bowlerId: 'b1',
        bowlerName: 'Hazlewood',
        description: '',
      };
      expect(formatDismissalText(lbw)).toBe('lbw b Hazlewood');

      const retiredHurt: DismissalInfo = {
        type: 'retiredHurt',
        batsmanId: 'p1',
        batsmanName: 'Raina',
        bowlerId: 'b1',
        bowlerName: 'N/A',
        description: '',
      };
      expect(formatDismissalText(retiredHurt)).toBe('retired hurt');
    });
  });

  describe('Ball Badge Labels in Timeline', () => {
    const dummyBall = (overrides: Partial<Ball>): Ball => ({
      id: 'b_1',
      overIndex: 0,
      ballInOver: 1,
      legalBallNumber: 1,
      isLegal: true,
      runsOffBat: 0,
      extraRuns: 0,
      totalRuns: 0,
      extraType: null,
      wicket: null,
      batsmanId: 'p1',
      batsmanName: 'P1',
      nonStrikerId: 'p2',
      nonStrikerName: 'P2',
      bowlerId: 'b1',
      bowlerName: 'B1',
      isFreeHit: false,
      displayLabel: '0',
      timestamp: Date.now(),
      ...overrides,
    });

    it('formats dot balls and standard runs', () => {
      expect(formatBallBadge(dummyBall({ runsOffBat: 0, totalRuns: 0 }))).toBe('0');
      expect(formatBallBadge(dummyBall({ runsOffBat: 1, totalRuns: 1 }))).toBe('1');
      expect(formatBallBadge(dummyBall({ runsOffBat: 4, totalRuns: 4 }))).toBe('4');
      expect(formatBallBadge(dummyBall({ runsOffBat: 6, totalRuns: 6 }))).toBe('6');
    });

    it('formats extras (Wd, Nb, B, Lb)', () => {
      expect(formatBallBadge(dummyBall({ extraType: 'wd', extraRuns: 1, isLegal: false }))).toBe('Wd');
      expect(formatBallBadge(dummyBall({ extraType: 'wd', extraRuns: 2, isLegal: false }))).toBe('2Wd');
      expect(formatBallBadge(dummyBall({ extraType: 'nb', extraRuns: 1, runsOffBat: 4, isLegal: false }))).toBe('Nb+4');
      expect(formatBallBadge(dummyBall({ extraType: 'b', extraRuns: 2, isLegal: true }))).toBe('2B');
      expect(formatBallBadge(dummyBall({ extraType: 'lb', extraRuns: 1, isLegal: true }))).toBe('1Lb');
    });

    it('formats wickets', () => {
      const wicketDismissal: DismissalInfo = {
        type: 'bowled',
        batsmanId: 'p1',
        batsmanName: 'P1',
        bowlerId: 'b1',
        bowlerName: 'B1',
        description: 'b B1',
      };
      expect(formatBallBadge(dummyBall({ wicket: wicketDismissal }))).toBe('W');
    });
  });

  describe('Bowler Eligibility & Consecutive Overs Rules', () => {
    const mockTeam: Team = {
      id: 'teamB',
      name: 'Australia',
      shortName: 'AUS',
      players: [
        { id: 'b1', name: 'Starc' },
        { id: 'b2', name: 'Cummins' },
        { id: 'b3', name: 'Hazlewood' },
      ],
    };

    it('prevents the same bowler from bowling consecutive overs when other bowlers are available', () => {
      const available = getAvailableBowlers(mockTeam, 'b1');
      expect(available.some((p) => p.id === 'b1')).toBe(false);
      expect(available.some((p) => p.id === 'b2')).toBe(true);
      expect(available.some((p) => p.id === 'b3')).toBe(true);
    });

    it('restricts bowlers who have reached max overs quota', () => {
      const mockInnings: Partial<Innings> = {
        allBalls: [
          ...Array(12).fill(null).map((_, i) => ({
            id: `ball_${i}`,
            bowlerId: 'b2',
            isLegal: true,
          } as Ball)),
        ],
      };

      const available = getAvailableBowlers(
        mockTeam,
        'b1',
        2, // max 2 overs per bowler
        mockInnings as Innings
      );

      expect(available.map((p) => p.id)).toEqual(['b3']);
    });
  });

  describe('Batsman Availability Rules', () => {
    const mockBattingTeam: Team = {
      id: 'teamA',
      name: 'India',
      shortName: 'IND',
      players: [
        { id: 'p1', name: 'Rohit' },
        { id: 'p2', name: 'Gill' },
        { id: 'p3', name: 'Kohli' },
        { id: 'p4', name: 'Iyer' },
        { id: 'p5', name: 'Rahul' },
      ],
    };

    it('prevents selecting already-out or currently-batting players', () => {
      const mockInnings: Partial<Innings> = {
        strikerId: 'p2',
        nonStrikerId: 'p3',
        fallOfWickets: [
          {
            wicketNumber: 1,
            score: 15,
            overs: '2.1',
            batsmanId: 'p1',
            batsmanName: 'Rohit',
          },
        ],
      };

      const available = getAvailableBatsmen(mockBattingTeam, mockInnings as Innings);
      expect(available.map((p) => p.id)).toEqual(['p4', 'p5']);
    });
  });

  describe('Match Result Evaluation', () => {
    const baseMatch: Match = {
      id: 'm1',
      date: 'Nov 14, 2026',
      teamA: {
        id: 'teamA',
        name: 'India',
        shortName: 'IND',
        players: Array.from({ length: 11 }, (_, i) => ({ id: `p_${i + 1}`, name: `Player ${i + 1}` })),
      },
      teamB: {
        id: 'teamB',
        name: 'Australia',
        shortName: 'AUS',
        players: Array.from({ length: 11 }, (_, i) => ({ id: `b_${i + 1}`, name: `Bowler ${i + 1}` })),
      },
      rules: {
        totalOvers: 5,
        maxOversPerBowler: 2,
        wideRuns: 1,
        noBallRuns: 1,
        rebowlWide: true,
        rebowlNoBall: true,
        freeHitOnNoBall: true,
        lastManStands: false,
      },
      toss: { winner: 'teamA', decision: 'bat' },
      currentInningsIndex: 1,
      innings: [
        {
          inningsNumber: 1,
          battingTeamId: 'teamA',
          bowlingTeamId: 'teamB',
          totalRuns: 50,
          wickets: 4,
          legalBalls: 30,
          oversFormatted: '5.0',
          currentOverBalls: [],
          allBalls: [],
          strikerId: 'p_1',
          nonStrikerId: 'p_2',
          currentBowlerId: 'b_1',
          previousBowlerId: null,
          isCompleted: true,
          extras: { wides: 0, noBalls: 0, byes: 0, legByes: 0, total: 0 },
          fallOfWickets: [],
        },
        {
          inningsNumber: 2,
          battingTeamId: 'teamB',
          bowlingTeamId: 'teamA',
          totalRuns: 52,
          wickets: 3,
          legalBalls: 24,
          oversFormatted: '4.0',
          currentOverBalls: [],
          allBalls: [],
          strikerId: 'b_1',
          nonStrikerId: 'b_2',
          currentBowlerId: 'p_1',
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

    it('detects when chasing team reaches target mid-over (won by wickets)', () => {
      const result = evaluateMatchResult(baseMatch);
      expect(result).not.toBeNull();
      expect(result?.winnerTeamId).toBe('teamB');
      expect(result?.marginText).toBe('Australia won by 7 wickets');
    });

    it('detects when defending team wins by runs when chasing team completes overs without reaching target', () => {
      const defendedMatch: Match = {
        ...baseMatch,
        innings: [
          baseMatch.innings[0],
          {
            ...baseMatch.innings[1],
            totalRuns: 42,
            wickets: 6,
            legalBalls: 30,
            isCompleted: true,
          },
        ],
      };

      const result = evaluateMatchResult(defendedMatch);
      expect(result).not.toBeNull();
      expect(result?.winnerTeamId).toBe('teamA');
      expect(result?.marginText).toBe('India won by 8 runs');
    });

    it('detects a match tie when 2nd innings score equals 1st innings score', () => {
      const tiedMatch: Match = {
        ...baseMatch,
        innings: [
          baseMatch.innings[0],
          {
            ...baseMatch.innings[1],
            totalRuns: 50,
            wickets: 8,
            legalBalls: 30,
            isCompleted: true,
          },
        ],
      };

      const result = evaluateMatchResult(tiedMatch);
      expect(result).not.toBeNull();
      expect(result?.isTie).toBe(true);
      expect(result?.marginText).toBe('Match Tied!');
    });
  });
});
