import { supabase } from '@/lib/supabaseClient';

export type PassportPhase =
  | 'INTRO'
  | 'ONBOARDING'
  | 'ASK_DEPENDENT'
  | 'DEPENDENT_ONBOARDING'
  | 'PROGRAM_MATCH'
  | 'EVALUATE'
  | 'CONCLUDED';

export interface UserProfile {
  id: string;
  full_name: string | null;
  age: number | null;
  birth_date: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  street: string | null;
  street_number: string | null;
  complement: string | null;
  education: string | null;
  education_year: string | null;
  onboarding_completed: boolean;
  passport_phase: PassportPhase | null;
  furthest_passport_phase: PassportPhase | null;
  relationship?: string | null;
  active_application_target_id?: string | null;
  current_dependent_id?: string | null;
}

export interface UpdateProfileParams {
  full_name?: string | null;
  age?: number | null;
  city?: string | null;
  state?: string | null;
  zip_code?: string | null;
  street?: string | null;
  street_number?: string | null;
  complement?: string | null;
  education?: string | null;
  education_year?: string | null;
  passport_phase?: PassportPhase | null;
  relationship?: string | null;
  isdependent?: boolean;
  parent_user_id?: string | null;
  current_dependent_id?: string | null;
  target_user_id?: string | null;
  birth_date?: string | null;
}

export async function getUserProfileService(): Promise<{ data: UserProfile | null; error: any }> {
  // Use RPC 'get_own_profile' to ensure we can read it reliably (SECURITY DEFINER)
  // Direct select failed due to RLS policies (406), so we must use the RPC.
  try {
    const { data, error } = await supabase.rpc('get_own_profile');

    if (error) {
      console.error('[getUserProfileService] Error fetching profile (RPC):', error);
      return { data: null, error };
    }

    // Guard: RPC can return null if profile doesn't exist and auto-create failed
    if (!data) {
      console.warn('[getUserProfileService] ⚠️ RPC returned null — profile not found. User may need profile creation.');
      return { data: null, error: null };
    }

    console.log('[getUserProfileService] RPC Data:', data);
    const isNewlyCreated = data?.passport_phase === 'INTRO' && !data?.full_name;
    console.log(`[getUserProfileService] Profile ${isNewlyCreated ? '🆕 NEWLY CREATED (auto-created by DB)' : '📋 EXISTING'}. passport_phase=${data?.passport_phase}, onboarding_completed=${data?.onboarding_completed}, id=${data?.id}`);

    // Polyfill/Fallback: If onboarding_completed is missing or false, check fields.
    const requiresYear = data.education === 'Ensino fundamental' || data.education === 'Ensino médio incompleto';
    const computedCompleted = data.onboarding_completed || (
      !!data.full_name &&
      !!data.city &&
      !!data.education &&
      !!data.zip_code &&
      data.age !== null && data.age !== undefined &&
      (!requiresYear || !!data.education_year)
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
    p_education: params.education,
    p_zip_code: params.zip_code,
    p_state: params.state,
    p_street: params.street,
    p_street_number: params.street_number,
    p_complement: params.complement,
    p_passport_phase: params.passport_phase,
    p_relationship: params.relationship,
    p_isdependent: params.isdependent,
    p_parent_user_id: params.parent_user_id,
    p_current_dependent_id: params.current_dependent_id,
    p_target_user_id: params.target_user_id,
    p_education_year: params.education_year,
    p_birth_date: params.birth_date,
  });

  if (error) {
    console.error('Error updating profile:', error);
    return { data: null, error };
  }

  return { data: data as UserProfile, error: null };
}
