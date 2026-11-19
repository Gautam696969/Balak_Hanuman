import { describe, it, expect, beforeEach } from 'vitest';
import {
  getFirebaseConfig,
  saveFirebaseConfig,
  isFirebaseConfigured,
  sanitizeForFirebase,
} from '../services/firebase';

describe('Firebase Realtime Sync Service', () => {
  let mockStorage: Record<string, string> = {};

  beforeEach(() => {
    mockStorage = {};
    (global as any).localStorage = {
      getItem: (key: string) => mockStorage[key] || null,
      setItem: (key: string, val: string) => {
        mockStorage[key] = val;
      },
      removeItem: (key: string) => {
        delete mockStorage[key];
      },
      clear: () => {
        mockStorage = {};
      },
    };
  });

  it('reports configured with default project config', () => {
    expect(isFirebaseConfigured()).toBe(true);
    const config = getFirebaseConfig();
    expect(config?.projectId).toBe('bhg-scorer');
  });

  it('saves and retrieves Firebase configuration correctly', () => {
    const config = {
      apiKey: 'test-api-key',
      databaseURL: 'https://test-cricket-default-rtdb.firebaseio.com',
      projectId: 'test-cricket',
    };

    saveFirebaseConfig(config);
    expect(isFirebaseConfigured()).toBe(true);

    const retrieved = getFirebaseConfig();
    expect(retrieved).not.toBeNull();
    expect(retrieved?.databaseURL).toBe('https://test-cricket-default-rtdb.firebaseio.com');
    expect(retrieved?.projectId).toBe('test-cricket');
  });

  it('formats spectator URL correctly with matchId and view=spectator', () => {
    const matchId = 'match_12345';
    const baseUrl = 'https://balak-hanuman-cricket.web.app';
    const spectatorUrl = `${baseUrl}/?matchId=${encodeURIComponent(matchId)}&view=spectator`;

    const url = new URL(spectatorUrl);
    expect(url.searchParams.get('matchId')).toBe('match_12345');
    expect(url.searchParams.get('view')).toBe('spectator');
  });

  it('sanitizeForFirebase strips all undefined properties from nested match objects', () => {
    const rawMatchData = {
      id: 'test_match_1',
      needsBatsmanSelection: true,
      dismissedBatsmanRole: 'striker',
      innings: [
        {
          allBalls: [
            {
              id: 'ball_1',
              runsOffBat: 0,
              totalRuns: 0,
              wicket: {
                type: 'bowled',
                batsmanId: 'p1',
                batsmanName: 'Player 1',
                fielderId: undefined, // undefined should be stripped!
                fielderName: undefined, // undefined should be stripped!
                bowlerId: 'b1',
                bowlerName: 'Bowler 1',
              },
            },
          ],
        },
      ],
    };

    const sanitized = sanitizeForFirebase(rawMatchData);

    expect(sanitized.id).toBe('test_match_1');
    expect('fielderId' in (sanitized.innings[0].allBalls[0].wicket as any)).toBe(false);
    expect('fielderName' in (sanitized.innings[0].allBalls[0].wicket as any)).toBe(false);
    expect(sanitized.innings[0].allBalls[0].wicket.type).toBe('bowled');
    expect(sanitized.innings[0].allBalls[0].wicket.batsmanName).toBe('Player 1');
  });
});
