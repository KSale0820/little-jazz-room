import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  LOCAL_SCOPE_ANONYMOUS,
  createLocalRepository,
  localStorageScopeForUser,
} from '../repository/localRepository';

const memory = new Map<string, string>();

function installLocalStorageMock() {
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => memory.get(key) ?? null,
    setItem: (key: string, value: string) => {
      memory.set(key, value);
    },
    removeItem: (key: string) => {
      memory.delete(key);
    },
    clear: () => {
      memory.clear();
    },
  });
}

describe('local repository account scope', () => {
  beforeEach(() => {
    memory.clear();
    installLocalStorageMock();
  });

  it('maps anonymous users to a shared offline scope', () => {
    expect(localStorageScopeForUser(null)).toBe(LOCAL_SCOPE_ANONYMOUS);
    expect(localStorageScopeForUser(undefined)).toBe(LOCAL_SCOPE_ANONYMOUS);
  });

  it('isolates routines per authenticated user id', () => {
    const userA = '11111111-1111-4111-8111-111111111111';
    const userB = '22222222-2222-4222-8222-222222222222';
    const repoA = createLocalRepository(localStorageScopeForUser(userA));
    const repoB = createLocalRepository(localStorageScopeForUser(userB));

    repoA.saveLocalRoutine({
      id: 'local-rt-a',
      title: 'A only',
      description: '',
      level: 'Beginner',
      duration_minutes: 5,
      visibility: 'private',
      is_seed: false,
      steps: [{ exercise_id: 'swing-2-4', duration_minutes: 5 }],
      applicable_instruments: ['All'],
    });

    expect(repoA.listLocalRoutines()).toHaveLength(1);
    expect(repoB.listLocalRoutines()).toHaveLength(0);
  });

  it('does not read legacy unscoped keys', () => {
    memory.set(
      'little-jazz-room:local-routines:v1',
      JSON.stringify([{ id: 'legacy', title: 'Old global' }])
    );
    const repo = createLocalRepository(LOCAL_SCOPE_ANONYMOUS);
    expect(repo.listLocalRoutines()).toHaveLength(0);
  });
});
