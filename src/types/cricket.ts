export type ExtraType = 'wd' | 'nb' | 'b' | 'lb' | null;

export type WicketType =
  | 'bowled'
  | 'caught'
  | 'lbw'
  | 'runOut'
  | 'stumped'
  | 'hitWicket'
  | 'retiredHurt';

export interface Player {
  id: string;
  name: string;
  isCaptain?: boolean;
  isViceCaptain?: boolean;
  isKeeper?: boolean;
}

export interface Team {
  id: 'teamA' | 'teamB';
  name: string;
  shortName: string; // 3-letter short name e.g. "IND", "GL", "MS"
  players: Player[];
}

export interface MatchRules {
  totalOvers: number; // 1 to 50
  maxOversPerBowler?: number; // optional, e.g. ceil(overs/5)
  wideRuns: number; // default 1
  noBallRuns: number; // default 1
  rebowlWide: boolean; // default false
  rebowlNoBall: boolean; // default false
  freeHitOnNoBall: boolean; // default false
  lastManStands: boolean; // default false
}

export interface DismissalInfo {
  type: WicketType;
  batsmanId: string;
  batsmanName: string;
  bowlerId: string;
  bowlerName: string;
  fielderId?: string;
  fielderName?: string;
  runsCompleted?: number; // for run out
  outBatsmanIsStriker?: boolean; // for run out
  description: string; // e.g. "c Rahul b Shami", "b Bumrah", "run out (Kohli)"
}

export interface Ball {
  id: string;
  overIndex: number; // 0, 1, 2...
  ballInOver: number; // ball sequence in this over (1, 2, 3...)
  legalBallNumber: number; // 1 to 6
  isLegal: boolean;
  runsOffBat: number;
  extraRuns: number;
  totalRuns: number;
  extraType: ExtraType;
  wicket: DismissalInfo | null;
  batsmanId: string;
  batsmanName: string;
  nonStrikerId: string;
  nonStrikerName: string;
  bowlerId: string;
  bowlerName: string;
  isFreeHit: boolean;
  displayLabel: string; // e.g., "0", "1", "4", "6", "W", "Wd", "Nb+4", "1B", "2LB"
  timestamp: number;
}

export interface ExtrasBreakdown {
  wides: number;
  noBalls: number;
  byes: number;
  legByes: number;
  total: number;
}

export interface FallOfWicket {
  wicketNumber: number;
  score: number;
  overs: string;
  batsmanId: string;
  batsmanName: string;
}

export interface BatsmanStats {
  playerId: string;
  name: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  strikeRate: number;
  isNotOut: boolean;
  dismissal?: DismissalInfo;
}

export interface BowlerStats {
  playerId: string;
  name: string;
  legalBalls: number;
  oversFormatted: string; // e.g., "3.4"
  maidens: number;
  runsConceded: number;
  wickets: number;
  economy: number;
  wides: number;
  noBalls: number;
}

export interface Innings {
  inningsNumber: 1 | 2;
  battingTeamId: 'teamA' | 'teamB';
  bowlingTeamId: 'teamA' | 'teamB';
  totalRuns: number;
  wickets: number;
  legalBalls: number; // cumulative legal balls
  oversFormatted: string; // e.g., "4.3"
  currentOverBalls: Ball[];
  allBalls: Ball[];
  strikerId: string;
  nonStrikerId: string;
  currentBowlerId: string;
  previousBowlerId: string | null;
  isCompleted: boolean;
  extras: ExtrasBreakdown;
  fallOfWickets: FallOfWicket[];
}

export interface TossDetails {
  winner: 'teamA' | 'teamB';
  decision: 'bat' | 'bowl';
}

export interface MatchResult {
  winnerTeamId: 'teamA' | 'teamB' | 'tie' | null;
  marginText: string;
  isTie?: boolean;
}

export type MatchStatus = 'setup' | 'live' | 'inningsBreak' | 'completed';

export interface Match {
  id: string;
  date: string;
  teamA: Team;
  teamB: Team;
  rules: MatchRules;
  toss: TossDetails;
  currentInningsIndex: 0 | 1;
  innings: [Innings, Innings];
  isFreeHit: boolean;
  needsBowlerSelection: boolean;
  needsBatsmanSelection: boolean;
  dismissedBatsmanRole?: 'striker' | 'nonStriker';
  status: MatchStatus;
  result: MatchResult | null;
  createdAt: number;
  updatedAt: number;
}

export interface MatchSummary {
  id: string;
  date: string;
  teamAName: string;
  teamBName: string;
  totalOvers: number;
  innings1Score: string;
  innings2Score?: string;
  resultText: string;
  createdAt: number;
  fullMatch: Match;
}

export type MatchAction =
  | {
      type: 'START_MATCH';
      payload: {
        teamA: Team;
        teamB: Team;
        rules: MatchRules;
        toss: TossDetails;
        strikerId: string;
        nonStrikerId: string;
        bowlerId: string;
      };
    }
  | { type: 'ADD_RUNS'; payload: { runs: number } }
  | { type: 'ADD_EXTRA'; payload: { extraType: ExtraType; additionalRuns: number; runsOffBat?: number; isZeroRunExtra?: boolean } }
  | { type: 'ADD_WICKET'; payload: { wicketType: WicketType; outBatsmanId: string; fielderId?: string; runsCompleted?: number; nextBatsmanId?: string; nextBatsmanName?: string } }
  | { type: 'UNDO' }
  | { type: 'SET_BOWLER'; payload: { bowlerId: string } }
  | { type: 'ADD_AND_SET_BOWLER'; payload: { name: string } }
  | { type: 'SET_BATTER'; payload: { batsmanId: string; replaceRole: 'striker' | 'nonStriker' } }
  | { type: 'ADD_AND_SET_BATTER'; payload: { name: string; replaceRole: 'striker' | 'nonStriker' } }
  | { type: 'CHANGE_BOWLER_MID_OVER'; payload: { bowlerId: string } }
  | { type: 'RETIRE_BATTER'; payload: { batsmanId: string; nextBatsmanId?: string } }
  | { type: 'SWAP_STRIKER' }
  | { type: 'END_INNINGS' }
  | { type: 'START_SECOND_INNINGS'; payload: { strikerId: string; nonStrikerId: string; bowlerId: string } }
  | { type: 'EDIT_TEAM_NAMES'; payload: { teamA: { name: string; shortName: string }; teamB: { name: string; shortName: string } } }
  | { type: 'ADD_PLAYER_IN_MATCH'; payload: { teamId: 'teamA' | 'teamB'; name: string } }
  | { type: 'REMOVE_PLAYER_IN_MATCH'; payload: { teamId: 'teamA' | 'teamB'; playerId: string } }
  | { type: 'EDIT_PLAYER_NAME'; payload: { teamId: 'teamA' | 'teamB'; playerId: string; newName: string } }
  | { type: 'CHANGE_TOTAL_OVERS'; payload: { newTotalOvers: number } }
  | { type: 'RESET' }
  | { type: 'LOAD_MATCH'; payload: { match: Match } };

export interface MatchContextState {
  match: Match | null;
  historyStack: Match[];
  savedMatches: MatchSummary[];
  activeTab: 'scoring' | 'scorecard' | 'history';
  selectedScorecardInnings: 1 | 2;
  darkMode: boolean;
}
