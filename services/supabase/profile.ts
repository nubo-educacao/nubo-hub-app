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
  // Direct select failed due to RLS policies (406), so we must use the RPC.
  try {
      const { data, error } = await supabase.rpc('get_own_profile');

      if (error) {
        console.error('Error fetching profile (RPC):', error);
        return { data: null, error };
      }
      
      console.log("[getUserProfileService] RPC Data:", data);
      
      // Polyfill/Fallback: If onboarding_completed is missing or false, check fields.
      // This ensures functionality even if RPC/DB is slightly out of sync.
      const computedCompleted = data.onboarding_completed || (
          !!data.full_name && 
          !!data.city && 
          !!data.education && 
          data.age !== null && data.age !== undefined
      );

      return { 
          data: { ...data, onboarding_completed: computedCompleted } as UserProfile, 
          error: null 
      };
      
  } catch (e) {
      console.error("RPC Call Failed:", e);
      return { data: null, error: e };
  }
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
