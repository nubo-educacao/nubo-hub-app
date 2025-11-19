import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Inter } from 'next/font/google';

import Header from '../components/Header';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'Nubo Hub',
  description: 'Marketplace de oportunidades educacionais'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.variable} bg-neutral-950 text-white antialiased`}>
        <div className="flex min-h-screen flex-col">
          <Header />
          <main className="flex-1">{children}</main>
          <footer className="border-t border-white/10 px-6 py-10 text-center text-sm text-white/60">
            &copy; {new Date().getFullYear()} Nubo Hub. Todos os direitos reservados.
          </footer>
        </div>
      </body>
    </html>
  );
}
