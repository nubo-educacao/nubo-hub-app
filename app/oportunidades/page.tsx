'use client';

import Link from 'next/link';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { useOpportunities } from '@/hooks/useOpportunities';

export default function OpportunitiesPage() {
  const { opportunities, isLoading, error } = useOpportunities();

  if (isLoading) {
    return <p>Carregando oportunidades...</p>;
  }

  if (error) {
    return <p>Erro: {error}</p>;
  }

  return (
    <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {opportunities.map((opportunity) => (
        <Card
          key={opportunity.id}
          title={opportunity.title}
          subtitle={`${opportunity.institution} · ${opportunity.location}`}
          footer={
            <Link href={`/oportunidades/${opportunity.id}`}>
              <Button>Ver detalhes</Button>
            </Link>
          }
        >
          <p>{opportunity.shortDescription}</p>
          <p>
            <strong>Benefício:</strong> {opportunity.benefitType} — {opportunity.benefitValue}
          </p>
          <p>
            <strong>Modalidade:</strong> {opportunity.modality}
          </p>
        </Card>
      ))}
    </section>
  );
}
