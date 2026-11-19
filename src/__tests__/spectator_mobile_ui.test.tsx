import { describe, it, expect } from 'vitest';
import ReactDOMServer from 'react-dom/server';
import { SpectatorView } from '../pages/SpectatorView';
import { Match } from '../types/cricket';

describe('SpectatorView Mobile UI Tests', () => {
  const mockMatch: Match = {
    id: 'match_mobile_1',
    date: '2026-11-19',
    result: null,
    teamA: {
      id: 'teamA',
      name: 'Mumbai Strikers',
      shortName: 'MS',
      players: [
        { id: 'p1', name: 'Rohit Sharma' },
        { id: 'p2', name: 'Suryakumar Yadav' },
        { id: 'p3', name: 'Hardik Pandya' },
      ],
    },
    teamB: {
      id: 'teamB',
      name: 'Chennai Super Kings',
      shortName: 'CSK',
      players: [
        { id: 'b1', name: 'Jasprit Bumrah' },
        { id: 'b2', name: 'Ravindra Jadeja' },
      ],
    },
    rules: {
      totalOvers: 10,
      maxOversPerBowler: 2,
      wideRuns: 1,
      noBallRuns: 1,
      rebowlWide: true,
      rebowlNoBall: true,
      freeHitOnNoBall: true,
      lastManStands: false,
    },
    toss: {
      winner: 'teamA',
      decision: 'bat',
    },
    currentInningsIndex: 0,
    innings: [
      {
        inningsNumber: 1,
        battingTeamId: 'teamA',
        bowlingTeamId: 'teamB',
        totalRuns: 48,
        wickets: 1,
        legalBalls: 24, // 4.0 overs
        oversFormatted: '4.0',
        currentOverBalls: [
          {
            id: 'ball_1',
            overIndex: 3,
            ballInOver: 1,
            legalBallNumber: 1,
            isLegal: true,
            runsOffBat: 4,
            extraRuns: 0,
            totalRuns: 4,
            extraType: null,
            wicket: null,
            batsmanId: 'p1',
            batsmanName: 'Rohit Sharma',
            nonStrikerId: 'p2',
            nonStrikerName: 'Suryakumar Yadav',
            bowlerId: 'b1',
            bowlerName: 'Jasprit Bumrah',
            isFreeHit: false,
            displayLabel: '4',
            timestamp: Date.now(),
          },
          {
            id: 'ball_2',
            overIndex: 3,
            ballInOver: 2,
            legalBallNumber: 2,
            isLegal: true,
            runsOffBat: 6,
            extraRuns: 0,
            totalRuns: 6,
            extraType: null,
            wicket: null,
            batsmanId: 'p1',
            batsmanName: 'Rohit Sharma',
            nonStrikerId: 'p2',
            nonStrikerName: 'Suryakumar Yadav',
            bowlerId: 'b1',
            bowlerName: 'Jasprit Bumrah',
            isFreeHit: false,
            displayLabel: '6',
            timestamp: Date.now(),
          },
        ],
        allBalls: [
          {
            id: 'ball_0',
            overIndex: 0,
            ballInOver: 1,
            legalBallNumber: 1,
            isLegal: true,
            runsOffBat: 0,
            extraRuns: 0,
            totalRuns: 0,
            extraType: null,
            wicket: {
              type: 'bowled',
              batsmanId: 'p3',
              batsmanName: 'Hardik Pandya',
              bowlerId: 'b1',
              bowlerName: 'Jasprit Bumrah',
              runsCompleted: 0,
              outBatsmanIsStriker: true,
              description: 'b Bumrah',
            },
            batsmanId: 'p3',
            batsmanName: 'Hardik Pandya',
            nonStrikerId: 'p1',
            nonStrikerName: 'Rohit Sharma',
            bowlerId: 'b1',
            bowlerName: 'Jasprit Bumrah',
            isFreeHit: false,
            displayLabel: 'W',
            timestamp: Date.now(),
          },
        ],
        strikerId: 'p1',
        nonStrikerId: 'p2',
        currentBowlerId: 'b1',
        previousBowlerId: null,
        isCompleted: false,
        extras: { wides: 0, noBalls: 0, byes: 0, legByes: 0, total: 0 },
        fallOfWickets: [
          {
            wicketNumber: 1,
            score: 10,
            overs: '1.2',
            batsmanId: 'p3',
            batsmanName: 'Hardik Pandya',
          },
        ],
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
    status: 'live',
    isFreeHit: false,
    needsBowlerSelection: false,
    needsBatsmanSelection: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  it('renders mobile-first spectator view with all key sections', () => {
    const rawHtml = ReactDOMServer.renderToString(
      <SpectatorView matchId="match_mobile_1" initialMatch={mockMatch} />
    );
    const html = rawHtml.replace(/<!--[\s\S]*?-->/g, '');

    // Check Header & Logo
    expect(html).toContain('Balak Hanuman');
    expect(html).toContain('LIVE');

    // Check Dual-Team score bar
    expect(html).toContain('Mumbai Strikers');
    expect(html).toContain('Chennai Super Kings');

    // Check Hero Score Display
    expect(html).toContain('48');
    expect(html).toContain('/1');
    expect(html).toContain('4.0 ov');
    expect(html).toContain('CRR');

    // Check Over Timeline
    expect(html).toContain('This Over');

    // Check Batters card with strike badge
    expect(html).toContain('Rohit Sharma');
    expect(html).toContain('Strike');
    expect(html).toContain('Suryakumar Yadav');

    // Check Bowler card
    expect(html).toContain('Jasprit Bumrah');
    expect(html).toContain('Current Bowler');

    // Check Mobile Tabs
    expect(html).toContain('Feed');
    expect(html).toContain('Scorecard');
    expect(html).toContain('Match Info');

    // Check WhatsApp Share Bar
    expect(html).toContain('Share Live Match on WhatsApp');
  });

  it('renders target chase and progress bar in 2nd innings', () => {
    const chaseMatch: Match = {
      ...mockMatch,
      currentInningsIndex: 1,
      innings: [
        mockMatch.innings[0], // 48/1
        {
          ...mockMatch.innings[1],
          totalRuns: 25,
          wickets: 1,
          legalBalls: 18, // 3.0 overs
          oversFormatted: '3.0',
          strikerId: 'b1',
          nonStrikerId: 'b2',
          currentBowlerId: 'p1',
        },
      ],
    };

    const rawHtml = ReactDOMServer.renderToString(
      <SpectatorView matchId="match_mobile_1" initialMatch={chaseMatch} />
    );
    const html = rawHtml.replace(/<!--[\s\S]*?-->/g, '');

    // Target is 48 + 1 = 49
    expect(html).toContain('Target:');
    expect(html).toContain('49');
    expect(html).toContain('Need 24 from 42 balls');
  });
});
