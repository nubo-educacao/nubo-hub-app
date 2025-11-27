'use server';

import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import { OpportunitySchema, OpportunityInput } from '@/lib/schemas/opportunity';

// Initialize Supabase Client (Server-side)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!; // In a real app, use SERVICE_ROLE key for admin actions
const supabase = createClient(supabaseUrl, supabaseKey);

export type ActionState = {
  success: boolean;
  message: string;
  errors?: Record<string, string[]>;
};

export async function createOpportunity(prevState: ActionState, formData: FormData): Promise<ActionState> {
  // 1. Extract data from FormData
  const rawData = {
    institution_id: formData.get('institution_id'),
    course_name: formData.get('course_name'),
    shift: formData.get('shift'),
    scholarship_type: formData.get('scholarship_type'),
    city: formData.get('city'),
    state: formData.get('state'),
    cutoff_score: formData.get('cutoff_score') ? Number(formData.get('cutoff_score')) : null,
  };

  // 2. Validate with Zod
  const validatedFields = OpportunitySchema.safeParse(rawData);

  // 3. Handle Validation Errors
  if (!validatedFields.success) {
    return {
      success: false,
      message: 'Erro de validação',
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  // 4. Proceed with Database Operation (if valid)
  const { error } = await supabase
    .from('opportunities')
    .insert(validatedFields.data);

  if (error) {
    return {
      success: false,
      message: `Erro ao criar oportunidade: ${error.message}`,
    };
  }

  return {
    success: true,
    message: 'Oportunidade criada com sucesso!',
  };
}
