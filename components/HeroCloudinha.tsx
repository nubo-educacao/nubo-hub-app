import ChatBox from './ChatBox';

export default function HeroCloudinha() {
  return (
    <section className="relative w-full min-h-[85vh] flex flex-col items-center justify-center px-4 pt-20 pb-10 overflow-hidden">


      <div className="container mx-auto flex flex-col items-center text-center z-10 space-y-12 mt-10">
        {/* Text Content */}
        <div className="space-y-4 max-w-3xl">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-sky-900 tracking-tight">
            Fale com a <span className="text-sky-600">Cloudinha</span>
          </h1>
          <p className="text-lg md:text-xl text-sky-700 font-medium">
            Encontre a melhor oportunidade para você!
          </p>
        </div>

        {/* Chat Component */}
        <ChatBox />
      </div>
    </section>
  );
}
