import { describe, it, expect, beforeEach } from 'vitest';
import {
  getFirebaseConfig,
  saveFirebaseConfig,
  isFirebaseConfigured,
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
});
