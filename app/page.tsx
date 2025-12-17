import Header from "@/components/Header";
import HeroCloudinha from "@/components/HeroCloudinha";
import OpportunityCatalog from "@/components/OpportunityCatalog";
import CloudBackground from "@/components/CloudBackground";

export default function Home() {
  return (
    <main className="min-h-screen relative flex flex-col">
      <CloudBackground />
      <div className="relative z-10 w-full">
        <Header />
        <HeroCloudinha />
        <OpportunityCatalog />
      </div>
    </main>
  );
}
