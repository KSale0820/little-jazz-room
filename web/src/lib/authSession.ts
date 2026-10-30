import type { Session, SupabaseClient } from '@supabase/supabase-js';

/** Auth events take precedence over a slower initial session read. */
export function observeAuthSession(
  auth: SupabaseClient['auth'],
  update: (session: Session | null, error: string | null) => void,
) {
  let active = true;
  let receivedEvent = false;
  const { data } = auth.onAuthStateChange((_event, session) => {
    if (!active) return;
    receivedEvent = true;
    update(session, null);
  });
  void Promise.resolve().then(() => auth.getSession()).then(({ data, error }) => {
    if (active && !receivedEvent) {
      update(error ? null : data.session, error ? 'Could not restore your session. Sign in again.' : null);
    }
  }).catch(() => {
    if (active && !receivedEvent) update(null, 'Could not restore your session. Sign in again.');
  });
  return () => {
    active = false;
    data.subscription.unsubscribe();
  };
}

export async function authAction(action: () => Promise<{ error: { message: string } | null }>) {
  try {
    const { error } = await action();
    return { error: error?.message ?? null };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Authentication is unavailable. Please try again.' };
  }
}
