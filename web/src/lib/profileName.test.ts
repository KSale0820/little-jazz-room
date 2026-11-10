import { describe, expect, it } from 'vitest';
import { normalizeProfileName, profileNameKey, readProfileName, saveProfileName } from './profileName';

describe('profile name', () => {
  it('normalizes whitespace and enforces length', () => {
    expect(normalizeProfileName('  Avery   Reed  ')).toBe('Avery Reed');
    expect(normalizeProfileName('x'.repeat(60))).toHaveLength(40);
    expect(normalizeProfileName('    ')).toBe('');
  });
  it('persists names separately for local and signed-in users', () => {
    const data = new Map<string, string>();
    const storage = {
      getItem: (key: string) => data.get(key) ?? null,
      setItem: (key: string, val: string) => { data.set(key, val); },
    };
    expect(saveProfileName('local', 'Avery', storage)).toBe(true);
    expect(saveProfileName('user-123', 'Casey', storage)).toBe(true);
    expect(readProfileName('local', '', storage)).toBe('Avery');
    expect(readProfileName('user-123', 'Cloud default', storage)).toBe('Casey');
    expect(readProfileName('other-user', 'Cloud default', storage)).toBe('Cloud default');
    expect(profileNameKey('local')).not.toBe(profileNameKey('user-123'));
  });
  it('rejects blank names without changing the previous value', () => {
    const saved: string[] = [];
    expect(saveProfileName('local', '   ', { setItem: (_key, val) => { saved.push(val); } })).toBe(false);
    expect(saved).toHaveLength(0);
  });
});
