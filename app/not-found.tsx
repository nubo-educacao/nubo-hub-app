import Link from 'next/link';
import Button from '@/components/ui/Button';

export default function NotFoundPage() {
  return (
    <section className="space-y-3">
      <h2 className="text-2xl font-semibold text-slate-900">Página não encontrada</h2>
      <p className="text-slate-700">A rota acessada não existe. Que tal voltar para o início?</p>
      <Link href="/">
        <Button>Ir para Home</Button>
      </Link>
    </section>
  );
}
