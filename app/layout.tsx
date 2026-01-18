import type { Metadata } from "next";
import { Montserrat, Lora } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { AuthProvider } from "../context/AuthContext";
import AuthModal from "../components/AuthModal";
import { Toaster } from "sonner";

const montserrat = Montserrat({ 
  subsets: ["latin"],
  variable: "--font-montserrat",
});
const lora = Lora({
  subsets: ["latin"],
  variable: "--font-lora",
});

export const metadata: Metadata = {
  title: "Cloudinha | Sua guia para o ensino superior - Nubo Educação",
  description: "A Cloudinha te ajuda a transformar sua nota do ENEM em oportunidades reais. A IA do Nubo para te orientar no acesso ao ensino superior, começando pelo SISU.",
  keywords: [
    "SISU",
    "ProUni",
    "nota de corte",
    "minha nota passa",
    "simulador SISU",
    "chance de passar",
    "vagas SISU",
    "lista de espera",
    "estratégia SISU",
    "escolher curso",
    "universidade pública",
    "bolsa ProUni",
    "auxílio permanência",
    "Cloudinha",
    "plataforma gratuita",
  ],
  icons: {
    icon: "/assets/cloudinha.png",
    shortcut: "/assets/cloudinha.png",
    apple: "/assets/cloudinha.png",
  },
  openGraph: {
    title: "Cloudinha | Sua guia para o ensino superior - Nubo Educação",
    description: "A Cloudinha te ajuda a transformar sua nota do ENEM em oportunidades reais. A IA do Nubo para te orientar no acesso ao ensino superior, começando pelo SISU.",
    type: "website",
    locale: "pt_BR",
    siteName: "Cloudinha - Nubo Educação",
    images: [
      {
        url: "/assets/cloudinha.png",
        width: 512,
        height: 512,
        alt: "Cloudinha - Assistente de Educação do Nubo",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "Cloudinha | Sua guia para o ensino superior - Nubo Educação",
    description: "A Cloudinha te ajuda a transformar sua nota do ENEM em oportunidades reais. A IA do Nubo para te orientar no acesso ao ensino superior, começando pelo SISU.",
    images: ["/assets/cloudinha.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${montserrat.className} ${montserrat.variable} ${lora.variable} bg-neutral-950 text-white antialiased`}>
        <AuthProvider>
          {children}
          <AuthModal />
          <Toaster richColors position="top-center" />
        </AuthProvider>
        <Script 
          src="https://t.contentsquare.net/uxa/a41506ab63916.js" 
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}

