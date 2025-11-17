import { Opportunity } from '../types/opportunity';

const mockOpportunities: Opportunity[] = [
  {
    id: '1',
    title: 'Bolsa Integral em Tecnologia',
    institution: 'Universidade Futuro Digital',
    location: 'São Paulo, SP',
    benefitType: 'Bolsa',
    benefitValue: '100%',
    modality: 'Presencial',
    shortDescription: 'Graduação em Ciência da Computação com foco em IA aplicada.'
  },
  {
    id: '2',
    title: 'ProUni — Engenharia de Software',
    institution: 'Instituto Nacional de Inovação',
    location: 'Belo Horizonte, MG',
    benefitType: 'ProUni',
    benefitValue: '75%',
    modality: 'EAD',
    shortDescription: 'Curso flexível com projetos práticos e mentoria.'
  },
  {
    id: '3',
    title: 'MBA em Dados com Bolsa Parcial',
    institution: 'DataLab University',
    location: 'Online',
    benefitType: 'Bolsa parcial',
    benefitValue: '50%',
    modality: 'Híbrido',
    shortDescription: 'MBA mão na massa com foco em analytics e produtos de dados.'
  },
  {
    id: '4',
    title: 'Residência em IA Generativa',
    institution: 'Centro de Pesquisa Nubo',
    location: 'Curitiba, PR',
    benefitType: 'Residência',
    benefitValue: 'R$ 3.500,00',
    modality: 'Presencial',
    shortDescription: 'Programa intensivo com projetos em LLMs e copilots.'
  }
];

export async function getOpportunities(): Promise<Opportunity[]> {
  return new Promise((resolve) => setTimeout(() => resolve(mockOpportunities), 500));
}

export async function getOpportunityById(id: string): Promise<Opportunity | undefined> {
  return new Promise((resolve) =>
    setTimeout(() => resolve(mockOpportunities.find((item) => item.id === id)), 400)
  );
}
