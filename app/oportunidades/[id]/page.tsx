import Link from 'next/link';
import { notFound } from 'next/navigation';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { getOpportunityById } from '@/services/opportunitiesService';

type OpportunityDetailsPageProps = {
  params: { id: string };
};

export default async function OpportunityDetailsPage({ params }: OpportunityDetailsPageProps) {
  const opportunity = await getOpportunityById(params.id);

  if (!opportunity) {
    return notFound();
  }

  return (
    <Card
      title={opportunity.title}
      subtitle={`${opportunity.institution} · ${opportunity.location}`}
      footer={
        <Link href="/oportunidades">
          <Button>Voltar</Button>
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
      <p>
        <strong>ID:</strong> {opportunity.id}
      </p>
    </Card>
  );
}
