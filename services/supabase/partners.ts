import { supabase } from '@/lib/supabaseClient';

export interface Partner {
  id: string;
  name: string;
  description: string;
  location: string | null;
  type: string | null;
  income: string | null;
  dates: Record<string, any> | null;
  link: string | null;
  coverimage: string | null;
}

export async function getPartners() {
  const { data, error } = await supabase.rpc('get_partners', { p_sort_by: 'name', p_sort_order: 'asc' });

  if (error) {
    console.error('Error fetching partners:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code
    });
    return [];
  }

  return (data as Partner[]) || [];
}
