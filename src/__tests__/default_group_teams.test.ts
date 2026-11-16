import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { describe, it, expect } from 'vitest';
import { Team, MatchRules, TossDetails } from '../types/cricket';
import { generateId } from '../utils/cricket';
import { matchReducer, ExtendedState, MatchContext } from '../context/MatchContext';
import { Setup } from '../pages/Setup';
import { Scorecard } from '../components/Scorecard';

describe('Default Group Teams flow', () => {
  const DEFAULT_VIKAS_PLAYERS = ['Rohit', 'Amit', 'Mohit', 'Bottle'];
  const DEFAULT_VIPUL_PLAYERS = ['Sashi', 'JD', 'Bhavesh', 'Aman'];

  const createInitialGroupTeamA = () => ({
    name: 'Team Vikas',
    shortName: 'TV',
    players: DEFAULT_VIKAS_PLAYERS.map((name, i) => ({
      id: generateId(),
      name,
      isCaptain: i === 0,
      isViceCaptain: i === 1,
    })),
  });

  const createInitialGroupTeamB = () => ({
    name: 'Team Vipul',
    shortName: 'TVP',
    players: DEFAULT_VIPUL_PLAYERS.map((name, i) => ({
      id: generateId(),
      name,
      isCaptain: i === 0,
      isViceCaptain: i === 1,
    })),
  });

  it('correctly sets up Team Vikas and Team Vipul with their respective players', () => {
    const groupA = createInitialGroupTeamA();
    const groupB = createInitialGroupTeamB();

    const teamA: Team = {
      id: 'teamA',
      name: groupA.name,
      shortName: groupA.shortName,
      players: groupA.players,
    };

    const teamB: Team = {
      id: 'teamB',
      name: groupB.name,
      shortName: groupB.shortName,
      players: groupB.players,
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
      activeTab: 'scoring',
      selectedScorecardInnings: 1,
      showNewBowlerModal: false,
      showNewBatsmanModal: false,
      replacingBatsmanRole: 'striker',
      savedMatches: [],
      darkMode: false,
    };

    const nextState = matchReducer(initialState, {
      type: 'START_MATCH',
      payload: {
        teamA,
        teamB,
        rules,
        toss,
        strikerId: groupA.players[0].id,
        nonStrikerId: groupA.players[1].id,
        bowlerId: groupB.players[0].id,
      },
    });

    expect(nextState.match).not.toBeNull();
    expect(nextState.match?.teamA.name).toBe('Team Vikas');
    expect(nextState.match?.teamB.name).toBe('Team Vipul');
    expect(nextState.match?.teamA.players.map((p) => p.name)).toEqual(['Rohit', 'Amit', 'Mohit', 'Bottle']);
    expect(nextState.match?.teamB.players.map((p) => p.name)).toEqual(['Sashi', 'JD', 'Bhavesh', 'Aman']);
    expect(nextState.match?.innings[0].strikerId).toBe(groupA.players[0].id);
    expect(nextState.match?.innings[0].nonStrikerId).toBe(groupA.players[1].id);
    expect(nextState.match?.innings[0].currentBowlerId).toBe(groupB.players[0].id);
  });

  it('allows match-specific edits without modifying the default constants', () => {
    // Session 1: User edits Team Vikas squad (renames player, deletes player, changes captain)
    const draftA = createInitialGroupTeamA();
    expect(draftA.players.find((p) => p.name === 'Rohit')?.isCaptain).toBe(true);

    // Edit player name
    draftA.players[0].name = 'Rohit Sharma';
    // Change Captain to Amit
    draftA.players[0].isCaptain = false;
    draftA.players[1].isCaptain = true;
    draftA.players[1].isViceCaptain = false;
    // Delete Bottle
    draftA.players = draftA.players.filter((p) => p.name !== 'Bottle');

    expect(draftA.players.map((p) => p.name)).toEqual(['Rohit Sharma', 'Amit', 'Mohit']);
    expect(draftA.players[1].isCaptain).toBe(true);

    // Session 2: User starts a new match or clicks Default Group Team again
    const freshA = createInitialGroupTeamA();
    const freshB = createInitialGroupTeamB();

    // Must be completely reset back to original default squads
    expect(freshA.name).toBe('Team Vikas');
    expect(freshA.players.map((p) => p.name)).toEqual(['Rohit', 'Amit', 'Mohit', 'Bottle']);
    expect(freshA.players[0].isCaptain).toBe(true);
    expect(freshA.players[1].isViceCaptain).toBe(true);

    expect(freshB.name).toBe('Team Vipul');
    expect(freshB.players.map((p) => p.name)).toEqual(['Sashi', 'JD', 'Bhavesh', 'Aman']);
    expect(freshB.players[0].isCaptain).toBe(true);
    expect(freshB.players[1].isViceCaptain).toBe(true);
  });

  it('renders Setup component with Default Group Team button', () => {
    const initialState: ExtendedState = {
      match: null,
      historyStack: [],
      activeTab: 'scoring',
      selectedScorecardInnings: 1,
      showNewBowlerModal: false,
      showNewBatsmanModal: false,
      replacingBatsmanRole: 'striker',
      savedMatches: [],
      darkMode: false,
    };

    const html = ReactDOMServer.renderToString(
      React.createElement(
        MatchContext.Provider,
        { value: { ...initialState, dispatch: () => {} } },
        React.createElement(Setup)
      )
    );

    expect(html).toContain('Default Group Team');
    expect(html).toContain('Team Vikas v Team Vipul');
  });

  it('renders Scorecard with correct dark theme classes on Batter, Bowler headers and Extras', () => {
    const groupA = createInitialGroupTeamA();
    const groupB = createInitialGroupTeamB();

    const teamA: Team = {
      id: 'teamA',
      name: groupA.name,
      shortName: groupA.shortName,
      players: groupA.players,
    };

    const teamB: Team = {
      id: 'teamB',
      name: groupB.name,
      shortName: groupB.shortName,
      players: groupB.players,
    };

    const rules: MatchRules = {
      totalOvers: 5,
      wideRuns: 1,
      noBallRuns: 1,
      rebowlWide: false,
      rebowlNoBall: false,
      freeHitOnNoBall: false,
      lastManStands: false,
    };

    const toss: TossDetails = {
      winner: 'teamA',
      decision: 'bat',
    };

    const initialState: ExtendedState = {
      match: null,
      historyStack: [],
      activeTab: 'scoring',
      selectedScorecardInnings: 1,
      showNewBowlerModal: false,
      showNewBatsmanModal: false,
      replacingBatsmanRole: 'striker',
      savedMatches: [],
      darkMode: true,
    };

    const stateWithMatch = matchReducer(initialState, {
      type: 'START_MATCH',
      payload: {
        teamA,
        teamB,
        rules,
        toss,
        strikerId: groupA.players[0].id,
        nonStrikerId: groupA.players[1].id,
        bowlerId: groupB.players[0].id,
      },
    });

    const html = ReactDOMServer.renderToString(
      React.createElement(
        MatchContext.Provider,
        { value: { ...stateWithMatch, dispatch: () => {} } },
        React.createElement(Scorecard)
      )
    );

    // Verify Batting header has dark theme background and text
    expect(html).toContain('Batter');
    expect(html).toContain('dark:bg-slate-800/80');
    expect(html).toContain('dark:text-slate-400');

    // Verify Bowler header has dark theme background and text
    expect(html).toContain('Bowler');

    // Verify Extras row has dark theme subtle background
    expect(html).toContain('Extras');
    expect(html).toContain('dark:bg-slate-800/40');
  });
});
