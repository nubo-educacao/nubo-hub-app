import type { Metadata, Viewport } from "next";
import { Montserrat, Lora } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { ChatProvider } from "@/context/ChatContext";
import AppShell from "@/components/navigation/AppShell";
import AuthModal from "@/components/AuthModal";
import { Toaster } from "sonner";
import FacebookPixel from "@/components/FacebookPixel";
import ReferralTracker from "@/components/ReferralTracker";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  display: 'swap',
});

const lora = Lora({
  subsets: ["latin"],
  variable: "--font-lora",
  display: 'swap',
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#024F86",
};

export const metadata: Metadata = {
  title: "Nubo Hub | Seu Futuro Começa Aqui",
  description: "A plataforma completa para encontrar bolsas de estudo, monitoria e as melhores oportunidades para sua carreira acadêmica.",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
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
          <ChatProvider>
            <AppShell>
              {children}
            </AppShell>
            <AuthModal />
            <Toaster richColors position="top-right" />
          </ChatProvider>
        </AuthProvider>
        <FacebookPixel />
        <ReferralTracker />
      </body>
    </html>
  );
}
