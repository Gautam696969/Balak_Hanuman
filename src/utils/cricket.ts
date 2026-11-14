import {
  Ball,
  BatsmanStats,
  BowlerStats,
  DismissalInfo,
  Innings,
  Match,
  MatchResult,
  Player,
  Team,
} from '../types/cricket';

/**
 * Robust UUID generator with fallback
 */
export function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Converts cumulative legal balls to standard cricket over notation (e.g., 23 balls -> "3.5")
 */
export function legalBallsToOvers(legalBalls: number): string {
  if (legalBalls <= 0) return '0.0';
  const completedOvers = Math.floor(legalBalls / 6);
  const remainderBalls = legalBalls % 6;
  return `${completedOvers}.${remainderBalls}`;
}

/**
 * Converts overs string "3.5" or similar to total legal balls (e.g. "3.5" -> 23)
 */
export function oversToLegalBalls(oversStr: string): number {
  const [overs, balls] = oversStr.split('.').map((n) => parseInt(n || '0', 10));
  return (overs || 0) * 6 + (balls || 0);
}

/**
 * Calculates current run rate (runs per over)
 */
export function calculateRunRate(runs: number, legalBalls: number): number {
  if (legalBalls <= 0) return 0;
  const rate = (runs / legalBalls) * 6;
  return Math.round(rate * 100) / 100;
}

/**
 * Calculates required run rate for target chase
 */
export function calculateRequiredRunRate(runsNeeded: number, ballsRemaining: number): number | null {
  if (runsNeeded <= 0) return 0;
  if (ballsRemaining <= 0) return runsNeeded > 0 ? 99.99 : 0;
  const rate = (runsNeeded / ballsRemaining) * 6;
  return Math.round(rate * 100) / 100;
}

/**
 * Calculates batsman strike rate (runs per 100 balls)
 */
export function calculateStrikeRate(runs: number, ballsFaced: number): number {
  if (ballsFaced <= 0) return 0;
  const rate = (runs / ballsFaced) * 100;
  return Math.round(rate * 10) / 10;
}

/**
 * Calculates bowler economy rate (runs conceded per over)
 */
export function calculateEconomy(runsConceded: number, legalBalls: number): number {
  if (legalBalls <= 0) return 0;
  const rate = (runsConceded / legalBalls) * 6;
  return Math.round(rate * 100) / 100;
}

/**
 * Generates display text for dismissal (e.g. "c Rohit b Bumrah", "b Shami", "run out (Kohli)")
 */
export function formatDismissalText(dismissal?: DismissalInfo): string {
  if (!dismissal) return 'not out';

  const { type, bowlerName, fielderName } = dismissal;

  switch (type) {
    case 'bowled':
      return `b ${bowlerName}`;
    case 'caught':
      if (fielderName && fielderName.toLowerCase() === bowlerName.toLowerCase()) {
        return `c & b ${bowlerName}`;
      }
      return `c ${fielderName || 'sub'} b ${bowlerName}`;
    case 'lbw':
      return `lbw b ${bowlerName}`;
    case 'runOut':
      return fielderName ? `run out (${fielderName})` : 'run out';
    case 'stumped':
      return `st ${fielderName || 'wk'} b ${bowlerName}`;
    case 'hitWicket':
      return `hit wicket b ${bowlerName}`;
    case 'retiredHurt':
      return 'retired hurt';
    default:
      return 'out';
  }
}

/**
 * Generates badge label for a ball in the over timeline
 */
export function formatBallBadge(ball: Ball): string {
  if (ball.wicket) {
    if (ball.wicket.type === 'retiredHurt') return 'RH';
    if (ball.extraType === 'wd') return 'W+Wd';
    if (ball.extraType === 'nb') return 'W+Nb';
    if (ball.runsOffBat > 0) return `W+${ball.runsOffBat}`;
    return 'W';
  }

  if (ball.extraType === 'wd') {
    return ball.extraRuns > 1 ? `${ball.extraRuns}Wd` : 'Wd';
  }

  if (ball.extraType === 'nb') {
    if (ball.runsOffBat > 0) {
      return `Nb+${ball.runsOffBat}`;
    }
    return ball.extraRuns > 1 ? `${ball.extraRuns}Nb` : 'Nb';
  }

  if (ball.extraType === 'b') {
    return `${ball.extraRuns}B`;
  }

  if (ball.extraType === 'lb') {
    return `${ball.extraRuns}Lb`;
  }

  return `${ball.runsOffBat}`;
}

/**
 * Computes individual batsman statistics for an innings
 */
export function getBatsmanStats(innings: Innings, battingTeam: Team): BatsmanStats[] {
  const statsMap = new Map<string, BatsmanStats>();

  const battedPlayerIds = new Set<string>();
  if (innings.strikerId) battedPlayerIds.add(innings.strikerId);
  if (innings.nonStrikerId) battedPlayerIds.add(innings.nonStrikerId);

  for (const b of innings.allBalls) {
    battedPlayerIds.add(b.batsmanId);
    battedPlayerIds.add(b.nonStrikerId);
    if (b.wicket) {
      battedPlayerIds.add(b.wicket.batsmanId);
    }
  }

  for (const player of battingTeam.players) {
    if (battedPlayerIds.has(player.id)) {
      statsMap.set(player.id, {
        playerId: player.id,
        name: player.name,
        runs: 0,
        balls: 0,
        fours: 0,
        sixes: 0,
        strikeRate: 0,
        isNotOut: true,
      });
    }
  }

  for (const ball of innings.allBalls) {
    const stats = statsMap.get(ball.batsmanId);
    if (stats) {
      if (ball.extraType !== 'wd') {
        stats.balls += 1;
      }
      if (ball.runsOffBat > 0) {
        stats.runs += ball.runsOffBat;
        if (ball.runsOffBat === 4) stats.fours += 1;
        if (ball.runsOffBat === 6) stats.sixes += 1;
      }
    }

    if (ball.wicket) {
      const outStats = statsMap.get(ball.wicket.batsmanId);
      if (outStats) {
        outStats.isNotOut = false;
        outStats.dismissal = ball.wicket;
      }
    }
  }

  const result: BatsmanStats[] = [];
  statsMap.forEach((stats) => {
    stats.strikeRate = calculateStrikeRate(stats.runs, stats.balls);
    result.push(stats);
  });

  return result;
}

/**
 * Computes individual bowler statistics for an innings
 */
export function getBowlerStats(innings: Innings, bowlingTeam: Team): BowlerStats[] {
  const statsMap = new Map<string, BowlerStats>();

  const bowledPlayerIds = new Set<string>();
  if (innings.currentBowlerId) bowledPlayerIds.add(innings.currentBowlerId);

  for (const b of innings.allBalls) {
    bowledPlayerIds.add(b.bowlerId);
  }

  for (const player of bowlingTeam.players) {
    if (bowledPlayerIds.has(player.id)) {
      statsMap.set(player.id, {
        playerId: player.id,
        name: player.name,
        legalBalls: 0,
        oversFormatted: '0.0',
        maidens: 0,
        runsConceded: 0,
        wickets: 0,
        economy: 0,
        wides: 0,
        noBalls: 0,
      });
    }
  }

  const overRunsMap = new Map<string, { runs: number; legalBalls: number }>();

  for (const ball of innings.allBalls) {
    const stats = statsMap.get(ball.bowlerId);
    if (!stats) continue;

    if (ball.isLegal) {
      stats.legalBalls += 1;
    }

    let runsChargedToBowler = ball.runsOffBat;
    if (ball.extraType === 'wd') {
      stats.wides += 1;
      runsChargedToBowler += ball.extraRuns;
    } else if (ball.extraType === 'nb') {
      stats.noBalls += 1;
      runsChargedToBowler += 1;
    }

    stats.runsConceded += runsChargedToBowler;

    const overKey = `${ball.bowlerId}-${ball.overIndex}`;
    const overData = overRunsMap.get(overKey) || { runs: 0, legalBalls: 0 };
    overData.runs += runsChargedToBowler;
    if (ball.isLegal) overData.legalBalls += 1;
    overRunsMap.set(overKey, overData);

    if (ball.wicket && ball.wicket.type !== 'runOut' && ball.wicket.type !== 'retiredHurt') {
      stats.wickets += 1;
    }
  }

  overRunsMap.forEach((data, overKey) => {
    if (data.legalBalls === 6 && data.runs === 0) {
      const bowlerId = overKey.split('-')[0];
      const stats = statsMap.get(bowlerId);
      if (stats) stats.maidens += 1;
    }
  });

  const result: BowlerStats[] = [];
  statsMap.forEach((stats) => {
    stats.oversFormatted = legalBallsToOvers(stats.legalBalls);
    stats.economy = calculateEconomy(stats.runsConceded, stats.legalBalls);
    result.push(stats);
  });

  return result;
}

/**
 * Returns available batsmen from the batting team who are NOT out and NOT currently at the crease
 */
export function getAvailableBatsmen(battingTeam: Team, innings: Innings): Player[] {
  const dismissedIds = new Set(innings.fallOfWickets.map((f) => f.batsmanId));
  const activeIds = new Set([innings.strikerId, innings.nonStrikerId].filter(Boolean));

  return battingTeam.players.filter(
    (player) => !dismissedIds.has(player.id) && !activeIds.has(player.id)
  );
}

/**
 * Returns available bowlers from bowling team:
 * Bowler cannot bowl consecutive overs (unless only 1 player available)
 */
export function getAvailableBowlers(
  bowlingTeam: Team,
  previousBowlerId: string | null,
  maxOversPerBowler?: number,
  innings?: Innings
): Player[] {
  return bowlingTeam.players.filter((p) => {
    if (bowlingTeam.players.length > 1 && previousBowlerId && p.id === previousBowlerId) {
      return false;
    }

    if (maxOversPerBowler && innings) {
      const bowlerBalls = innings.allBalls.filter(
        (b) => b.bowlerId === p.id && b.isLegal
      ).length;
      const completedOvers = Math.floor(bowlerBalls / 6);
      if (completedOvers >= maxOversPerBowler) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Evaluates match result
 */
export function evaluateMatchResult(match: Match): MatchResult | null {
  const [innings1, innings2] = match.innings;
  const teamABatFirst = innings1.battingTeamId === 'teamA';
  const team1 = teamABatFirst ? match.teamA : match.teamB;
  const team2 = teamABatFirst ? match.teamB : match.teamA;

  if (match.currentInningsIndex === 1) {
    const target = innings1.totalRuns + 1;
    const team2Runs = innings2.totalRuns;
    const team2Wickets = innings2.wickets;

    // Calculate max wickets: if lastManStands is enabled, team2 can lose all players. Otherwise players - 1.
    const maxWickets = match.rules.lastManStands
      ? team2.players.length
      : Math.max(1, team2.players.length - 1);

    const maxBalls = match.rules.totalOvers * 6;

    // Team 2 successfully chased target
    if (team2Runs >= target) {
      const wicketsRemaining = Math.max(0, maxWickets - team2Wickets);
      return {
        winnerTeamId: team2.id,
        marginText: `${team2.name} won by ${wicketsRemaining} wicket${wicketsRemaining === 1 ? '' : 's'}`,
      };
    }

    // Team 2 is all out OR balls completed
    const isInnings2Finished =
      innings2.isCompleted ||
      team2Wickets >= maxWickets ||
      innings2.legalBalls >= maxBalls;

    if (isInnings2Finished) {
      if (team2Runs === innings1.totalRuns) {
        return {
          winnerTeamId: 'tie',
          marginText: 'Match Tied!',
          isTie: true,
        };
      }
      if (team2Runs < innings1.totalRuns) {
        const runMargin = innings1.totalRuns - team2Runs;
        return {
          winnerTeamId: team1.id,
          marginText: `${team1.name} won by ${runMargin} run${runMargin === 1 ? '' : 's'}`,
        };
      }
    }
  }

  return null;
}
