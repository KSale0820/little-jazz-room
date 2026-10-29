import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { readSupabaseConfig } from './env';

let client: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (client) return client;
  const cfg = readSupabaseConfig();
  if (!cfg) return null;
  client = createClient(cfg.url, cfg.anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
  return client;
}

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          cat_id: string;
          practice_milestone_minutes: number;
          gentle_motion_enabled: boolean;
        };
      };
    };
  };
};
