import { supabase } from '@/lib/supabaseClient';

export interface PartnerSolicitation {
  institution_name: string;
  contact_name: string;
  whatsapp?: string;
  email?: string;
  how_did_you_know: string;
  goals?: string;
}

export async function createPartnerSolicitation(data: PartnerSolicitation) {
  
  const { error } = await supabase
    .from('partner_solicitations')
    .insert([data]);

  if (error) {
    console.error('Error creating partner solicitation:', error);
    throw error;
  }

  return true;
}
