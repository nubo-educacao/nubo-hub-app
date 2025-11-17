import { Link } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { useOpportunities } from '../hooks/useOpportunities';

const OpportunitiesPage = () => {
  const { opportunities, isLoading, error } = useOpportunities();

  if (isLoading) {
    return <p>Carregando oportunidades...</p>;
  }

  if (error) {
    return <p>Erro: {error}</p>;
  }

  return (
    <section className="grid">
      {opportunities.map((opportunity) => (
        <Card
          key={opportunity.id}
          title={opportunity.title}
          subtitle={`${opportunity.institution} · ${opportunity.location}`}
          footer={
            <Link to={`/oportunidades/${opportunity.id}`}>
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
};

export default OpportunitiesPage;
