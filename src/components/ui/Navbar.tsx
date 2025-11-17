'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const linkBase =
  'text-sm font-semibold text-slate-800 px-3 py-2 rounded-md transition hover:bg-slate-100';
const activeClasses = 'bg-indigo-50 text-indigo-700';

const Navbar = () => {
  const pathname = usePathname();

  return (
    <nav className="flex items-center justify-between gap-4 py-4">
      <span className="text-lg font-extrabold tracking-tight text-slate-900">Nubo Hub</span>
      <div className="flex items-center gap-2">
        <Link
          href="/"
          className={`${linkBase} ${pathname === '/' ? activeClasses : ''}`.trim()}
        >
          Início
        </Link>
        <Link
          href="/oportunidades"
          className={`${linkBase} ${pathname.startsWith('/oportunidades') ? activeClasses : ''}`.trim()}
        >
          Oportunidades
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;
