import type { Session, SupabaseClient } from '@supabase/supabase-js';
import { describe, expect, it, vi } from 'vitest';
import { authAction, observeAuthSession } from './authSession';

function setup() {
  let event!: Parameters<SupabaseClient['auth']['onAuthStateChange']>[0];
  let resolve!: (value: { data: { session: Session | null }; error: { message: string } | null }) => void;
  let reject!: (reason: Error) => void;
  const initial = new Promise<Parameters<typeof resolve>[0]>((res, rej) => { resolve = res; reject = rej; });
  const unsubscribe = vi.fn();
  const auth = {
    getSession: vi.fn(() => initial),
    onAuthStateChange: (callback: typeof event) => { event = callback; return { data: { subscription: { unsubscribe } } }; },
  } as unknown as SupabaseClient['auth'];
  const update = vi.fn();
  const stop = observeAuthSession(auth, update);
  return { event: (session: Session | null) => event('SIGNED_IN', session), resolve, reject, unsubscribe, update, stop };
}

describe('auth restoration lifecycle', () => {
  it('does not overwrite a newer sign-in with a delayed session read', async () => {
    const state = setup();
    const session = { user: { id: 'B' } } as Session;
    state.event(session);
    state.resolve({ data: { session: { user: { id: 'A' } } as Session }, error: null });
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(state.update.mock.calls).toEqual([[session, null]]);
    state.stop();
  });

  it('reports returned restore errors and exits the loading path', async () => {
    const state = setup();
    state.resolve({ data: { session: null }, error: { message: 'Expired refresh token' } });
    await vi.waitFor(() => expect(state.update).toHaveBeenCalledWith(null, 'Could not restore your session. Sign in again.'));
    state.stop();
  });

  it('catches thrown restore errors and recovers on a later auth event', async () => {
    const state = setup();
    state.reject(new Error('Network unavailable'));
    await vi.waitFor(() => expect(state.update).toHaveBeenCalledTimes(1));
    state.event(null);
    expect(state.update).toHaveBeenLastCalledWith(null, null);
    state.stop();
  });

  it('ignores events and read results after unsubscribe', async () => {
    const state = setup();
    state.stop();
    state.event(null);
    state.resolve({ data: { session: null }, error: null });
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(state.update).not.toHaveBeenCalled();
    expect(state.unsubscribe).toHaveBeenCalledOnce();
  });
});

describe('authentication actions', () => {
  it('surfaces returned sign-out errors', async () => {
    expect(await authAction(async () => ({ error: { message: 'Logout unavailable' } }))).toEqual({ error: 'Logout unavailable' });
  });
  it('turns thrown errors into retryable form results', async () => {
    expect(await authAction(async () => { throw new Error('Connection lost'); })).toEqual({ error: 'Connection lost' });
    expect(await authAction(async () => ({ error: null }))).toEqual({ error: null });
  });
});
