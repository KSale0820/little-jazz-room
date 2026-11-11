/** Per-account saved routine IDs. Compatible with existing class-demo bookmarks. */
const key = (scope: string) => 'little-jazz-room:routine-bookmarks:v1:' + scope;

export function readRoutineBookmarks(scope: string): string[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(key(scope)) ?? '[]');
    return Array.isArray(parsed)
      ? [...new Set(parsed.filter((id): id is string => typeof id === 'string'))]
      : [];
  } catch { return []; }
}

export function saveRoutineBookmarks(scope: string, ids: string[]): void {
  try { localStorage.setItem(key(scope), JSON.stringify([...new Set(ids)])); }
  catch { /* local persistence unavailable */ }
}
