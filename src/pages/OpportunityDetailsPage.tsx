import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Opportunity } from '../types/opportunity';
import { getOpportunityById } from '../services/opportunitiesService';

const OpportunityDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<Opportunity | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setIsLoading(false);
      return;
    }

    getOpportunityById(id)
      .then((opportunity) => {
        setData(opportunity ?? null);
      })
      .finally(() => setIsLoading(false));
  }, [id]);

  if (isLoading) return <p>Carregando detalhes...</p>;

  if (!data) {
    return (
      <Card title="Oportunidade não encontrada">
        <p>Não encontramos a oportunidade solicitada.</p>
        <Link to="/oportunidades">
          <Button>Voltar para oportunidades</Button>
        </Link>
      </Card>
    );
  }

  return (
    <Card
      title={data.title}
      subtitle={`${data.institution} · ${data.location}`}
      footer={
        <Link to="/oportunidades">
          <Button>Voltar</Button>
        </Link>
      }
    >
      <p>{data.shortDescription}</p>
      <p>
        <strong>Benefício:</strong> {data.benefitType} — {data.benefitValue}
      </p>
      <p>
        <strong>Modalidade:</strong> {data.modality}
      </p>
      <p>
        <strong>ID:</strong> {data.id}
      </p>
    </Card>
  );
};

export default OpportunityDetailsPage;
