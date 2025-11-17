import { ReactNode } from 'react';
import Navbar from '../ui/Navbar';

type MainLayoutProps = {
  children: ReactNode;
};

const MainLayout = ({ children }: MainLayoutProps) => {
  return (
    <div className="app-shell">
      <header className="app-header">
        <Navbar />
      </header>
      <main className="app-main">{children}</main>
      <footer className="app-footer">Nubo Hub · MVP</footer>
    </div>
  );
};

export default MainLayout;
