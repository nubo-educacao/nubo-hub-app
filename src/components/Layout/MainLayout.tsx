import { ReactNode } from 'react';
import Navbar from '../ui/Navbar';

type MainLayoutProps = {
  children: ReactNode;
};

const MainLayout = ({ children }: MainLayoutProps) => {
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto flex max-w-5xl flex-col px-5 pb-10">
        <header className="sticky top-0 bg-slate-100/80 backdrop-blur">{/* Navbar is client */}<Navbar /></header>
        <main className="pt-2">{children}</main>
        <footer className="mt-10 border-t border-slate-200 pt-6 text-sm text-slate-600">
          Nubo Hub · MVP
        </footer>
      </div>
    </div>
  );
};

export default MainLayout;
