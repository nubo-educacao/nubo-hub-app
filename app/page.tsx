import Header from "@/components/Header";
import HeroCloudinha from "@/components/HeroCloudinha";
import OpportunityCatalog from "@/components/OpportunityCatalog";
import CloudBackground from "@/components/CloudBackground";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main className="min-h-screen relative flex flex-col">
      <CloudBackground />
      <div className="relative z-10 w-full">
        <Header />
        <HeroCloudinha />
        
        <div className="pt-36"> {/* increased spacing between hero and catalog */}
          <OpportunityCatalog />
        </div>
      </div>
      <Footer />
    </main>
  );
}
