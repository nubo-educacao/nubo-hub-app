import Header from "@/components/Header";
import HeroCloudinha from "@/components/HeroCloudinha";
import OpportunityCatalog from "@/components/OpportunityCatalog";

export default function Home() {
  return (
    <main className="min-h-screen bg-neutral-950">
      <Header />
      <HeroCloudinha />
      <OpportunityCatalog />
    </main>
  );
}
