import { describe, it, expect } from 'vitest';
import ReactDOMServer from 'react-dom/server';
import { MatchContext, ExtendedState } from '../context/MatchContext';
import { AppContent } from '../App';
import { Match, MatchRules, TossDetails, Team } from '../types/cricket';
import { matchReducer } from '../context/MatchContext';

describe('Render test after WICKET', () => {
  const createBaseMatch = (teamSize = 3): Match => {
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
    };

    const toss: TossDetails = {
      winner: 'teamA',
      decision: 'bat',
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

    const startedState = matchReducer(initialState, {
      type: 'START_MATCH',
      payload: {
        teamA,
        teamB,
        rules,
        toss,
        strikerId: 'p_1',
        nonStrikerId: 'p_2',
        bowlerId: 'b_1',
      },
    });

    return startedState.match!;
  };

  it('renders correctly in 2nd innings normal wicket', () => {
    const match = createBaseMatch(4);
    // End 1st innings and start 2nd innings
    const inn1End = matchReducer({
      match,
      historyStack: [],
      activeTab: 'scoring' as const,
      selectedScorecardInnings: 1 as const,
      showNewBowlerModal: false,
      showNewBatsmanModal: false,
      replacingBatsmanRole: 'striker',
      savedMatches: [],
      darkMode: false,
    }, { type: 'END_INNINGS' });

    const inn2Start = matchReducer(inn1End, {
      type: 'START_SECOND_INNINGS',
      payload: {
        strikerId: 'b_1',
        nonStrikerId: 'b_2',
        bowlerId: 'p_1',
      },
    });

    const wicketState = matchReducer(inn2Start, {
      type: 'ADD_WICKET',
      payload: {
        wicketType: 'caught',
        outBatsmanId: 'b_1',
        fielderId: 'p_2',
        runsCompleted: 0,
        nextBatsmanId: undefined,
        nextBatsmanName: undefined,
      },
    });

    const contextValue = {
      ...wicketState,
      dispatch: () => {},
    };

    const html = ReactDOMServer.renderToString(
      <MatchContext.Provider value={contextValue}>
        <AppContent />
      </MatchContext.Provider>
    );

    expect(html).toContain('New Batter');
  });

  it('renders correctly in 2nd innings when match completed by all out', () => {
    const match = createBaseMatch(2);
    // End 1st innings
    const inn1End = matchReducer({
      match,
      historyStack: [],
      activeTab: 'scoring' as const,
      selectedScorecardInnings: 1 as const,
      showNewBowlerModal: false,
      showNewBatsmanModal: false,
      replacingBatsmanRole: 'striker',
      savedMatches: [],
      darkMode: false,
    }, { type: 'END_INNINGS' });

    const inn2Start = matchReducer(inn1End, {
      type: 'START_SECOND_INNINGS',
      payload: {
        strikerId: 'b_1',
        nonStrikerId: 'b_2',
        bowlerId: 'p_1',
      },
    });

    const allOutState = matchReducer(inn2Start, {
      type: 'ADD_WICKET',
      payload: {
        wicketType: 'bowled',
        outBatsmanId: 'b_1',
        runsCompleted: 0,
      },
    });

    const contextValue = {
      ...allOutState,
      dispatch: () => {},
    };

    const html = ReactDOMServer.renderToString(
      <MatchContext.Provider value={contextValue}>
        <AppContent />
      </MatchContext.Provider>
    );

    expect(html).toContain('Final Result');
  });
});
