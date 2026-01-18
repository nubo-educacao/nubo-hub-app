import { supabase } from '@/lib/supabaseClient';

export interface UserPreferences {
    id: string;
    user_id: string;
    course_interest: string[] | null;
    enem_score: number | null;
    preferred_shifts: string[] | null;
    university_preference: 'publica' | 'privada' | 'indiferente' | null;
    program_preference: 'sisu' | 'prouni' | 'indiferente' | null;
    family_income_per_capita: number | null;
    quota_types: string[] | null;
    location_preference: string | null;
    state_preference: string | null;
}

export type UpdateUserPreferencesParams = Partial<Omit<UserPreferences, 'id' | 'user_id'>>;

export async function getUserPreferencesService(): Promise<{ data: UserPreferences | null; error: any }> {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
            console.error('No authenticated user found');
            return { data: null, error: 'User not authenticated' };
        }

        const { data, error } = await supabase
            .from('user_preferences')
            .select('*')
            .eq('user_id', user.id)
            .single();

        if (error) {
            // If the error is "PGRST116" (Result contains 0 rows), it means no preferences yet.
            // We should treat this as a "not found" but acceptable case, or maybe create one.
            // For now, let's return null data so the UI can handle empty state or create on first save.
            if (error.code === 'PGRST116') {
                return { data: null, error: null };
            }
            console.error('Error fetching user preferences:', error);
            return { data: null, error };
        }

        return { data: data as UserPreferences, error: null };
    } catch (e) {
        console.error("Exception fetching user preferences:", e);
        return { data: null, error: e };
    }
}

export async function updateUserPreferencesService(params: UpdateUserPreferencesParams): Promise<{ data: UserPreferences | null; error: any }> {
    try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return { data: null, error: 'User not authenticated' };
        }

        // Check if record exists
        const { data: existing } = await supabase
            .from('user_preferences')
            .select('id')
            .eq('user_id', user.id)
            .single();

        let result;
        
        if (existing) {
            // Update
            result = await supabase
                .from('user_preferences')
                .update(params)
                .eq('user_id', user.id)
                .select()
                .single();
        } else {
            // Insert
            result = await supabase
                .from('user_preferences')
                .insert({ user_id: user.id, ...params })
                .select()
                .single();
        }

        if (result.error) {
            console.error('Error updating user preferences:', result.error);
            return { data: null, error: result.error };
        }

        return { data: result.data as UserPreferences, error: null };

    } catch (e) {
        console.error("Exception updating user preferences:", e);
        return { data: null, error: e };
    }
}

export async function getAvailableCoursesService(): Promise<{ data: string[] | null; error: any }> {
    try {
        const { data, error } = await supabase.rpc('get_unique_course_names');
        
        if (error) {
            console.error('Error fetching course names:', error);
            return { data: null, error };
        }

        const courses = data.map((item: any) => item.course_name);
        return { data: courses, error: null };
    } catch (e) {
        return { data: null, error: e };
    }
}

export interface MatchOpportunitiesParams {
    course_interests: string[] | null;
    enem_score: number | null;
    income_per_capita: number | null;
    quota_types: string[] | null;
    preferred_shifts: string[] | null;
    program_preference: string | null;
    user_lat: number | null;
    user_long: number | null;
    city_names: string[] | null;
    state_names: string[] | null;
    university_preference: string | null;
    page_size: number;
    page_number: number;
}

export async function matchOpportunitiesService(params: MatchOpportunitiesParams): Promise<{ data: any[] | null; error: any }> {
    try {
        const { data, error } = await supabase.rpc('match_opportunities', params);
        
        if (error) {
            console.error('Error fetching match opportunities:', error);
            return { data: null, error };
        }

        return { data, error: null };
    } catch (e) {
        console.error("Exception fetching match opportunities:", e);
        return { data: null, error: e };
    }
}
