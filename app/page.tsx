import HeroCloudinha from '../components/HeroCloudinha';
import OpportunityCatalog from '../components/OpportunityCatalog';

export default function HomePage() {
  const isLoggedIn = false; // TODO: conectar ao provider de autenticação quando estiver disponível

  return (
    <>
      <HeroCloudinha isLoggedIn={isLoggedIn} />
      <OpportunityCatalog />

      <section
        id="instituicoes"
        className="border-t border-white/5 bg-neutral-950 py-16 text-white"
      >
        <div className="mx-auto grid max-w-6xl gap-10 px-6 md:grid-cols-2">
          <div className="space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-white/50">
              Instituições
            </p>
            <h2 className="text-3xl font-semibold">Parceiros que acreditam no Nubo Hub</h2>
            <p className="text-white/70">
              Conectamos universidades, escolas técnicas e institutos de pesquisa dentro de um
              catálogo aberto, onde estudantes comparam benefícios e iniciam sua jornada com
              transparência.
            </p>
          </div>
          <div className="grid gap-4 rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-white/70">
            {['Universidade Nubo', 'Instituto Cloud Nova', 'Nubo Global Institute', 'Universidade Virtual da Nuvem'].map(
              (partner) => (
                <div
                  key={partner}
                  className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white"
                >
                  {partner}
                </div>
              )
            )}
          </div>
        </div>
      </section>

      <section
        id="como-funciona"
        className="border-t border-white/5 bg-gradient-to-b from-neutral-950 via-indigo-950/40 to-neutral-950 py-16 text-white"
      >
        <div className="mx-auto max-w-5xl space-y-10 px-6">
          <div className="space-y-3 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-white/50">
              Como funciona
            </p>
            <h2 className="text-3xl font-semibold">Sua jornada com a Cloudinha</h2>
            <p className="text-white/70">Explorar, conversar, aplicar — tudo em um só lugar.</p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                title: 'Explore o catálogo',
                description: 'Filtros inteligentes e cards detalhados para comparar oportunidades sem login.'
              },
              {
                title: 'Converse com a Cloudinha',
                description: 'Ao fazer login, o agente conversacional recomenda bolsas alinhadas ao seu perfil.'
              },
              {
                title: 'Aplique com confiança',
                description: 'Salve favoritos, organize documentos e receba alertas de prazos importantes.'
              }
            ].map((step) => (
              <div key={step.title} className="rounded-3xl border border-white/10 bg-white/5 p-6 text-center">
                <h3 className="text-xl font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm text-white/70">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
