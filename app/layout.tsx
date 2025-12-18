import type { Metadata } from "next";
import { Inter, Montserrat, Nunito, Lora } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../context/AuthContext";
import AuthModal from "../components/AuthModal";

const inter = Inter({ subsets: ["latin"] });
const montserrat = Montserrat({ 
  subsets: ["latin"],
  variable: "--font-montserrat",
});
const nunito = Nunito({ 
  subsets: ["latin"],
  variable: "--font-nunito",
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
      <body className={`${inter.className} ${montserrat.variable} ${nunito.variable} ${lora.variable} bg-neutral-950 text-white antialiased`}>
        <AuthProvider>
          {children}
          <AuthModal />
        </AuthProvider>
      </body>
    </html>
  );
}
