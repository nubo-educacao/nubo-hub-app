import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface City {
    id: number;
    name: string;
    state: string;
    latitude?: number;
    longitude?: number;
}

/**
 * Search cities by name with fuzzy matching.
 * @param query - Partial city name to search
 * @returns Array of matching cities
 */
export async function searchCitiesService(query: string): Promise<{ data: City[] | null; error: Error | null }> {
    if (!query || query.length < 2) {
        return { data: [], error: null };
    }

    try {
        const { data, error } = await supabase
            .from('cities')
            .select('id, name, state, latitude, longitude')
            .ilike('name', `%${query}%`)
            .order('name')
            .limit(10);

        if (error) {
            return { data: null, error: new Error(error.message) };
        }

        return { data: data as City[], error: null };
    } catch (e) {
        return { data: null, error: e as Error };
    }
}

/**
 * Get a single city by exact name match.
 * @param name - Exact city name
 * @param state - Optional state to disambiguate
 * @returns The matched city or null
 */
export async function getCityByNameService(name: string, state?: string): Promise<{ data: City | null; error: Error | null }> {
    try {
        let query = supabase
            .from('cities')
            .select('id, name, state, latitude, longitude')
            .ilike('name', name);

        if (state) {
            query = query.eq('state', state);
        }

        const { data, error } = await query.limit(1).single();

        if (error) {
            return { data: null, error: new Error(error.message) };
        }

        return { data: data as City, error: null };
    } catch (e) {
        return { data: null, error: e as Error };
    }
}
