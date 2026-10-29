#!/usr/bin/env node
/**
 * Phase 2 RLS smoke tests — run against YOUR Supabase project after migrations.
 * Env: SUPABASE_URL, SUPABASE_ANON_KEY, TEAM_USER_A_EMAIL, TEAM_USER_A_PASSWORD,
 *      TEAM_USER_B_EMAIL, TEAM_USER_B_PASSWORD
 */
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';

const url = process.env.SUPABASE_URL;
const anon = process.env.SUPABASE_ANON_KEY;

function req(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env ${name}`);
  return v;
}

if (!url || !anon) {
  console.error('Set SUPABASE_URL and SUPABASE_ANON_KEY');
  process.exit(1);
}

const results = [];
const pass = label => {
  results.push({ label, ok: true });
  console.log('PASS', label);
};
const fail = (label, detail) => {
  results.push({ label, ok: false, detail });
  console.error('FAIL', label, detail);
};

async function signIn(email, password) {
  const client = createClient(url, anon, { auth: { persistSession: false } });
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw new Error(`${email}: ${error.message}`);
  return client;
}

const anonClient = createClient(url, anon, { auth: { persistSession: false } });

try {
  const clientA = await signIn(req('TEAM_USER_A_EMAIL'), req('TEAM_USER_A_PASSWORD'));
  const clientB = await signIn(req('TEAM_USER_B_EMAIL'), req('TEAM_USER_B_PASSWORD'));

  const { data: anonRoutines } = await anonClient.from('user_routines').select('id, visibility');
  if ((anonRoutines ?? []).some(r => r.visibility !== 'public')) {
    fail('Anonymous lists only public routines', JSON.stringify(anonRoutines));
  } else pass('Anonymous lists only public routines');

  const privateId = randomUUID();
  const { data: userA } = await clientA.auth.getUser();
  const ownerA = userA.user.id;
  const { error: insErr } = await clientA.from('user_routines').insert({
    id: privateId,
    owner_id: ownerA,
    title: 'RLS test private',
    duration_minutes: 5,
    visibility: 'private',
  });
  if (insErr) fail('User A inserts private routine', insErr.message);
  else pass('User A inserts private routine');

  const { data: bRead } = await clientB.from('user_routines').select('id').eq('id', privateId).maybeSingle();
  if (bRead) fail('User B read A private routine', privateId);
  else pass('User B cannot read A private routine');

  const publicId = randomUUID();
  await clientA.from('user_routines').insert({
    id: publicId,
    owner_id: ownerA,
    title: 'RLS test public',
    duration_minutes: 5,
    visibility: 'public',
  });
  await clientA.from('routine_steps').insert({
    routine_id: publicId,
    sort_order: 0,
    snapshot_title: 'Step',
    snapshot_instructions: 'Do it',
    snapshot_duration_minutes: 5,
  });

  const { data: anonPublic } = await anonClient.from('user_routines').select('id').eq('id', publicId).maybeSingle();
  if (!anonPublic) fail('Anonymous can read public routine', publicId);
  else pass('Anonymous can read public routine');

  const { error: signUpErr } = await anonClient.auth.signUp({
    email: `blocked-${Date.now()}@example.com`,
    password: 'ShouldNotWork123!',
  });
  if (!signUpErr) fail('Public signup blocked', 'unexpected success');
  else pass('Public signup blocked');

  await clientA.from('profiles').update({ cat_id: 'milo' }).eq('id', ownerA);
  const { data: bProfile } = await clientB.from('profiles').select('cat_id').eq('id', ownerA).maybeSingle();
  if (bProfile) fail('User B reads A profile', JSON.stringify(bProfile));
  else pass('User B cannot read A profile');

  await clientA.from('user_routines').delete().in('id', [privateId, publicId]);
} catch (e) {
  fail('Test harness', e.message);
}

const failed = results.filter(r => !r.ok);
console.log(`\nSummary: ${results.length - failed.length}/${results.length} passed`);
process.exit(failed.length ? 1 : 0);
