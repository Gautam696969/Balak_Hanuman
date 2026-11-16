import { describe, it, expect } from 'vitest';
import { matchReducer, ExtendedState } from '../context/MatchContext';
import { MatchRules, TossDetails, Team } from '../types/cricket';

describe('ADD_WICKET edge cases', () => {
  const createTestState = (rulesOverrides?: Partial<MatchRules>, teamSize: number = 2) => {
    const teamA: Team = {
      id: 'teamA',
      name: 'Team 1',
      shortName: 'T1',
      players: Array.from({ length: teamSize }, (_, i) => ({
        id: `p_${i + 1}`,
        name: `Player ${i + 1}`,
      })),
    };

    const teamB: Team = {
      id: 'teamB',
      name: 'Team 2',
      shortName: 'T2',
      players: Array.from({ length: teamSize }, (_, i) => ({
        id: `b_${i + 1}`,
        name: `Bowler ${i + 1}`,
      })),
    };

    const rules: MatchRules = {
      totalOvers: 5,
      maxOversPerBowler: 2,
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

    const startAction = {
      type: 'START_MATCH' as const,
      payload: {
        teamA,
        teamB,
        rules,
        toss,
        strikerId: 'p_1',
        nonStrikerId: 'p_2',
        bowlerId: 'b_1',
      },
    };

    const initialState: ExtendedState = {
      match: null,
      historyStack: [],
      activeTab: 'scoring' as const,
      selectedScorecardInnings: 1 as const,
      showNewBowlerModal: false,
      showNewBatsmanModal: false,
      replacingBatsmanRole: 'striker',
      savedMatches: [],
      darkMode: false,
    };

    return matchReducer(initialState, startAction);
  };

  it('handles standard wicket when next batter is not provided', () => {
    // 5 players team
    const state = createTestState({}, 5);
    const action = {
      type: 'ADD_WICKET' as const,
      payload: {
        wicketType: 'bowled' as const,
        outBatsmanId: 'p_1',
        fielderId: undefined,
        runsCompleted: 0,
        nextBatsmanId: undefined,
        nextBatsmanName: undefined,
      },
    };

    const nextState = matchReducer(state, action);
    expect(nextState.showNewBatsmanModal).toBe(true);
    expect(nextState.replacingBatsmanRole).toBe('striker');
    expect(nextState.match?.status).toBe('live');
  });

  it('handles wicket when team size is 2 (All Out on 1st wicket)', () => {
    // Default team size in Setup is 2!
    const state = createTestState({}, 2);
    const action = {
      type: 'ADD_WICKET' as const,
      payload: {
        wicketType: 'bowled' as const,
        outBatsmanId: 'p_1',
        fielderId: undefined,
        runsCompleted: 0,
        nextBatsmanId: undefined,
        nextBatsmanName: undefined,
      },
    };

    const nextState = matchReducer(state, action);
    expect(nextState.match?.status).toBe('inningsBreak');
  });
});
