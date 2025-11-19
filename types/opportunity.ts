export type OpportunityCategory =
  | 'Em destaque'
  | 'Públicas'
  | 'Privadas'
  | 'Parceiros'
  | 'EAD'
  | 'Programas internacionais'
  | 'Políticas de permanência';

export type Opportunity = {
  id: string;
  name: string;
  institution: string;
  location: string;
  type: 'Pública' | 'Privada' | 'Parceiro';
  modality: 'Presencial' | 'EAD' | 'Híbrido';
  description: string;
  highlight?: string;
  categories: OpportunityCategory[];
};
