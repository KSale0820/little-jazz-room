/**
 * Load web/.env.local into process.env (scripts only — never import from app code).
 * Does not log values. Skips blank lines and # comments.
 */
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const webRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const envPath = join(webRoot, '.env.local');

export function loadEnvLocal() {
  if (!existsSync(envPath)) return { loaded: false, path: envPath };

  const text = readFileSync(envPath, 'utf8');
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }

  if (!process.env.SUPABASE_URL && process.env.VITE_SUPABASE_URL) {
    process.env.SUPABASE_URL = process.env.VITE_SUPABASE_URL;
  }
  if (!process.env.SUPABASE_ANON_KEY && process.env.VITE_SUPABASE_ANON_KEY) {
    process.env.SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
  }

  return { loaded: true, path: envPath };
}

export function missingRlsEnvVars() {
  const required = [
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'TEAM_USER_A_EMAIL',
    'TEAM_USER_A_PASSWORD',
    'TEAM_USER_B_EMAIL',
    'TEAM_USER_B_PASSWORD',
  ];
  return required.filter(name => !process.env[name]?.trim());
}
