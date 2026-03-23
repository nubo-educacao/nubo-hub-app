import { supabase } from '@/lib/supabaseClient';

export interface UserIncome {
  id?: string;
  user_id?: string;
  family_count: number | null;
  social_benefits: number | null;
  alimony: number | null;
  member_incomes: number[];
  per_capita_income: number | null;
  created_at?: string;
  updated_at?: string;
}

export async function getUserIncomeService(): Promise<{ data: UserIncome | null; error: any }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { data: null, error: new Error('User not authenticated') };
  }

  const { data, error } = await supabase
    .from('user_income')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 is the "Result contains 0 rows" error
    console.error('[getUserIncomeService] Error fetching income:', error);
    return { data: null, error };
  }

  return { data: data as UserIncome, error: null };
}

export async function updateUserIncomeService(params: UserIncome): Promise<{ data: UserIncome | null; error: any }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { data: null, error: new Error('User not authenticated') };
  }

  // Set the user_id explicitly
  const payload = { ...params, user_id: user.id };

  // Use upsert to create or update the income record
  const { data, error } = await supabase
    .from('user_income')
    .upsert(payload, { onConflict: 'user_id' })
    .select()
    .single();

  if (error) {
    console.error('[updateUserIncomeService] Error updating income:', error);
    return { data: null, error };
  }

  return { data: data as UserIncome, error: null };
}
