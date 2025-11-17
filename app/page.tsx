import Link from 'next/link';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

export default function HomePage() {
  return (
    <section className="space-y-4">
      <Card title="Nubo Hub" subtitle="Marketplace de oportunidades educacionais">
        <p>
          O Nubo Hub centraliza bolsas, ProUni e oportunidades educacionais em um só lugar e será
          conectado a um agente de IA para recomendar o melhor caminho para cada estudante.
        </p>
        <p>Explore as oportunidades disponíveis e acompanhe novidades do MVP.</p>
        <div>
          <Link href="/oportunidades">
            <Button>Ver oportunidades</Button>
          </Link>
        </div>
      </Card>
    </section>
  );
}
