/** Time-of-day greeting, optionally personalised with the user's first name. */
export function timeGreeting(displayName?: string | null): string {
  const h = new Date().getHours();
  const base = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  const name = displayName?.trim().split(/\s+/)[0]; // first word only
  return name ? `${base}, ${name}.` : `${base}.`;
}

/** Extract a short display name from a Supabase user object. */
export function displayNameFromUser(user: { email?: string | null; user_metadata?: Record<string, unknown> } | null | undefined): string | null {
  if (!user) return null;
  const meta = user.user_metadata;
  if (meta) {
    const full = meta['full_name'] ?? meta['name'];
    if (typeof full === 'string' && full.trim()) return full.trim();
  }
  // Fall back to the email prefix (before @)
  if (user.email) return user.email.split('@')[0] ?? null;
  return null;
}
