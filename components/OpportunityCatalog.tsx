'use client';

import { useMemo, useState } from 'react';

import FilterPills from './FilterPills';
import OpportunityCard from './OpportunityCard';
import type { Opportunity, OpportunityCategory } from '../types/opportunity';

const filters: OpportunityCategory[] = [
  'Em destaque',
  'Públicas',
  'Privadas',
  'Parceiros',
  'EAD',
  'Programas internacionais',
  'Políticas de permanência'
];

const opportunities: Opportunity[] = [
  {
    id: '1',
    name: 'Bolsa ProUni Integral – Engenharia de Software',
    institution: 'Universidade Nubo',
    location: 'São Paulo, SP',
    type: 'Pública',
    modality: 'Presencial',
    description: 'Vagas integrais para alunos com alto desempenho e interesse em tecnologia aplicada.',
    highlight: 'Bolsa integral',
    categories: ['Em destaque', 'Públicas', 'Políticas de permanência']
  },
  {
    id: '2',
    name: 'Programa Parceiros Tech – Cloud Computing',
    institution: 'Instituto Cloud Nova',
    location: 'Remoto / EAD',
    type: 'Parceiro',
    modality: 'EAD',
    description: 'Mentorias ao vivo + bolsa parcial para certificações em nuvem com parceiros oficiais.',
    highlight: 'Mentorias exclusivas',
    categories: ['Em destaque', 'Parceiros', 'EAD']
  },
  {
    id: '3',
    name: 'Residência em Dados – Universidade Federal',
    institution: 'UF Nimbo',
    location: 'Belo Horizonte, MG',
    type: 'Pública',
    modality: 'Híbrido',
    description: 'Programa voltado a projetos reais com auxílio permanência e bolsa mensal.',
    categories: ['Públicas', 'Políticas de permanência']
  },
  {
    id: '4',
    name: 'Bolsa Internacional – Design Estratégico',
    institution: 'Nubo Global Institute',
    location: 'Lisboa, Portugal',
    type: 'Parceiro',
    modality: 'Presencial',
    description: 'Experiência internacional com bolsas de estudo parciais e apoio à moradia.',
    categories: ['Programas internacionais', 'Em destaque']
  },
  {
    id: '5',
    name: 'Programa Talentos Privados – Ciência de Dados',
    institution: 'Colégio Analítico',
    location: 'Curitiba, PR',
    type: 'Privada',
    modality: 'Presencial',
    description: 'Bolsas de até 70% em cursos presenciais com laboratórios de ponta.',
    categories: ['Privadas']
  },
  {
    id: '6',
    name: 'Trilha Remota – Educação a Distância em TI',
    institution: 'Universidade Virtual da Nuvem',
    location: 'Remoto / EAD',
    type: 'Privada',
    modality: 'EAD',
    description: 'Conteúdo assíncrono com tutoria semanal e bolsas especiais para iniciantes.',
    categories: ['Privadas', 'EAD']
  }
];

export default function OpportunityCatalog() {
  const [activeFilter, setActiveFilter] = useState<OpportunityCategory>('Em destaque');

  const filteredOpportunities = useMemo(() => {
    if (activeFilter === 'Em destaque') {
      return opportunities;
    }
    return opportunities.filter((opportunity) => opportunity.categories.includes(activeFilter));
  }, [activeFilter]);

  return (
    <section id="catalogo" className="bg-neutral-950 py-16 text-white">
      <div className="mx-auto max-w-6xl space-y-8 px-6">
        <div className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-white/50">Catálogo</p>
          <h2 className="text-3xl font-semibold">Catálogo de Oportunidades</h2>
          <p className="text-white/70">Explore bolsas e programas antes mesmo de fazer login.</p>
        </div>

        <FilterPills filters={filters} activeFilter={activeFilter} onSelect={setActiveFilter} />

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredOpportunities.map((opportunity) => (
            <OpportunityCard key={opportunity.id} opportunity={opportunity} />
          ))}
        </div>
      </div>
    </section>
  );
}
