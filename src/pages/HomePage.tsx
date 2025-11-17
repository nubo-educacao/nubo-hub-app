import { Link } from 'react-router-dom';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

const HomePage = () => {
  return (
    <section className="stack">
      <Card title="Nubo Hub" subtitle="Marketplace de oportunidades educacionais">
        <p>
          O Nubo Hub centraliza bolsas, ProUni e oportunidades educacionais em um só lugar e será
          conectado a um agente de IA para recomendar o melhor caminho para cada estudante.
        </p>
        <p>Explore as oportunidades disponíveis e acompanhe novidades do MVP.</p>
        <div>
          <Link to="/oportunidades">
            <Button>Ver oportunidades</Button>
          </Link>
        </div>
      </Card>
    </section>
  );
};

export default HomePage;
