const PROFILE_NAME_PREFIX = 'little-jazz-room:profile-name:v1';

export function profileNameKey(accountKey: string): string {
  return `${PROFILE_NAME_PREFIX}:${accountKey}`;
}

export function normalizeProfileName(value: string): string {
  return value.trim().replace(/\s+/g, ' ').slice(0, 40);
}

export function readProfileName(
  accountKey: string,
  authName = '',
  storage: Pick<Storage, 'getItem'> | null = typeof localStorage === 'undefined' ? null : localStorage,
): string {
  try {
    const saved = storage?.getItem(profileNameKey(accountKey));
    if (saved && normalizeProfileName(saved)) return normalizeProfileName(saved);
  } catch { /* Storage may be unavailable in private mode. */ }
  return normalizeProfileName(authName) || 'Jazz learner';
}

export function saveProfileName(
  accountKey: string,
  name: string,
  storage: Pick<Storage, 'setItem'> | null = typeof localStorage === 'undefined' ? null : localStorage,
): boolean {
  const normalized = normalizeProfileName(name);
  if (!normalized || !storage) return false;
  try {
    storage.setItem(profileNameKey(accountKey), normalized);
    return true;
  } catch {
    return false;
  }
}
