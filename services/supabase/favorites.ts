import { supabase } from '@/lib/supabaseClient';

export interface UserFavorites {
  courseIds: string[];
  partnerIds: string[];
}

export async function toggleFavoriteService(type: 'course' | 'partner', id: string): Promise<{ error: any }> {
  const { error } = await supabase.rpc('toggle_favorite', { p_type: type, p_id: id });
  return { error };
}

export async function getUserFavoritesService(): Promise<{ data: UserFavorites | null; error: any }> {
  const { data, error } = await supabase.rpc('get_user_favorites');
  
  if (error) {
    console.error('Error fetching favorites:', error);
    return { data: null, error };
  }

  return { data: data as UserFavorites, error: null };
}

import { CourseDisplayData, OpportunityDisplay } from '@/types/opportunity';
import { Partner } from './partners';

// ... existing code ...

export interface FavoriteDetails {
    courses: CourseDisplayData[];
    partners: Partner[];
}

export async function getUserFavoritesDetailsService(): Promise<{ data: FavoriteDetails | null; error: any }> {
    const { data, error } = await supabase.rpc('get_user_favorites_details');

    if (error) {
        console.error('Error fetching favorite details:', error);
        return { data: null, error };
    }

    // Map raw RPC course data to CourseDisplayData
    const mappedCourses: CourseDisplayData[] = (data.courses || []).map((item: any) => {
        const opportunities: OpportunityDisplay[] = (item.opportunities || []).map((opp: any) => {
             let type: 'Pública' | 'Privada' | 'Parceiro' = 'Parceiro';
             if (opp.scholarship_type?.toLowerCase().includes('integral') || opp.opportunity_type === 'sisu') {
                type = 'Pública';
             } else if (opp.scholarship_type?.toLowerCase().includes('parcial')) {
                type = 'Privada';
             }

             return {
                id: opp.id,
                shift: opp.shift,
                opportunity_type: opp.opportunity_type,
                scholarship_type: opp.scholarship_type,
                concurrency_tags: opp.concurrency_tags,
                cutoff_score: opp.cutoff_score,
                type
             };
        });

        const scores = opportunities.map(o => o.cutoff_score).filter((s): s is number => typeof s === 'number' && s !== null);
        const min_cutoff_score = scores.length > 0 ? Math.min(...scores) : null;

        return {
            id: item.id,
            title: item.course_name || 'Curso não informado',
            institution: item.institution_name || 'Instituição não informada',
            location: `${item.city || ''} - ${item.state || ''}`,
            city: item.city || '',
            state: item.state || '',
            opportunities,
            min_cutoff_score
        };
    });

    return { 
        data: {
            courses: mappedCourses,
            partners: data.partners || []
        }, 
        error: null 
    };
}
