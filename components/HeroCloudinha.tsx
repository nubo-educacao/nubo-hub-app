import ChatBox from './ChatBox';

type HeroCloudinhaProps = {
  isLoggedIn: boolean;
};

export default function HeroCloudinha({ isLoggedIn }: HeroCloudinhaProps) {
  return (
    <section className="relative isolate overflow-hidden border-b border-white/5 bg-gradient-to-b from-indigo-950 via-purple-900/50 to-amber-900/30 py-20 text-center text-white">
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <div className="absolute -top-32 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-indigo-500/50 blur-[180px]" />
        <div className="absolute bottom-0 left-1/4 h-64 w-64 rounded-full bg-amber-400/40 blur-[180px]" />
      </div>

      <div className="relative mx-auto flex max-w-5xl flex-col items-center gap-8 px-6">
        <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-white/70">
          ☁️ Cloudinha sempre online
        </p>
        <div className="space-y-4">
          <h1 className="text-4xl font-semibold leading-tight md:text-5xl">
            Fale com a <span className="bg-gradient-to-r from-indigo-300 via-purple-200 to-amber-200 bg-clip-text text-transparent">Cloudinha</span>
          </h1>
          <p className="text-lg text-white/70">Encontre a melhor oportunidade para você.</p>
        </div>

        <ChatBox isLoggedIn={isLoggedIn} />
      </div>
    </section>
  );
}
