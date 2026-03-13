import type { Metadata } from "next";
import { Montserrat, Lora } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { AuthProvider } from "../context/AuthContext";
import AuthModal from "../components/AuthModal";
import FacebookPixel from "../components/FacebookPixel";
import ReferralTracker from "../components/ReferralTracker";
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
  title: "Cloudinha | Sua guia para as melhores oportunidades educacionais - Nubo Educação",
  description: "A Cloudinha conecta estudantes a oportunidades reais de educação. Encontre bolsas de estudo, programas educacionais e caminhos para ingressar na universidade.",
  keywords: [
    // acesso ao ensino superior
    "ENEM",
    "nota do ENEM",
    "acesso ao ensino superior",
    "entrar na faculdade",
    "como entrar na universidade",

    // SISU
    "SISU",
    "simulador SISU",
    "nota de corte",
    "minha nota passa",
    "estratégia SISU",
    "lista de espera SISU",
    "vagas SISU",

    // ProUni
    "ProUni",
    "bolsa ProUni",
    "bolsa de estudo faculdade",

    // oportunidades educacionais
    "bolsas de estudo",
    "oportunidades educacionais",
    "programas para estudantes",
    "oportunidades para ensino médio",
    "plataforma de bolsas",

    // parceiros e programas
    "programas educacionais",
    "iniciativas educacionais",
    "institutos educacionais",
    "projetos para estudantes",

    // inscrição e seleção
    "processo seletivo estudante",
    "inscrição programa educacional",
    "inscrição bolsa de estudo",
    "seleção para estudantes",

    // apoio educacional
    "orientação educacional",
    "planejamento para faculdade",
    "escolher curso",
    "escolher faculdade",

    // marca
    "Cloudinha",
    "Nubo Educação",
    "plataforma gratuita para estudantes"
  ],
  icons: {
    icon: "/assets/cloudinha.png",
    shortcut: "/assets/cloudinha.png",
    apple: "/assets/cloudinha.png",
  },
  openGraph: {
    title: "Cloudinha | Sua guia para as melhores oportunidades educacionais - Nubo Educação",
    description: "A Cloudinha conecta estudantes a oportunidades reais de educação. Encontre bolsas de estudo, programas educacionais e caminhos para ingressar na universidade.",
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
    title: "Cloudinha | Sua guia para as melhores oportunidades educacionais - Nubo Educação",
    description: "A Cloudinha conecta estudantes a oportunidades reais de educação. Encontre bolsas de estudo, programas educacionais e caminhos para ingressar na universidade.",
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
        <FacebookPixel />
        <ReferralTracker />
        <Script
          src="https://t.contentsquare.net/uxa/a41506ab63916.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}

