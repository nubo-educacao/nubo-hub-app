import ChatBox from './ChatBox';

export default function HeroCloudinha() {
  return (
    <section className="relative w-full min-h-[80vh] flex flex-col items-center justify-center px-4 pt-20 pb-10 overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 -z-10 bg-neutral-950">
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-950/50 via-neutral-950/80 to-neutral-950"></div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-indigo-600/20 rounded-full blur-[120px] opacity-50"></div>
        <div className="absolute bottom-0 right-0 w-[800px] h-[600px] bg-purple-600/10 rounded-full blur-[100px] opacity-30"></div>
      </div>

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
