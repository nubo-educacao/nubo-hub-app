import type { Metadata } from "next";
import { Montserrat, Lora } from "next/font/google";
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
  title: "Nubo Hub",
  description: "Encontre a melhor oportunidade para você.",
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
      </body>
    </html>
  );
}

