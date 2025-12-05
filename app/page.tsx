import Header from "@/components/Header";
import HeroCloudinha from "@/components/HeroCloudinha";
import OpportunityCatalog from "@/components/OpportunityCatalog";

export default function Home() {
  return (
    <main className="min-h-screen" style={{ background: 'linear-gradient(180deg, #FFFFFF 0%, #38B1E4 50%, #024F86 100%)' }}>
      <Header />
      <HeroCloudinha />
      <OpportunityCatalog />
    </main>
  );
}
