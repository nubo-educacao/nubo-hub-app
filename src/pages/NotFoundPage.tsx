import { Link } from 'react-router-dom';
import Button from '../components/ui/Button';

const NotFoundPage = () => {
  return (
    <section className="stack">
      <h2>Página não encontrada</h2>
      <p>A rota acessada não existe. Que tal voltar para o início?</p>
      <Link to="/">
        <Button>Ir para Home</Button>
      </Link>
    </section>
  );
};

export default NotFoundPage;
