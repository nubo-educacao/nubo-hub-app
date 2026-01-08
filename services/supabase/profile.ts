import { supabase } from '@/lib/supabaseClient';

export interface UserProfile {
  id: string;
  full_name: string | null;
  age: number | null;
  city: string | null;
  education: string | null;
  onboarding_completed: boolean;
}

export interface UpdateProfileParams {
  full_name?: string | null;
  age?: number | null;
  city?: string | null;
  education?: string | null;
}

export async function getUserProfileService(): Promise<{ data: UserProfile | null; error: any }> {
  // Use RPC 'get_own_profile' to ensure we can read it reliably (SECURITY DEFINER)
  const { data, error } = await supabase.rpc('get_own_profile');

  if (error) {
    console.error('Error fetching profile (RPC):', error);
    return { data: null, error };
  }

  // The RPC returns null if no row found, or the object.
  return { data: data as UserProfile, error: null };
}

export async function updateUserProfileService(params: UpdateProfileParams): Promise<{ data: UserProfile | null; error: any }> {
  const { data, error } = await supabase.rpc('update_own_profile', {
      p_full_name: params.full_name,
      p_age: params.age,
      p_city: params.city,
      p_education: params.education
  });

  if (error) {
    console.error('Error updating profile:', error);
    return { data: null, error };
  }

  return { data: data as UserProfile, error: null };
}
