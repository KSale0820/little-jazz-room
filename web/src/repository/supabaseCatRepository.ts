import type { SupabaseClient } from '@supabase/supabase-js';
import type { CatPreferenceRepository } from '../features/cats/CatCompanion';
import type { CatId } from '../features/cats/CatCompanion';

export function createSupabaseCatRepository(
  client: SupabaseClient,
  userId: string
): CatPreferenceRepository {
  return {
    async readCat() {
      const { data, error } = await client
        .from('profiles')
        .select('cat_id')
        .eq('id', userId)
        .maybeSingle();
      if (error) throw error;
      return data?.cat_id ?? null;
    },
    async writeCat(catId: CatId) {
      const { error } = await client
        .from('profiles')
        .update({ cat_id: catId })
        .eq('id', userId);
      if (error) throw error;
    },
  };
}

export async function ensureProfileRow(client: SupabaseClient, userId: string): Promise<void> {
  const { error } = await client.from('profiles').upsert({ id: userId }, { onConflict: 'id' });
  if (error) throw error;
}
