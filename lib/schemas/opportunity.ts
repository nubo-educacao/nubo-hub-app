import { z } from 'zod';

export const OpportunitySchema = z.object({
  institution_id: z.string().uuid({ message: "ID da instituição inválido" }),
  course_name: z.string().min(3, { message: "Nome do curso deve ter pelo menos 3 caracteres" }),
  shift: z.enum(['Matutino', 'Vespertino', 'Noturno', 'Integral', 'EAD'], { 
    error: () => ({ message: "Turno inválido" }) 
  }),
  scholarship_type: z.enum(['Integral', 'Parcial'], {
    error: () => ({ message: "Tipo de bolsa inválido" })
  }),
  city: z.string().min(2, { message: "Cidade inválida" }),
  state: z.string().length(2, { message: "Estado deve ter 2 letras (UF)" }),
  cutoff_score: z.number().min(0).max(1000).nullable().optional(),
  opportunity_type: z.string().nullable().optional(),
});

export type OpportunityInput = z.infer<typeof OpportunitySchema>;
