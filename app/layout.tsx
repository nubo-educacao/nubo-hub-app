import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import MainLayout from '@/components/Layout/MainLayout';
import './globals.css';

export const metadata: Metadata = {
  title: 'Nubo Hub',
  description: 'Marketplace de oportunidades educacionais'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <MainLayout>{children}</MainLayout>
      </body>
    </html>
  );
}
