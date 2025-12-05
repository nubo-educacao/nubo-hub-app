import ChatBox from './ChatBox';

export default function HeroCloudinha() {
  return (
    <section className="relative w-full min-h-[80vh] flex flex-col items-center justify-center px-4 pt-20 pb-10 overflow-hidden">
      {/* Background Gradient */}
      {/* Background Gradient Removed for Light Theme */}

      <div className="container mx-auto flex flex-col items-center text-center z-10 space-y-8">
        {/* Text Content */}
        <div className="space-y-4 max-w-2xl">
          <h1 className="text-4xl md:text-6xl font-bold text-white tracking-tight">
            Fale com a <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Cloudinha</span>
          </h1>
          <p className="text-lg md:text-xl text-neutral-400">
            Encontre a melhor oportunidade para você.
          </p>
        </div>

        {/* Chat Component */}
        <ChatBox />
      </div>
    </section>
  );
}
